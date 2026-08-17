import { Request, Response } from "express";
import { categoryTreeService } from "./categoryTree.service";
import { AppError } from "../../shared/errors/AppError";

type CreateCategoryInput = {
    name: string;
    parentCategoryId?: string;
};

type UpdateCategoryInput = {
    name?: string;
    parentCategoryId?: string | null;
};

export class CategoryTreeController {
    // [Public] Get all categories
    async getAllCategories(req: Request, res: Response): Promise<void> {
        const categories = await categoryTreeService.getAllCategories();
        res.json({ data: categories });
    }

    // [Admin] Create a category
    async createCategory(req: Request, res: Response): Promise<void> {
        const body = req.body as CreateCategoryInput;
        if (!body.name) {
            throw new AppError("Category name is required", 400);
        }

        const category = await categoryTreeService.createCategory(body);
        res.status(201).json({ data: category, message: "Category created successfully" });
    }

    // [Admin] Update a category
    async updateCategory(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        const body = req.body as UpdateCategoryInput;

        const updatedCategory = await categoryTreeService.updateCategory(id, body);
        res.json({ data: updatedCategory, message: "Category updated successfully" });
    }

    // [Admin] Delete a category
    async deleteCategory(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        await categoryTreeService.deleteCategory(id);
        res.json({ message: "Category deleted successfully" });
    }
}

export const categoryTreeController = new CategoryTreeController();
