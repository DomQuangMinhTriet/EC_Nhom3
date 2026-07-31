import { customerProfileRepository } from "./customerProfile.repository";
import { uploadToCloudinary } from "../../lib/cloudinary";

export class CustomerProfileService {
    async getProfile(userId: string) {
        const profile = await customerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error("Customer profile not found");
        }
        return profile;
    }

    async updateProfile(userId: string, data: any) {
        // Only allow updating specific fields
        const updateData: Record<string, any> = {
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
            ...(data.gender !== undefined && { gender: data.gender }),
            ...(data.address !== undefined && { address: data.address }),
        };

        const updatedProfile = await customerProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new Error("Customer profile not found or update failed");
        }
        return updatedProfile;
    }

    async uploadAvatar(userId: string, base64Image: string) {
        // "avatar" is a folder placeholder
        const avatarUrl = await uploadToCloudinary(base64Image, "avatars");
        
        // Update avatarUrl in db
        const updatedProfile = await customerProfileRepository.updateByUserId(userId, { avatarUrl });
        if (!updatedProfile) {
            throw new Error("Customer profile not found");
        }
        return updatedProfile;
    }
}

export const customerProfileService = new CustomerProfileService();
