self.languagePluginUrl = "https://pyodide.cdn.iodide.io/"
// importScripts("./pyodide/pyodide.js")

let printBuffer = []
let intervalId = null
const batchSize = 50
let running = false
let intervalId2 = null

// used to check if a control message "input_required" has been appended to buffer
const checkForMsg = () => {
  let msgObject = null
  if (typeof printBuffer[printBuffer.length - 1] === "object") {
    msgObject = printBuffer.pop()
  }
  return msgObject
}

const intervalManager = (runInterval) => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (runInterval) {
    intervalId = setInterval(() => {
      if (printBuffer.length > 0) {
        let msgObject = null
        if (printBuffer.length <= batchSize) {
          msgObject = checkForMsg()
        }
        const batch = printBuffer.splice(0, batchSize)
        postMessage({ type: "print_batch", msg: batch })
        if (msgObject) postMessage(msgObject)
      }
      if (!running && printBuffer.length === 0) {
        clearInterval(intervalId)
        postMessage({ type: "print_done" })
      }
    }, 100)
  }
}

let prevDate = null
function outf(text) {
  printBuffer.push(text)
  const newDate = Date.now()
  if (newDate - prevDate > 50) {
    postMessage({
      type: "print_batch",
      msg: printBuffer.splice(0, batchSize),
    })
    prevDate = newDate
  }
}

const printAlias = `
import sys

output = []

def print(data):
    output.append(str(data))
    sys.stdout.write(str(data))
`

function run(code) {
  if (!code || code.length === 0) return
  code = `
${printAlias}
${code}
`
  languagePluginLoader
    .then(() => {
      pyodide
        .loadPackage()
        .then(() => {
          pyodide
            .runPythonAsync(code)
            .then(() => {
              printBuffer.push()
              console.log("running pyodide completed", pyodide.globals.output)
              if (pyodide.globals.output) {
                outf(pyodide.globals.output.join("\n"))
              }
              postMessage({ type: "ready" })
            })
            .catch((e) => {
              printBuffer = []
              printBuffer.push({ type: "error", msg: e.toString() })
            })
        })
        .finally(() => {
          running = false
        })
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({ type: "error", msg: e.toString() })
    })
}

self.onmessage = function (e) {
  const { type, msg } = e.data
  if (type === "run") {
    console.log("run command")
    intervalManager(true)
    running = true
    printBuffer = []
    run(msg)
  } else if (type === "stop") {
    console.log("stop command")
    intervalManager(false)
  }
}
