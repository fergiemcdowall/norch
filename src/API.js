const param = (req, name) =>
  new URLSearchParams(
    new URL(req.url, `http://${req.headers.host}/`).search
  ).get(name)

const sendJSONResponse = (body, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.writeHead(200)
  res.end(JSON.stringify(body, null, 2))
}

module.exports = (index, sendResponse) => ({
  ALL_DOCUMENTS: (req, res) =>
    index
      .ALL_DOCUMENTS(+param(req, 'limit') || undefined)
      .then(ad => sendJSONResponse(ad, res)),

  BUCKETS: (req, res) =>
    index
      .BUCKETS(...JSON.parse('[' + param(req, 'q') + ']'))
      .then(b => sendJSONResponse(b, res)),

  DELETE: (req, res) =>
    index
      .DELETE(param(req, 'ids'))
      .then(idxRes => sendJSONResponse(idxRes, res)),

  DICTIONARY: (req, res) =>
    index.DICTIONARY().then(d => sendJSONResponse(d, res)),

  DISTINCT: (req, res) => index.DISTINCT().then(d => sendJSONResponse(d, res)),

  // TODO: DOCUMENTS doesnt seem to work for docs with ID of type int
  DOCUMENTS: (req, res) =>
    index.DOCUMENTS(param(req, 'ids')).then(b => sendJSONResponse(b, res)),

  EXPORT: (req, res) => index.EXPORT().then(exp => sendJSONResponse(exp, res)),

  FACETS: (req, res) =>
    index
      .FACETS(JSON.parse(param(req, 'q')))
      .then(b => sendJSONResponse(b, res)),

  FIELDS: (req, res) => index.FIELDS().then(f => sendJSONResponse(f, res)),

  FLUSH: (req, res) =>
    index.FLUSH().then(idxRes => sendJSONResponse(idxRes, res)),

  IMPORT: (req, res) => {
    let body = ''
    req.on('data', d => (body += d.toString()))
    req.on('end', () =>
      index
        .IMPORT(JSON.parse(body))
        .then(idxRes => sendJSONResponse(idxRes, res))
    )
  },

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
      index.PUT(JSON.parse(body)).then(idxRes => sendJSONResponse(idxRes, res))
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
    Promise.all([
      index.LAST_UPDATED(),
      index.CREATED(),
      index.DOCUMENT_COUNT()
    ]).then(([LAST_UPDATED, CREATED, DOCUMENT_COUNT]) =>
      sendJSONResponse(
        {
          IS_ALIVE: true,
          CREATED,
          DOCUMENT_COUNT,
          LAST_UPDATED
        },
        res
      )
    )
})
