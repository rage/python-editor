self.languagePluginUrl = "https://pyodide.cdn.iodide.io/"

let printBuffer = []
let intervalId = null
const batchSize = 50
let running = false
let testing = false
let inputBuffer = undefined

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

let testResults = []
let testPoints = []
// Running tests requires verbosity > 1 from unittest
// Make sure to run with command unittest.main(2) or equal
const handleTestOutput = (text) => {
  console.log(text)
  if (text.startsWith("Running")) {
    const testName = text.split(" ")[2]
    const matchingPoint = testPoints.find(
      (t) =>
        t.name === testName.split(".")[0] || t.name === testName.split(".")[1],
    )
    testResults.push({
      testName,
      passed: true,
      points: matchingPoint ? matchingPoint.points : "",
    })
  } else if (
    text.startsWith("Fail:") ||
    text.startsWith("Test threw exception")
  ) {
    const lastResult = testResults.pop()
    const updatedResult = { ...lastResult, passed: false, feedback: text }
    testResults.push(updatedResult)
  } else if (text.startsWith("Points:")) {
    const pointObj = JSON.parse(text.slice(7))
    testPoints.push(pointObj)
  }
}

let prevDate = null

/**
 * Python print alias when running with Pyodide. include lines
 * `from js import print` and `__builtins__.print = print` to use.
 */
function print(...args) {
  const kwargs = args.pop()
  console.log(args, kwargs)
  const text = args.join(kwargs?.sep ?? " ") + (kwargs?.end ?? "\n")
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

function request_input() {
  inputBuffer = undefined
  postMessage({ type: "input_required" })
}

function fetch_input() {
  let val = inputBuffer
  inputBuffer = undefined
  return val
}

async function inputPromise(...args) {
  printBuffer.push({ type: "input_required" })
  return new Promise((resolve, reject) => {
    self.addEventListener("message", function (e) {
      if (e.data.type === "input") {
        resolve(e.data.msg)
        self.Sk.execStart = new Date()
      }
    })
  })
}

async function wait(ms) {
  await new Promise((res) => setTimeout(res, ms))
}

function outf(text) {
  if (testing) {
    handleTestOutput(text)
  } else {
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
}

function builtinRead(x) {
  if (
    self.Sk.builtinFiles === undefined ||
    self.Sk.builtinFiles["files"][x] === undefined
  )
    throw "File not found: '" + x + "'"
  return Sk.builtinFiles["files"][x]
}

function end() {
  postMessage({ type: "ready" })
  running = false
}

function run(code) {
  if (!code || code.length === 0) return

  // Async function workaround for input by Andreas Klostermann
  // https://github.com/akloster/aioweb-demo/blob/master/src/main.py
  code = `
from functools import partial
from js import print, inputPromise, wait, end
__builtins__.print = print

class WrappedPromise:
    def __init__(self, promise):
        self.promise = promise
    def __await__(self):
        x = yield self.promise
        return x

def input(*args):
    print(args)
    return WrappedPromise(inputPromise())
__builtins__.input = input

class PromiseException(RuntimeError):
    pass

class WebLoop:
    def __init__(self):
        self.coros = []
    def call_soon(self, coro):
        self.step(coro)
    def step(self, coro, arg=None):
        try:
            x = coro.send(arg)
            x = x.then(partial(self.step, coro))
            x.catch(partial(self.fail,coro))
        except StopIteration as result:
            pass

    def fail(self, coro,arg=None):
        try:
            coro.throw(PromiseException(arg))
        except StopIteration:
            pass

async def task():
${code
  .replaceAll(/input/g, "await input")
  .split("\n")
  .map((x) => `    ${x}`)
  .join("\n")}
    end()

loop = WebLoop()
loop.call_soon(task())
`
  console.log(code)

  languagePluginLoader
    .then(() => {
      pyodide
        .loadPackage()
        .then(() => pyodide.runPythonAsync(code))
        .catch((e) => {
          printBuffer = []
          printBuffer.push({ type: "error", msg: e.toString() })
        })
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({ type: "error", msg: e.toString() })
    })
}

function test(code) {
  if (!code || code.length === 0) return
  languagePluginLoader
    .then(() => {
      pyodide
        .loadPackage()
        .then(() => pyodide.runPythonAsync(code))
        .then(() => {
          console.log("running pyodide completed")
          postMessage({
            type: "test_results",
            msg: JSON.parse(pyodide.globals.testOutput),
          })
          postMessage({ type: "ready" })
        })
        .catch((e) => {
          printBuffer = []
          printBuffer.push({ type: "error", msg: e.toString() })
        })
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({ type: "error", msg: e.toString() })
    })
    .finally(() => (running = false))
}

self.onmessage = function (e) {
  const { type, msg } = e.data
  if (type === "run") {
    intervalManager(true)
    running = true
    printBuffer = []
    run(msg)
  } else if (type === "stop") {
    intervalManager(false)
  } else if (type === "run_tests") {
    intervalManager(true)
    running = true
    printBuffer = []
    console.log(msg)
    test(msg)
  } else if (type === "input") {
    inputBuffer = msg
  }
}
