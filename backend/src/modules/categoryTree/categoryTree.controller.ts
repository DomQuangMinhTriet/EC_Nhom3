import { Request, Response } from "express";
import { CategoryTreeService } from "./categoryTree.service";
import { AppError } from "../../shared/errors/AppError";
import { parseNullableString, parseOptionalString } from "../../shared/http/requestParsers";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CategoryTreeController {
    constructor(private readonly categoryTreeService = new CategoryTreeService()) {}

    // [Public] Get all categories
    getAllCategories = async (req: Request, res: Response) => {
        const categories = await this.categoryTreeService.getAllCategories();
        res.json({ data: categories });
    };

    // [Admin] Create a category
    createCategory = async (req: Request, res: Response) => {
        const { name, parentCategoryId } = req.body as Record<string, unknown>;
        
        let parsedName = parseOptionalString(name, "name");
        if (parsedName) parsedName = parsedName.trim();
        
        if (!parsedName) {
            throw new AppError("Category name is required", 400);
        }
        
        let parsedParentId = parseOptionalString(parentCategoryId, "parentCategoryId");
        if (parsedParentId !== undefined) {
            parsedParentId = parsedParentId.trim();
            if (parsedParentId === "") {
                parsedParentId = undefined;
            } else if (!uuidPattern.test(parsedParentId)) {
                throw new AppError("Invalid parentCategoryId", 400);
            }
        }

        const category = await this.categoryTreeService.createCategory({
            name: parsedName,
            parentCategoryId: parsedParentId
        });
        res.status(201).json({ data: category, message: "Category created successfully" });
    };

    // [Admin] Update a category
    updateCategory = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        if (!uuidPattern.test(id)) {
            throw new AppError("Invalid category id", 400);
        }

        const { name, parentCategoryId } = req.body as Record<string, unknown>;
        
        let parsedName = parseOptionalString(name, "name");
        if (parsedName) parsedName = parsedName.trim();
        
        let parsedParentId = parseNullableString(parentCategoryId, "parentCategoryId");
        if (parsedParentId !== undefined && parsedParentId !== null) {
            parsedParentId = parsedParentId.trim();
            if (parsedParentId === "") {
                parsedParentId = null;
            } else if (!uuidPattern.test(parsedParentId)) {
                throw new AppError("Invalid parentCategoryId", 400);
            }
        }

        const updatedCategory = await this.categoryTreeService.updateCategory(id, {
            name: parsedName,
            parentCategoryId: parsedParentId
        });
        res.json({ data: updatedCategory, message: "Category updated successfully" });
    };

    // [Admin] Delete a category
    deleteCategory = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        if (!uuidPattern.test(id)) {
            throw new AppError("Invalid category id", 400);
        }

        await this.categoryTreeService.deleteCategory(id);
        res.json({ message: "Category deleted successfully" });
    };
}
