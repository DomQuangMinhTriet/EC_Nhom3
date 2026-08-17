import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import type { CategoryTreeRepository } from "./categoryTree.repository";
import { CategoryTreeService } from "./categoryTree.service";

const rootCategory = {
    categoryId: "00000000-0000-4000-8000-000000000001",
    name: "Electronics",
    parentCategoryId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const childCategory = {
    categoryId: "00000000-0000-4000-8000-000000000002",
    name: "Laptops",
    parentCategoryId: rootCategory.categoryId,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const createRepository = (overrides: Partial<CategoryTreeRepository> = {}) =>
    ({
        findAll: async () => [rootCategory, childCategory],
        findById: async (id: string) => {
            if (id === rootCategory.categoryId) return rootCategory;
            if (id === childCategory.categoryId) return childCategory;
            return null;
        },
        hasChildren: async (id: string) => id === rootCategory.categoryId, // Only root has a child
        create: async (data: any) => ({ ...childCategory, ...data }),
        update: async (id: string, data: any) => ({
            ...(id === rootCategory.categoryId ? rootCategory : childCategory),
            ...data,
        }),
        delete: async (id: string) => (id === rootCategory.categoryId ? rootCategory : childCategory),
        ...overrides,
    }) as unknown as CategoryTreeRepository;

test("getAllCategories retrieves all categories", async () => {
    const service = new CategoryTreeService(createRepository());
    const categories = await service.getAllCategories();
    assert.equal(categories.length, 2);
    assert.equal(categories[0]!.categoryId, rootCategory.categoryId);
});

test("createCategory successfully creates a root category", async () => {
    const repository = createRepository({
        create: async (data) => {
            assert.equal(data.name, "Books");
            assert.equal(data.parentCategoryId, undefined);
            return { ...rootCategory, name: data.name, parentCategoryId: null };
        }
    });
    const service = new CategoryTreeService(repository);
    
    const result = await service.createCategory({ name: "Books" });
    assert.equal(result!.name, "Books");
    assert.equal(result!.parentCategoryId, null);
});

test("createCategory successfully creates a child category", async () => {
    const repository = createRepository({
        create: async (data) => {
            assert.equal(data.name, "Gaming Laptops");
            assert.equal(data.parentCategoryId, rootCategory.categoryId);
            return { ...childCategory, name: data.name, parentCategoryId: data.parentCategoryId! };
        }
    });
    const service = new CategoryTreeService(repository);
    
    const result = await service.createCategory({ name: "Gaming Laptops", parentCategoryId: rootCategory.categoryId });
    assert.equal(result!.name, "Gaming Laptops");
    assert.equal(result!.parentCategoryId, rootCategory.categoryId);
});

test("createCategory throws 404 if parent category does not exist", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.createCategory({ name: "Fake Child", parentCategoryId: "fake-id" }),
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 404 &&
            error.message === "Parent category not found",
    );
});

test("updateCategory successfully updates a category's name and parent", async () => {
    const repository = createRepository({
        update: async (id, data) => {
            assert.equal(id, childCategory.categoryId);
            assert.equal(data.name, "MacBooks");
            assert.equal(data.parentCategoryId, null);
            return { ...childCategory, name: data.name!, parentCategoryId: data.parentCategoryId! };
        }
    });
    const service = new CategoryTreeService(repository);

    const result = await service.updateCategory(childCategory.categoryId, {
        name: "MacBooks",
        parentCategoryId: null
    });
    assert.equal(result!.name, "MacBooks");
    assert.equal(result!.parentCategoryId, null);
});

test("updateCategory throws 404 if category to update does not exist", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.updateCategory("fake-id", { name: "New Name" }),
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 404 &&
            error.message === "Category not found",
    );
});

test("updateCategory throws 400 if category is set to be its own parent", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.updateCategory(rootCategory.categoryId, { parentCategoryId: rootCategory.categoryId }),
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 400 &&
            error.message === "A category cannot be its own parent",
    );
});

test("updateCategory throws 404 if new parent category does not exist", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.updateCategory(childCategory.categoryId, { parentCategoryId: "fake-id" }),
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 404 &&
            error.message === "Parent category not found",
    );
});

test("deleteCategory successfully deletes a category with no children", async () => {
    const repository = createRepository({
        delete: async (id) => {
            assert.equal(id, childCategory.categoryId);
            return childCategory;
        }
    });
    const service = new CategoryTreeService(repository);

    const result = await service.deleteCategory(childCategory.categoryId);
    assert.equal(result!.categoryId, childCategory.categoryId);
});

test("deleteCategory throws 404 if category to delete does not exist", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.deleteCategory("fake-id"),
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 404 &&
            error.message === "Category not found",
    );
});

test("deleteCategory throws 400 if category currently has children", async () => {
    const service = new CategoryTreeService(createRepository());
    
    await assert.rejects(
        service.deleteCategory(rootCategory.categoryId), // root has children in the mock
        (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 400 &&
            error.message === "Cannot delete a category that has child categories",
    );
});
