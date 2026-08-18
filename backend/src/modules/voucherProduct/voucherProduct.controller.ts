import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { VoucherProductService } from "./voucherProduct.service";
import type { VoucherProductStatus } from "./voucherProduct.repository";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parsePositiveIntegerQuery = (
  value: unknown,
  field: string,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a number`, 400);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(`${field} must be a positive integer`, 400);
  }

  return parsed;
};

const parseOptionalStringQuery = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }

  return value;
};

const parseVoucherId = (value: unknown) => {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new AppError("Invalid voucher ID", 400);
  }

  return value;
};

export class VoucherProductController {
  constructor(
    private readonly voucherProductService = new VoucherProductService(),
  ) {}

  createVoucher = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const {
      categoryId,
      title,
      description,
      originalPrice,
      discountType,
      discountValue,
      startDate,
      endDate,
      validDurationDays,
      minLimit,
      maxLimit,
      imageUrl,
    } = req.body as Record<string, unknown>;

    if (
      typeof categoryId !== "string" ||
      typeof title !== "string" ||
      (typeof originalPrice !== "string" && typeof originalPrice !== "number") ||
      typeof discountType !== "string" ||
      (typeof discountValue !== "string" && typeof discountValue !== "number") ||
      (typeof startDate !== "string" && !(startDate instanceof Date)) ||
      (typeof endDate !== "string" && !(endDate instanceof Date)) ||
      typeof validDurationDays !== "number"
    ) {
      throw new AppError("Missing or invalid required voucher fields", 400);
    }

    res.status(201).json(
      await this.voucherProductService.createVoucher(req.user.userId, {
        categoryId,
        title,
        description:
          typeof description === "string" ? description : undefined,
        originalPrice,
        discountType: discountType as "direct" | "percentage",
        discountValue,
        startDate,
        endDate,
        validDurationDays,
        minLimit: typeof minLimit === "number" ? minLimit : undefined,
        maxLimit:
          typeof maxLimit === "number" || maxLimit === null
            ? maxLimit
            : undefined,
        imageUrl: typeof imageUrl === "string" || imageUrl === null
          ? imageUrl
          : undefined,
      }),
    );
  };

  getPartnerVouchers = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    res.json(
      await this.voucherProductService.getPartnerVouchers(req.user.userId),
    );
  };

  updatePartnerVoucher = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    res.json(
      await this.voucherProductService.updatePartnerVoucher(
        req.user.userId,
        parseVoucherId(req.params.id),
        req.body,
      ),
    );
  };

  getVouchers = async (req: Request, res: Response) => {
    const status = parseOptionalStringQuery(req.query.status, "status");

    res.json(
      await this.voucherProductService.getVouchers({
        page: parsePositiveIntegerQuery(req.query.page, "page"),
        pageSize: parsePositiveIntegerQuery(req.query.pageSize, "pageSize"),
        categoryId: parseOptionalStringQuery(
          req.query.categoryId,
          "categoryId",
        ),
        status: status as VoucherProductStatus | undefined,
        search: parseOptionalStringQuery(req.query.search, "search"),
      }),
    );
  };

  getVoucherById = async (req: Request, res: Response) => {
    res.json(
      await this.voucherProductService.getVoucherById(
        parseVoucherId(req.params.id),
      ),
    );
  };

  updateVoucherStatus = async (req: Request, res: Response) => {
    const { status, rejectionReason } = req.body as {
      status?: string;
      rejectionReason?: string | null;
    };

    if (typeof status !== "string") {
      throw new AppError("status is required", 400);
    }

    res.json(
      await this.voucherProductService.updateVoucherStatus(
        parseVoucherId(req.params.id),
        {
          status: status as "active" | "inactive" | "rejected",
          rejectionReason,
        },
      ),
    );
  };
}
