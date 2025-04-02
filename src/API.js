import { packageVersion } from './version.js'

export class API {
  constructor(index, sendResponse, events, logResponse) {
    this.events = events
    this.index = index
    this.logResponse = logResponse
    this.ready = false
    this.sendResponse = sendResponse
    events.on('ready', () => (this.ready = true))
  }

  params = (req, name) =>
    new URLSearchParams(new URL(req.url, `http://${req.headers.host}/`).search)
      .getAll(name)
      .map(item => {
        try {
          item = JSON.parse(item)
        } catch (e) {}
        return item
      })

  param = (req, name) => this.params(req, name)[0]

  sendJSONResponse = (body, req, res, statusCode) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.writeHead(statusCode)
    res.end(JSON.stringify(body, null, 2))
    this.logResponse(statusCode, req.url, req.timestamp)
  }

  internalServerError = (e, req, res) => {
    this.sendJSONResponse(
      { status: 500, error: e.toString() || 'Internal Server Error' },
      req,
      res,
      500
    )
  }

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
  ALL_DOCUMENTS = (req, res) =>
    this.index
      .ALL_DOCUMENTS(+this.params(req, 'LIMIT') || undefined)
      .then(ad => this.sendJSONResponse(ad, req, res, 200))

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
  BUCKETS = (req, res) =>
    this.index
      .BUCKETS(...this.params(req, 'TOKENSPACE'))
      .then(b => this.sendJSONResponse(b, req, res, 200))

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
  DELETE = (req, res) =>
    this.index
      .DELETE(...this.params(req, 'ID'))
      .then(idxRes => this.sendJSONResponse(idxRes, req, res, 200))

  // TODO: DELETE_RAW?

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
  DICTIONARY = (req, res) =>
    this.index
      .DICTIONARY(...this.params(req, 'TOKENSPACE'))
      .then(d => d.slice(0, +this.params(req, 'LIMIT')))
      .then(d => this.sendJSONResponse(d, req, res, 200))

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
  DISTINCT = (req, res) =>
    this.index
      .DISTINCT(...this.params(req, 'TOKENSPACE'))
      .then(d => d.slice(0, +this.params(req, 'LIMIT')))
      .then(d => this.sendJSONResponse(d, req, res, 200))

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
  DOCUMENTS = (req, res) =>
    this.index
      .DOCUMENTS(...this.params(req, 'ID'))
      .then(b => this.sendJSONResponse(b, req, res, 200))

  // TODO: DOCUMENT_VECTORS?

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
  EXPORT = (req, res) =>
    this.index.EXPORT().then(exp => this.sendJSONResponse(exp, req, res, 200))

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
  FACETS = (req, res) =>
    this.index
      .FACETS(...this.params(req, 'TOKENSPACE'))
      .then(b => this.sendJSONResponse(b, req, res, 200))

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
  FIELDS = (req, res) =>
    this.index.FIELDS().then(f => this.sendJSONResponse(f, req, res, 200))

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
  FLUSH = (req, res) =>
    this.index
      .FLUSH()
      .then(idxRes => this.sendJSONResponse(idxRes, req, res, 200))

  /**
   * @openapi
   * /IMPORT:
   *   post:
   *     tags: [WRITE]
   *     summary: Import an index
   *     requestBody:
   *       description: An index dump to be imported (generate this dump using EXPORT)
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *     responses:
   *       200:
   *         description: Successfully imported
   */
  IMPORT = (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      this.index
        .IMPORT(JSON.parse(body))
        .then(idxRes => this.sendJSONResponse(idxRes, req, res, 200))
    )
  }

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
  MAX = (req, res) =>
    this.index
      .MAX(...this.params(req, 'TOKENSPACE'))
      .then(m => this.sendJSONResponse(m, req, res, 200))

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
  MIN = (req, res) =>
    this.index
      .MIN(JSON.parse(this.params(req, 'TOKENSPACE'))) // TODO: is this right?
      .then(m => this.sendJSONResponse(m, req, res, 200))

  /**
   * @openapi
   * /PUT:
   *   post:
   *     tags: [WRITE]
   *     summary: Add documents to the index
   *     requestBody:
   *       description: An array of objects (documents). If objects contain a property called `_id` then that will be used to identify the document, if not then an `_id` field with be automatically assigned.
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/Document'
   *     parameters:
   *       - in: query
   *         name: caseSensitive
   *         schema:
   *           type: boolean
   *         default: true
   *         description: index everything in a case-insensitive manner (lower case)
   *       - in: query
   *         name: nGrams
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               default: { lengths: [ 1 ],  join: ' ',  fields: []}
   *         description: |
   *           Property `lengths` describes the length of n\-grams, `join` describes how they will be joined for indexing (`['one', 'two']` would be indexed as `'one two'` if `join: ' '`). `fields` is an array describing which fields to create n\-grams on`
   *       - in: query
   *         name: replace
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               default: { fields: [], values: {} }
   *         description: |
   *           `fields` is an array that specifies the fields where replacements will happen, `values` is an array that specifies the tokens to be swapped in, for example: `{ values: { sheep: [ 'animal', 'livestock' ] } }`
   *       - in: query
   *         name: skipField
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         default: []
   *         description: These fields will not be searchable, but they will still be stored
   *       - in: query
   *         name: stopwords
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         default: []
   *         description: A list of words to be ignored when indexing
   *       - in: query
   *         name: tokenSplitRegex
   *         schema:
   *           type: string
   *         default: /[\p{L}\d]+/gu
   *         description: The regular expression that splits strings into tokens
   *     responses:
   *       200:
   *         description: Successfully imported
   */

  // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
  PUT = (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () => {
      console.log(body.length)
      let parsedData
      try {
        parsedData = JSON.parse(body)
      } catch (e) {
        return this.internalServerError(e, req, res)
      }
      return this.index
        .PUT(parsedData)
        .then(idxRes => this.sendJSONResponse(idxRes, req, res, 200))
        .catch(e => this.internalServerError(e, req, res))
    })
  }

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
   *         description: Successfully written
   */
  PUT_RAW = (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      this.index
        .PUT_RAW(JSON.parse(body))
        .then(idxRes => this.sendJSONResponse(idxRes, req, res, 200))
    )
  }

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
  QUERY = (req, res) =>
    this.index
      .QUERY(this.param(req, 'QUERY'), {
        BUCKETS: this.params(req, 'BUCKETS'),
        DOCUMENTS:
          this.param(req, 'DOCUMENTS') === undefined
            ? true // if not specified, default to true
            : this.param(req, 'DOCUMENTS'),
        // TODO: option to suppress empty facets?
        FACETS: this.params(req, 'FACETS').length
          ? this.params(req, 'FACETS')
          : undefined,
        PAGE: this.param(req, 'PAGE'),
        // //TODO: PIPELINE!
        SCORE: this.param(req, 'SCORE'),
        SORT: this.param(req, 'SORT')
      })
      .then(r => this.sendJSONResponse(r, req, res, 200))

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
  SEARCH = (req, res) =>
    this.index
      .SEARCH(this.param(req, 'STRING').trim().split(/\s+/), {
        PAGE: this.param(req, 'PAGE') || undefined,
        DOCUMENTS: true
      })
      .then(r => this.sendJSONResponse(r, req, res, 200))

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
  STATUS = (req, res) =>
    Promise.all([
      this.index.LAST_UPDATED(),
      this.index.CREATED(),
      this.index.DOCUMENT_COUNT()
    ]).then(([LAST_UPDATED, CREATED, DOCUMENT_COUNT]) =>
      this.sendJSONResponse(
        {
          VERSION: packageVersion,
          READY: true,
          DOCUMENT_COUNT,
          CREATED: new Date(CREATED),
          LAST_UPDATED: new Date(LAST_UPDATED)
        },
        req,
        res,
        200
      )
    )

  /**
   * @openapi
   * /READY:
   *   get:
   *     tags: [READ]
   *     summary: Is index ready?
   *     description: |
   *       Returns `{ READY: true }` when index is ready
   *     responses:
   *       200:
   *         description: Index is ready
   */
  READY = (req, res) =>
    this.ready
      ? this.sendJSONResponse({ READY: true }, req, res, 200)
      : this.events.on('ready', () =>
          this.sendJSONResponse({ READY: true }, req, res, 200)
        )
}
