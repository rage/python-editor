import React, { useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import styled from "styled-components"
import { Button } from "@material-ui/core"

type PyEditorProps = {
  initialValue: string
  setContentBuffer: React.Dispatch<React.SetStateAction<string>>
  handleRun: (code: string) => void
  allowRun?: boolean
}

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  initialValue,
  setContentBuffer,
  handleRun,
  allowRun = true,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef()

  function handleEditorDidMount(_: any, editor: any) {
    setIsEditorReady(true)
    editorRef.current = editor
    editor.onDidChangeModelContent(() => {
      setContentBuffer(() => editorRef.current.getValue())
    })
  }

  function handleShowValue() {
    alert(editorRef.current.getValue())
  }

  return (
    <>
      <StyledButton
        onClick={handleShowValue}
        disabled={!isEditorReady}
        data-cy="print-btn"
      >
        Print editor content
      </StyledButton>
      <StyledButton
        onClick={() => handleRun(editorRef.current.getValue())}
        disabled={!(isEditorReady && allowRun)}
        data-cy="run-btn"
      >
        Run code
      </StyledButton>
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
