import { CircularProgress } from "@material-ui/core"
import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { TestResultObject } from "../types"
import {
  OutputBody,
  OutputBox,
  OutputHeaderButton,
  OutputHeaderColor,
  OutputHeaderText,
  OutputHeaderWithPercentage,
} from "./OutputBox"
import TestResults from "./TestResults"

interface SubmissionOutputProps {
  onClose: () => void
  outputHeight?: string
  submitting: boolean
  testResults: TestResultObject
}

const SubmissionOutput: React.FunctionComponent<SubmissionOutputProps> = (
  props,
) => {
  const { onClose, submitting, testResults } = props
  const [percentage, setPercentage] = useState(0)
  const [t] = useTranslation()

  useEffect(() => {
    if (submitting) {
      setPercentage(10 + 30 * Math.random())
      setTimeout(() => {
        setPercentage((prev) => Math.min(prev + 10, 99))
      }, 2000)
    } else {
      setPercentage(
        (100 * testResults.testCases.filter((x) => x.passed).length) /
          testResults.testCases.length,
      )
    }
  }, [submitting])

  // Do not modify, this is optimized.
  const fakePercentage = (progress: number) => {
    const fake = progress / 100
    return Math.min(
      Math.round(300 * Math.pow(fake, 2) - 200 * Math.pow(fake, 3)),
      99,
    )
  }

  return (
    <OutputBox>
      <OutputHeaderWithPercentage
        color={OutputHeaderColor.Blue}
        percentage={submitting ? fakePercentage(percentage) : percentage}
        percentageTitle={
          submitting ? t("submittingToServer") : t("testsPassed")
        }
        title={submitting ? t("outputTitle") : t("testResults")}
      >
        {submitting && (
          <>
            <CircularProgress size={25} color="inherit" disableShrink />
            <OutputHeaderText>{t("submitting")}</OutputHeaderText>
          </>
        )}
        <OutputHeaderButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeaderWithPercentage>
      <OutputBody>
        <TestResults results={testResults} />
      </OutputBody>
    </OutputBox>
  )
}

export default SubmissionOutput
