import hljs from '/node_modules/@highlightjs/cdn-assets/es/highlight.min.js'

// rightsize textarea to its contents
export const rightsizeTextarea = () =>
  freehandJsonInput.setAttribute(
    'rows',
    freehandJsonInput.value.split(/\r|\r\n|\n/).length
  )

// log server responses to web page
const printResponse = response => {
  serverResponse.innerHTML =
    '\n\n' +
    new Date().toISOString() +
    ' ->\n\n' +
    hljs.highlight(JSON.stringify(response, null, 2), {
      language: 'json'
    }).value +
    serverResponse.innerHTML
}

const setLoading = toggle =>
  toggle ? (loading.style.display = 'flex') : (loading.style.display = 'none')

// upload to server from textarea
export const PUTFromTextArea = jsonText => {
  setLoading(true)
  PUT(jsonText)
}

// upload to server from file
export const PUTFromFile = () => {
  setLoading(true)
  const reader = new FileReader()
  const [file] = fileUpload.files
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
      setLoading(false)
      printResponse(reponse)
      rightsizeTextarea()
    })
    .catch(console.error)

// pretty input validation
export const validateInput = () => {
  // set invalid, not submittable as default
  putFromTextAreaBtn.disabled = true
  freehandJsonInput.setCustomValidity('')
  validation: try {
    if (freehandJsonInput.value == '') break validation // valid, but not submittable
    JSON.parse(freehandJsonInput.value)
    putFromTextAreaBtn.disabled = false // if no error thrown, json is valid
  } catch (e) {
    freehandJsonInput.setCustomValidity(e.toString()) // JSON is invalid
  } finally {
    rightsizeTextarea()
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

window.onload = () => {
  setDetails()
}
