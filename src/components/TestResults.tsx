import React from "react"
import styled from "styled-components"
import { Paper, Typography } from "@material-ui/core"

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
  const passedTests = results.reduce((passed: number, result: any) => {
    return passed + (result.passed ? 1 : 0)
  }, 0)
  const resultSummary = `Test results: ${passedTests}/${results.length} tests passed!`
  const mappedResults = results.map(r => (
    <TestResult
      key={r.id}
      testName={r.testName}
      passed={r.passed}
      feedback={r.feedback}
    />
  ))
  return (
    <div>
      {resultSummary}
      {mappedResults}
    </div>
  )
}

export default TestResults
