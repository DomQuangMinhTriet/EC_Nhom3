import { AppError } from "../errors/AppError";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && uuidPattern.test(value);

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

export const parseRequiredTrimmedString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} is required`, 400);
  }

  return value.trim();
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

export const parseDateQuery = (
  value: unknown,
  field: string,
  endOfDay = false,
): Date | undefined => {
  const raw = parseOptionalStringQuery(value, field);

  if (raw === undefined) {
    return undefined;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  // A date-only string (e.g. "2026-08-31") parses to that day's UTC midnight.
  // Used as an inclusive upper bound, that would exclude nearly the entire
  // day, so extend it to the end of that day.
  if (endOfDay && !raw.includes("T")) {
    parsed.setUTCHours(23, 59, 59, 999);
  }

  return parsed;
};
