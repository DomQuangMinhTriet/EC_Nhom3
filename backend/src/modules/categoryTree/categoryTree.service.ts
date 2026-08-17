import { categoryTreeRepository } from "./categoryTree.repository";
import { AppError } from "../../shared/errors/AppError";

export class CategoryTreeService {
    async getAllCategories() {
        return await categoryTreeRepository.findAll();
    }

    async createCategory(data: { name: string; parentCategoryId?: string }) {
        if (data.parentCategoryId) {
            const parent = await categoryTreeRepository.findById(data.parentCategoryId);
            if (!parent) {
                throw new AppError("Parent category not found", 404);
            }
        }
        return await categoryTreeRepository.create(data);
    }

    async updateCategory(categoryId: string, data: { name?: string; parentCategoryId?: string | null }) {
        const category = await categoryTreeRepository.findById(categoryId);
        if (!category) {
            throw new AppError("Category not found", 404);
        }

        if (data.parentCategoryId) {
            if (data.parentCategoryId === categoryId) {
                throw new AppError("A category cannot be its own parent", 400);
            }
            const parent = await categoryTreeRepository.findById(data.parentCategoryId);
            if (!parent) {
                throw new AppError("Parent category not found", 404);
            }
        }

        return await categoryTreeRepository.update(categoryId, data);
    }

    async deleteCategory(categoryId: string) {
        const category = await categoryTreeRepository.findById(categoryId);
        if (!category) {
            throw new AppError("Category not found", 404);
        }

        const hasChildren = await categoryTreeRepository.hasChildren(categoryId);
        if (hasChildren) {
            throw new AppError("Cannot delete a category that has child categories", 400);
        }

        return await categoryTreeRepository.delete(categoryId);
    }
}

export const categoryTreeService = new CategoryTreeService();
