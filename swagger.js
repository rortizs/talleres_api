const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const router = express.Router();

const definition = {
  openapi: "3.0.0",
  info: {
    title: "API Documentación Taller Digicom By: Richard Ortiz",
    version: "1.0.0",
    description: "Documentación de la API para la gestión de talleres",
  },
  servers: [
    {
      url: "https://api.taller.digicom.com.gt/api/v1",
      description: "Production API over HTTPS",
    },
    {
      url: "http://localhost:3000/api/v1",
      description: "Local development API",
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiSuccessEnvelope: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: {
            type: "boolean",
            enum: [true],
          },
          data: {
            type: "object",
            nullable: true,
            description: "Response payload for the requested resource.",
          },
          message: {
            type: "string",
            description: "Optional human-readable success message.",
          },
        },
      },
      ApiErrorEnvelope: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: {
            type: "boolean",
            enum: [false],
          },
          error: {
            $ref: "#/components/schemas/ApiError",
          },
        },
      },
      ApiError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: {
            type: "string",
            example: "VALIDATION_ERROR",
          },
          message: {
            type: "string",
            example: "Request validation failed.",
          },
          details: {
            type: "object",
            nullable: true,
            additionalProperties: true,
          },
        },
      },
    },
  },
};

const options = {
  definition,
  apis: ["./routes/api.js", "./controllers/clientesController.js"],
};

const specs = swaggerJsdoc(options);

router.use("/", swaggerUi.serve, swaggerUi.setup(specs));

router.specs = specs;
router.definition = definition;

module.exports = router;
