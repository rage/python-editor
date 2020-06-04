import React, { useState } from "react"
import { ControlledEditor } from "@monaco-editor/react"
import styled from "styled-components"
import { Button } from "@material-ui/core"
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useTranslation } from "react-i18next"

interface EditorWrapperProps {
  height?: string
}

const EditorWrapper = styled.div`
  min-height: 300px;
  max-height: 950px;
  border: 1px inset;
  height: ${(props: EditorWrapperProps) =>
    props.height ? props.height : "400px"};
`

type PyEditorProps = {
  handleRun: (code: string) => void
  handleRunWrapped: (code: string) => void
  allowRun?: boolean
  handleStop: () => void
  isRunning: boolean
  editorValue: string
  setEditorValue: React.Dispatch<React.SetStateAction<string>>
  editorHeight: string | undefined
  solutionUrl?: string
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))``

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  handleRun,
  handleRunWrapped,
  allowRun = true,
  handleStop,
  isRunning,
  editorValue,
  setEditorValue,
  editorHeight,
  solutionUrl,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [t] = useTranslation()
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

  return (
    <>
      {!isRunning ? (
        <StyledButton
          onClick={() => handleRun(editorValue)}
          disabled={!(isEditorReady && allowRun)}
          data-cy="run-btn"
        >
          <FontAwesomeIcon color="#32CD32" icon={faPlay} />
        </StyledButton>
      ) : (
        <StyledButton
          onClick={() => handleStop()}
          disabled={!(isEditorReady && isRunning)}
          data-cy="stop-btn"
        >
          <FontAwesomeIcon color="#B40A0A" icon={faStop} />
        </StyledButton>
      )}
      {solutionUrl && (
        <StyledButton
          style={{ fontSize: "9px", float: "right" }}
          variant="contained"
          onClick={() => window.open(solutionUrl, "_blank")}
        >
          {t("modelSolution")}
        </StyledButton>
      )}
      {/* <StyledButton
        onClick={() => handleRunWrapped(editorValue)}
        disabled={!(isEditorReady && allowRun)}
        data-cy="run-wrapped-btn"
      >
        Run with wrapped imports
      </StyledButton> */}
      <EditorWrapper height={editorHeight}>
        <ControlledEditor
          value={editorValue}
          language="python"
          editorDidMount={handleEditorDidMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            hideCursorInOverviewRuler: true,
            scrollbar: { alwaysConsumeMouseWheel: false },
          }}
        />
      </EditorWrapper>
    </>
  )
}

export default PyEditor
