importScripts("skulpt.min.js", "skulpt-stdlib.js")
let Sk = self.Sk

postMessage({ type: "ready" })

let printBuffer = []
let intervalId = null
const batchSize = 200
let running = false

// used to check if a control message "input_required" has been appended to buffer
const checkForMsg = () => {
  let msgObject = null
  if (typeof printBuffer[printBuffer.length - 1] === "object") {
    msgObject = printBuffer.pop()
  }
  return msgObject
}

const intervalManager = runInterval => {
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
    postMessage({ type: "print_batch", msg: printBuffer.splice(0, batchSize) })
    prevDate = newDate
  }
}

function builtinRead(x) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][x] === undefined
  )
    throw "File not found: '" + x + "'"
  return Sk.builtinFiles["files"][x]
}

function run(code) {
  if (!code || code.length === 0) return
  Sk.execLimit = 10000
  Sk.inputfun = function() {
    printBuffer.push({ type: "input_required" })
    return new Promise((resolve, reject) => {
      self.addEventListener("message", function(e) {
        if (e.data.type === "input") {
          resolve(e.data.msg)
          Sk.execStart = new Date()
        }
      })
    })
  }
  Sk.configure({
    output: outf,
    read: builtinRead,
    __future__: Sk.python3,
  })

  Sk.misceval
    .asyncToPromise(function() {
      return Sk.importMainWithBody("<stdin>", false, code, true)
    })
    .then(e => {
      console.log("running skulpt completed")
      running = false
      postMessage({ type: "ready" })
    })
    .catch(e => {
      console.log(e)
      running = false
      postMessage({ type: "error", msg: e.toString() })
    })
}

self.onmessage = function(e) {
  const { type, msg } = e.data
  if (type === "run") {
    intervalManager(true)
    running = true
    printBuffer = []
    run(msg)
  } else if (type === "stop") {
    intervalManager(false)
  }
}
