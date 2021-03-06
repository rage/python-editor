import React from "react"
import styled from "styled-components"
import { Paper, Typography, Grid } from "@material-ui/core"
import { TestResultObject } from "../types"
import { removeFalseIsNotTrue } from "../services/test_parsing"

type TestResultsProps = {
  results: TestResultObject
  showAllTests: boolean
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

const TestResultHeader = styled(({ passed, ...props }) => (
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
  const nameMatch = testName.match(/(\w+)\.(\w+)$/)
  const displayName = nameMatch ? `${nameMatch[1]}: ${nameMatch[2]}` : testName
  const passStatus = passed ? "PASS" : "FAIL"
  return (
    <StyledPaper passed={passed} data-cy="test-result">
      <TestResultHeader passed={passed}>
        {passStatus}: {displayName}
      </TestResultHeader>
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {removeFalseIsNotTrue(feedback)}
      </pre>
    </StyledPaper>
  )
}

const TestResults: React.FunctionComponent<TestResultsProps> = ({
  results,
  showAllTests,
  children,
}) => {
  const showResults = () => {
    if (!showAllTests) {
      const failedTest = results.testCases.find(
        (result) => result.passed === false,
      )
      if (failedTest) {
        return (
          <TestResult
            key={failedTest.id}
            testName={failedTest.testName}
            passed={failedTest.passed}
            feedback={failedTest.feedback}
          />
        )
      }
    }
    const testResults = results.testCases.map((r) => (
      <TestResult
        key={r.id}
        testName={r.testName}
        passed={r.passed}
        feedback={r.feedback}
      />
    ))
    return <>{showAllTests && testResults}</>
  }

  if (!results.testCases || results.testCases.length === 0) return null

  return (
    <Grid container direction="row" justify="space-between">
      <Grid item xs={12}>
        {children}
        {showResults()}
      </Grid>
    </Grid>
  )
}

export default TestResults
