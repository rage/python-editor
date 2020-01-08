import React, { useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import useScript from "../hooks/useScript"

const Quiz: React.FunctionComponent = props => {
  const [skulptLoaded, skulptError] = useScript(
    "http://localhost:1234/skulpt.min.js",
  )
  const [stdlibLoaded, stdlibError] = useScript(
    "http://localhost:1234/skulpt-stdlib.js",
  )

  let Sk: any = {}
  if (skulptLoaded && !skulptError) Sk = (window as any).Sk

  function outf(text: string) {
    console.log(text)
  }

  function builtinRead(x: any) {
    if (
      Sk.builtinFiles === undefined ||
      Sk.builtinFiles["files"][x] === undefined
    )
      throw "File not found: '" + x + "'"
    return Sk.builtinFiles["files"][x]
  }

  function handleRun(code: string) {
    if (!code || code.length === 0) return

    Sk.configure({
      output: outf,
      read: builtinRead,
      __future__: Sk.python3,
    })

    try {
      Sk.importMainWithBody("<stdin>", false, code, true)
    } catch (e) {
      alert(e)
    }
  }

  return (
    <div>
      <p>This is a quiz.</p>
      <PyEditor handleRun={handleRun} />
    </div>
  )
}

type PyEditorProps = {
  handleRun: (code: string) => void
}

const PyEditor: React.FunctionComponent<PyEditorProps> = props => {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const valueGetter = useRef(() => "")

  function handleEditorDidMount(_valueGetter: any) {
    setIsEditorReady(true)
    valueGetter.current = _valueGetter
  }

  function handleShowValue() {
    alert(valueGetter.current())
  }

  return (
    <>
      <p>This is an editor.</p>
      <button onClick={handleShowValue} disabled={!isEditorReady}>
        Print editor content
      </button>
      <button
        onClick={() => props.handleRun(valueGetter.current())}
        disabled={!isEditorReady}
      >
        Run code
      </button>
      <Editor
        height="90vh"
        language="python"
        editorDidMount={handleEditorDidMount}
      />
    </>
  )
}

export { Quiz, PyEditor }
