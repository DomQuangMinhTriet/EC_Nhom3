import { branchProfileRepository } from "./branchProfile.repository";
import { AppError } from "../../shared/errors/AppError";

export class BranchProfileService {
    async getProfile(userId: string) {
        const profile = await branchProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new AppError("Branch profile not found", 404);
        }
        return profile;
    }

    async updateProfile(userId: string, data: { branchName?: string; phone?: string; address?: string; email?: string }) {
        const updateData: Partial<typeof data> = {
            ...(data.branchName !== undefined && { branchName: data.branchName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.email !== undefined && { email: data.email }),
        };

        const updatedProfile = await branchProfileRepository.updateByUserId(userId, updateData);
        if (!updatedProfile) {
            throw new AppError("Branch profile not found or update failed", 404);
        }
        return updatedProfile;
    }

    async getAllBranches() {
        return await branchProfileRepository.findAll();
    }

    async updateBranchStatus(id: string, status: "pending" | "active" | "suspended" | "closed" | "rejected", rejectionReason?: string) {
        if (status === "rejected" && !rejectionReason) {
            throw new AppError("Rejection reason is required when rejecting a branch", 400);
        }
        
        const updatedProfile = await branchProfileRepository.updateStatusById(
            id, 
            status, 
            status === "rejected" ? rejectionReason : ""
        );
        
        if (!updatedProfile) {
            throw new AppError("Branch profile not found", 404);
        }
        return updatedProfile;
    }
}

export const branchProfileService = new BranchProfileService();
