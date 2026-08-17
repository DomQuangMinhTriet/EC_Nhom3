import { Request, Response } from "express";
import { branchQuotaService } from "./branchQuota.service";
import { AppError } from "../../shared/errors/AppError";

export class BranchQuotaController {
    async allocateVouchers(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        const allocations = req.body as { branchProfileId: string; totalQuantity: number }[];

        if (!Array.isArray(allocations)) {
            throw new AppError("Request body must be an array of allocations", 400);
        }



        // Filter out bad payload shapes (Fail one, not all)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

        const { inserted, hasConflicts } = await branchQuotaService.allocateVouchers(userId, voucherProductId, validAllocations);
        
        if (hasConflicts) {
            res.status(409).json({ data: inserted, message: "Some branch allocations already existed and were skipped (Conflict)" });
        } else {
            res.status(201).json({ data: inserted, message: "Allocations created successfully" });
        }
    }

    async getAllocations(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;

        const allocations = await branchQuotaService.getAllocations(userId, voucherProductId);
        res.json({ data: allocations });
    }

    async updateAllocation(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        const branchProfileId = req.params.branchId as string;
        const { totalQuantity } = req.body as { totalQuantity?: number };

        if (totalQuantity === undefined || !Number.isInteger(totalQuantity) || totalQuantity < 0) {
            throw new AppError("Valid non-negative integer totalQuantity is required", 400);
        }

        const updated = await branchQuotaService.updateAllocation(userId, voucherProductId, branchProfileId, totalQuantity);
        res.json({ data: updated, message: "Allocation updated successfully" });
    }

    async deleteAllocation(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const voucherProductId = req.params.id as string;
        const branchProfileId = req.params.branchId as string;

        const result = await branchQuotaService.deleteAllocation(userId, voucherProductId, branchProfileId);
        if (result.action === "updated") {
            res.json({ message: "Allocation updated (Smart Revoked) to match soldQuantity" });
        } else {
            res.json({ message: "Allocation deleted successfully" });
        }
    }
}

export const branchQuotaController = new BranchQuotaController();
