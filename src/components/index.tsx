import React, { useRef, useState } from "react"
import Editor from "@monaco-editor/react"

const Quiz: React.FunctionComponent = props => {
  return (
    <div>
      <p>This is a quiz.</p>
      <PyEditor />
    </div>
  )
}

const PyEditor: React.FunctionComponent = props => {
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
      <Editor
        height="90vh"
        language="python"
        editorDidMount={handleEditorDidMount}
      />
    </>
  )
}

export { Quiz, PyEditor }
