import { Request, Response } from "express";
import { partnerProfileService } from "./partnerProfile.service";

export class PartnerProfileController {
    // [Client] Get current partner profile
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const profile = await partnerProfileService.getProfile(userId as string);
            res.status(200).json({ data: profile });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Client] Update current partner profile
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const updatedProfile = await partnerProfileService.updateProfile(userId as string, req.body);
            res.status(200).json({ data: updatedProfile, message: "Profile updated successfully" });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Client] Get list of branches for current partner
    async getBranches(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const branches = await partnerProfileService.getBranches(userId as string);
            res.status(200).json({ data: branches });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Admin] Get all partners
    async getAllPartners(req: Request, res: Response): Promise<void> {
        try {
            // Uncomment the following line when auth middleware is integrated
            // if ((req as any).user?.roleCode !== "admin" && req.headers["x-role-code"] !== "admin") {
            //     res.status(403).json({ error: "Forbidden: Admins only" });
            //     return;
            // }

            const partners = await partnerProfileService.getAllPartners();
            res.status(200).json({ data: partners });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    // [Admin] Update partner status
    async updatePartnerStatus(req: Request, res: Response): Promise<void> {
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

            const updatedProfile = await partnerProfileService.updatePartnerStatus(id, status, rejectionReason);
            res.status(200).json({ data: updatedProfile, message: `Partner status updated to ${status}` });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }
}

export const partnerProfileController = new PartnerProfileController();
