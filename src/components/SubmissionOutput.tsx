import { CircularProgress } from "@material-ui/core"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
import Help from "./Help"
import {
  OutputBody,
  OutputBox,
  OutputButton,
  OutputHeaderColor,
  OutputHeaderText,
  OutputFooterWithPercentage,
  OutputHeader,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"
import TestResults from "./TestResults"

interface SubmissionOutputProps {
  getPasteLink: () => Promise<string>
  pasteDisabled: boolean
  onClose: () => void
  outputHeight?: string
  submitting: boolean
  testResults: TestResultObject
}

const SubmissionOutput: React.FunctionComponent<SubmissionOutputProps> = (
  props,
) => {
  const {
    getPasteLink,
    onClose,
    submitting,
    testResults,
    pasteDisabled,
    outputHeight,
  } = props
  const [t] = useTranslation()
  const [showAllTests, setShowAllTests] = useState(testResults.allTestsPassed)

  const percentage = Math.round(
    (100 * testResults.testCases.filter((x) => x.passed).length) /
      testResults.testCases.length,
  )
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  return (
    <OutputBox>
      <OutputHeader title={t("outputTitle")} color={OutputHeaderColor.Gray}>
        <Help getPasteUrl={getPasteLink} pasteDisabled={pasteDisabled} />
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
        color={OutputHeaderColor.Gray}
        percentage={percentage}
        percentageTitle={
          submitting ? t("submittingToServer") : t("testsPassed")
        }
        title={submitting ? t("outputTitle") : t("testResults")}
        showAll={showAllTests}
        setShowAll={setShowAllTests}
      >
        {submitting && (
          <>
            <CircularProgress size={25} color="inherit" disableShrink />
            <OutputHeaderText>{t("submitting")}</OutputHeaderText>
          </>
        )}
      </OutputFooterWithPercentage>
    </OutputBox>
  )
}

export default SubmissionOutput
