import React from "react"
import styled from "styled-components"
import { Typography } from "@material-ui/core"

type TestProgressBarProps = {
  percentage: number
  title: string
}

const ProgressBarBackground = styled.div`
  background-color: #b6bce2;
  width: 100%;
  height: 25px;
  overflow: hidden;
  text-align: center;
  position: relative;
  border-radius: 1px;
`

interface ProgressBarProps {
  value: number
}

const ProgressBar = styled.div<ProgressBarProps>`
  background-color: #3f51b5;
  width: ${props => (props.value ? props.value : 0)}%;
  height: 25px;
`

const ProgressBarText = styled(Typography)`
  width: 100%;
  color: white;
  z-index: 1;
  display: block;
  position: absolute;
`

const TestProgressBar: React.FunctionComponent<TestProgressBarProps> = ({
  percentage,
  title,
}) => {
  if (!percentage && percentage !== 0) return null

  return (
    <>
      <Typography align="center">{title}</Typography>
      <ProgressBarBackground>
        <ProgressBarText variant="button">{percentage}%</ProgressBarText>
        <ProgressBar value={percentage} />
      </ProgressBarBackground>
    </>
  )
}

export default TestProgressBar
