const url = require('url')

module.exports = (index, sendResponse) => {

  const params = _url => url.parse(_url, {
    parseQueryString: true
  }).query

  const sendJSONResponse = (body, res) => {
    res.setHeader("Content-Type", 'application/json; charset=utf-8')
    res.writeHead(200)
    res.end(JSON.stringify(body, null, 2))
  }
  
  // *************


  // TODO: do we still need the formField hack?
  // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
  // if ?form=[fieldName] then read from that form field
  const put = (req, res) => {
    const formField = url.parse(req.url, {
      parseQueryString: true
    }).query.form
    var body = ''
    req.on('data', d => body += d.toString())
    req.on('end', () => index.PUT(JSON.parse(
      formField
        ? querystring.decode(body)[formField]
        : body
    )).then(
      idxRes => sendJSONResponse(idxRes, res)
    ))
  }

  const imprt = (req, res) => {
    console.log('in imprt')
    var body = ''
    req.on('data', d => body += d.toString())
    req.on('end', () => index.IMPORT(JSON.parse(body)).then(
      idxRes => sendJSONResponse(idxRes, res)
    ))
  }

  const del = (req, res) => index.DELETE(
    [params(req.url).ids].flat()
  ).then(idxRes => sendJSONResponse(idxRes, res))

  const flush = (req, res) => index.FLUSH()
        .then(idxRes => sendJSONResponse(idxRes, res))

  const get = (req, res) => res.end('This is GET yo!')

  const allDocuments = (req, res) => index.ALL_DOCUMENTS(
    +params(req.url).limit || undefined
  ).then(ad => sendJSONResponse(ad, res))

  const buckets = (req, res) => index.BUCKETS(
    ...JSON.parse('[' + params(req.url).q + ']')
  ).then(b => sendJSONResponse(b, res))

  const documents = (req, res) => index.DOCUMENTS(
    params(req.url).ids
  ).then(b => sendJSONResponse(b, res))

  const dictionary = (req, res) => index.DICTIONARY()
        .then(d => sendJSONResponse(d, res))  

  const distinct = (req, res) => index.DISTINCT()
        .then(d => sendJSONResponse(d, res))
  
  const facets = (req, res) => index.FACETS(
    JSON.parse(params(req.url).q)
  ).then(b => sendJSONResponse(b, res))
  
  const documentCount = (req, res) => index.DOCUMENT_COUNT().then(
    td => sendResponse(td + '', res, 'text/plain')
  )

  const created = (req, res) => index.CREATED().then(
    c => sendResponse(c + '', res, 'text/plain')
  )

  const lastUpdated = (req, res) => index.LAST_UPDATED().then(
    lu => sendResponse(lu + '', res, 'text/plain')
  )

  const query = (req, res) => index.QUERY(
    JSON.parse(params(req.url).query || '{}'),
    JSON.parse(params(req.url).ops || '{}')
  ).then(r => sendJSONResponse(r, res))

  const replicate = (req, res) => index.EXPORT().then(
    exp => sendJSONResponse(exp, res)
  )

  const max = (req, res) => index.MAX(
    params(req.url).field
  ).then(m => sendJSONResponse(m, res))

  const min = (req, res) => index.MIN(
    params(req.url).field
  ).then(m => sendJSONResponse(m, res))

  const fields = (req, res) => index.FIELDS()
        .then(f => sendJSONResponse(f, res))
  
  return {
    allDocuments: allDocuments,
    buckets: buckets,
    created: created,
    del: del,
    dictionary: dictionary,
    distinct: distinct,
    documentCount: documentCount,
    documents: documents,
    facets: facets,
    fields: fields,
    flush: flush,
    get: get,
    imprt: imprt,
    lastUpdated: lastUpdated,
    max: max,
    min: min,
    put: put,
    query: query,
    replicate: replicate
  }

}
