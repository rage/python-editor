import React from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
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
  onClose: () => void
  onSubmit: () => void
  outputHeight?: string
  testResults: TestResultObject
}

const TestOutput: React.FunctionComponent<TestOutputProps> = (props) => {
  const { onClose, onSubmit, outputHeight, testResults } = props
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
        </ScrollBox>
      </OutputBody>
    </OutputBox>
  )
}

export default TestOutput
