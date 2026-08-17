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
