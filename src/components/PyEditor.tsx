import React, { useState } from "react"
import { ControlledEditor } from "@monaco-editor/react"
import styled from "styled-components"
import { Button } from "@material-ui/core"

type PyEditorProps = {
  handleRun: (code: string) => void
  handleRunWrapped: (code: string) => void
  allowRun?: boolean
  handleStop: () => void
  handleSubmit: () => void
  isRunning: boolean
  isSubmitting: boolean
  editorValue: string
  setEditorValue: React.Dispatch<React.SetStateAction<string>>
}

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  handleRun,
  handleRunWrapped,
  allowRun = true,
  handleStop,
  handleSubmit,
  isRunning,
  isSubmitting,
  editorValue,
  setEditorValue,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false)

  function handleEditorDidMount(_: any, editor: any) {
    setIsEditorReady(true)
  }

  const handleChange = (ev: any, value: string | undefined): string => {
    if (value) {
      setEditorValue(value)
      return value
    }
    return ""
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
        onClick={() => handleRunWrapped(editorValue)}
        disabled={!(isEditorReady && allowRun)}
        data-cy="run-wrapped-btn"
      >
        Run with wrapped imports
      </StyledButton>
      <StyledButton
        onClick={() => handleStop()}
        disabled={!isRunning}
        data-cy="stop-btn"
      >
        Stop
      </StyledButton>
      <StyledButton
        onClick={handleSubmit}
        disabled={isSubmitting}
        data-cy="submit-btn"
      >
        Submit exercise
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
