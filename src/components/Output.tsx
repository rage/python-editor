import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { Button, Paper, Grid, Typography, TextField } from "@material-ui/core"

type OutputProps = {
  outputText: { id: string; type: string; text: string }[]
  clearOutput: () => void
  inputRequested: boolean
  sendInput: (input: string) => void
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
  padding: 10px;
  border-radius: 3px 3px 0 0;
`

const OutputTitle = styled(Typography)`
  && {
    font-size: 1.62rem;
    display: inline-block;
  }
`

const FloatedButton = styled(Button)`
  float: right;
  display: inline-block;
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

const Output: React.FunctionComponent<OutputProps> = props => {
  const [render, setRender] = useState(false)
  const [open, setOpen] = useState(true)
  const { outputText, clearOutput, inputRequested, sendInput } = props

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
  }, [inputRequested, outputText])

  useEffect(() => {
    if (outputText.length > 0 && !render) {
      setRender(true)
      if (!open) setOpen(true)
    }
  }, [outputText])

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

  const outputElems = outputText.map(output =>
    output.type !== "input" ? (
      <React.Fragment key={output.id}>{output.text}</React.Fragment>
    ) : (
      <StyledUserInput key={output.id}>{output.text}</StyledUserInput>
    ),
  )

  return (
    <ContainerBox data-cy="output-container">
      <AnimatedOutputBox open={open} onAnimationEnd={onAnimationEnd}>
        <Grid container direction="column">
          <OutputTitleBox inputRequested={inputRequested} item>
            <OutputTitle>
              Output {inputRequested && "(Waiting for input)"}
            </OutputTitle>
            <FloatedButton
              onClick={closeOutput}
              variant="contained"
              data-cy="close-btn"
            >
              Close
            </FloatedButton>
          </OutputTitleBox>
          <StyledOutput item ref={outputRef}>
            {outputElems}
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
