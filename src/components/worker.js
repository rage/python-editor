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
function print(...args) {
  const kwargs = args.pop()
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

function printError(...args) {
  const kwargs = args.pop()
  const text = args.join(kwargs?.sep ?? " ") + (kwargs?.end ?? "\n")
  postMessage({
    type: "error",
    msg: fixLineNumberOffset(text),
  })
}

async function inputPromise() {
  printBuffer.push({ type: "input_required" })
  return new Promise((resolve) => {
    self.addEventListener("message", function (e) {
      if (e.data.type === "input") {
        resolve(e.data.msg)
      }
    })
  })
}

async function wait(ms) {
  await new Promise((res) => setTimeout(res, ms))
}

function exit() {
  postMessage({ type: "ready" })
  running = false
}

function run({ code, debug }) {
  // Async function workaround for input by Andreas Klostermann
  // https://github.com/akloster/aioweb-demo/blob/master/src/main.py
  code = `\
async def execute():
    __name__ = "__main__"
${code
  .replace(/"""/g, '\\"\\"\\"')
  .split("\n")
  .map((x) => `    ${x}`)
  .join("\n")}
    pass # SyntaxError: EOF - Missing end parentheses at end of code?

from functools import partial
from js import exit, inputPromise, print, printError, wait
import traceback

class WrappedPromise:
    def __init__(self, promise):
        self.promise = promise
    def __await__(self):
        x = yield self.promise
        return x

def input(prompt=None):
    if prompt:
        print(prompt, end="")
    return WrappedPromise(inputPromise())

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

async def wrap_execution():
    try:
        await execute()
    except Exception as e:
        tb = traceback.format_exc()
        printError(tb)
    exit()

loop = WebLoop()
loop.call_soon(wrap_execution())
`

  parsedCode = `
import ast
import re

class PatchCode(ast.NodeTransformer):
    def generic_visit(self, node):
      super().generic_visit(node)

      # Python 3.8 higher all is ast.Constant
      if isinstance(node, ast.Constant):
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

tree = ast.parse("""${code}""")
optimizer = PatchCode()
tree = optimizer.visit(tree)
code = compile(tree, "<string>", "exec")
exec(code)
`
  if (debug) {
    console.log(parsedCode)
  }
  languagePluginLoader
    .then(() => {
      pyodide
        .loadPackage()
        .then(() => postMessage({ type: "start_run" }))
        .then(() => pyodide.runPythonAsync(parsedCode))
        .catch((e) => {
          printBuffer = []
          printBuffer.push({
            type: "error",
            msg: fixLineNumberOffset(e.toString()),
          })
          exit()
        })
    })
    .catch((e) => {
      printBuffer = []
      printBuffer.push({
        type: "error",
        msg: fixLineNumberOffset(e.toString()),
      })
      exit()
    })
}

function lineOffsetReplacer(m, number, o, s) {
  return "line " + (parseInt(number) - 2).toString()
}

function fixLineNumberOffset(msg) {
  return msg.replace(/line\s(\d+)/g, lineOffsetReplacer)
}

function test({ code, debug }) {
  if (debug) {
    console.log(code)
  }
  languagePluginLoader
    .then(() => {
      pyodide
        .loadPackage()
        .then(() => postMessage({ type: "start_test" }))
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
