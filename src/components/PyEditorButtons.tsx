import React from "react"
import styled from "styled-components"
import { Button } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons"
import { useTranslation } from "react-i18next"
import { EditorState } from "../types"

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))``

type PyEditorButtonsProps = {
  allowRun?: boolean
  editorState: EditorState
  handleRun: (code?: string) => void
  handleStop: () => void
  solutionUrl?: string
}

const PyEditorButtons: React.FunctionComponent<PyEditorButtonsProps> = ({
  allowRun = true,
  editorState,
  handleRun,
  handleStop,
  solutionUrl,
}) => {
  const [t] = useTranslation()

  return (
    <>
      {editorState !== EditorState.Running &&
      editorState !== EditorState.RunningWaitingInput ? (
        <StyledButton
          onClick={() => handleRun()}
          disabled={
            editorState === EditorState.Initializing ||
            !allowRun ||
            editorState === EditorState.Submitting ||
            editorState === EditorState.SubmittingToPaste
          }
          data-cy="run-btn"
        >
          <FontAwesomeIcon color="#32CD32" icon={faPlay} />
        </StyledButton>
      ) : (
        <StyledButton onClick={() => handleStop()} data-cy="stop-btn">
          <FontAwesomeIcon color="#B40A0A" icon={faStop} />
        </StyledButton>
      )}
      {solutionUrl && (
        <StyledButton
          style={{
            fontSize: "12px",
            position: "absolute",
            right: "0",
            top: "0",
            padding: "2px 16px",
          }}
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
