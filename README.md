# talleres_api

## Manual de Documentación de una API usando Swagger

Este manual proporciona los comandos y pasos necesarios para documentar una API usando Swagger y generar los archivos necesarios en un solo documento.

## Paso 1: Instalación de Dependencias

Instala las dependencias necesarias en tu proyecto Node.js.

`bash
npm install swagger-jsdoc swagger-ui-express`
Paso 2: Crear el Archivo de Configuración de Swagger
Crea un archivo llamado swagger.js en la raíz de tu proyecto con el siguiente contenido:

javascript
Copy code
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const express = require('express');
const router = express.Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentación Taller Digicom',
      version: '1.0.0',
      description: 'Documentación de la API para la gestión de talleres',
    },
    servers: [
      {
        url: 'http://api.taller.digicom.com.gt/api/v1',
      },
    ],
  },
  apis: ['./routes/api.js', './controllers/clientesController.js'],
};

const specs = swaggerJsdoc(options);

router.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;
Paso 3: Añadir Anotaciones Swagger a los Controladores y Rutas
Ejemplo de Anotaciones en un Controlador
javascript
Copy code
/**

* @swagger
* /clientes:
* get:
*     summary: Obtiene una lista de clientes
*     tags: [Clientes]
*     responses:
*       200:
*         description: Lista de clientes
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 type: object
*                 properties:
*                   id:
*                     type: integer
*                   nombre:
*                     type: string

 */
Ejemplo de Anotaciones en una Ruta
javascript
Copy code
const express = require('express');
const router = express.Router();
const ClientesController = require('../controllers/clientesController');

/**

* @swagger
* /clientes:
* get:
*     summary: Obtiene una lista de clientes
*     tags: [Clientes]
*     responses:
*       200:
*         description: Lista de clientes

 */
router.get('/clientes', ClientesController.getClientes);

module.exports = router;
Paso 4: Integrar Swagger en el Servidor
Modifica tu archivo server.js para incluir la configuración de Swagger.

javascript
Copy code
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const swaggerRouter = require('./swagger');

// Middlewares y otras configuraciones
// ...

// Rutas de la API
app.use('/api/v1', require('./routes/api'));

// Rutas de Swagger
app.use('/api-docs', swaggerRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
Paso 5: Configuración de Nginx para Proxy Reverso
Configura Nginx para que actúe como proxy reverso para tu API y la documentación de Swagger.

nginx
Copy code
server {
    listen 80;
    server_name api.taller.digicom.com.gt;

    root /var/www/html/talleres_api;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api-docs {
        proxy_pass http://localhost:3000/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /deploy {
        alias /var/www/html/talleres_api/deploy.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/talleres_api/deploy.php;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
Paso 6: Verificar la Documentación
Accede a la documentación de Swagger en la URL:

arduino
Copy code
<http://api.taller.digicom.com.gt/api-docs>
Con estos pasos, tu API debería estar documentada usando Swagger y la documentación debería estar accesible a través del navegador.
