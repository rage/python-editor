import React from "react"
import styled from "styled-components"
import { Button } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faPlay, faStop } from "@fortawesome/free-solid-svg-icons"
import { useTranslation } from "react-i18next"
import { EditorState } from "../types"

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))``

type PyEditorButtonsProps = {
  allowRun?: boolean
  allowTest?: boolean
  editorState: EditorState
  handleRun?: (code?: string) => void
  handleStop?: () => void
  handleTests?: (code?: string) => void
  solutionUrl?: string
}

const PyEditorButtons: React.FunctionComponent<PyEditorButtonsProps> = ({
  allowRun = true,
  allowTest = false,
  editorState,
  handleRun,
  handleStop,
  handleTests,
  solutionUrl,
}) => {
  const [t] = useTranslation()

  return (
    <>
      {(editorState & EditorState.WorkerActive) === 0 && handleRun ? (
        <StyledButton
          onClick={() => handleRun()}
          disabled={!allowRun}
          data-cy="run-btn"
        >
          <FontAwesomeIcon color="#32CD32" icon={faPlay} />
        </StyledButton>
      ) : handleStop ? (
        <StyledButton onClick={() => handleStop()} data-cy="stop-btn">
          <FontAwesomeIcon color="#B40A0A" icon={faStop} />
        </StyledButton>
      ) : null}
      {handleTests ? (
        <StyledButton onClick={() => handleTests()} disabled={!allowTest}>
          <FontAwesomeIcon color="#ED9410" icon={faEye} />
        </StyledButton>
      ) : null}
      {solutionUrl && (
        <StyledButton
          style={
            handleRun
              ? {
                  fontSize: "12px",
                  position: "absolute",
                  right: "0",
                  top: "0",
                  padding: "2px 16px",
                }
              : {}
          }
          variant="contained"
          onClick={() => window.open(solutionUrl, "_blank")}
        >
          {t("modelSolution")}
        </StyledButton>
      )}
    </>
  )
}

export default PyEditorButtons
