import React, { useState } from "react"
import styled from "styled-components"
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@material-ui/core"

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
    <StyledPaper passed={passed}>
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

  if (!results || results.length === 0) return null

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
              />
            }
          />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default TestResults
