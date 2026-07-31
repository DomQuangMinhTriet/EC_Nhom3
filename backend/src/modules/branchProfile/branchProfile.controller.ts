import { Request, Response } from "express";
import { branchProfileService } from "./branchProfile.service";

export class BranchProfileController {
    // [Client] Get current branch profile
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const profile = await branchProfileService.getProfile(userId as string);
            res.status(200).json({ data: profile });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Client] Update current branch profile
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const updatedProfile = await branchProfileService.updateProfile(userId as string, req.body);
            res.status(200).json({ data: updatedProfile, message: "Profile updated successfully" });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Admin] Get all branches
    async getAllBranches(req: Request, res: Response): Promise<void> {
        try {
            // if ((req as any).user?.roleCode !== "admin" && req.headers["x-role-code"] !== "admin") {
            //     res.status(403).json({ error: "Forbidden: Admins only" });
            //     return;
            // }

            const branches = await branchProfileService.getAllBranches();
            res.status(200).json({ data: branches });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Admin] Update branch status
    async updateBranchStatus(req: Request, res: Response): Promise<void> {
        try {
            // Uncomment the following line when auth middleware is integrated
            // if ((req as any).user?.roleCode !== "admin" && req.headers["x-role-code"] !== "admin") {
            //     res.status(403).json({ error: "Forbidden: Admins only" });
            //     return;
            // }

            const { id } = req.params;
            const { status, rejectionReason } = req.body;

            if (!status || !["pending", "approved", "rejected"].includes(status)) {
                res.status(400).json({ error: "Invalid status value" });
                return;
            }

            const updatedProfile = await branchProfileService.updateBranchStatus(id, status, rejectionReason);
            res.status(200).json({ data: updatedProfile, message: `Branch status updated to ${status}` });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }
}

export const branchProfileController = new BranchProfileController();
