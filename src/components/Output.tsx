import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { Button, Paper, Grid, Typography, TextField } from "@material-ui/core"

type OutputProps = {
  outputText: string
  clearOutput: () => void
  inputRequested: any
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

const Output: React.FunctionComponent<OutputProps> = props => {
  const [render, setRender] = useState(!!props.outputText)
  const [open, setOpen] = useState(true)
  const { outputText, clearOutput, inputRequested, sendInput } = props

  useEffect(() => {
    if (outputText && !render) {
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

  return (
    <ContainerBox>
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
          <StyledOutput item>
            {outputText}
            <div>
              {inputRequested && (
                <TextField
                  label="Enter input and press 'Enter'"
                  margin="dense"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  onKeyPress={keyPressOnInput}
                />
              )}
            </div>
          </StyledOutput>
        </Grid>
      </AnimatedOutputBox>
    </ContainerBox>
  )
}

export default Output
