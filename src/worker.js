self.languagePluginUrl = "https://pyodide.cdn.iodide.io/"
importScripts("./pyodide/pyodide.js")

languagePluginLoader.then(() => {
  self.pyodide.loadPackage().then(() => {
    self.postMessage({ init: true })
  })
})

var onmessage = function (e) {
  languagePluginLoader
    .then(() => {
      const data = e.data
      const useTest = data.useTest
      const usePlot = data.usePlot
      self.pyodide
        .runPythonAsync(data.python)
        .then(() => {
          if (useTest) {
            if (self.pyodide.globals.testOutput) {
              self.postMessage({
                data: self.pyodide.globals.testOutput,
                useTest,
              })
            }
          } else if (usePlot) {
            if (self.pyodide.globals.figureOutput) {
              self.postMessage({
                data: self.pyodide.globals.figureOutput,
                usePlot,
              })
            }
          } else {
            if (self.pyodide.globals.output) {
              self.postMessage({ data: self.pyodide.globals.output, useTest })
            }
          }
        })
        .catch((error) => {
          self.postMessage({ data: { error } })
        })
    })
    .catch((error) => {
      self.postMessage({ data: { error } })
    })
}
