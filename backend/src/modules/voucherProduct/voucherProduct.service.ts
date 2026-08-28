import { AppError } from "../../shared/errors/AppError";
import {
  VoucherProductRepository,
  type UpdateVoucherProductRecord,
  type VoucherProductStatus,
} from "./voucherProduct.repository";

const discountTypes = ["direct", "percentage"] as const;
type DiscountType = (typeof discountTypes)[number];

const voucherStatuses = [
  "pending",
  "out_of_stock",
  "active",
  "inactive",
  "rejected",
  "expired",
] as const;

const adminStatuses = ["active", "inactive", "rejected"] as const;
type AdminVoucherStatus = (typeof adminStatuses)[number];

export type CreateVoucherProductInput = {
  categoryId: string;
  title: string;
  description?: string;
  originalPrice: string | number;
  discountType: DiscountType;
  discountValue: string | number;
  startDate: string | Date;
  endDate: string | Date;
  validDurationDays: number;
  minLimit?: number;
  maxLimit?: number | null;
  imageUrl?: string | null;
};

export type UpdateVoucherProductInput = Partial<
  Omit<CreateVoucherProductInput, "discountType">
> & {
  discountType?: DiscountType;
};

export type ListVoucherProductsInput = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  status?: VoucherProductStatus;
  search?: string;
};

export type UpdateVoucherStatusInput = {
  status: AdminVoucherStatus;
  rejectionReason?: string | null;
};

const trim = (value: string) => value.trim();

const hasValue = (value: unknown) => value !== undefined && value !== null;

const normalizeMoney = (value: unknown, field: string) => {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError(`${field} must be a non-negative number`, 400);
  }

  const text = typeof value === "number" ? String(value) : trim(value);
  const numberValue = Number(text);

  if (!text || !Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError(`${field} must be a non-negative number`, 400);
  }

  return text;
};

const normalizeDate = (value: unknown, field: string) => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  return date;
};

const normalizeOptionalString = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }

  return value.trim();
};

const normalizeOptionalNullableString = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string or null`, 400);
  }

  return value.trim() || null;
};

const normalizeOptionalInteger = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AppError(`${field} must be an integer`, 400);
  }

  return value;
};

const normalizeOptionalNullableInteger = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AppError(`${field} must be an integer or null`, 400);
  }

  return value;
};

const isDiscountType = (value: string): value is DiscountType =>
  discountTypes.includes(value as DiscountType);

/**
 * RB-02: "Giá bán của voucher phải nhỏ hơn giá gốc." A discount that eats the
 * entire price (or exceeds it) collapses the sale price to <= 0, which is
 * rejected here rather than left to slip through as a free/negative voucher.
 */
const validateDiscountedPrice = (
  originalPrice: string,
  discountType: DiscountType,
  discountValue: string,
) => {
  const original = Number(originalPrice);
  const discount = Number(discountValue);

  if (discount <= 0) {
    throw new AppError("discountValue must be greater than 0", 400);
  }

  if (discountType === "percentage" && discount >= 100) {
    throw new AppError("discountValue must be less than 100 for a percentage discount", 400);
  }

  const salePrice =
    discountType === "direct" ? original - discount : original * (1 - discount / 100);

  if (salePrice <= 0 || salePrice >= original) {
    throw new AppError(
      "The discounted sale price must be greater than 0 and less than originalPrice",
      400,
    );
  }
};

const isVoucherStatus = (value: string): value is VoucherProductStatus =>
  voucherStatuses.includes(value as VoucherProductStatus);

const isAdminStatus = (value: string): value is AdminVoucherStatus =>
  adminStatuses.includes(value as AdminVoucherStatus);

export class VoucherProductService {
  constructor(
    private readonly voucherProductRepository = new VoucherProductRepository(),
  ) {}

  async createVoucher(userId: string, input: CreateVoucherProductInput) {
    const partnerProfileId =
      await this.voucherProductRepository.findPartnerProfileIdByUserId(userId);

    if (!partnerProfileId) {
      throw new AppError("Partner profile not found", 404);
    }

    await this.ensureCategoryExists(input.categoryId);

    const data = this.normalizeCreateInput(input);
    const voucher = await this.voucherProductRepository.create({
      ...data,
      partnerProfileId,
      status: "pending",
      rejectionReason: null,
    });

    return { voucher };
  }

  async getPartnerVouchers(userId: string) {
    const partnerProfileId =
      await this.voucherProductRepository.findPartnerProfileIdByUserId(userId);

    if (!partnerProfileId) {
      throw new AppError("Partner profile not found", 404);
    }

    const vouchers =
      await this.voucherProductRepository.findByPartnerProfileId(
        partnerProfileId,
      );

    return { vouchers };
  }

  async updatePartnerVoucher(
    userId: string,
    voucherProductId: string,
    input: UpdateVoucherProductInput,
  ) {
    const partnerProfileId =
      await this.voucherProductRepository.findPartnerProfileIdByUserId(userId);

    if (!partnerProfileId) {
      throw new AppError("Partner profile not found", 404);
    }

    const existing =
      await this.voucherProductRepository.findByIdAndPartnerProfileId(
        voucherProductId,
        partnerProfileId,
      );

    if (!existing) {
      throw new AppError("Voucher not found", 404);
    }

    if (input.categoryId) {
      await this.ensureCategoryExists(input.categoryId);
    }

    const updates = this.normalizeUpdateInput(input, existing);

    if (Object.keys(updates).length === 0) {
      throw new AppError("At least one voucher field is required", 400);
    }

    const voucher =
      await this.voucherProductRepository.updateByPartnerProfileId(
        voucherProductId,
        partnerProfileId,
        {
          ...updates,
          status: "pending",
          rejectionReason: null,
        },
      );

    return { voucher };
  }

  async getVouchers(input: ListVoucherProductsInput = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const search = input.search?.trim() || undefined;

    if (input.status && !isVoucherStatus(input.status)) {
      throw new AppError("Invalid voucher status", 400);
    }

    if (input.status && input.status !== "active") {
      throw new AppError("Public voucher listing only supports active status", 400);
    }

    const { vouchers, total } = await this.voucherProductRepository.findAll({
      page,
      pageSize,
      categoryId: input.categoryId,
      status: "active",
      search,
    });

    return {
      vouchers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getVoucherById(voucherProductId: string) {
    const voucher =
      await this.voucherProductRepository.findById(voucherProductId);

    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }

    if (voucher.status !== "active") {
      throw new AppError("Voucher not found", 404);
    }

    return { voucher };
  }

  async updateVoucherStatus(
    voucherProductId: string,
    input: UpdateVoucherStatusInput,
  ) {
    if (!isAdminStatus(input.status)) {
      throw new AppError("Invalid voucher status", 400);
    }

    if (input.status === "rejected" && !input.rejectionReason?.trim()) {
      throw new AppError(
        "Rejection reason is required when rejecting a voucher",
        400,
      );
    }

    const existing =
      await this.voucherProductRepository.findById(voucherProductId);

    if (!existing) {
      throw new AppError("Voucher not found", 404);
    }

    const voucher = await this.voucherProductRepository.updateStatus(
      voucherProductId,
      input.status,
      input.rejectionReason?.trim() ?? null,
    );

    return {
      message: "Voucher status updated successfully.",
      voucher,
    };
  }

  private async ensureCategoryExists(categoryId: string) {
    const category =
      await this.voucherProductRepository.findCategoryById(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  private normalizeCreateInput(input: CreateVoucherProductInput) {
    if (typeof input.categoryId !== "string") {
      throw new AppError("categoryId is required", 400);
    }

    if (typeof input.title !== "string") {
      throw new AppError("title is required", 400);
    }

    if (!isDiscountType(input.discountType)) {
      throw new AppError("Invalid discountType", 400);
    }

    if (!Number.isInteger(input.validDurationDays)) {
      throw new AppError("validDurationDays must be a positive integer", 400);
    }

    const title = trim(input.title);
    const description = normalizeOptionalString(input.description, "description") ?? "";
    const startDate = normalizeDate(input.startDate, "startDate");
    const endDate = normalizeDate(input.endDate, "endDate");
    const minLimit = input.minLimit ?? 1;
    const validDurationDays = input.validDurationDays;

    if (!title) {
      throw new AppError("title is required", 400);
    }

    if (startDate >= endDate) {
      throw new AppError("startDate must be before endDate", 400);
    }

    if (!Number.isInteger(validDurationDays) || validDurationDays < 1) {
      throw new AppError("validDurationDays must be a positive integer", 400);
    }

    if (!Number.isInteger(minLimit) || minLimit < 1) {
      throw new AppError("minLimit must be a positive integer", 400);
    }

    if (
      hasValue(input.maxLimit) &&
      (!Number.isInteger(input.maxLimit) || input.maxLimit < minLimit)
    ) {
      throw new AppError("maxLimit must be greater than or equal to minLimit", 400);
    }

    const originalPrice = normalizeMoney(input.originalPrice, "originalPrice");
    const discountValue = normalizeMoney(input.discountValue, "discountValue");

    validateDiscountedPrice(originalPrice, input.discountType, discountValue);

    return {
      categoryId: input.categoryId,
      title,
      description,
      originalPrice,
      discountType: input.discountType,
      discountValue,
      startDate,
      endDate,
      validDurationDays,
      minLimit,
      maxLimit: input.maxLimit,
      imageUrl: normalizeOptionalNullableString(input.imageUrl, "imageUrl") ?? null,
    };
  }

  private normalizeUpdateInput(
    input: UpdateVoucherProductInput,
    existing: {
      startDate: Date;
      endDate: Date;
      minLimit: number;
      maxLimit: number | null;
      originalPrice: string;
      discountType: DiscountType;
      discountValue: string;
    },
  ) {
    const updates: UpdateVoucherProductRecord = {};

    if (input.categoryId !== undefined) {
      if (typeof input.categoryId !== "string") {
        throw new AppError("categoryId must be a string", 400);
      }
      updates.categoryId = input.categoryId;
    }

    if (input.title !== undefined) {
      if (typeof input.title !== "string") {
        throw new AppError("title must be a string", 400);
      }
      const title = trim(input.title);
      if (!title) {
        throw new AppError("title is required", 400);
      }
      updates.title = title;
    }

    if (input.description !== undefined) {
      updates.description = normalizeOptionalString(input.description, "description");
    }

    if (input.originalPrice !== undefined) {
      updates.originalPrice = normalizeMoney(
        input.originalPrice,
        "originalPrice",
      );
    }

    if (input.discountType !== undefined) {
      if (typeof input.discountType !== "string") {
        throw new AppError("discountType must be a string", 400);
      }
      if (!isDiscountType(input.discountType)) {
        throw new AppError("Invalid discountType", 400);
      }
      updates.discountType = input.discountType;
    }

    if (input.discountValue !== undefined) {
      updates.discountValue = normalizeMoney(
        input.discountValue,
        "discountValue",
      );
    }

    if (input.startDate !== undefined) {
      updates.startDate = normalizeDate(input.startDate, "startDate");
    }

    if (input.endDate !== undefined) {
      updates.endDate = normalizeDate(input.endDate, "endDate");
    }

    if (input.validDurationDays !== undefined) {
      const validDurationDays = normalizeOptionalInteger(input.validDurationDays, "validDurationDays");
      if (validDurationDays === undefined || validDurationDays < 1) {
        throw new AppError("validDurationDays must be a positive integer", 400);
      }
      updates.validDurationDays = validDurationDays;
    }

    if (input.minLimit !== undefined) {
      const minLimit = normalizeOptionalInteger(input.minLimit, "minLimit");
      if (minLimit === undefined || minLimit < 1) {
        throw new AppError("minLimit must be a positive integer", 400);
      }
      updates.minLimit = minLimit;
    }

    if (input.maxLimit !== undefined) {
      updates.maxLimit = normalizeOptionalNullableInteger(input.maxLimit, "maxLimit");
    }

    const nextStartDate = updates.startDate ?? existing.startDate;
    const nextEndDate = updates.endDate ?? existing.endDate;
    const nextMinLimit = updates.minLimit ?? existing.minLimit;
    const nextMaxLimit =
      updates.maxLimit !== undefined ? updates.maxLimit : existing.maxLimit;

    if (nextStartDate >= nextEndDate) {
      throw new AppError("startDate must be before endDate", 400);
    }

    if (nextMaxLimit !== null && nextMaxLimit < nextMinLimit) {
      throw new AppError("maxLimit must be greater than or equal to minLimit", 400);
    }

    const nextOriginalPrice = updates.originalPrice ?? existing.originalPrice;
    const nextDiscountType = updates.discountType ?? existing.discountType;
    const nextDiscountValue = updates.discountValue ?? existing.discountValue;

    validateDiscountedPrice(nextOriginalPrice, nextDiscountType, nextDiscountValue);

    if (input.imageUrl !== undefined) {
      updates.imageUrl = normalizeOptionalNullableString(input.imageUrl, "imageUrl");
    }

    return updates;
  }
}
