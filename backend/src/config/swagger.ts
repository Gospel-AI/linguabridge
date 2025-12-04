import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskBridge API Documentation',
      version: '1.0.0',
      description: 'Global Micro Task Marketplace - API documentation for clients and workers',
      contact: {
        name: 'TaskBridge Support',
        email: 'support@taskbridge.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.taskbridge.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token from authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            domain_type: {
              type: 'string',
              enum: ['translation', 'ai_verification', 'physical_data', 'app_testing'],
            },
            budget: {
              type: 'number',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
            },
          },
        },
        Worker: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            tier: {
              type: 'string',
              enum: ['standard', 'pro'],
            },
            average_rating: {
              type: 'number',
            },
            completed_tasks: {
              type: 'integer',
            },
            certifications: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            task_id: {
              type: 'string',
              format: 'uuid',
            },
            worker_id: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
            },
            proposal: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
