import { makeStyles } from "@material-ui/styles"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

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
  const [showAllTests, setShowAllTests] = useState(
    testResults.allTestsPassed ?? false,
  )
  const scrollBoxRef = React.createRef<ScrollBoxRef>()
  const classes = useStyles()

  const percentage = Math.round(
    (100 * testResults.testCases.filter((x) => x.passed).length) /
      testResults.testCases.length,
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
          <TestResults
            results={testResults}
            showAllTests={showAllTests ?? false}
          />
        </ScrollBox>
      </OutputBody>
      <OutputFooterWithPercentage
        color={OutputColor.Gray}
        percentage={percentage}
        showAll={showAllTests}
        setShowAll={setShowAllTests}
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
