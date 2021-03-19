import { DateTime } from "luxon"
import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useTime } from "../hooks/customHooks"
import {
  TestResultObject,
  Language,
  ExerciseDetails,
  FileEntry,
  LocalStorageContent,
} from "../types"
import { ProgrammingExercise, defaultFile } from "./ProgrammingExercise"
import {
  getExerciseDetails,
  getExerciseZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
  getLatestSubmissionZip,
  getLatestSubmissionDetails,
} from "../services/programming_exercise"
import { extractExerciseArchive } from "../services/patch_exercise"
import Notification from "./Notification"
import JSZip from "jszip"

interface ProgrammingExerciseLoaderProps {
  onExerciseDetailsChange?: (exerciseDetails?: ExerciseDetails) => void
  organization: string
  course: string
  exercise: string
  token: string
  username?: string
  height?: string
  outputHeight?: string
  debug?: boolean
  language?: Language
}

/*  Loads the ProgrammingExercise from the server. Then returns a ProgrammingExercise component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const ProgrammingExerciseLoader: React.FunctionComponent<ProgrammingExerciseLoaderProps> = ({
  onExerciseDetailsChange,
  organization,
  course,
  exercise,
  token,
  username,
  height,
  outputHeight,
  debug,
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
    const wrapError = (message: string) => [
      {
        ...defaultFile,
        content: `# ${message}`,
      },
    ]

    let detailsResult: ExerciseDetails
    try {
      detailsResult = await getExerciseDetails(
        organization,
        course,
        exercise,
        apiConfig,
      )
    } catch (e) {
      setExerciseDetails(undefined)
      setSrcFiles(wrapError(e.message))
      return
    }
    setExerciseDetails(detailsResult)

    if (!detailsResult.unlocked) {
      setSrcFiles(wrapError(t("exerciseNotYetUnlocked")))
      return
    }

    let downloadResult: JSZip
    try {
      downloadResult = await getExerciseZip(
        organization,
        course,
        exercise,
        apiConfig,
      )
    } catch (e) {
      setSrcFiles(wrapError(e.message))
      return
    }

    const template = await extractExerciseArchive(downloadResult, apiConfig)
    setProblems(template.problems)
    setTestSource(template.testSource)

    if (!hasToken) {
      setSrcFiles(template.srcFiles)
      return
    }

    const tryToSetContentFromLocalStorage = () => {
      template.srcFiles.forEach((file: FileEntry) => {
        const localStorageFile = localStorage.getItem(file.fullName)
        if (localStorageFile) {
          const localStorageData: LocalStorageContent = JSON.parse(
            localStorageFile,
          )
          file.content = localStorageData.content
        }
      })
    }

    try {
      const submissionDetails = await getLatestSubmissionDetails(
        detailsResult.id,
        apiConfig,
      )
      const useLocalStorage = template.srcFiles.some((file) => {
        const localStorageFile = localStorage.getItem(file.fullName)
        if (localStorageFile) {
          const localStorageData: LocalStorageContent = JSON.parse(
            localStorageFile,
          )
          if (
            localStorageData.createdAtMillis > submissionDetails.createdAtMillis
          ) {
            return true
          }
        }
      })
      if (useLocalStorage) {
        tryToSetContentFromLocalStorage()
        setSrcFiles(template.srcFiles)
        return
      }
      const submissionResult = await getLatestSubmissionZip(
        submissionDetails.id,
        apiConfig,
      )

      const submission = await extractExerciseArchive(
        submissionResult,
        apiConfig,
      )
      if (submission.srcFiles.length > 0) {
        submission.srcFiles.forEach((file: FileEntry) => {
          const templateFile = template.srcFiles.find(
            (f) => f.fullName === file.fullName,
          )
          if (templateFile) {
            file.originalContent = templateFile.originalContent
          }
        })
        setSrcFiles(submission.srcFiles)
        return
      }

      tryToSetContentFromLocalStorage()
      setSrcFiles(template.srcFiles)
    } catch (e) {
      tryToSetContentFromLocalStorage()
      setSrcFiles(template.srcFiles)
    }
  }

  const submitAndWaitResult = async (files: Array<FileEntry>) => {
    const wrapError = (message: string): TestResultObject => ({
      points: [],
      testCases: [
        {
          id: "0",
          testName: "Exercise submission",
          passed: false,
          feedback: `Error ${message}`,
        },
      ],
    })
    if (!exerciseDetails) {
      return wrapError("418: Exercise details missing")
    }

    try {
      const postResult = await postExerciseSubmission(
        exerciseDetails.id,
        files,
        apiConfig,
      )
      try {
        const submissionResult = await getSubmissionResults(
          postResult,
          apiConfig,
        )
        getExerciseDetails(
          organization,
          course,
          exercise,
          apiConfig,
        ).then((result) => setExerciseDetails(result))
        return submissionResult
      } catch (e) {
        setExerciseDetails(undefined)
        return wrapError(e.message)
      }
    } catch (e) {
      return wrapError(e.message)
    }
  }

  const submitToPaste = async (files: FileEntry[]): Promise<string> => {
    if (!exerciseDetails) {
      return ""
    }
    try {
      const submitResult = await postExerciseSubmission(
        exerciseDetails.id,
        files,
        apiConfig,
        { paste: true },
      )
      return submitResult.pasteUrl ?? ""
    } catch (e) {
      return Promise.reject(e.message)
    }
  }

  const resetExerciseToOriginalContent = async () => {
    srcFiles.forEach((file: FileEntry) => {
      file.content = file.originalContent
      localStorage.removeItem(file.fullName)
    })
  }

  useEffect(() => {
    if (
      exerciseDetails &&
      exerciseDetails.deadline &&
      !exerciseDetails.expired &&
      time >= DateTime.fromISO(exerciseDetails.deadline)
    ) {
      getExerciseDetails(organization, course, exercise, apiConfig)
        .then((result) => setExerciseDetails(result))
        .catch()
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
  }, [token, organization, course, exercise])

  return (
    <div>
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
        resetExercise={resetExerciseToOriginalContent}
        editorHeight={height}
        outputHeight={outputHeight}
        solutionUrl={
          exerciseDetails?.completed || exerciseDetails?.expired
            ? `https://tmc.mooc.fi/exercises/${exerciseDetails.id}/solution`
            : undefined
        }
        ready={ready}
      />
    </div>
  )
}

export { ProgrammingExerciseLoader, ProgrammingExerciseLoaderProps }
