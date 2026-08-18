import QRCode from "qrcode";
import { AppError } from "../../shared/errors/AppError";
import { VoucherInstanceRepository } from "./voucherInstance.repository";

export class VoucherInstanceService {
    constructor(private readonly voucherInstanceRepository = new VoucherInstanceRepository()) {}

    private async getCustomerProfileId(userId: string): Promise<string> {
        const customerProfileId = await this.voucherInstanceRepository.getCustomerProfileIdByUserId(userId);
        if (!customerProfileId) {
            throw new AppError("Customer profile not found", 404);
        }
        return customerProfileId;
    }

    async getMyVouchers(userId: string, statusFilter?: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);
        return await this.voucherInstanceRepository.getVouchers(customerProfileId, statusFilter);
    }

    async getVoucherDetail(userId: string, voucherCodeId: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);
        
        // This implicitly guarantees the voucher belongs to the user
        const voucher = await this.voucherInstanceRepository.getVoucherByIdAndOwner(voucherCodeId, customerProfileId);
        
        if (!voucher) {
            throw new AppError("Voucher not found", 404);
        }

        // Generate QR code on-the-fly from the code string
        const qrDataUri = await QRCode.toDataURL(voucher.code);

        return {
            ...voucher,
            qrDataUri,
        };
    }
}
