self.languagePluginUrl = "https://pyodide.cdn.iodide.io/"
// importScripts("./pyodide/pyodide.js")

let intervalId = null
const batchSize = 50
let running = false
let intervalId2 = null

// used to check if a control message "input_required" has been appended to buffer
const checkForMsg = (printBuffer) => {
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
      let printBuffer = pyodide?.globals?._print_buffer ?? []

      console.log("print", pyodide?.globals?._input_requested)
      if (pyodide?.globals?._input_requested) {
        printBuffer.push({ type: "input_required" })
        pyodide.globals._input_requested = false
      }

      if (printBuffer.length > 0) {
        let msgObject = null
        if (printBuffer.length <= batchSize) {
          msgObject = checkForMsg(printBuffer)
        }
        const batch = printBuffer.splice(0, batchSize)
        console.log(batch)
        console.log(printBuffer)
        pyodide.globals._print_buffer = printBuffer
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

const printAlias = `
import sys, time

_print_buffer = []
_input_requested = False
_input_buffer = ["ras"]

def print(*objects, sep=' ',  end='\\n'):
    def _print(object, end):
        global _print_buffer
        _print_buffer += list(str(object) + end)

    if len(objects) == 0:
        _print("", end)
        return

    for object in objects[:-1]:
        _print(object, sep)
    _print(objects[-1], end)

    # sys.stdout.write(str(objects))

def input(prompt=None):
    global _input_requested
    global _input_buffer
    print(prompt, end='')
    #_input_requested = True
    #while len(_input_buffer) == 0:
    #    time.sleep(1)

    ret = _input_buffer.join('')
    _input_buffer = []
    return ret
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
              console.log("running pyodide completed")
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
  if (type === "input") {
    console.log("input command")
    if (pyodide.globals._input_requested) {
      pyodide.globals._input_buffer = msg.split("")
    }
  } else if (type === "run") {
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
