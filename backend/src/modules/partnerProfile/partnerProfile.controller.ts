import { Request, Response } from "express";
import { partnerProfileService } from "./partnerProfile.service";
import { AppError } from "../../shared/errors/AppError";

type UpdatePartnerProfileInput = {
    partnerName?: string;
    taxCode?: string;
    representativeName?: string;
};

type UpdatePartnerStatusInput = {
    status?: "pending" | "active" | "suspended" | "terminated" | "rejected";
    rejectionReason?: string;
};

export class PartnerProfileController {
    // [Client] Get current partner profile
    async getProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const profile = await partnerProfileService.getProfile(userId);
        res.json({ data: profile });
    }

    // [Client] Update current partner profile
    async updateProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const body = req.body as UpdatePartnerProfileInput;
        const updatedProfile = await partnerProfileService.updateProfile(userId, body);
        res.json({ data: updatedProfile, message: "Profile updated successfully" });
    }

    // [Client] Get list of branches for current partner
    async getBranches(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const branches = await partnerProfileService.getBranches(userId);
        res.json({ data: branches });
    }

    // [Admin] Get all partners
    async getAllPartners(req: Request, res: Response): Promise<void> {
        const partners = await partnerProfileService.getAllPartners();
        res.json({ data: partners });
    }

    // [Admin] Update partner status
    async updatePartnerStatus(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        const { status, rejectionReason } = req.body as UpdatePartnerStatusInput;

        if (!status || !["pending", "active", "suspended", "terminated", "rejected"].includes(status)) {
            throw new AppError("Invalid status value", 400);
        }

        const updatedProfile = await partnerProfileService.updatePartnerStatus(id, status, rejectionReason);
        res.json({ data: updatedProfile, message: `Partner status updated to ${status}` });
    }
}

export const partnerProfileController = new PartnerProfileController();
