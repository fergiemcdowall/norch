import hljs from '/node_modules/@highlightjs/cdn-assets/es/highlight.min.js'
export default class Elem extends HTMLElement {
  search(input, output) {
    if (input.length <= 2) input = ''

    const q = '/API/SEARCH?STRING=' + input + '&PAGE={"NUMBER":0,"SIZE":10}'

    fetch(q)
      .then(res => res.json())
      .then(res => {
        output.innerHTML = `
<link rel="stylesheet" href="/node_modules/@highlightjs/cdn-assets/styles/github.min.css">
<pre><b>Raw JSON:</b><a href='${q}'>${q}</a></pre>
<pre style="white-space:pre-wrap;">
<code class="language-javascript">${
          hljs.highlight(JSON.stringify(res, null, 2), {
            language: 'json'
          }).value
        }
</code>
</pre>
`
      })
  }

  constructor() {
    super()
    let shadow = this.attachShadow({ mode: 'open' })
    const searchInput = document.getElementById('searchinput')
    const searchResultDiv = document.createElement('div')
    shadow.appendChild(searchResultDiv)

    searchInput.addEventListener('input', event => {
      this.search(event.target.value, searchResultDiv)
    })
  }
}

customElements.define('x-search-results', Elem)
