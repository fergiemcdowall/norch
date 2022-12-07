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
      Buckets: {
        in: 'query',
        name: 'BUCKETS',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Token'
          }
        },
        description: 'Describes one or many BUCKETs'
      },
      Documents: {
        in: 'query',
        name: 'DOCUMENTS',
        schema: {
          type: 'boolean'
        },
        default: false,
        description: 'Attach document to result'
      },

      Facets: {
        in: 'query',
        name: 'FACETS',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Token'
          }
        },
        description: 'Describes one or many FACETs'
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
      },

      Page: {
        name: 'PAGE',
        in: 'query',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                NUMBER: {
                  type: 'integer'
                },
                SIZE: {
                  type: 'integer'
                }
              }
            }
          }
        },
        default: { NUMBER: 0, SIZE: 20 },
        description: 'Pagination'
      },

      Score: {
        in: 'query',
        name: 'SCORE',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                TYPE: {
                  type: 'string',
                  default: 'TFIDF'
                }
              }
            }
          }
        },
        description:
          "TODO: can sort also be boolean `true`?\nScoring schemes:\n * `CONCAT` - Concatenate values together\n * `PRODUCT` - Multiply values together\n * `SUM` - Add values up\n * `TFIDF` - Determine TFIDF score\n * `VALUE` - Set score to be the value itself\n\nYou can also optionally specify an array of FIELDs to score on:\n```javascript\n// EXAMPLE: specify fields to score on\n{\n  TYPE: 'CONCAT',\n  FIELDS: [ 'lat', 'lon' ]\n}\n```\n"
      },

      Sort: {
        in: 'query',
        name: 'SORT',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                TYPE: {
                  type: 'string',
                  default: 'NUMERIC'
                },
                DIRECTION: {
                  type: 'string',
                  enum: ['ASCENDING', 'DESCENDING'],
                  default: 'DESCENDING'
                },
                FIELD: {
                  type: 'string',
                  default: '_score'
                }
              }
            }
          }
        },
        description: 'Describes how the results will be sorted'
      },

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

      Weight: {
        in: 'query',
        name: 'WEIGHT',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              FIELD: {
                type: 'string'
              },
              VALUE: {
                oneOf: [
                  {
                    type: 'string'
                  },
                  {
                    type: 'number'
                  }
                ]
              },
              WEIGHT: {
                type: 'number'
              }
            }
          }
        },
        description: 'Describes how the results will be weighted'
      }
    },

    schemas: {
      Document: {
        type: 'object',
        properties: {
          _id: {
            $ref: '#/components/schemas/Id'
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
  'www_root/openapi.json',
  JSON.stringify(openapiSpecification, null, 2)
)
