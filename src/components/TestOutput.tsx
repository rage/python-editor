import { makeStyles } from "@material-ui/styles"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
import Help from "./Help"
import {
  OutputBox,
  OutputBody,
  OutputButton,
  OutputHeaderColor,
  OutputFooterWithPercentage,
  OutputHeader,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"
import TestResults from "./TestResults"

const useStyles = makeStyles({
  blueButton: {
    backgroundColor: "#0275d8",
    color: "white",
    "&:hover": {
      backgroundColor: "#0275d8",
    },
  },
})
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
  const [showAllTestResults, setShowAllTestResults] = useState(false)
  const scrollBoxRef = React.createRef<ScrollBoxRef>()
  const classes = useStyles()

  const percentage = Math.round(
    (100 * testResults.testCases.filter((x) => x.passed).length) /
      testResults.testCases.length,
  )

  return (
    <OutputBox>
      <OutputHeader title={t("outputTitle")} color={OutputHeaderColor.Gray}>
        <Help getPasteUrl={getPasteLink} pasteDisabled={submitDisabled} />
        <OutputButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          <TestResults
            results={testResults}
            showAllTests={showAllTestResults}
          />
        </ScrollBox>
      </OutputBody>
      <OutputFooterWithPercentage
        color={OutputHeaderColor.Gray}
        percentage={percentage}
        percentageTitle={t("testsPassed")}
        title={t("testResults")}
        showAll={showAllTestResults}
        setShowAll={setShowAllTestResults}
      >
        <OutputButton
          disabled={submitDisabled}
          label={t("button.submit")}
          onClick={onSubmit}
          dataCy="submit-btn"
          className={classes.blueButton}
        />
      </OutputFooterWithPercentage>
    </OutputBox>
  )
}

export default TestOutput
