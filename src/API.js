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
  
  // curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
  // if ?form=[fieldName] then read from that form field
  const put = (req, res) => {
    const formField = url.parse(req.url, {
      parseQueryString: true
    }).query.form
    var body = ""
    req.on('data', d => body += d.toString())
    req.on('end', () => index.PUT(JSON.parse(
      formField
        ? querystring.decode(body)[formField]
        : body
    )).then(idxRes => {
      sendJSONResponse(idxRes, res)
    }))
  }

  const get = (req, res) => res.end('This is GET yo!')

  const allDocuments = (req, res) => index.ALL_DOCUMENTS(
    +params(req.url).limit || undefined
  ).then(ad => sendJSONResponse(ad, res))

  const buckets = (req, res) => index.BUCKETS(
    ...JSON.parse(params(req.url).q)
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

  const query = (req, res) => {
    console.log('BOOOOOOM')
    console.log(params(req.url).query)
    console.log(params(req.url).ops)
    return index.QUERY(
      JSON.parse(params(req.url).query || '{}'),
      JSON.parse(params(req.url).ops || '{}')
    ).then(r => sendJSONResponse(r, res))
  }

  return {
    put: put,
    get: get,
    allDocuments: allDocuments,
    buckets: buckets,
    documentCount: documentCount,
    created: created,
    lastUpdated: lastUpdated,
    query: query
  }

}
