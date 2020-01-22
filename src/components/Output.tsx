import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { Button, Paper, Grid, Typography } from "@material-ui/core"

type OutputProps = {
  outputText: string
  clearOutput: () => void
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

const OutputTitleBox = styled(Grid)`
  background-color: #2196f3;
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
  const { outputText, clearOutput } = props

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

  if (!render) return null

  return (
    <ContainerBox>
      <AnimatedOutputBox open={open} onAnimationEnd={onAnimationEnd}>
        <Grid container direction="column">
          <OutputTitleBox item>
            <OutputTitle>Output</OutputTitle>
            <FloatedButton onClick={closeOutput} variant="contained">
              Close
            </FloatedButton>
          </OutputTitleBox>
          <StyledOutput item>{outputText}</StyledOutput>
        </Grid>
      </AnimatedOutputBox>
    </ContainerBox>
  )
}

export default Output
