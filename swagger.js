const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const router = express.Router();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentación Taller Digicom By: Jhonatan",
      version: "1.0.0",
      description: "Documentación de la API para la gestión de talleres",
    },
    servers: [
      {
        url: "http://api.taller.digicom.com.gt/api/v1",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // Archivos que contienen anotaciones Swagger
};

const specs = swaggerJsdoc(options);

router.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;
