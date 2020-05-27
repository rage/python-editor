import React, { useEffect } from "react"
import styled from "styled-components"
import { Grid, TextField } from "@material-ui/core"
import TestResults from "./TestResults"
import Help from "./Help"
import { OutputObject, TestResultObject } from "../types"

type OutputContentProps = {
  inputRequested: boolean
  outputContent: OutputObject[]
  help: boolean
  handlePasteSubmit: () => void
  pasteUrl: string
  sendInput: (input: string) => void
  testResults: TestResultObject | undefined
  outputHeight: string | undefined
}

interface StyledOutputProps {
  height?: string
}

const StyledOutput = styled(Grid)`
  padding: 10px;
  display: table-cell;
  max-height: ${(props: StyledOutputProps) =>
    props.height ? props.height : "175px"};
  min-height: 100px;
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

const OutputContent: React.FunctionComponent<OutputContentProps> = (props) => {
  const {
    inputRequested,
    outputContent,
    help,
    handlePasteSubmit,
    pasteUrl,
    sendInput,
    testResults,
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

  const keyPressOnInput = (e: any) => {
    if (e.key === "Enter" && inputRequested) {
      sendInput(e.target.value)
    }
  }

  const showOutput = () => {
    if (outputContent && outputContent.length > 0) {
      return outputContent.map((output) =>
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

  return (
    <StyledOutput height={outputHeight} item ref={outputRef}>
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
  )
}

export default OutputContent
