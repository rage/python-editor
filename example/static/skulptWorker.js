onmessage = e => {
  self.importScripts("skulpt.min.js")
  self.importScripts("skulpt-stdlib.js")
  let out = ""
  const code = e.data
  const Sk = self.Sk
  Sk.execLimit = 5000
  const outf = output => {
    console.log(`Skulpt says ${output}`)
    out += output
  }

  console.log("Message received from main script: " + e.data)

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
    console.log("Posting message back to main script")
    postMessage(out)
  } catch (e) {
    console.log(`Worker caught an error: ${e}`)
    postMessage(`An error occurred: ${e}`)
  }
}
