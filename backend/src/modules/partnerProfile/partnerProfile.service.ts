import { partnerProfileRepository } from "./partnerProfile.repository";
import { AppError } from "../../shared/errors/AppError";

export class PartnerProfileService {
    async getProfile(userId: string) {
        const profile = await partnerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new AppError("Partner profile not found", 404);
        }
        return profile;
    }

    async updateProfile(userId: string, data: { partnerName?: string; taxCode?: string; representativeName?: string }) {
        const updateData: Partial<typeof data> = {
            ...(data.partnerName !== undefined && { partnerName: data.partnerName }),
            ...(data.taxCode !== undefined && { taxCode: data.taxCode }),
            ...(data.representativeName !== undefined && { representativeName: data.representativeName }),
        };

        const updatedProfile = await partnerProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new AppError("Partner profile not found or update failed", 404);
        }
        return updatedProfile;
    }

    async getBranches(userId: string) {
        const profile = await partnerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new AppError("Partner profile not found", 404);
        }
        const branches = await partnerProfileRepository.findBranchesByPartnerProfileId(profile.partnerProfileId);
        return branches;
    }

    async getAllPartners() {
        return await partnerProfileRepository.findAll();
    }

    async updatePartnerStatus(id: string, status: "pending" | "active" | "suspended" | "terminated" | "rejected", rejectionReason?: string) {
        if (status === "rejected" && !rejectionReason) {
            throw new AppError("Rejection reason is required when rejecting a partner", 400);
        }
        
        const updatedProfile = await partnerProfileRepository.updateStatusById(
            id, 
            status, 
            status === "rejected" ? rejectionReason : ""
        );
        
        if (!updatedProfile) {
            throw new AppError("Partner profile not found", 404);
        }
        return updatedProfile;
    }
}

export const partnerProfileService = new PartnerProfileService();
