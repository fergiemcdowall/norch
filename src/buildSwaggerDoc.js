const fs = require('fs')
const swaggerJsdoc = require('swagger-jsdoc')

const swaggerDefinition = {
  openapi: '3.0.1',
  info: {
    title: 'Norch',
    description: 'This is your Norch server. Add documents. Find them again.',
    contact: {
      email: 'fergus@norch.io'
    },
    license: {
      name: 'MIT',
      url: 'https://github.com/fergiemcdowall/search-index/blob/master/LICENSE'
    },
    version: '1.0.0'
  },
  externalDocs: {
    description: 'Find out more about Swagger',
    url: 'http://swagger.io'
  },
  servers: [
    {
      url: '//localhost:3030/'
    }
  ],
  tags: [
    {
      name: 'WRITE',
      description: 'Write to index'
    },
    {
      name: 'READ',
      description: 'Read from index'
    },
    {
      name: 'DELETE',
      description: 'Delete from index'
    }
  ],
  components: {
    parameters: {
      TokenSpace: {
        name: 'TOKENSPACE',
        in: 'query',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Token'
            }
          }
        },
        description: 'Describes a single tokenspace'
      },

      TokenSpaces: {
        name: 'TOKENSPACE',
        in: 'query',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Token'
          }
        },
        description: 'Describes one or many tokenspaces'
      },

      Ids: {
        name: 'ID',
        in: 'query',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Id'
          }
        },
        description: 'One or many Ids, each of which describes a document'
      },

      Limit: {
        name: 'LIMIT',
        in: 'query',
        schema: {
          type: 'number',
          default: 10
        },
        description: 'Limits the amount of results returned'
      }
    },

    schemas: {
      Document: {
        type: 'object',
        properties: {
          _id: {
            type: 'string'
          }
        }
      },
      Id: {
        oneOf: [{ type: 'string' }, { type: 'integer' }]
      },
      Token: {
        type: 'object',
        properties: {
          FIELD: {
            oneOf: [{ type: 'string' }, { type: 'integer' }]
          },
          VALUE: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  GTE: {
                    oneOf: [{ type: 'string' }, { type: 'integer' }]
                  },
                  LTE: {
                    oneOf: [{ type: 'string' }, { type: 'integer' }]
                  }
                }
              },
              { type: 'string' },
              { type: 'integer' }
            ]
          }
        }
      }
    }
  }
}

const options = {
  swaggerDefinition,
  apis: ['src/API.js']
}

const openapiSpecification = swaggerJsdoc(options)

// console.log(JSON.stringify(openapiSpecification, null, 2))

fs.writeFileSync(
  'www_root/swagger.json',
  JSON.stringify(openapiSpecification, null, 2)
)
