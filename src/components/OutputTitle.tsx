import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Typography, Button, Grid, CircularProgress } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import TestProgressBar from "./TestProgressBar"
import { TestResultObject } from "../types"

type OutputTitleProps = {
  testResults: TestResultObject | undefined
  inputRequested: boolean
  isRunning: boolean
  isAborted: boolean
  isSubmitting: boolean
  testing: boolean
  help: boolean
  signedIn: boolean
  hasErrors: boolean
  handleSubmit: () => void
  handleStop: () => void
  closeOutput: () => void
  showHelp: () => void
}

const StatusText = styled(Typography)`
  && {
    margin: 0 10px 0 10px;
    color: white;
  }
`

const MarginedButton = styled(Button)`
  margin: 0 3px !important;
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
    font-size: 1.1rem;
    display: inline-block;
    padding: 5px;
    color: white;
  }
`

const OutputTitle: React.FunctionComponent<OutputTitleProps> = (props) => {
  const [progress, setProgress] = useState(100)
  const {
    inputRequested,
    isRunning,
    isSubmitting,
    isAborted,
    testing,
    testResults,
    closeOutput,
    handleStop,
    showHelp,
    help,
    hasErrors,
    handleSubmit,
    signedIn,
  } = props
  const [t] = useTranslation()

  useEffect(() => {
    if (isSubmitting) {
      setProgress(35)
    }
  }, [isSubmitting])

  useEffect(() => {
    if (isSubmitting) {
      setTimeout(() => {
        setProgress((prev) => Math.min(prev + 10, 100))
      }, 2000)
    }
  }, [progress])

  const titleText = testing ? t("testResults") : t("outputTitle")

  const getStatusText = () => {
    if (isRunning) {
      return inputRequested ? t("waitingForInput") : t("running")
    } else if (isSubmitting) {
      return "Submitting"
    }
    return null
  }

  const getStatusIcon = () => {
    if (isRunning && inputRequested) {
      return <FontAwesomeIcon icon={faExclamation} />
    } else if (isRunning || isSubmitting) {
      return <CircularProgress size={25} color="inherit" disableShrink />
    }
    return null
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

  return (
    <OutputTitleBox
      inputRequested={inputRequested}
      container
      item
      direction="row"
      alignItems="center"
      justify="space-between"
    >
      <Grid item xs={2}>
        <OutputTitleText>{titleText}</OutputTitleText>
      </Grid>
      {isSubmitting ? (
        <Grid item xs={5}>
          <TestProgressBar
            percentage={fakePercentage()}
            title={t("submittingToServer")}
          />
        </Grid>
      ) : null}
      {testing ? (
        <Grid item xs={5}>
          <TestProgressBar
            percentage={passedTestsPercentage()}
            title={t("testsPassed")}
          />
        </Grid>
      ) : null}
      <Grid
        container
        item
        xs={isRunning ? 6 : 5}
        alignItems="center"
        justify="flex-end"
      >
        {getStatusIcon()}
        <StatusText>{getStatusText()}</StatusText>
        {testing || isSubmitting ? null : (
          <MarginedButton
            onClick={handleStop}
            variant="contained"
            color="secondary"
            disabled={!isRunning}
            data-cy="output-title-stop-btn"
          >
            {t("button.stop")}
          </MarginedButton>
        )}
        {testResults ? (
          testResults.testCases.some((test) => !test.passed) ? (
            <MarginedButton
              onClick={showHelp}
              variant="contained"
              disabled={isSubmitting || isRunning || help}
              data-cy="need-help-btn"
            >
              {t("needHelp")}?
            </MarginedButton>
          ) : null
        ) : null}
        {testing || isSubmitting || inputRequested ? null : (
          <MarginedButton
            onClick={handleSubmit}
            variant="contained"
            disabled={
              isSubmitting || isRunning || isAborted || !signedIn || hasErrors
            }
            data-cy="submit-btn"
          >
            {t("button.submit")}
          </MarginedButton>
        )}
        <MarginedButton
          onClick={closeOutput}
          variant="contained"
          disabled={isSubmitting}
          data-cy="close-btn"
        >
          {t("button.close")}
        </MarginedButton>
      </Grid>
    </OutputTitleBox>
  )
}

export default OutputTitle
