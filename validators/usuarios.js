const { validateWriteInput } = require("./common");

const USER_WRITE_FIELDS = ["nome", "email", "senha", "telefone", "foto"];
const USER_CREATE_REQUIRED_FIELDS = ["nome", "email", "senha"];
const validateCreateUsuario = (input = {}) => validateWriteInput(input, USER_WRITE_FIELDS, { requiredFields: USER_CREATE_REQUIRED_FIELDS });
const validateUpdateUsuario = (input = {}) => validateWriteInput(input, USER_WRITE_FIELDS, { requireAny: true });

module.exports = { USER_WRITE_FIELDS, validateCreateUsuario, validateUpdateUsuario };
