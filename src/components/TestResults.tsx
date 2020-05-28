import React, { useState } from "react"
import { useTranslation } from "react-i18next"
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
type PointsProps = {
  points: string[]
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

const StyledPointsPaper = styled(({ points, ...props }) => (
  <Paper {...props} />
))`
  border-left: 10px solid #4caf50;
  margin: 5px;
  padding: 10px;
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

const Points: React.FunctionComponent<PointsProps> = ({ points }) => {
  return (
    <StyledPointsPaper points data-cy="submission-points">
      <Typography>
        {"Points gained: "} {points}
      </Typography>
    </StyledPointsPaper>
  )
}

const TestResults: React.FunctionComponent<TestResultsProps> = ({
  results,
}) => {
  const [t] = useTranslation()
  const [showAll, setShowAll] = useState(false)

  const showResults = () => {
    if (!showAll) {
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
      return <Points points={results.points} />
    }
    const points = <Points points={results.points} />
    const testResults = results.testCases.map((r) => (
      <TestResult
        key={r.id}
        testName={r.testName}
        passed={r.passed}
        feedback={r.feedback}
      />
    ))
    return (
      <>
        {results.points.length > 0 ? points : null} {testResults}
      </>
    )
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
            label={t("showAll")}
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
