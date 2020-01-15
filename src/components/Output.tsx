import React from "react"
import styled from "styled-components"
import { Button, Paper, Grid, Typography } from "@material-ui/core"

type OutputProps = {
  outputText: string
  clearOutput: () => void
}

const OutputBox = styled(Paper)`
  && {
    height: 210px;
    width: 100%;
    position: absolute;
    bottom: 0;
  }
`

const OutputTitleBox = styled(Grid)`
  background-color: #2196f3;
  color: white;
  padding: 10px;
  border-radius: 3px 3px 0 0;
  box-shadow: inherit;
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
  const { outputText, clearOutput } = props
  if (!outputText || outputText.length === 0) return null

  return (
    <OutputBox>
      <Grid container direction="column">
        <OutputTitleBox item>
          <OutputTitle>Output</OutputTitle>
          <FloatedButton onClick={clearOutput} variant="contained">
            Close
          </FloatedButton>
        </OutputTitleBox>
        <StyledOutput item>{props.outputText}</StyledOutput>
      </Grid>
    </OutputBox>
  )
}

export default Output
