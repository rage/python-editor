import React, { useState } from "react"
import styled from "styled-components"
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core"
import TestProgressBar from "./TestProgressBar"

type TestResultsProps = {
  results: {
    id: string
    testName: string
    passed: boolean
    feedback: string
  }[]
}

type TestResultProps = {
  testName: string
  passed: boolean
  feedback: string
}

const StyledPaper = styled(({ passed, ...props }) => <Paper {...props} />)`
  border-left: 10px solid ${({ passed }) => (passed ? "#4caf50" : "#f44336")};
  margin: 5px;
  padding: 10px;
`

const StyledTestHeader = styled(({ passed, ...props }) => (
  <Typography {...props} />
))`
  color: ${({ passed }) => (passed ? "#4caf50" : "#f44336")};
  font-weight: 700;
`

const TestResult: React.FunctionComponent<TestResultProps> = ({
  testName,
  passed,
  feedback,
}) => {
  const passStatus = passed ? "PASS" : "FAIL"
  return (
    <StyledPaper passed={passed}>
      <StyledTestHeader passed={passed}>
        {passStatus}: {testName}
      </StyledTestHeader>
      <Typography>{feedback}</Typography>
    </StyledPaper>
  )
}

const TestResults: React.FunctionComponent<TestResultsProps> = ({
  results,
}) => {
  const [showAll, setShowAll] = useState(false)
  const passedTestsSum = results.reduce((passed: number, result: any) => {
    return passed + (result.passed ? 1 : 0)
  }, 0)
  const passedTestsPercentage = Math.round(
    (passedTestsSum / results.length) * 100,
  )

  const showResults = () => {
    if (!showAll) {
      const failedTest = results.find(result => result.passed === false)
      return failedTest ? (
        <TestResult
          key={failedTest.id}
          testName={failedTest.testName}
          passed={failedTest.passed}
          feedback={failedTest.feedback}
        />
      ) : null
    }

    return results.map(r => (
      <TestResult
        key={r.id}
        testName={r.testName}
        passed={r.passed}
        feedback={r.feedback}
      />
    ))
  }

  return (
    <div>
      <Typography style={{ fontSize: "20" }}>Test Results</Typography>
      <FormControlLabel
        style={{ float: "right" }}
        label="Show all"
        control={
          <Checkbox
            checked={showAll}
            onChange={() => setShowAll(!showAll)}
            color="primary"
          />
        }
      />
      <TestProgressBar percentage={passedTestsPercentage} />
      {showResults()}
    </div>
  )
}

export default TestResults
