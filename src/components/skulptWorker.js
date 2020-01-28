onmessage = e => {
  self.importScripts("skulpt.min.js")
  self.importScripts("skulpt-stdlib.js")
  const code = e.data
  const Sk = self.Sk
  Sk.execLimit = 3000

  const outf = output => {
    postMessage({ result: output, error: null })
  }

  function builtinRead(x) {
    if (
      Sk.builtinFiles === undefined ||
      Sk.builtinFiles["files"][x] === undefined
    )
      throw "File not found: '" + x + "'"
    return Sk.builtinFiles["files"][x]
  }

  Sk.configure({
    output: outf,
    read: builtinRead,
    __future__: Sk.python3,
  })

  try {
    Sk.importMainWithBody("<stdin>", false, code, true)
  } catch (e) {
    console.log(`Worker caught an error: ${e}`)
    postMessage({ error: e.toString(), result: null })
  }

  postMessage({ done: true })
}
