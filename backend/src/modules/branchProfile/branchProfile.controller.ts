import { Request, Response } from "express";
import { branchProfileService } from "./branchProfile.service";
import { AppError } from "../../shared/errors/AppError";

type UpdateBranchProfileInput = {
    branchName?: string;
    phone?: string;
    address?: string;
    email?: string;
};

type UpdateBranchStatusInput = {
    status?: "pending" | "active" | "suspended" | "closed" | "rejected";
    rejectionReason?: string;
};

export class BranchProfileController {
    // [Client] Get current branch profile
    async getProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const profile = await branchProfileService.getProfile(userId);
        res.json({ data: profile });
    }

    // [Client] Update current branch profile
    async updateProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const body = req.body as UpdateBranchProfileInput;
        const updatedProfile = await branchProfileService.updateProfile(userId, body);
        res.json({ data: updatedProfile, message: "Profile updated successfully" });
    }

    // [Admin] Get all branches
    async getAllBranches(req: Request, res: Response): Promise<void> {
        const branches = await branchProfileService.getAllBranches();
        res.json({ data: branches });
    }

    // [Admin] Update branch status
    async updateBranchStatus(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        const { status, rejectionReason } = req.body as UpdateBranchStatusInput;

        if (!status || !["pending", "active", "suspended", "closed", "rejected"].includes(status)) {
            throw new AppError("Invalid status value", 400);
        }

        const updatedProfile = await branchProfileService.updateBranchStatus(id, status, rejectionReason);
        res.json({ data: updatedProfile, message: `Branch status updated to ${status}` });
    }
}

export const branchProfileController = new BranchProfileController();
