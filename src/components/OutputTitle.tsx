import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Typography, Button, Grid, CircularProgress } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import TestProgressBar from "./TestProgressBar"
import { TestResultObject, EditorState } from "../types"

type OutputTitleProps = {
  allowSubmitting: boolean
  closeOutput: () => void
  editorState: EditorState
  handleSubmit: () => void
  hasErrors: boolean
  showHelp: () => void
  testResults: TestResultObject | undefined
}

const StatusText = styled(Typography)`
  && {
    margin: 0 10px 0 10px;
    color: white;
  }
`

const MarginedButton = styled(Button)`
  margin: 3px !important;
`

const OutputTitleBox = styled(({ inputRequested, ...props }) => (
  <Grid {...props} />
))`
  background-color: ${({ inputRequested }) =>
    inputRequested ? "#FF9800" : "#2196f3"};
  color: white;
  border-radius: 3px 3px 0 0;
  padding: 5px;
`

const OutputTitleText = styled(Typography)`
  && {
    font-size: 1 rem;
    display: inline-block;
    padding: 5px;
    color: white;
  }
`

const OutputTitle: React.FunctionComponent<OutputTitleProps> = (props) => {
  const {
    allowSubmitting,
    closeOutput,
    editorState,
    handleSubmit,
    hasErrors,
    showHelp,
    testResults,
  } = props
  const [t] = useTranslation()
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (editorState === EditorState.Submitting) {
      setProgress(10 + 30 * Math.random())
    }
  }, [editorState])

  useEffect(() => {
    if (editorState === EditorState.Submitting) {
      setTimeout(() => {
        setProgress((prev) => Math.min(prev + 10, 100))
      }, 2000)
    }
  }, [progress])

  const getTitleText = () => {
    switch (editorState) {
      case EditorState.ShowSubmissionResults:
        return t("testResults")
      default:
        return t("outputTitle")
    }
  }

  const getStatusText = () => {
    switch (editorState) {
      case EditorState.ExecutingCode:
        return t("running")
      case EditorState.Submitting:
        return t("submitting")
      case EditorState.Testing:
        return t("testing")
      case EditorState.WaitingInput:
        return t("waitingForInput")
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    switch (editorState) {
      case EditorState.WaitingInput:
        return <FontAwesomeIcon icon={faExclamation} />
      case EditorState.ExecutingCode:
      case EditorState.Submitting:
      case EditorState.Testing:
        return <CircularProgress size={25} color="inherit" disableShrink />
      default:
        return null
    }
  }

  // Do not modify, this is optimized.
  const fakePercentage = () => {
    const fake = progress / 100
    return Math.min(
      Math.round((3 * Math.pow(fake, 2) - 2 * Math.pow(fake, 3)) * 100),
      99,
    )
  }

  const passedTestsPercentage = () => {
    if (testResults) {
      const passedTestsSum = testResults.testCases.reduce(
        (passed: number, result: any) => {
          return passed + (result.passed ? 1 : 0)
        },
        0,
      )
      return Math.round((passedTestsSum / testResults.testCases.length) * 100)
    }

    return 0
  }

  const running =
    editorState === EditorState.ExecutingCode ||
    editorState === EditorState.WaitingInput

  return (
    <OutputTitleBox
      inputRequested={editorState === EditorState.WaitingInput}
      container
      item
      direction="row"
      alignItems="center"
      justify="space-between"
    >
      <Grid item xs={2}>
        <OutputTitleText>{getTitleText()}</OutputTitleText>
      </Grid>
      {editorState === EditorState.Submitting ? (
        <Grid item xs={5}>
          <TestProgressBar
            percentage={fakePercentage()}
            title={t("submittingToServer")}
          />
        </Grid>
      ) : null}
      {testResults && (
        <Grid item xs={5}>
          <TestProgressBar
            percentage={passedTestsPercentage()}
            title={t("testsPassed")}
          />
        </Grid>
      )}
      <Grid
        container
        item
        xs={running ? 6 : 4}
        alignItems="center"
        justify="flex-end"
      >
        {getStatusIcon()}
        <StatusText>{getStatusText()}</StatusText>
        {hasErrors || testResults?.testCases?.some((test) => !test.passed) ? (
          <MarginedButton
            onClick={showHelp}
            variant="contained"
            disabled={
              !allowSubmitting ||
              editorState === EditorState.ShowHelp ||
              editorState === EditorState.SubmittingToPaste ||
              editorState === EditorState.ShowPasteResults
            }
            data-cy="need-help-btn"
          >
            {t("needHelp")}
          </MarginedButton>
        ) : null}
        {running || testResults || hasErrors ? null : (
          <MarginedButton
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !allowSubmitting ||
              editorState === EditorState.ExecutingCode ||
              editorState === EditorState.RunAborted ||
              editorState === EditorState.Submitting
            }
            data-cy="submit-btn"
          >
            {t("button.submit")}
          </MarginedButton>
        )}
        <MarginedButton
          onClick={closeOutput}
          variant="contained"
          disabled={editorState === EditorState.Submitting}
          data-cy="close-btn"
        >
          {t("button.close")}
        </MarginedButton>
      </Grid>
    </OutputTitleBox>
  )
}

export default OutputTitle
