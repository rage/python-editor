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
    props.height ? props.height : "200px"};
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
  animation: ${(props) => (props.open ? show : hide)} 0.3s ease-in-out;
  bottom: 0;
  border: 4px 4px 0px 0px;
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
    <ContainerBox height={outputHeight} data-cy="output-container">
      <AnimatedOutputBox open={open} onAnimationEnd={onAnimationEnd}>
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
          />
        </Grid>
      </AnimatedOutputBox>
    </ContainerBox>
  )
}

export default Output
