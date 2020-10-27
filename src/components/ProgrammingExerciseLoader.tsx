import JSZip, { JSZipObject } from "jszip"
import { DateTime } from "luxon"
import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Result } from "ts-results"

import { useTime } from "../hooks/customHooks"
import { TestResultObject, Language, ExerciseDetails } from "../types"
import { ProgrammingExercise, defaultFile } from "./ProgrammingExercise"
import {
  getExerciseDetails,
  getExerciseZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
  getLatestSubmissionZip,
} from "../services/programming_exercise"
import { inlineAndPatchTestSources } from "../services/patch_exercise"
import Notification from "./Notification"

type ProgrammingExerciseLoaderProps = {
  onExerciseDetailsChange?: (exerciseDetails?: ExerciseDetails) => void
  organization: string
  course: string
  debug?: boolean
  exercise: string
  token: string
  height?: string
  outputHeight?: string
  outputPosition?: string
  language: Language
}

type FileEntry = {
  fullName: string
  shortName: string
  originalContent: string
  content: string
}

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
  outputPosition,
  language = "en",
}) => {
  const time = useTime(10000)
  const [t, i18n] = useTranslation()
  const [ready, setReady] = useState(false)
  const [srcFiles, setSrcFiles] = useState([defaultFile])
  const [testSource, setTestSource] = useState<string | undefined>()
  const [incompatibleMessage, setIncompatibleMessage] = useState<
    string | undefined
  >()
  const [signedIn, setSignedIn] = useState(false)
  const [exerciseDetails, setExerciseDetails] = useState<
    ExerciseDetails | undefined
  >()
  const apiConfig = { t, token }
  const mainSourceFile = "__main__.py"

  const getFileEntries = (
    zip: JSZip,
    directory: string,
    main: string | null,
  ): Promise<Array<FileEntry>> => {
    const fileSelector: RegExp = RegExp(`${directory}/\\w*\\.py$`)
    const files = orderFiles(zip.file(fileSelector), main)
    return Promise.all(files.map((f: JSZipObject) => createEntry(f)))
  }

  const orderFiles = (files: JSZipObject[], main: string | null) => {
    if (main) {
      const mainIndex = files.findIndex((file: any) => file.name.includes(main))
      if (mainIndex > -1) {
        const mainEntry = files.splice(mainIndex, 1)[0]
        files.unshift(mainEntry)
        return files
      }
    }
    return files
  }

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

    const zip = downloadResult.val
    const unzipResult = Result.all(
      await Result.wrapAsync(() => getFileEntries(zip, "src", mainSourceFile)),
      await Result.wrapAsync(() => getFileEntries(zip, "test", mainSourceFile)),
      await Result.wrapAsync(() => getFileEntries(zip, "tmc", mainSourceFile)),
    )
    if (unzipResult.err) {
      setSrcFiles(wrapError(418, t("malformedExerciseTemplate")))
      return
    }

    const [src, test, tmc] = unzipResult.val
    try {
      const inlined = inlineAndPatchTestSources(test, tmc)
      setTestSource(inlined)
    } catch (e) {
      setIncompatibleMessage(e)
    }

    if (!hasToken) {
      setSrcFiles(src)
      return
    }

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

    try {
      const submissionResult = await getLatestSubmissionZip(
        detailsResult.val.id,
        apiConfig,
      )
      if (submissionResult.ok && submissionResult.val) {
        const fileEntries = await getFileEntries(
          submissionResult.val,
          "src",
          mainSourceFile,
        )
        if (fileEntries.length > 0) {
          setSrcFiles(fileEntries)
          return
        }
      }
    } catch (e) {
      setSrcFiles(src)
    }
  }

  const createEntry = async (f: JSZipObject): Promise<FileEntry> => {
    const content = await f.async("string")
    const fullName: string = f.name
    const matches = fullName.match(/(\w+\.py)/)
    let shortName: string | null = null
    if (matches) {
      shortName = matches[0]
      return { fullName, shortName, originalContent: content, content }
    }
    return { fullName: "", shortName: "", originalContent: "", content: "" }
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
      {!signedIn && (
        <Notification style="warning">
          {t("signInToSubmitExercise")}
        </Notification>
      )}
      {incompatibleMessage && (
        <Notification style="warning">
          {`${t("incompatibleExerciseTemplate")}. ${t(
            "pleaseReportFollowingErrorToCourseInstructor",
          )}: ${incompatibleMessage}`}
        </Notification>
      )}
      {exerciseDetails?.expired && (
        <Notification style="warning">{t("deadlineExpired")}</Notification>
      )}
      <ProgrammingExercise
        debug={debug}
        initialFiles={srcFiles}
        testSource={testSource}
        submitFeedback={(testResults, feedback) => {
          if (testResults.feedbackAnswerUrl && feedback.length > 0) {
            postExerciseFeedback(testResults, feedback, apiConfig)
          }
        }}
        submitProgrammingExercise={submitAndWaitResult}
        submitToPaste={submitToPaste}
        submitDisabled={exerciseDetails?.expired ?? !signedIn}
        editorHeight={height}
        outputHeight={outputHeight}
        outputPosition={outputPosition}
        ready={ready}
        solutionUrl={
          exerciseDetails?.completed || exerciseDetails?.expired
            ? `https://tmc.mooc.fi/exercises/${exerciseDetails.id}/solution`
            : undefined
        }
      />
    </div>
  )
}

export { ProgrammingExerciseLoader, ProgrammingExerciseLoaderProps, FileEntry }
