import React, { useRef, useState } from "react"
import Editor from "@monaco-editor/react"

type PyEditorProps = {
  initialValue: string
  handleRun: (code: string) => void
  allowRun?: boolean
}

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  initialValue,
  handleRun,
  allowRun = true,
}) => {
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
      <button onClick={handleShowValue} disabled={!isEditorReady}>
        Print editor content
      </button>
      <button
        onClick={() => handleRun(valueGetter.current())}
        disabled={!(isEditorReady && allowRun)}
      >
        Run code
      </button>
      <Editor
        value={initialValue}
        height="60vh"
        language="python"
        editorDidMount={handleEditorDidMount}
      />
    </>
  )
}

export default PyEditor
