import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
import Help from "./Help"
import {
  OutputBox,
  OutputBody,
  OutputHeaderButton,
  OutputHeaderColor,
  OutputHeaderWithPercentage,
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
  const [showHelp, setShowHelp] = useState(false)
  const [t] = useTranslation()
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  const percentage =
    (100 * testResults.testCases.filter((x) => x.passed).length) /
    testResults.testCases.length

  return (
    <OutputBox>
      <OutputHeaderWithPercentage
        color={OutputHeaderColor.Blue}
        percentage={percentage}
        percentageTitle={t("testsPassed")}
        title={t("testResults")}
      >
        <OutputHeaderButton
          disabled={submitDisabled}
          label={t("needHelp")}
          onClick={() => setShowHelp(true)}
          dataCy="need-help-btn"
        />
        <OutputHeaderButton
          disabled={submitDisabled}
          label={t("button.submit")}
          onClick={onSubmit}
          dataCy="submit-btn"
        />
        <OutputHeaderButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeaderWithPercentage>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          <TestResults results={testResults} />
          {showHelp && <Help getPasteUrl={getPasteLink} />}
        </ScrollBox>
      </OutputBody>
    </OutputBox>
  )
}

export default TestOutput
