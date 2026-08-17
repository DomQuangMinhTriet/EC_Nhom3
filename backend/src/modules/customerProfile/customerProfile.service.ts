import { customerProfileRepository } from "./customerProfile.repository";
import { AppError } from "../../shared/errors/AppError";
import { uploadToCloudinary } from "../../lib/cloudinary";

export class CustomerProfileService {
    async getProfile(userId: string) {
        const profile = await customerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new AppError("Customer profile not found", 404);
        }
        return profile;
    }

    async updateProfile(userId: string, data: { fullName?: string; phone?: string; birthDate?: string; gender?: "Nam" | "Nữ"; address?: string }) {
        // Build the update object
        const updateData: Partial<typeof data> = {
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
            ...(data.gender !== undefined && { gender: data.gender }),
            ...(data.address !== undefined && { address: data.address }),
        };

        const updatedProfile = await customerProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new AppError("Customer profile not found or update failed", 404);
        }
        return updatedProfile;
    }

    async uploadAvatar(userId: string, base64Image: string) {
        // "avatar" is a folder placeholder
        const avatarUrl = await uploadToCloudinary(base64Image, "avatars");
        
        // Update avatarUrl in db
        const updatedProfile = await customerProfileRepository.updateByUserId(userId, { avatarUrl });
        if (!updatedProfile) {
            throw new AppError("Customer profile not found", 404);
        }
        return updatedProfile;
    }
}

export const customerProfileService = new CustomerProfileService();
