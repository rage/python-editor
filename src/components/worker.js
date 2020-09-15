self.languagePluginUrl = "https://pyodide.cdn.iodide.io/"

let printBuffer = []
let intervalId = null
const batchSize = 50
let running = false
let testing = false

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

function run(code) {
  if (!code || code.length === 0) return
  self.Sk.execLimit = 7500
  self.Sk.inputfun = function () {
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
  self.Sk.configure({
    output: outf,
    read: builtinRead,
    __future__: self.Sk.python3,
  })

  self.Sk.misceval
    .asyncToPromise(function () {
      return self.Sk.importMainWithBody("<stdin>", false, code, true)
    })
    .then((e) => {
      console.log("running skulpt completed")
      if (testing) {
        postMessage({ type: "testResults", msg: testResults })
        testResults = []
        testPoints = []
      }
      postMessage({ type: "ready" })
    })
    .catch((e) => {
      console.log(e)
      printBuffer = []
      printBuffer.push({ type: "error", msg: e.toString() })
    })
    .finally(() => {
      running = false
      testing = false
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
  }
}
