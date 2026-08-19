import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { isUuid } from "../../shared/http/requestParsers";
import { VoucherInstanceService } from "./voucherInstance.service";

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

        if (!isUuid(voucherCodeId)) {
            throw new AppError("Invalid voucher ID", 400);
        }

        const voucherDetail = await this.voucherInstanceService.getVoucherDetail(userId, voucherCodeId);
        res.json({ data: voucherDetail });
    };
}
