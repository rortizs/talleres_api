const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const router = express.Router();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentación Taller Digicom By: Richard Ortiz",
      version: "1.0.0",
      description: "Documentación de la API para la gestión de talleres",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
      },
    ],
  },
  apis: ["./routes/api.js", "./controllers/clientesController.js"], // Paths to files with Swagger annotations
};

const specs = swaggerJsdoc(options);

router.use("/", swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;
