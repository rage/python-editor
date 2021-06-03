import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { TextField } from "@material-ui/core"
import { OutputObject } from "../types"
import PythonError from "./PythonError"

const StyledConsole = styled.div`
  white-space: pre-wrap;
`

const StyledUserInput = styled.span`
  background-color: #efefef;
  border-radius: 3px 3px 3px 3px;
  color: #292929;
  margin: 3px;
  padding: 3px;
`

interface ConsoleProps {
  inputRequested: boolean
  outputContent: OutputObject[]
  sendInput: (input: string) => void
  scrollToBottom: () => void
}

const Console: React.FunctionComponent<ConsoleProps> = (props) => {
  const { inputRequested, outputContent, scrollToBottom, sendInput } = props
  const [t] = useTranslation()
  const userInputFieldRef: React.RefObject<HTMLInputElement> = React.createRef()

  const focusOnInputField = () => {
    userInputFieldRef?.current?.focus()
  }

  useEffect(() => {
    scrollToBottom()
    if (inputRequested) {
      focusOnInputField()
    }
  }, [inputRequested, outputContent])

  const keyPressOnInput = (e: any) => {
    if (e.key === "Enter" && inputRequested) {
      sendInput(e.target.value)
    }
  }

  const outputMapper = (output: OutputObject) => {
    switch (output.type) {
      case "input":
        return <StyledUserInput key={output.id}>{output.text}</StyledUserInput>
      case "error":
        return (
          <PythonError
            key={output.id}
            error={output.text}
            trace={output.traceback}
          />
        )
      default:
        return <React.Fragment key={output.id}>{output.text}</React.Fragment>
    }
  }

  return (
    <StyledConsole>
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {outputContent.map(outputMapper)}
      </pre>
      {inputRequested && (
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
    </StyledConsole>
  )
}

export default Console
