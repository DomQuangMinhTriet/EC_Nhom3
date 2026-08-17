import { Request, Response } from "express";
import { customerProfileService } from "./customerProfile.service";
import { AppError } from "../../shared/errors/AppError";

type UpdateCustomerProfileInput = {
    fullName?: string;
    phone?: string;
    birthDate?: string;
    gender?: "Nam" | "Nữ";
    address?: string;
};

type UploadAvatarInput = {
    avatarBase64?: string;
};

export class CustomerProfileController {
    async getProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const profile = await customerProfileService.getProfile(userId);
        res.json({ data: profile });
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const body = req.body as UpdateCustomerProfileInput;
        const updatedProfile = await customerProfileService.updateProfile(userId, body);
        res.json({ data: updatedProfile, message: "Profile updated successfully" });
    }

    async uploadAvatar(req: Request, res: Response): Promise<void> {
        const userId = req.user!.userId;
        const { avatarBase64 } = req.body as UploadAvatarInput;
        
        if (!avatarBase64) {
            throw new AppError("avatarBase64 is required in request body", 400);
        }

        const updatedProfile = await customerProfileService.uploadAvatar(userId, avatarBase64);
        res.json({ data: updatedProfile, message: "Avatar uploaded successfully" });
    }
}

export const customerProfileController = new CustomerProfileController();
