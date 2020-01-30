import React, { useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import styled from "styled-components"
import { Button } from "@material-ui/core"

type PyEditorProps = {
  initialValue: string
  handleRun: (code: string) => void
  allowRun?: boolean
}

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

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
      <StyledButton onClick={handleShowValue} disabled={!isEditorReady}>
        Print editor content
      </StyledButton>
      <StyledButton
        onClick={() => handleRun(valueGetter.current())}
        disabled={!(isEditorReady && allowRun)}
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
