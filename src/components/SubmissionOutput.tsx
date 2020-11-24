import { CircularProgress } from "@material-ui/core"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
import Help from "./Help"
import {
  OutputBody,
  OutputBox,
  OutputButton,
  OutputColor,
  OutputHeaderText,
  OutputFooterWithPercentage,
  OutputHeader,
} from "./OutputBox"
import Points from "./Points"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"
import TestResults from "./TestResults"

interface SubmissionOutputProps {
  getPasteLink: () => Promise<string>
  pasteDisabled: boolean
  onClose: () => void
  outputHeight?: string
  testResults: TestResultObject
}

const SubmissionOutput: React.FunctionComponent<SubmissionOutputProps> = (
  props,
) => {
  const {
    getPasteLink,
    onClose,
    testResults,
    pasteDisabled,
    outputHeight,
  } = props
  const [t] = useTranslation()
  const [showAllTests, setShowAllTests] = useState(false)

  const percentage = Math.round(
    (100 * testResults.testCases.filter((x) => x.passed).length) /
      testResults.testCases.length,
  )
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  return (
    <OutputBox>
      <OutputHeader title={t("submissionResult")} color={OutputColor.Gray}>
        <Help getPasteUrl={getPasteLink} pasteDisabled={pasteDisabled} />
        <OutputButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          <TestResults results={testResults} showAllTests={showAllTests}>
            {testResults.points.length > 0 && (
              <Points points={testResults.points} />
            )}
          </TestResults>
        </ScrollBox>
      </OutputBody>
      <OutputFooterWithPercentage
        color={OutputColor.Gray}
        percentage={percentage}
        showAll={showAllTests}
        setShowAll={setShowAllTests}
        showAllDisabled={
          testResults.testCases.length === 1 &&
          (!testResults.allTestsPassed ?? false)
        }
      />
    </OutputBox>
  )
}

export default SubmissionOutput
