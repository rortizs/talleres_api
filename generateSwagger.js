const fs = require("fs");
const path = require("path");
const swaggerRouter = require("./swagger");

const swaggerOutputPaths = [
  path.join(__dirname, "swagger.json"),
  path.join(__dirname, "public", "swagger.json"),
];
const serializedSpec = `${JSON.stringify(swaggerRouter.specs, null, 2)}\n`;

function writeSwaggerFiles() {
  for (const outputPath of swaggerOutputPaths) {
    fs.writeFileSync(outputPath, serializedSpec);
    console.log(`Generated ${path.relative(__dirname, outputPath)}.`);
  }
}

function checkSwaggerFiles() {
  const staleFiles = swaggerOutputPaths.filter((outputPath) => {
    if (!fs.existsSync(outputPath)) {
      return true;
    }

    return fs.readFileSync(outputPath, "utf8") !== serializedSpec;
  });

  if (staleFiles.length > 0) {
    console.error(
      `Swagger snapshots are out of date: ${staleFiles
        .map((outputPath) => path.relative(__dirname, outputPath))
        .join(", ")}. Run npm run swagger:generate.`
    );
    process.exit(1);
  }

  console.log("Swagger snapshots are up to date.");
}

if (process.argv.includes("--check")) {
  checkSwaggerFiles();
} else {
  writeSwaggerFiles();
}
