import React from "react"
import styled from "styled-components"
import { Button } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons"
import { useTranslation } from "react-i18next"

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))``

type PyEditorButtonsProps = {
  handleRun: (code?: string) => void
  handleRunWrapped: (code?: string) => void
  allowRun?: boolean
  handleStop: () => void
  isRunning: boolean
  solutionUrl?: string
  isEditorReady: boolean
}

const PyEditorButtons: React.FunctionComponent<PyEditorButtonsProps> = ({
  handleRun,
  handleRunWrapped,
  allowRun = true,
  handleStop,
  isRunning,
  solutionUrl,
  isEditorReady,
}) => {
  const [t] = useTranslation()
  return (
    <>
      {!isRunning ? (
        <StyledButton
          onClick={() => handleRun()}
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
      {/* <StyledButton
            onClick={() => handleRunWrapped(editorValue)}
            disabled={!(isEditorReady && allowRun)}
            data-cy="run-wrapped-btn"
          >
            Run with wrapped imports
          </StyledButton> */}
    </>
  )
}

export default PyEditorButtons
