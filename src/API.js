const url = require('url')

module.exports = (index, sendResponse) => {
  const params = _url =>
    url.parse(_url, {
      parseQueryString: true
    }).query

  const sendJSONResponse = (body, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.writeHead(200)
    res.end(JSON.stringify(body, null, 2))
  }

  // *************

  const lastUpdated = (req, res) =>
    index.LAST_UPDATED().then(lu => sendResponse(lu + '', res, 'text/plain'))

  return {
    ALL_DOCUMENTS: (req, res) =>
      index
        .ALL_DOCUMENTS(+params(req.url).limit || undefined)
        .then(ad => sendJSONResponse(ad, res)),

    BUCKETS: (req, res) =>
      index
        .BUCKETS(...JSON.parse('[' + params(req.url).q + ']'))
        .then(b => sendJSONResponse(b, res)),

    CREATED: (req, res) =>
      index.CREATED().then(c => sendResponse(c + '', res, 'text/plain')),

    DELETE: (req, res) =>
      index
        // .DELETE([params(req.url).ids].flat())
        .DELETE(params(req.url).ids)
        .then(idxRes => sendJSONResponse(idxRes, res)),

    DICTIONARY: (req, res) =>
      index.DICTIONARY().then(d => sendJSONResponse(d, res)),

    DISTINCT: (req, res) =>
      index.DISTINCT().then(d => sendJSONResponse(d, res)),

    DOCUMENT_COUNT: (req, res) =>
      index
        .DOCUMENT_COUNT()
        .then(td => sendResponse(td + '', res, 'text/plain')),

    // TODO: DOCUMENTS doesnt seem to work for docs with ID of type int
    DOCUMENTS: (req, res) =>
      index.DOCUMENTS(params(req.url).ids).then(b => sendJSONResponse(b, res)),

    EXPORT: (req, res) =>
      index.EXPORT().then(exp => sendJSONResponse(exp, res)),

    FACETS: (req, res) =>
      index
        .FACETS(JSON.parse(params(req.url).q))
        .then(b => sendJSONResponse(b, res)),

    FIELDS: (req, res) => index.FIELDS().then(f => sendJSONResponse(f, res)),

    FLUSH: (req, res) =>
      index.FLUSH().then(idxRes => sendJSONResponse(idxRes, res)),

    IMPORT: (req, res) => {
      console.log('in imprt')
      var body = ''
      req.on('data', d => (body += d.toString()))
      req.on('end', () =>
        index
          .IMPORT(JSON.parse(body))
          .then(idxRes => sendJSONResponse(idxRes, res))
      )
    },

    lastUpdated: lastUpdated,

    MAX: (req, res) =>
      index
        .MAX(JSON.parse(params(req.url).TOKEN))
        .then(m => sendJSONResponse(m, res)),

    MIN: (req, res) =>
      index
        .MIN(JSON.parse(params(req.url).TOKEN))
        .then(m => sendJSONResponse(m, res)),

    // TODO: do we still need the formField hack?
    // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
    // if ?form=[fieldName] then read from that form field
    PUT: (req, res) => {
      const formField = url.parse(req.url, {
        parseQueryString: true
      }).query.form
      var body = ''
      req.on('data', d => (body += d.toString()))
      req.on('end', () =>
        index
          .PUT(
            JSON.parse(formField ? querystring.decode(body)[formField] : body)
          )
          .then(idxRes => sendJSONResponse(idxRes, res))
      )
    },

    PUT_RAW: (req, res) => {
      var body = ''
      req.on('data', d => (body += d.toString()))
      req.on('end', () =>
        index
          .PUT_RAW(JSON.parse(body))
          .then(idxRes => sendJSONResponse(idxRes, res))
      )
    },

    QUERY: (req, res) =>
      index
        .QUERY(
          JSON.parse(params(req.url).TOKEN),
          JSON.parse(params(req.url).ops || '{}')
        )
        .then(r => sendJSONResponse(r, res)),

    SEARCH: (req, res) =>
      index
        .SEARCH(
          JSON.parse(params(req.url).TOKEN),
          JSON.parse(params(req.url).ops || '{}')
        )
        .then(r => sendJSONResponse(r, res))
  }
}
