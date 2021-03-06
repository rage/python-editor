import { Paper } from "@material-ui/core"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import useStyles from "../hooks/useStyles"

import { TestResultObject } from "../types"
import Help from "./Help"
import {
  OutputBox,
  OutputBody,
  OutputButton,
  OutputColor,
  OutputFooterWithPercentage,
  OutputHeader,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"
import TestResults from "./TestResults"

interface TestOutputProps {
  getPasteLink: () => Promise<string>
  onClose: () => void
  onSubmit: () => void
  outputHeight?: string
  submitDisabled?: boolean
  testResults: TestResultObject
}

const TestOutput: React.FunctionComponent<TestOutputProps> = ({
  getPasteLink,
  onClose,
  onSubmit,
  outputHeight,
  submitDisabled,
  testResults,
}) => {
  const [t] = useTranslation()
  const [showAllTests, setShowAllTests] = useState(false)
  const scrollBoxRef = React.createRef<ScrollBoxRef>()
  const classes = useStyles()

  const percentage = Math.round(
    (100 * testResults.testCases.filter((x) => x.passed).length) /
      testResults.testCases.length,
  )

  const SubmitButton: React.FunctionComponent = () => (
    <OutputButton
      disabled={submitDisabled}
      label={t("button.submit")}
      onClick={onSubmit}
      dataCy="submit-btn"
      className={classes.blueButton}
    />
  )

  return (
    <OutputBox>
      <OutputHeader title={t("testResults")} color={OutputColor.Gray}>
        <Help getPasteUrl={getPasteLink} pasteDisabled={submitDisabled} />
        <OutputButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          <TestResults results={testResults} showAllTests={showAllTests}>
            {testResults.allTestsPassed && (
              <Paper className={classes.allTestsPassedPaper}>
                <h2>{t("allTestsPassed")}</h2>
                <p>{t("rememberToSubmitToServer")}</p>
                <SubmitButton />
              </Paper>
            )}
          </TestResults>
        </ScrollBox>
      </OutputBody>
      <OutputFooterWithPercentage
        color={OutputColor.Gray}
        percentage={percentage}
        showAll={showAllTests}
        setShowAll={setShowAllTests}
        showAllDisabled={testResults.testCases.length === 1}
      >
        {!testResults.allTestsPassed && <SubmitButton />}
      </OutputFooterWithPercentage>
    </OutputBox>
  )
}

export default TestOutput
