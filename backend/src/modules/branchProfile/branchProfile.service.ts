import { branchProfileRepository } from "./branchProfile.repository";

export class BranchProfileService {
    async getProfile(userId: string) {
        const profile = await branchProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error("Branch profile not found");
        }
        return profile;
    }

    async updateProfile(userId: string, data: any) {
        const updateData: Record<string, any> = {
            ...(data.branchName !== undefined && { branchName: data.branchName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.email !== undefined && { email: data.email }),
        };

        const updatedProfile = await branchProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new Error("Branch profile not found or update failed");
        }
        return updatedProfile;
    }

    async getAllBranches() {
        return await branchProfileRepository.findAll();
    }

    async updateBranchStatus(id: string, status: "pending" | "approved" | "rejected", rejectionReason?: string) {
        if (status === "rejected" && !rejectionReason) {
            throw new Error("Rejection reason is required when rejecting a branch");
        }
        
        const updatedProfile = await branchProfileRepository.updateStatusById(
            id, 
            status, 
            status === "rejected" ? rejectionReason : ""
        );
        
        if (!updatedProfile) {
            throw new Error("Branch profile not found");
        }
        return updatedProfile;
    }
}

export const branchProfileService = new BranchProfileService();
