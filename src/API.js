const params = (req, name) =>
  new URLSearchParams(new URL(req.url, `http://${req.headers.host}/`).search)
    .getAll(name)
    .map(item => {
      try {
        item = JSON.parse(item)
      } catch (e) {}
      return item
    })

const param = (req, name) => params(req, name)[0]

const sendJSONResponse = (body, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.writeHead(200)
  res.end(JSON.stringify(body, null, 2))
}

module.exports = (index, sendResponse) => ({
  /**
   * @openapi
   * /ALL_DOCUMENTS:
   *   get:
   *     tags: [READ]
   *     summary: Return all documents in the index
   *     parameters:
   *       - $ref: '#/components/parameters/Limit'
   *     responses:
   *       200:
   *         description: An array of documents
   */
  ALL_DOCUMENTS: (req, res) =>
    index
      .ALL_DOCUMENTS(+params(req, 'LIMIT') || undefined)
      .then(ad => sendJSONResponse(ad, res)),

  /**
   * @openapi
   * /BUCKETS:
   *   get:
   *     tags: [READ]
   *     summary: Aggregate documents into predefined buckets
   *     parameters:
   *       - $ref: '#/components/parameters/TokenSpaces'
   *     responses:
   *       200:
   *         description: An array of buckets
   */
  BUCKETS: (req, res) =>
    index
      .BUCKETS(...params(req, 'TOKENSPACE'))
      .then(b => sendJSONResponse(b, res)),

  /**
   * @openapi
   * /DELETE:
   *   delete:
   *     tags: [DELETE]
   *     summary: Delete specified documents by id
   *     parameters:
   *       - $ref: '#/components/parameters/Ids'
   *     responses:
   *       200:
   *         description: Successfully deleted
   */
  DELETE: (req, res) =>
    index
      .DELETE(...params(req, 'ID'))
      .then(idxRes => sendJSONResponse(idxRes, res)),

  /**
   * @openapi
   * /DICTIONARY:
   *   get:
   *     tags: [READ]
   *     summary: Returns tokens described by TOKENSPACE
   *     description: If no TOKENSPACE is described, return all tokens in index.
   *                  DICTIONARY returns only the tokens, whereas DISTINCT returns
   *                  field-token pairs
   *     parameters:
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/TokenSpace'
   *     responses:
   *       200:
   *         description: An array of tokens
   */
  DICTIONARY: (req, res) =>
    index
      .DICTIONARY(...params(req, 'TOKENSPACE'))
      .then(d => d.slice(0, +params(req, 'LIMIT')))
      .then(d => sendJSONResponse(d, res)),

  /**
   * @openapi
   * /DISTINCT:
   *   get:
   *     tags: [READ]
   *     summary: Returns all field-token pairs in the given TOKENSPACE
   *     description: If no TOKENSPACE is described, return all field-token
   *                  pairs in the index. DICTIONARY returns only the tokens,
   *                  whereas DISTINCT returns field-token pairs.
   *     parameters:
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/TokenSpace'
   *     responses:
   *       200:
   *         description: An array of field-token pairs
   */
  DISTINCT: (req, res) =>
    index
      .DISTINCT(...params(req, 'TOKENSPACE'))
      .then(d => d.slice(0, +params(req, 'LIMIT')))
      .then(d => sendJSONResponse(d, res)),

  /**
   * @openapi
   * /DOCUMENTS:
   *   get:
   *     tags: [READ]
   *     summary: Returns all documents with the given ids
   *     parameters:
   *       - $ref: '#/components/parameters/Ids'
   *     responses:
   *       200:
   *         description: An array of documents
   */
  DOCUMENTS: (req, res) =>
    index.DOCUMENTS(...params(req, 'ID')).then(b => sendJSONResponse(b, res)),

  /**
   * @openapi
   * /EXPORT:
   *   get:
   *     tags: [READ]
   *     summary: Dumps the index to text
   *     description: See also IMPORT
   *     responses:
   *       200:
   *         description: A dump of the index
   */
  EXPORT: (req, res) => index.EXPORT().then(exp => sendJSONResponse(exp, res)),

  /**
   * @openapi
   * /FACETS:
   *   get:
   *     tags: [READ]
   *     summary: Aggregate documents into their distinct values
   *     description: Take every unique field-value pair of a TOKENSPACE and
   *                  return every document for which that field-value pair is
   *                  present
   *     parameters:
   *       - $ref: '#/components/parameters/TokenSpaces'
   *     responses:
   *       200:
   *         description: An array of facets
   */
  FACETS: (req, res) =>
    index
      .FACETS(...params(req, 'TOKENSPACE'))
      .then(b => sendJSONResponse(b, res)),

  /**
   * @openapi
   * /FIELDS:
   *   get:
   *     tags: [READ]
   *     summary: Return all field names known to the index
   *     responses:
   *       200:
   *         description: An array of field names
   */
  FIELDS: (req, res) => index.FIELDS().then(f => sendJSONResponse(f, res)),

  /**
   * @openapi
   * /FLUSH:
   *   delete:
   *     tags: [DELETE]
   *     summary: Delete everything in the index
   *     responses:
   *       200:
   *         description: Successfully deleted
   */
  FLUSH: (req, res) =>
    index.FLUSH().then(idxRes => sendJSONResponse(idxRes, res)),

  /**
   * @openapi
   * /IMPORT:
   *   post:
   *     tags: [WRITE]
   *     summary: Import an index
   *     responses:
   *       200:
   *         description: Successfully imported
   */
  IMPORT: (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      index
        .IMPORT(JSON.parse(body))
        .then(idxRes => sendJSONResponse(idxRes, res))
    )
  },

  /**
   * @openapi
   * /MAX:
   *   get:
   *     tags: [READ]
   *     summary: Get maximum value from the given TOKENSPACE
   *     parameters:
   *       - $ref: '#/components/parameters/TokenSpace'
   *     responses:
   *       200:
   *         description: The maximum value
   */
  MAX: (req, res) =>
    index.MAX(...params(req, 'TOKENSPACE')).then(m => sendJSONResponse(m, res)),

  /**
   * @openapi
   * /MIN:
   *   get:
   *     tags: [READ]
   *     summary: Get minimum value from the given TOKENSPACE
   *     parameters:
   *       - $ref: '#/components/parameters/TokenSpace'
   *     responses:
   *       200:
   *         description: The minimum value
   */
  MIN: (req, res) =>
    index
      .MIN(JSON.parse(params(req, 'TOKENSPACE'))) // TODO: is this right?
      .then(m => sendJSONResponse(m, res)),

  /**
   * @openapi
   * /PUT:
   *   post:
   *     tags: [WRITE]
   *     summary: Add documents to the index
   *     requestBody:
   *       description: Optional description in *Markdown*
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/Document'
   *     responses:
   *       200:
   *         description: Successfully imported
   */
  // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
  PUT: (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      index.PUT(JSON.parse(body)).then(idxRes => sendJSONResponse(idxRes, res))
    )
  },

  // TODO: how to deal with PUT pipelines?

  /**
   * @openapi
   * /PUT_RAW:
   *   post:
   *     tags: [WRITE]
   *     summary: Add documents to the index
   *     requestBody:
   *       description: Adds a raw file that is not tokenized or indexed
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/Document'
   *     responses:
   *       200:
   *         description: Successfully imported
   */
  PUT_RAW: (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      index
        .PUT_RAW(JSON.parse(body))
        .then(idxRes => sendJSONResponse(idxRes, res))
    )
  },

  /**
   * @openapi
   * /QUERY:
   *   get:
   *     tags: [READ]
   *     summary: Query the index
   *     description: Query objects can be composed of any combination of
   *                  boolean verbs (AND, OR, NOT) combined with query options
   *     parameters:
   *       - in: query
   *         name: QUERY
   *         content:
   *           'application/json':
   *             schema:
   *               type: object
   *               default: { ALL_DOCUMENTS: -1 }
   *         description: |
   *           # Describes a QUERY
   *
   *           #### ALL_DOCUMENTS
   *
   *           ```javascript
   *           // returns all documents. Use PAGE to limit how many you see
   *           {
   *             ALL_DOCUMENTS: true
   *           }
   *           ```
   *
   *           #### AND
   *
   *           ```javascript
   *           // Boolean AND: Return results that contain all tokens
   *           {
   *             AND: [ token1, token2, ... ]
   *           }
   *           ```
   *
   *           #### NOT
   *
   *           ```javascript
   *           {
   *             INCLUDE: queryExpression1,
   *             EXCLUDE: queryExpression2
   *           }
   *           ```
   *
   *
   *           #### OR
   *
   *           ```javascript
   *           // Boolean OR: Return results that contain one or more tokens
   *           {
   *             OR: [ token1, token2, ... ]
   *           }
   *           ```
   *
   *           Query verbs can be nested to create powerful expressions:
   *           ```javascript
   *           // Example: AND with a nested OR with a nested AND
   *           {
   *             AND: [ token1, token2, {
   *               OR: [ token3, {
   *                 AND: [ token4, token5 ]
   *               }]
   *             }]
   *           }
   *           ```
   *       - $ref: '#/components/parameters/Buckets'
   *       - $ref: '#/components/parameters/Documents'
   *       - $ref: '#/components/parameters/Facets'
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Score'
   *       - $ref: '#/components/parameters/Sort'
   *       - $ref: '#/components/parameters/Weight'
   *     responses:
   *       200:
   *         description: A query result
   */
  QUERY: (req, res) =>
    index
      .QUERY(param(req, 'QUERY'), {
        BUCKETS: params(req, 'BUCKETS'),
        DOCUMENTS: param(req, 'DOCUMENTS'),
        // // TODO: option to suppress empty facets?
        FACETS: params(req, 'FACETS').length
          ? params(req, 'FACETS')
          : undefined,
        PAGE: param(req, 'PAGE'),
        // //TODO: PIPELINE!
        SCORE: param(req, 'SCORE'),
        SORT: param(req, 'SORT')
      })
      .then(r => sendJSONResponse(r, res)),

  /**
   * @openapi
   * /SEARCH:
   *   get:
   *     tags: [READ]
   *     summary: Search the index
   *     description: |
   *       This is a utility endpoint equivalent to
   *       `?QUERY={AND:["search","terms"]}&SCORE=TFIDF&SORT=true`
   *     parameters:
   *       - in: query
   *         name: STRING
   *         schema:
   *           type: string
   *         description: |
   *           STRING is split on whitespace so that `?STRING=search terms` is
   *           equivalent to `?STRING={AND: ['search', 'terms']}`
   *       - $ref: '#/components/parameters/Buckets'
   *       - $ref: '#/components/parameters/Documents'
   *       - $ref: '#/components/parameters/Facets'
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Score'
   *       - $ref: '#/components/parameters/Sort'
   *       - $ref: '#/components/parameters/Weight'
   *     responses:
   *       200:
   *         description: A search result
   */
  SEARCH: (req, res) =>
    index
      .SEARCH(param(req, 'STRING').trim().split(/\s+/), {
        PAGE: param(req, 'PAGE')
      })
      .then(r => sendJSONResponse(r, res)),

  /**
   * @openapi
   * /STATUS:
   *   get:
   *     tags: [READ]
   *     summary: Display information about the index
   *     description: Display information about the index
   *     responses:
   *       200:
   *         description: Information about the index
   */
  STATUS: (req, res) =>
    Promise.all([
      index.LAST_UPDATED(),
      index.CREATED(),
      index.DOCUMENT_COUNT()
    ]).then(([LAST_UPDATED, CREATED, DOCUMENT_COUNT]) =>
      sendJSONResponse(
        {
          IS_ALIVE: true,
          DOCUMENT_COUNT,
          // Update these lines when https://github.com/fergiemcdowall/search-index/issues/600
          // is rolled out
          CREATED: new Date(CREATED).toISOString(),
          LAST_UPDATED: new Date(LAST_UPDATED).toISOString()
        },
        res
      )
    )
})
