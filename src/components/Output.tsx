import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { Paper, Grid, TextField } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import TestResults from "./TestResults"
import OutputTitle from "./OutputTitle"
import Help from "./Help"
import { OutputObject, TestResultObject } from "../types"

type OutputProps = {
  outputContent: OutputObject[]
  testResults: TestResultObject | undefined
  clearOutput: () => void
  inputRequested: boolean
  sendInput: (input: string) => void
  isRunning: boolean
  isAborted: boolean
  handleSubmit: () => void
  handlePasteSubmit: () => void
  pasteUrl: string
  isSubmitting: boolean
  handleStop: () => void
  testing: boolean
  signedIn: boolean
  outputHeight: string | undefined
}

interface ContainerBoxProps {
  height?: string
}

const ContainerBox = styled.div`
  overflow: hidden;
  position: absolute;
  width: 100%;
  bottom: 0;
  max-height: 500px;
  min-height: 200px;
  height: ${(props: ContainerBoxProps) =>
    props.height ? props.height : "250px"};
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
  position: absolute;
  height: 100%;
  width: 100%;
`

const WarningBox = styled(Grid)`
  background-color: #ff9800;
  color: white;
  border-radius: 3px 3px 0 0;
  padding: 8px;
  font-size: 1.25rem;
`

const StyledOutput = styled(Grid)`
  padding: 10px;
  max-height: 500px;
  height: 175px;
  min-height: 150px;
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

const Output: React.FunctionComponent<OutputProps> = props => {
  const [render, setRender] = useState(false)
  const [open, setOpen] = useState(true)
  const [help, setShowHelp] = useState(false)
  const {
    outputContent,
    testResults,
    clearOutput,
    inputRequested,
    sendInput,
    isRunning,
    isAborted,
    handleSubmit,
    handlePasteSubmit,
    pasteUrl,
    isSubmitting,
    handleStop,
    testing,
    signedIn,
    outputHeight,
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
    setShowHelp(false)
    if (isRunning && !render) {
      setRender(true)
      if (!open) setOpen(true)
    }
  }, [isRunning])

  const closeOutput = () => {
    setOpen(false)
  }

  const showHelp = () => {
    setShowHelp(true)
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
    } else if (help) {
      return <Help handlePasteSubmit={handlePasteSubmit} pasteUrl={pasteUrl} />
    } else if (testResults) {
      return <TestResults results={testResults} />
    }

    return null
  }

  const outputContentIncludesErrors = outputContent.some(
    item => item.type === "error",
  )

  return (
    <ContainerBox height={outputHeight} data-cy="output-container">
      <AnimatedOutputBox open={open} onAnimationEnd={onAnimationEnd}>
        <Grid container direction="column">
          {!signedIn && (
            <WarningBox>
              <FontAwesomeIcon icon={faExclamationTriangle} /> Sign in to submit
              exercise
            </WarningBox>
          )}
          <OutputTitle
            inputRequested={inputRequested}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            isAborted={isAborted}
            testing={testing}
            testResults={testResults}
            closeOutput={closeOutput}
            handleStop={handleStop}
            showHelp={showHelp}
            help={help}
            handleSubmit={handleSubmit}
            signedIn={signedIn}
            hasErrors={outputContentIncludesErrors}
          />
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
