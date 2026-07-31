import { Request, Response } from "express";
import { customerProfileService } from "./customerProfile.service";

export class CustomerProfileController {
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];

            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const profile = await customerProfileService.getProfile(userId as string);
            res.status(200).json({ data: profile });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const updatedProfile = await customerProfileService.updateProfile(userId as string, req.body);
            res.status(200).json({ data: updatedProfile, message: "Profile updated successfully" });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    async uploadAvatar(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id || req.headers["x-user-id"];
            const { avatarBase64 } = req.body;
            
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            if (!avatarBase64) {
                res.status(400).json({ error: "avatarBase64 is required in request body" });
                return;
            }

            const updatedProfile = await customerProfileService.uploadAvatar(userId as string, avatarBase64);
            res.status(200).json({ data: updatedProfile, message: "Avatar uploaded successfully" });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }
}

export const customerProfileController = new CustomerProfileController();
