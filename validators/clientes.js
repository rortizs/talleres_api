const { validateWriteInput } = require("./common");

const CLIENT_WRITE_FIELDS = [
  "nomeCliente", "documento", "senha", "telefone", "celular", "email", "endereco",
  "numero", "bairro", "cidade", "estado", "cep", "contato", "fornecedor",
];
const CLIENT_CREATE_REQUIRED_FIELDS = ["nomeCliente", "documento"];
const validateCreateCliente = (input = {}) => validateWriteInput(input, CLIENT_WRITE_FIELDS, { requiredFields: CLIENT_CREATE_REQUIRED_FIELDS });
const validateUpdateCliente = (input = {}) => validateWriteInput(input, CLIENT_WRITE_FIELDS, { requireAny: true });

module.exports = { CLIENT_WRITE_FIELDS, validateCreateCliente, validateUpdateCliente };
