import { AppError } from "../../shared/errors/AppError";
import { VoucherInstanceRepository } from "./voucherInstance.repository";

export class VoucherInstanceService {
  constructor(
    private readonly voucherInstanceRepository = new VoucherInstanceRepository(),
  ) {}

  private async getCustomerProfileId(userId: string): Promise<string> {
    const customerProfileId =
      await this.voucherInstanceRepository.getCustomerProfileIdByUserId(userId);
    if (!customerProfileId) {
      throw new AppError("Customer profile not found", 404);
    }
    return customerProfileId;
  }

  private async getBranchProfileId(userId: string): Promise<string> {
    const branchProfileId =
      await this.voucherInstanceRepository.getBranchProfileIdByUserId(userId);
    if (!branchProfileId) {
      throw new AppError("Branch profile not found", 404);
    }
    return branchProfileId;
  }

  async getMyVouchers(userId: string, statusFilter?: string) {
    const customerProfileId = await this.getCustomerProfileId(userId);
    return await this.voucherInstanceRepository.getVouchers(
      customerProfileId,
      statusFilter,
    );
  }

  async getVoucherDetail(userId: string, voucherCodeId: string) {
    const customerProfileId = await this.getCustomerProfileId(userId);

    // This implicitly guarantees the voucher belongs to the user
    const voucher = await this.voucherInstanceRepository.getVoucherByIdAndOwner(
      voucherCodeId,
      customerProfileId,
    );

    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }

    // QR is rendered client-side from `code` (see VoucherInstanceQr) — no
    // need to also encode it here.
    return voucher;
  }

  async lookupVoucherForRedemption(userId: string, code: string) {
    const branchProfileId = await this.getBranchProfileId(userId);
    const voucher = await this.getRedeemableVoucherForBranch(
      branchProfileId,
      code,
    );

    return this.withRedemptionStatus(voucher);
  }

  async redeemVoucher(userId: string, code: string) {
    const branchProfileId = await this.getBranchProfileId(userId);
    const voucher = await this.getRedeemableVoucherForBranch(
      branchProfileId,
      code,
    );
    const redemptionStatus = this.withRedemptionStatus(voucher);

    if (!redemptionStatus.redeemable) {
      throw new AppError(
        redemptionStatus.reason ?? "Voucher is not redeemable",
        400,
      );
    }

    const redeemedVoucher =
      await this.voucherInstanceRepository.redeemVoucherCode(code);

    if (!redeemedVoucher) {
      throw new AppError("Voucher is no longer redeemable", 409);
    }

    return {
      ...redeemedVoucher,
      redeemable: false,
      reason: null,
    };
  }

  private async getRedeemableVoucherForBranch(
    branchProfileId: string,
    code: string,
  ) {
    const voucher =
      await this.voucherInstanceRepository.getVoucherByCodeForRedemption(code);

    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }

    const isAllocatedToBranch =
      await this.voucherInstanceRepository.hasBranchVoucherAllocation(
        branchProfileId,
        voucher.voucherProduct.voucherProductId,
      );

    if (!isAllocatedToBranch) {
      throw new AppError("Voucher cannot be redeemed at this branch", 403);
    }

    return voucher;
  }

  private withRedemptionStatus<
    T extends { status: string; expiredAt: Date; usedAt?: Date | null },
  >(voucher: T) {
    if (voucher.status === "used" || voucher.usedAt) {
      return {
        ...voucher,
        redeemable: false,
        reason: "Voucher has already been used",
      };
    }

    if (voucher.status === "available" && voucher.expiredAt > new Date()) {
      return {
        ...voucher,
        redeemable: true,
        reason: null,
      };
    }

    if (voucher.status === "expired" || voucher.expiredAt <= new Date()) {
      return {
        ...voucher,
        redeemable: false,
        reason: "Voucher has expired",
      };
    }

    return {
      ...voucher,
      redeemable: false,
      reason: `Voucher status is ${voucher.status}`,
    };
  }
}
