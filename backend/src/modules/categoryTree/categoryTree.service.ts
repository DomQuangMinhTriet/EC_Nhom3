import { CategoryTreeRepository } from "./categoryTree.repository";
import { AppError } from "../../shared/errors/AppError";

export type CreateCategoryInput = {
    name: string;
    parentCategoryId?: string;
};

export type UpdateCategoryInput = {
    name?: string;
    parentCategoryId?: string | null;
};

export class CategoryTreeService {
    constructor(private readonly categoryTreeRepository = new CategoryTreeRepository()) {}

    async getAllCategories() {
        return await this.categoryTreeRepository.findAll();
    }

    async createCategory(data: CreateCategoryInput) {
        if (data.parentCategoryId) {
            const parent = await this.categoryTreeRepository.findById(data.parentCategoryId);
            if (!parent) {
                throw new AppError("Parent category not found", 404);
            }
        }
        return await this.categoryTreeRepository.create(data);
    }

    async updateCategory(categoryId: string, data: UpdateCategoryInput) {
        const category = await this.categoryTreeRepository.findById(categoryId);
        if (!category) {
            throw new AppError("Category not found", 404);
        }

        if (data.parentCategoryId) {
            if (data.parentCategoryId === categoryId) {
                throw new AppError("A category cannot be its own parent", 400);
            }
            const parent = await this.categoryTreeRepository.findById(data.parentCategoryId);
            if (!parent) {
                throw new AppError("Parent category not found", 404);
            }
        }

        return await this.categoryTreeRepository.update(categoryId, data);
    }

    async deleteCategory(categoryId: string) {
        const category = await this.categoryTreeRepository.findById(categoryId);
        if (!category) {
            throw new AppError("Category not found", 404);
        }

        const hasChildren = await this.categoryTreeRepository.hasChildren(categoryId);
        if (hasChildren) {
            throw new AppError("Cannot delete a category that has child categories", 400);
        }

        return await this.categoryTreeRepository.delete(categoryId);
    }
}
