import { Request, Response } from "express";
import { BranchQuotaService, type BranchAllocationInput } from "./branchQuota.service";
import { AppError } from "../../shared/errors/AppError";
import { parsePositiveIntegerQuery } from "../../shared/http/requestParsers";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BranchQuotaController {
    constructor(private readonly branchQuotaService = new BranchQuotaService()) {}

    getPublicAllocations = async (req: Request, res: Response) => {
        const voucherProductId = req.params.id as string;

        if (!uuidRegex.test(voucherProductId)) {
            throw new AppError("Invalid voucher ID", 400);
        }

        const data = await this.branchQuotaService.getPublicAllocations(voucherProductId);
        res.json({ data });
    };

    allocateVouchers = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        
        if (!uuidRegex.test(voucherProductId)) {
            throw new AppError("Invalid voucher ID", 400);
        }
        
        const allocations = req.body as BranchAllocationInput[];

        if (!Array.isArray(allocations)) {
            throw new AppError("Request body must be an array of allocations", 400);
        }

        // Filter out bad payload shapes (Fail one, not all)
        const validAllocations = allocations.filter(a => 
            a && 
            typeof a === 'object' &&
            a.branchProfileId && 
            typeof a.branchProfileId === 'string' &&
            uuidRegex.test(a.branchProfileId) &&
            a.totalQuantity !== undefined && 
            Number.isInteger(a.totalQuantity) && 
            a.totalQuantity >= 0
        );

        if (validAllocations.length === 0) {
            throw new AppError("No valid allocations provided in request", 400);
        }

        const { inserted, hasConflicts } = await this.branchQuotaService.allocateVouchers(userId, voucherProductId, validAllocations);
        
        if (hasConflicts) {
            res.status(409).json({ data: inserted, message: "Some branch allocations already existed and were skipped (Conflict)" });
        } else {
            res.status(201).json({ data: inserted, message: "Allocations created successfully" });
        }
    };

    getAllocations = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        
        if (!uuidRegex.test(voucherProductId)) {
            throw new AppError("Invalid voucher ID", 400);
        }

        const result = await this.branchQuotaService.getAllocations(userId, voucherProductId, {
            page: parsePositiveIntegerQuery(req.query.page, "page"),
            pageSize: parsePositiveIntegerQuery(req.query.pageSize, "pageSize"),
        });
        res.json(result);
    };

    updateAllocation = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        const branchProfileId = req.params.branchId as string;
        
        if (!uuidRegex.test(voucherProductId) || !uuidRegex.test(branchProfileId)) {
            throw new AppError("Invalid voucher ID or branch ID", 400);
        }

        const { totalQuantity } = req.body as { totalQuantity?: number };

        if (totalQuantity === undefined || !Number.isInteger(totalQuantity) || totalQuantity < 0) {
            throw new AppError("Valid non-negative integer totalQuantity is required", 400);
        }

        const updated = await this.branchQuotaService.updateAllocation(userId, voucherProductId, branchProfileId, totalQuantity);
        res.json({ data: updated, message: "Allocation updated successfully" });
    };

    deleteAllocation = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        const branchProfileId = req.params.branchId as string;
        
        if (!uuidRegex.test(voucherProductId) || !uuidRegex.test(branchProfileId)) {
            throw new AppError("Invalid voucher ID or branch ID", 400);
        }

        const result = await this.branchQuotaService.deleteAllocation(userId, voucherProductId, branchProfileId);
        if (result.action === "updated") {
            res.json({ message: "Allocation updated (Smart Revoked) to match soldQuantity" });
        } else {
            res.json({ message: "Allocation deleted successfully" });
        }
    };
}
