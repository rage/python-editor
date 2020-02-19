importScripts("skulpt.min.js", "skulpt-stdlib.js")
let Sk = self.Sk

function outf(text) {
  postMessage({ type: "print", msg: text })
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
    postMessage({ type: "input_required" })
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
      postMessage({ type: "done" })
    })
    .catch(e => {
      console.log(e)
      postMessage({ type: "error", msg: e.toString() })
    })
}

self.onmessage = function(e) {
  const { type, msg } = e.data
  if (type === "run") {
    run(msg)
  }
}
