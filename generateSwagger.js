const swaggerJsdoc = require("swagger-jsdoc");
const fs = require("fs");

const options = {
  definition: {
    // <-- Asegúrate de que 'definition' esté presente
    openapi: "3.0.0",
    info: {
      title: "API Documentación Taller Digicom By: Richard Ortiz",
      version: "1.0.0",
      description: "Documentación de la API para la gestión de talleres",
    },
    servers: [
      {
        url: "http://api.taller.digicom.com.gt/api/v1",
      },
    ],
  },
  apis: ["./routes/api.js", "./controllers/clientesController.js"], // Paths to files with Swagger annotations
};

const specs = swaggerJsdoc(options);

fs.writeFile("./swagger.json", JSON.stringify(specs, null, 2), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("Archivo swagger.json generado correctamente.");
});
