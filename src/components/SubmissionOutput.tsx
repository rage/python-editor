import { CircularProgress } from "@material-ui/core"
import React, { useEffect, useState } from "react"
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
  } = props
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

  const fakePercentage = (progress: number) => {
    const fake = progress / 100
    return Math.min(
      Math.round(300 * Math.pow(fake, 2) - 200 * Math.pow(fake, 3)),
      99,
    )
  }

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
        <TestResults
          results={testResults}
          showAllTests={testResults.allTestsPassed ?? false}
        />
      </OutputBody>
      <OutputFooterWithPercentage
        color={OutputHeaderColor.Gray}
        percentage={submitting ? fakePercentage(percentage) : percentage}
        percentageTitle={
          submitting ? t("submittingToServer") : t("testsPassed")
        }
        title={submitting ? t("outputTitle") : t("testResults")}
        showAll={testResults.allTestsPassed ?? false}
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
