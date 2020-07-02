import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Typography, Button, Grid, CircularProgress } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import TestProgressBar from "./TestProgressBar"
import { TestResultObject, EditorState } from "../types"

type OutputTitleProps = {
  closeOutput: () => void
  editorState: EditorState
  expired?: boolean
  handleSubmit: () => void
  hasErrors: boolean
  showHelp: () => void
  signedIn: boolean
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
    closeOutput,
    editorState,
    expired,
    handleSubmit,
    hasErrors,
    showHelp,
    signedIn,
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
      case EditorState.Running:
        return t("running")
      case EditorState.RunningWaitingInput:
        return t("waitingForInput")
      case EditorState.Submitting:
        return t("submitting")
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    switch (editorState) {
      case EditorState.RunningWaitingInput:
        return <FontAwesomeIcon icon={faExclamation} />
      case EditorState.Running:
      case EditorState.Submitting:
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
    editorState === EditorState.Running ||
    editorState === EditorState.RunningWaitingInput

  return (
    <OutputTitleBox
      inputRequested={editorState === EditorState.RunningWaitingInput}
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
              editorState === EditorState.ShowHelp ||
              editorState === EditorState.SubmittingToPaste ||
              editorState === EditorState.ShowPasteResults
            }
            data-cy="need-help-btn"
          >
            {t("needHelp")}
          </MarginedButton>
        ) : null}
        {testResults || running || hasErrors ? null : (
          <MarginedButton
            onClick={handleSubmit}
            variant="contained"
            disabled={
              editorState === EditorState.Running ||
              editorState === EditorState.RunAborted ||
              editorState === EditorState.Submitting ||
              !signedIn ||
              hasErrors ||
              expired
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
