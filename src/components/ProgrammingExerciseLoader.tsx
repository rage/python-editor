import { DateTime } from "luxon"
import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useTime } from "../hooks/customHooks"
import {
  TestResultObject,
  Language,
  ExerciseDetails,
  FileEntry,
} from "../types"
import { ProgrammingExercise, defaultFile } from "./ProgrammingExercise"
import {
  getExerciseDetails,
  getExerciseZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
  getLatestSubmissionZip,
} from "../services/programming_exercise"
import { extractExerciseArchive } from "../services/patch_exercise"
import Notification from "./Notification"
import styled from "styled-components"
import { Button, Grid } from "@material-ui/core"

type ProgrammingExerciseLoaderProps = {
  onExerciseDetailsChange?: (exerciseDetails?: ExerciseDetails) => void
  organization: string
  course: string
  debug?: boolean
  exercise: string
  token: string
  height?: string
  outputHeight?: string
  language?: Language
}

const ModelSolutionButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  float: right;
`

/*  Loads the ProgrammingExercise from the server. Then returns a ProgrammingExercise component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const ProgrammingExerciseLoader: React.FunctionComponent<ProgrammingExerciseLoaderProps> = ({
  onExerciseDetailsChange,
  organization,
  course,
  debug,
  exercise,
  token,
  height,
  outputHeight,
  language = "en",
}) => {
  const time = useTime(10000)
  const [t, i18n] = useTranslation()
  const [ready, setReady] = useState(false)
  const [problems, setProblems] = useState<string[] | undefined>(undefined)
  const [srcFiles, setSrcFiles] = useState([defaultFile])
  const [testSource, setTestSource] = useState<string | undefined>()
  const [signedIn, setSignedIn] = useState(false)
  const [exerciseDetails, setExerciseDetails] = useState<
    ExerciseDetails | undefined
  >()
  const apiConfig = { t, token }

  const loadExercises = async (hasToken: boolean) => {
    const wrapError = (status: number, message: string) => [
      {
        ...defaultFile,
        content: `# ${status}: ${message}`,
      },
    ]

    setExerciseDetails(undefined)
    const downloadResult = await getExerciseZip(
      organization,
      course,
      exercise,
      apiConfig,
    )
    if (downloadResult.err) {
      setSrcFiles(
        wrapError(downloadResult.val.status, downloadResult.val.message),
      )
      return
    }

    const template = await extractExerciseArchive(downloadResult.val, apiConfig)
    setProblems(template.problems)
    setTestSource(template.testSource)

    const detailsResult = await getExerciseDetails(
      organization,
      course,
      exercise,
      apiConfig,
    )
    if (detailsResult.err) {
      setSrcFiles(
        wrapError(detailsResult.val.status, detailsResult.val.message),
      )
      return
    }
    setExerciseDetails(detailsResult.val)

    if (!hasToken) {
      setSrcFiles(template.srcFiles)
      return
    }

    try {
      const submissionResult = await getLatestSubmissionZip(
        detailsResult.val.id,
        apiConfig,
      )
      if (submissionResult.ok && submissionResult.val) {
        const submission = await extractExerciseArchive(
          submissionResult.val,
          apiConfig,
        )
        if (submission.srcFiles.length > 0) {
          setSrcFiles(submission.srcFiles)
        }
      }
      setSrcFiles(template.srcFiles)
    } catch (e) {
      setSrcFiles(template.srcFiles)
    }
  }

  const submitAndWaitResult = async (files: Array<FileEntry>) => {
    const wrapError = (status: number, message: string): TestResultObject => ({
      points: [],
      testCases: [
        {
          id: "0",
          testName: "Exercise submission",
          passed: false,
          feedback: `Error ${status}: ${message}`,
        },
      ],
    })
    if (!exerciseDetails) {
      return wrapError(418, "Exercise details missing")
    }
    const postResult = await postExerciseSubmission(
      exerciseDetails.id,
      files,
      apiConfig,
    )
    if (postResult.err) {
      return wrapError(postResult.val.status, postResult.val.message)
    }
    const submissionResult = await getSubmissionResults(
      postResult.val,
      apiConfig,
    )
    if (submissionResult.err) {
      return wrapError(
        submissionResult.val.status,
        submissionResult.val.message,
      )
    }
    getExerciseDetails(
      organization,
      course,
      exercise,
      apiConfig,
    ).then((result) => setExerciseDetails(result.ok ? result.val : undefined))
    return submissionResult.val
  }

  const submitToPaste = async (files: FileEntry[]): Promise<string> => {
    if (!exerciseDetails) {
      return ""
    }
    const submitResult = await postExerciseSubmission(
      exerciseDetails.id,
      files,
      apiConfig,
      { paste: true },
    )
    // Remap to avoid dependency to `ts-results`.
    return submitResult
      .map((x) => Promise.resolve(x.pasteUrl ?? ""))
      .mapErr((x) => Promise.reject(x.message)).val
  }

  useEffect(() => {
    if (
      exerciseDetails &&
      exerciseDetails.deadline &&
      !exerciseDetails.expired &&
      time >= DateTime.fromISO(exerciseDetails.deadline)
    ) {
      getExerciseDetails(organization, course, exercise, apiConfig).then(
        (result) => result.ok && setExerciseDetails(result.val),
      )
    }
  }, [time])

  useEffect(() => {
    onExerciseDetailsChange?.(exerciseDetails)
  }, [exerciseDetails])

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  useEffect(() => {
    setReady(false)
    const hasToken = token !== "" && token !== null
    setSignedIn(hasToken)
    loadExercises(hasToken).finally(() => setReady(true))
  }, [token])

  return (
    <div>
      {(exerciseDetails?.completed || exerciseDetails?.expired) && (
        <Grid container direction="row" justify="space-between">
          <Grid item xs={12}>
            <ModelSolutionButton
              onClick={() =>
                window.open(
                  `https://tmc.mooc.fi/exercises/${exerciseDetails.id}/solution`,
                  "_blank",
                )
              }
            >
              {t("modelSolution")}
            </ModelSolutionButton>
          </Grid>
        </Grid>
      )}
      {!signedIn && (
        <Notification style="warning">
          {t("signInToSubmitExercise")}
        </Notification>
      )}
      {exerciseDetails?.expired && (
        <Notification style="warning">{t("deadlineExpired")}</Notification>
      )}
      <ProgrammingExercise
        debug={debug}
        initialFiles={srcFiles}
        problems={problems}
        submitFeedback={(testResults, feedback) => {
          if (testResults.feedbackAnswerUrl && feedback.length > 0) {
            postExerciseFeedback(testResults, feedback, apiConfig)
          }
        }}
        testSource={testSource}
        submitProgrammingExercise={submitAndWaitResult}
        submitToPaste={submitToPaste}
        submitDisabled={exerciseDetails?.expired || !signedIn}
        editorHeight={height}
        outputHeight={outputHeight}
        ready={ready}
      />
    </div>
  )
}

export { ProgrammingExerciseLoader, ProgrammingExerciseLoaderProps }
