// make it easier to grab elements
const el = id => document.getElementById(id)

// grab value of documents from textarea
const textareaInput = () =>
  JSON.stringify(JSON.parse(el('json').value), null, 2)

// resize textarea to its contents
const resizeTextarea = () =>
  el('json').setAttribute('rows', el('json').value.split(/\r|\r\n|\n/).length)

// log server responses to web page
const printResponse = response => {
  el('server-response').innerHTML =
    '\n\n' +
    new Date().toISOString() +
    ' ->\n\n' +
    JSON.stringify(response, null, 2) +
    el('server-response').innerHTML
}

const loading = toggle =>
  toggle
    ? (el('loading').style.display = 'flex')
    : (el('loading').style.display = 'none')

// upload to server from textarea
const PUTFromTextArea = () => {
  loading(true)
  PUT(textareaInput())
}

// upload to server from file
PUTFromFile = () => {
  loading(true)
  const reader = new FileReader()
  const [file] = el('file-upload').files
  if (file) reader.readAsText(file)
  reader.addEventListener('load', () => PUT(reader.result))
}

// upload to server
const PUT = json =>
  fetch(
    new Request('/API/PUT', {
      body: json,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      method: 'POST'
    })
  )
    .then(res => res.json())
    .then(reponse => {
      console.log(reponse)
      loading(false)
      printResponse(reponse)
      resizeTextarea()
    })
    .catch(console.error)

// pretty input validation
const validateInput = () => {
  // set invalid, not submittable as default
  el('put').disabled = true
  el('json').setCustomValidity('')
  validation: try {
    if (el('json').value == '') break validation // valid, but not submittable
    el('json').value = textareaInput()
    el('put').disabled = false // if no error thrown, json is valid
  } catch (e) {
    el('json').setCustomValidity(e.toString()) // JSON is invalid
  } finally {
    resizeTextarea()
  }
}

// only open one <details> element at a time
const setDetails = () => {
  const details = document.querySelectorAll('details')
  details.forEach(targetDetail => {
    targetDetail.addEventListener('click', () => {
      // Close all details that are not targetDetail
      details.forEach(detail => {
        if (detail !== targetDetail) {
          detail.removeAttribute('open')
        }
      })
    })
  })
}

// if browser initialises wit content in textarea- validate!
window.onload = () => {
  validateInput()
  setDetails()
}
