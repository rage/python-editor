import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Grid, TextField } from "@material-ui/core"
import TestResults from "./TestResults"
import Help from "./Help"
import { OutputObject, TestResultObject, EditorState } from "../types"

type OutputContentProps = {
  editorState: EditorState
  outputContent: OutputObject[]
  handlePasteSubmit: () => void
  pasteUrl: string
  sendInput: (input: string) => void
  testResults: TestResultObject | undefined
  outputHeight: string | undefined
}

interface StyledOutputProps {
  outputheight?: string
}

const StyledOutput = styled(Grid)<StyledOutputProps>`
  padding: 10px;
  display: table-cell;
  max-height: ${(props) =>
    props.outputheight && props.outputheight !== "auto"
      ? props.outputheight
      : "500px"};
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
    editorState,
    outputContent,
    handlePasteSubmit,
    pasteUrl,
    sendInput,
    testResults,
    outputHeight,
  } = props
  const [t] = useTranslation()
  const outputRef: React.RefObject<HTMLInputElement> = React.createRef()
  const userInputFieldRef: React.RefObject<HTMLInputElement> = React.createRef()

  const scrollToBottom = () => {
    if (outputRef && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }

  const scrollToTop = () => {
    if (outputRef && outputRef.current) {
      outputRef.current.scrollTop = 0
    }
  }

  const focusOnInputField = () => {
    if (userInputFieldRef && userInputFieldRef.current) {
      userInputFieldRef.current.focus()
    }
  }

  useEffect(() => {
    scrollToBottom()
    if (editorState === EditorState.WaitingInput) focusOnInputField()
  }, [editorState, outputContent])

  useEffect(() => {
    scrollToTop()
  }, [testResults])

  const keyPressOnInput = (e: any) => {
    if (e.key === "Enter" && editorState === EditorState.WaitingInput) {
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
    } else if (testResults) {
      return <TestResults results={testResults} />
    }
    return null
  }

  return (
    <StyledOutput outputheight={outputHeight} ref={outputRef}>
      {(editorState === EditorState.ShowHelp ||
        editorState === EditorState.SubmittingToPaste ||
        editorState === EditorState.ShowPasteResults) && (
        <Help handlePasteSubmit={handlePasteSubmit} pasteUrl={pasteUrl} />
      )}
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {showOutput()}
      </pre>
      {editorState === EditorState.WaitingInput && (
        <TextField
          inputRef={userInputFieldRef}
          label={t("enterInputAndPressEnter")}
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
