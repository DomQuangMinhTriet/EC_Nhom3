import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { VoucherInstanceService } from "./voucherInstance.service";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class VoucherInstanceController {
    constructor(private readonly voucherInstanceService = new VoucherInstanceService()) {}

    getMyVouchers = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const statusFilter = req.query.status as string | undefined;

        const vouchers = await this.voucherInstanceService.getMyVouchers(userId, statusFilter);
        res.json({ data: vouchers });
    };

    getVoucherDetail = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const voucherCodeId = req.params.id as string;

        if (!uuidRegex.test(voucherCodeId)) {
            throw new AppError("Invalid voucher ID", 400);
        }

        const voucherDetail = await this.voucherInstanceService.getVoucherDetail(userId, voucherCodeId);
        res.json({ data: voucherDetail });
    };
}
