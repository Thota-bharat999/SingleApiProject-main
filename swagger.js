const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Perfume E-Commerce API',
      version: '1.0.0',
      description: 'API documentation for the Perfume E-Commerce Website',
    },
    servers: [
      {
        url: 'https://singleapiproject-main-22.onrender.com', // Local root
        description: 'Local API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a91a32f1c8fddf00000123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            isAdmin: { type: 'boolean', example: false },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
    ],
  },

  // Paths for swagger-jsdoc to scan for annotations
  apis: ['./routes/**/*.js', './controllers/**/*.js', './Admin/**/*.js', './Admin/upload/routes/*.js']

};

const specs = swaggerJsdoc(options);  
module.exports = { swaggerUi, specs };
