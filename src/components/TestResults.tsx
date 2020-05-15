import React, { useState } from "react"
import styled from "styled-components"
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@material-ui/core"
import { TestResultObject } from "../types"

type TestResultsProps = {
  results: TestResultObject
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
  const passStatus = passed ? "PASS" : "FAIL"
  return (
    <StyledPaper passed={passed} data-cy="test-result">
      <TestResultHeader passed={passed}>
        {passStatus}: {testName}
      </TestResultHeader>
      <Typography>{feedback}</Typography>
    </StyledPaper>
  )
}

const TestResults: React.FunctionComponent<TestResultsProps> = ({
  results,
}) => {
  const [showAll, setShowAll] = useState(false)

  const showResults = () => {
    if (!showAll) {
      const failedTest = results.testCases.filter(
        result => result.passed === false,
      )
      if (failedTest) {
        return failedTest.map(res => (
          <TestResult
            key={res.id}
            testName={res.testName}
            passed={res.passed}
            feedback={res.feedback}
          />
        ))
      } else {
        console.log("Points", results.points)
      }
    }

    return results.testCases.map(r => (
      <TestResult
        key={r.id}
        testName={r.testName}
        passed={r.passed}
        feedback={r.feedback}
      />
    ))
  }

  if (!results.testCases || results.testCases.length === 0) return null

  return (
    <Grid container direction="row" justify="space-between">
      <Grid item xs={10}>
        {showResults()}
      </Grid>
      <Grid item>
        <Paper style={{ paddingLeft: "10px" }}>
          <FormControlLabel
            label="Show all"
            control={
              <Checkbox
                checked={showAll}
                onChange={() => setShowAll(!showAll)}
                color="primary"
                data-cy="show-all-results-checkbox"
              />
            }
          />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default TestResults
