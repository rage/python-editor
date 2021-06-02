/* eslint-env worker */

self.importScripts("https://download.mooc.fi/pyodide-cdn/v0.17.0/pyodide.js")
/* global loadPyodide, pyodide */

async function loadPyodideAndPackages() {
  await loadPyodide({
    indexURL: "https://download.mooc.fi/pyodide-cdn/v0.17.0/",
  })
}
let pyodideReadyPromise = loadPyodideAndPackages()

let printBuffer = []
let intervalId = null
const batchSize = 50
let running = false

/**
 * printBuffer should only contain strings, if an object is encountered it's an input request
 * @returns The last element, i.e. input request from printBuffer
 */
const checkForInputMessage = () => {
  let msgObject = null
  if (typeof printBuffer[printBuffer.length - 1] === "object") {
    msgObject = printBuffer.pop()
  }
  return msgObject
}

const printBufferManager = (runInIntervals) => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (runInIntervals) {
    intervalId = setInterval(() => {
      if (printBuffer.length > 0) {
        let inputObject = null
        // Code halts at input, if input requested, it's the last element in the buffer.
        if (printBuffer.length <= batchSize) {
          inputObject = checkForInputMessage()
        }
        const batch = printBuffer.splice(0, batchSize)
        postMessage({ type: "print_batch", msg: batch })
        if (inputObject) postMessage(inputObject)
      }
      if (!running && printBuffer.length === 0) {
        clearInterval(intervalId)
        postMessage({ type: "print_done" })
      }
    }, 100)
  }
}

let prevDate = null
/**
 * Python print alias when running with Pyodide. include lines
 * `from js import print` and `__builtins__.print = print` to use.
 */
self.print = function (...args) {
  let kwargs = {}
  if (typeof args[args.length - 1] === "object") {
    kwargs = args.pop()
  }
  const text = args.join(kwargs?.sep ?? " ") + (kwargs?.end ?? "\n")
  printBuffer.push(text)

  // If code is in loop, intervalManager doesn't print batches(?)
  // This below makes sure there are prints done.
  const newDate = Date.now()
  if (newDate - prevDate > 50) {
    postMessage({
      type: "print_batch",
      msg: printBuffer.splice(0, batchSize),
    })
    prevDate = newDate
  }
}

self.printError = function (message, kind, line, traceback) {
  const msg = `${kind} on line ${line}: ${message}`
  postMessage({ type: "error", msg, traceback })
}

self.inputPromise = () => {
  printBuffer.push({ type: "input_required" })
  return new Promise((resolve) => {
    self.addEventListener(
      "message",
      function (e) {
        if (e.data.type === "input") {
          resolve(e.data.msg)
        }
      },
      { once: true },
    )
  })
}

self.wait = function (ms) {
  return new Promise((res) => setTimeout(res, ms))
}

self.exit = function () {
  postMessage({ type: "ready" })
  running = false
}

function run({ code, debug }) {
  code = `\
async def execute():
    __name__ = "__main__"
${code
  .replace(/\\/g, "\\\\")
  .replace(/"""/g, '\\"\\"\\"')
  .split("\n")
  .map((x) => `    ${x}`)
  .join("\n")}
    pass # SyntaxError: EOF - Missing end parentheses at end of code?

import asyncio, pyodide, sys, traceback
from js import exit, inputPromise, print, printError, wait

async def input(prompt=None):
    if prompt:
        print(prompt, end="")
    return await inputPromise()

async def wrap_execution():
  try:
      await execute()
  except Exception:
      t, v, tb = sys.exc_info()
      frames = traceback.extract_tb(tb)
      for frame in frames:
          frame.lineno -= 2
      tb2 = [f"Line {f.lineno} in {f.name}()" for f in frames[2:]]
      printError(str(v), type(v).__name__, frames[-1].lineno, pyodide.to_js(tb2))
  exit()

asyncio.create_task(wrap_execution())
`

  const parsedCode = `
import ast, re, sys, traceback
from js import exit, printError

class PatchCode(ast.NodeTransformer):
    def generic_visit(self, node):
      super().generic_visit(node)

      # Python 3.8 higher all is ast.Constant
      if isinstance(node, ast.Constant) and isinstance(node.value, str):
        remove_padding = re.sub('[\\n]    ', '\\n', node.value)
        result = ast.Constant(remove_padding)
        return ast.copy_location(result, node)
      # Python ver 3.8 lower ast.Str is used
      if isinstance(node, ast.Str):
        remove_padding = re.sub('[\\n]    ', '\\n', node.s)
        result = ast.Constant(remove_padding)
        return ast.copy_location(result, node)

      input_conditions = (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == 'input'
      )
      if input_conditions:
        result = ast.Await(node)
        return ast.copy_location(result, node)

      return node

try:
    tree = ast.parse("""${code}""")
    optimizer = PatchCode()
    tree = optimizer.visit(tree)
    code = compile(tree, "<string>", "exec")
    exec(code)
except Exception:
    t, v, tb = sys.exc_info()
    error, line = re.compile(r'(.+) \\(.+, line (\\d+)').search(str(v)).groups()
    printError(error, type(v).__name__, int(line) - 2, [])
    exit()
`
  if (debug) {
    console.log(parsedCode)
  }
  pyodideReadyPromise
    .then(async () => {
      postMessage({ type: "start_run" })
      await pyodide.runPythonAsync(parsedCode)
      if (debug) console.log("running pyodide completed")
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({
        type: "error",
        msg: "Failed to initialize Pyodide: " + e.toString(),
        traceback: [],
      })
      self.exit()
    })
}

function test({ code, debug }) {
  if (debug) {
    console.log(code)
  }
  pyodideReadyPromise
    .then(async () => {
      try {
        postMessage({ type: "start_test" })
        await pyodide.runPythonAsync(code)
        if (debug) console.log("running pyodide completed")
        postMessage({
          type: "test_results",
          msg: JSON.parse(pyodide.globals.get("testOutput")),
        })
        postMessage({ type: "ready" })
      } catch (e) {
        printBuffer = []
        printBuffer.push({ type: "error", msg: e.toString(), traceback: [] })
      }
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({ type: "error", msg: e.toString(), traceback: [] })
    })
    .finally(() => (running = false))
}

self.onmessage = function (e) {
  const { type, msg } = e.data
  if (type === "run") {
    printBufferManager(true)
    running = true
    printBuffer = []
    run(msg)
  } else if (type === "stop") {
    printBufferManager(false)
  } else if (type === "run_tests") {
    printBufferManager(true)
    running = true
    printBuffer = []
    //console.log(msg)
    test(msg)
  }
}
