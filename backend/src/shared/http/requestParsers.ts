import { AppError } from "../errors/AppError";

export const parseOptionalString = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }

  return value;
};

export const parseNullableString = (value: unknown, field: string) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }

  return value;
};

export const parseOptionalStringQuery = (value: unknown, field: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }

  return value;
};

export const parsePositiveIntegerQuery = (
  value: unknown,
  field: string,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${field} must be a number`, 400);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(`${field} must be a positive integer`, 400);
  }

  return parsed;
};

export const parsePositiveIntegerWithDefault = (
  value: unknown,
  fallback: number,
  field: string,
) => parsePositiveIntegerQuery(value, field) ?? fallback;
