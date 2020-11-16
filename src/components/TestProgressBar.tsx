import React from "react"
import styled from "styled-components"
import { LinearProgress, Typography, withStyles } from "@material-ui/core"

type TestProgressBarProps = {
  percentage: number
  title: string
}

const BorderLinearProgress = withStyles((theme) => ({
  root: {
    height: 25,
    borderRadius: 10,
  },
  colorPrimary: {
    borderRadius: 10,
  },
  bar: {
    borderRadius: 10,
    backgroundColor: "#0275d8",
  },
}))(LinearProgress)

const ProgressBarBackground = styled.div`
  width: 100%;
  height: 25px;
  overflow: hidden;
  text-align: center;
  position: relative;
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
      <ProgressBarBackground>
        <ProgressBarText variant="button">{percentage} %</ProgressBarText>
        <BorderLinearProgress variant="determinate" value={percentage} />
      </ProgressBarBackground>
    </>
  )
}

export default TestProgressBar
