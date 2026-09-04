const { fail } = require("../utils/apiResponse");

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const MAX_SEARCH_LENGTH = 100;
const fieldError = (field, message) => ({ field, message });

function pickAllowedFields(input = {}, allowedFields) {
  return allowedFields.reduce((data, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined) data[field] = input[field];
    return data;
  }, {});
}

function validateAllowedFields(input = {}, allowedFields) {
  const allowed = new Set(allowedFields);
  return Object.keys(input).filter((field) => !allowed.has(field)).map((field) => fieldError(field, "Field is not allowed"));
}

function validateRequiredFields(input = {}, requiredFields) {
  return requiredFields
    .filter((field) => input[field] === undefined || input[field] === null || input[field] === "")
    .map((field) => fieldError(field, "Field is required"));
}

function validateWriteInput(input = {}, allowedFields, options = {}) {
  const { requiredFields = [], requireAny = false } = options;
  const data = pickAllowedFields(input, allowedFields);
  const errors = [
    ...validateAllowedFields(input, allowedFields),
    ...validateRequiredFields(input, requiredFields),
  ];
  if (requireAny && Object.keys(data).length === 0) errors.push(fieldError("body", "At least one allowed field is required"));
  return { errors, data };
}

function sendValidationError(res, errors) {
  return fail(res, { statusCode: 400, code: "VALIDATION_ERROR", message: "Request validation failed", details: { errors } });
}

function parseIntegerParam(query, field, defaultValue, min, max) {
  const raw = query[field];
  if (raw === undefined || raw === "") return { value: defaultValue, errors: [] };
  if (Array.isArray(raw) || !/^-?\d+$/.test(String(raw))) return { value: defaultValue, errors: [fieldError(field, "Must be an integer")] };
  const value = Number(raw);
  if (value < min || value > max) return { value: defaultValue, errors: [fieldError(field, `Must be between ${min} and ${max}`)] };
  return { value, errors: [] };
}

function validatePagination(query = {}) {
  const perPage = parseIntegerParam(query, "perPage", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const page = parseIntegerParam(query, "page", 0, 0, Number.MAX_SAFE_INTEGER);
  const errors = [...perPage.errors, ...page.errors];
  let search = "";
  if (query.search !== undefined) {
    if (Array.isArray(query.search)) errors.push(fieldError("search", "Must be a string"));
    else if (String(query.search).length > MAX_SEARCH_LENGTH) errors.push(fieldError("search", `Must be ${MAX_SEARCH_LENGTH} characters or fewer`));
    else search = String(query.search);
  }
  return { errors, perPage: perPage.value, page: page.value, search, start: perPage.value * page.value };
}

module.exports = { pickAllowedFields, sendValidationError, validateAllowedFields, validatePagination, validateRequiredFields, validateWriteInput };
