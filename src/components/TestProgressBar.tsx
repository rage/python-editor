import React from "react"
import styled from "styled-components"
import { Typography } from "@material-ui/core"

type TestProgressBarProps = {
  percentage: number
}

const ProgressBarBackground = styled.div`
  background-color: #b6bce2;
  width: 100%;
  height: 25px;
  overflow: hidden;
  text-align: center;
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
  padding: 2px;
  position: relative;
  z-index: 1;
  color: white;
`

const TestProgressBar: React.FunctionComponent<TestProgressBarProps> = ({
  percentage,
}) => {
  if (!percentage) return null

  return (
    <div>
      <Typography style={{ textAlign: "center", paddingRight: "2px" }}>
        Tests passed
      </Typography>
      <ProgressBarBackground>
        <ProgressBar value={percentage}>
          <ProgressBarText variant="button">{percentage}%</ProgressBarText>
        </ProgressBar>
      </ProgressBarBackground>
    </div>
  )
}

export default TestProgressBar
