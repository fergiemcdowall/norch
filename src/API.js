module.exports = (index, sendResponse) => {
  const param = (req, name) =>
    new URLSearchParams(
      new URL(req.url, `http://${req.headers.host}/`).search
    ).get(name)

  const sendJSONResponse = (body, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.writeHead(200)
    res.end(JSON.stringify(body, null, 2))
  }

  // *************

  return {
    ALL_DOCUMENTS: (req, res) =>
      index
        .ALL_DOCUMENTS(+param(req, 'limit') || undefined)
        .then(ad => sendJSONResponse(ad, res)),

    BUCKETS: (req, res) =>
      index
        .BUCKETS(...JSON.parse('[' + param(req, 'q') + ']'))
        .then(b => sendJSONResponse(b, res)),

    CREATED: (req, res) =>
      index.CREATED().then(c => sendResponse(c + '', res, 'text/plain')),

    DELETE: (req, res) =>
      index
        .DELETE(param(req, 'ids'))
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
      index.DOCUMENTS(param(req, 'ids')).then(b => sendJSONResponse(b, res)),

    EXPORT: (req, res) =>
      index.EXPORT().then(exp => sendJSONResponse(exp, res)),

    FACETS: (req, res) =>
      index
        .FACETS(JSON.parse(param(req, 'q')))
        .then(b => sendJSONResponse(b, res)),

    FIELDS: (req, res) => index.FIELDS().then(f => sendJSONResponse(f, res)),

    FLUSH: (req, res) =>
      index.FLUSH().then(idxRes => sendJSONResponse(idxRes, res)),

    IMPORT: (req, res) => {
      console.log('in imprt')
      let body = ''
      req.on('data', d => (body += d.toString()))
      req.on('end', () =>
        index
          .IMPORT(JSON.parse(body))
          .then(idxRes => sendJSONResponse(idxRes, res))
      )
    },

    // TODO: move this to STATUS perhaps?
    LAST_UPDATED: (req, res) =>
      index.LAST_UPDATED().then(lu => sendResponse(lu + '', res, 'text/plain')),

    MAX: (req, res) =>
      index
        .MAX(JSON.parse(param(req, 'TOKEN')))
        .then(m => sendJSONResponse(m, res)),

    MIN: (req, res) =>
      index
        .MIN(JSON.parse(param(req, 'TOKEN')))
        .then(m => sendJSONResponse(m, res)),

    // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
    PUT: (req, res) => {
      let body = ''
      req.on('data', d => (body += d.toString()))
      req.on('end', () =>
        index
          .PUT(JSON.parse(body))
          .then(idxRes => sendJSONResponse(idxRes, res))
      )
    },

    PUT_RAW: (req, res) => {
      let body = ''
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
          JSON.parse(param(req, 'TOKEN')),
          JSON.parse(param(req, 'ops') || '{}')
        )
        .then(r => sendJSONResponse(r, res)),

    SEARCH: (req, res) =>
      index
        .SEARCH(
          JSON.parse(param(req, 'TOKEN')),
          JSON.parse(param(req, 'ops') || '{}')
        )
        .then(r => sendJSONResponse(r, res)),

    STATUS: (req, res) =>
      sendJSONResponse(
        {
          isAlive: true
        },
        res
      )
  }
}
