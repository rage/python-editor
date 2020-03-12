import React, { useRef, useState, useEffect } from "react"
// import Editor from "@monaco-editor/react"
import { ControlledEditor } from "@monaco-editor/react"
import styled from "styled-components"
import { Button } from "@material-ui/core"

type PyEditorProps = {
  handleRun: (code: string) => void
  allowRun?: boolean
  handleStop: () => void
  isRunning: boolean
  editorValue
  setEditorValue: React.Dispatch<React.SetStateAction<string>>
}

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  handleRun,
  allowRun = true,
  handleStop,
  isRunning,
  editorValue,
  setEditorValue,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false)

  function handleEditorDidMount(_: any, editor: any) {
    setIsEditorReady(true)
  }

  const handleChange = (ev, value) => {
    setEditorValue(value)
    return value
  }

  function handleShowValue() {
    alert(editorValue)
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
        onClick={() => handleRun(editorValue)}
        disabled={!(isEditorReady && allowRun)}
        data-cy="run-btn"
      >
        Run code
      </StyledButton>
      <StyledButton
        onClick={() => handleStop()}
        disabled={!isRunning}
        data-cy="stop-btn"
      >
        Stop
      </StyledButton>
      <ControlledEditor
        value={editorValue}
        height="60vh"
        language="python"
        editorDidMount={handleEditorDidMount}
        onChange={handleChange}
      />
    </>
  )
}

export default PyEditor
