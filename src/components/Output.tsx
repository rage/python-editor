import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import {
  Button,
  Paper,
  Grid,
  Typography,
  TextField,
  CircularProgress,
} from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import TestResults from "./TestResults"
import TestProgressBar from "./TestProgressBar"
import { OutputObject, TestResultObject } from "../types"

type OutputProps = {
  outputContent: OutputObject[]
  testResults: TestResultObject[]
  clearOutput: () => void
  inputRequested: boolean
  sendInput: (input: string) => void
  isRunning: boolean
  handleSubmit: () => void
  handlePasteSubmit: () => void
  isSubmitting: boolean
  handleStop: () => void
  testing: boolean
}

const ContainerBox = styled.div`
  bottom: 0;
  height: 210px;
  overflow: hidden;
  position: absolute;
  width: 100%;
`

const show = keyframes`
    from {
      transform: translateY(210px);
    }

    to  {
      transform: translateY(0px);
    }
  }
`
const hide = keyframes`
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(210px);
  }
`

const AnimatedOutputBox = styled(Paper)<{ open: boolean }>`
  animation: ${props => (props.open ? show : hide)} 0.3s ease-in-out;
  bottom: 0;
  height: 210px;
  position: absolute;
  width: 100%;
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

const OutputTitle = styled(Typography)`
  && {
    font-size: 1.62rem;
    display: inline-block;
    padding: 5px;
  }
`

const MarginedButton = styled(Button)`
  margin: 5px;
`

const StyledOutput = styled(Grid)`
  padding: 10px;
  height: 140px;
  overflow: auto;
  white-space: pre-wrap;
`

const StyledUserInput = styled.span`
  background-color: #efefef;
  border-radius: 3px 3px 3px 3px;
  color: #292929;
  margin: 3px;
  padding: 3px;
`

const StatusText = styled(Typography)`
  margin: 10px;
`

const Output: React.FunctionComponent<OutputProps> = props => {
  const [render, setRender] = useState(false)
  const [open, setOpen] = useState(true)
  const {
    outputContent,
    testResults,
    clearOutput,
    inputRequested,
    sendInput,
    isRunning,
    handleSubmit,
    handlePasteSubmit,
    isSubmitting,
    handleStop,
    testing,
  } = props

  const outputRef: React.RefObject<HTMLInputElement> = React.createRef()
  const userInputFieldRef: React.RefObject<HTMLInputElement> = React.createRef()

  const scrollToBottom = () => {
    if (outputRef && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }

  const focusOnInputField = () => {
    if (userInputFieldRef && userInputFieldRef.current) {
      userInputFieldRef.current.focus({ preventScroll: true })
    }
  }

  useEffect(() => {
    scrollToBottom()
    if (inputRequested) focusOnInputField()
  }, [inputRequested, outputContent])

  useEffect(() => {
    if (isRunning && !render) {
      setRender(true)
      if (!open) setOpen(true)
    }
  }, [isRunning])

  const closeOutput = () => {
    setOpen(false)
  }

  const onAnimationEnd = () => {
    if (!open) {
      clearOutput()
      setRender(false)
    }
  }

  const keyPressOnInput = (e: any) => {
    if (e.key === "Enter" && inputRequested) {
      sendInput(e.target.value)
    }
  }

  if (!render) return null

  const showOutput = () => {
    if (outputContent && outputContent.length > 0) {
      return outputContent.map(output =>
        output.type === "input" ? (
          <StyledUserInput key={output.id}>{output.text}</StyledUserInput>
        ) : (
          <React.Fragment key={output.id}>{output.text}</React.Fragment>
        ),
      )
    } else if (testResults) {
      return <TestResults results={testResults} />
    }

    return null
  }

  const getStatusText = () => {
    if (isRunning) {
      return inputRequested ? "Waiting for input" : "Running"
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

  const titleText = testing ? "Test Results" : "Output"

  const passedTestsSum = testResults.reduce((passed: number, result: any) => {
    return passed + (result.passed ? 1 : 0)
  }, 0)
  const passedTestsPercentage = Math.round(
    (passedTestsSum / testResults.length) * 100,
  )

  return (
    <ContainerBox data-cy="output-container">
      <AnimatedOutputBox open={open} onAnimationEnd={onAnimationEnd}>
        <Grid container direction="column">
          <OutputTitleBox
            inputRequested={inputRequested}
            container
            item
            direction="row"
            alignItems="center"
            justify="space-between"
          >
            <Grid item xs="auto">
              <OutputTitle>{titleText}</OutputTitle>
            </Grid>
            {testing ? (
              <Grid item xs={6}>
                <TestProgressBar percentage={passedTestsPercentage} />
              </Grid>
            ) : null}
            <Grid
              container
              item
              xs={testing ? 3 : 9}
              alignItems="center"
              justify="flex-end"
            >
              {getStatusIcon()}
              <StatusText>{getStatusText()}</StatusText>
              {testing ? null : (
                <MarginedButton
                  onClick={handleStop}
                  variant="contained"
                  color="secondary"
                  disabled={!isRunning}
                  data-cy="output-title-stop-btn"
                >
                  Stop
                </MarginedButton>
              )}

              <MarginedButton
                onClick={handleSubmit}
                variant="contained"
                disabled={isSubmitting || isRunning}
                data-cy="submit-btn"
              >
                Submit solution
              </MarginedButton>
              <MarginedButton
                onClick={closeOutput}
                variant="contained"
                disabled={isSubmitting}
                data-cy="close-btn"
              >
                Close
              </MarginedButton>
            </Grid>
          </OutputTitleBox>
          <StyledOutput item ref={outputRef}>
            {showOutput()}
            {inputRequested && (
              <TextField
                inputRef={userInputFieldRef}
                label="Enter input and press 'Enter'"
                margin="dense"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                onKeyPress={keyPressOnInput}
                style={{ display: "block" }}
                data-cy="user-input-field"
              />
            )}
          </StyledOutput>
        </Grid>
      </AnimatedOutputBox>
    </ContainerBox>
  )
}

export default Output
