import { partnerProfileRepository } from "./partnerProfile.repository";

export class PartnerProfileService {
    async getProfile(userId: string) {
        const profile = await partnerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error("Partner profile not found");
        }
        return profile;
    }

    async updateProfile(userId: string, data: any) {
        const updateData: Record<string, any> = {
            ...(data.partnerName !== undefined && { partnerName: data.partnerName }),
            ...(data.taxCode !== undefined && { taxCode: data.taxCode }),
            ...(data.representativeName !== undefined && { representativeName: data.representativeName }),
        };

        const updatedProfile = await partnerProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new Error("Partner profile not found or update failed");
        }
        return updatedProfile;
    }

    async getBranches(userId: string) {
        const profile = await partnerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error("Partner profile not found");
        }
        const branches = await partnerProfileRepository.findBranchesByPartnerProfileId(profile.partnerProfileId);
        return branches;
    }

    async getAllPartners() {
        return await partnerProfileRepository.findAll();
    }

    async updatePartnerStatus(id: string, status: "pending" | "approved" | "rejected", rejectionReason?: string) {
        if (status === "rejected" && !rejectionReason) {
            throw new Error("Rejection reason is required when rejecting a partner");
        }
        
        const updatedProfile = await partnerProfileRepository.updateStatusById(
            id, 
            status, 
            status === "rejected" ? rejectionReason : ""
        );
        
        if (!updatedProfile) {
            throw new Error("Partner profile not found");
        }
        return updatedProfile;
    }
}

export const partnerProfileService = new PartnerProfileService();
