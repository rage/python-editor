import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { Paper, Grid } from "@material-ui/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import OutputTitle from "./OutputTitle"
import OutputContent from "./OutputContent"
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

const ContainerBox = styled.div`
  overflow: hidden;
  position: absolute;
  width: 100%;
  bottom: 0;
  min-height: 100px;
`

const show = (animateHeight: string | undefined) => keyframes`
    from {
      transform: translateY(${animateHeight ? animateHeight : "225px"});
    }

    to  {
      transform: translateY(0px);
    }
  }
`
const hide = (animateHeight: string | undefined) => keyframes`
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(${animateHeight ? animateHeight : "225px"});
  }
`

const AnimatedOutputBox = styled(Paper)<{
  open: boolean
  animateFrom: string | undefined
}>`
  animation: ${(props) =>
      props.open ? show(props.animateFrom) : hide(props.animateFrom)}
    0.2s ease-in-out;
  border: 4px 4px 0px 0px;
  position: relative;
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

const Output: React.FunctionComponent<OutputProps> = (props) => {
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

  if (!render) return null

  const outputContentIncludesErrors = outputContent.some(
    (item) => item.type === "error",
  )

  return (
    <ContainerBox data-cy="output-container">
      <AnimatedOutputBox
        animateFrom={outputHeight}
        open={open}
        onAnimationEnd={onAnimationEnd}
      >
        <Grid container direction="column">
          {!signedIn && (
            <WarningBox>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Sign in to submit exercise
            </WarningBox>
          )}
          <OutputTitle
            testResults={testResults}
            inputRequested={inputRequested}
            isRunning={isRunning}
            isAborted={isAborted}
            isSubmitting={isSubmitting}
            testing={testing}
            help={help}
            signedIn={signedIn}
            hasErrors={outputContentIncludesErrors}
            handleSubmit={handleSubmit}
            handleStop={handleStop}
            closeOutput={closeOutput}
            showHelp={showHelp}
          />
          <OutputContent
            inputRequested={inputRequested}
            outputContent={outputContent}
            help={help}
            handlePasteSubmit={handlePasteSubmit}
            pasteUrl={pasteUrl}
            sendInput={sendInput}
            testResults={testResults}
            outputHeight={outputHeight}
          />
        </Grid>
      </AnimatedOutputBox>
    </ContainerBox>
  )
}

export default Output
