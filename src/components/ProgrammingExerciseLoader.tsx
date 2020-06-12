import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ProgrammingExercise, defaultFile } from "./ProgrammingExercise"
import {
  getExerciseDetails,
  getExerciseZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
  getLatestSubmissionZip,
} from "../services/programming_exercise"
import { TestResultObject, Language, ExerciseDetails } from "../types"
import { useTime } from "../hooks/customHooks"
import { DateTime } from "luxon"

type ProgrammingExerciseLoaderProps = {
  onExerciseDetailsChange?: (exerciseDetails?: ExerciseDetails) => void
  organization: string
  course: string
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
  const [testFiles, setTestFiles] = useState([] as Array<FileEntry>)
  const [signedIn, setSignedIn] = useState(false)
  const [exerciseDetails, setExerciseDetails] = useState<
    ExerciseDetails | undefined
  >()
  const apiConfig = { t, token }
  const mainSourceFile = "__main__.py"

  const getFileEntries = (
    zip: any,
    directory: string,
    main: string | null,
  ): Promise<Array<FileEntry>> => {
    const fileSelector: RegExp = RegExp(`${directory}/\\w*\\.py$`)
    const files = orderFiles(zip.file(fileSelector), main)
    return Promise.all(files.map((f: any) => createEntry(zip, f)))
  }

  const orderFiles = (files: any, main: string | null) => {
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

    const downloadExercise = async () => {
      const result = await getExerciseZip(
        organization,
        course,
        exercise,
        apiConfig,
      )
      if (result.ok) {
        try {
          return getFileEntries(result.val, "src", mainSourceFile)
        } catch (e) {
          return wrapError(418, t("malformedExerciseTemplate"))
        }
      }
      return wrapError(result.val.status, result.val.message)
    }

    setExerciseDetails(undefined)
    if (!hasToken) {
      setSrcFiles(await downloadExercise())
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
          submissionResult.val, "src", mainSourceFile
        )
        if (fileEntries.length > 0) {
          setSrcFiles(fileEntries)
          return
        }
      }
    } catch (e) {}
    setSrcFiles(await downloadExercise())
  }

  const createEntry = async (zip: any, f: any): Promise<FileEntry> => {
    const file = zip.file(f.name)
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

  const submitToPaste = async (files: FileEntry[]) => {
    if (!exerciseDetails) {
      return ""
    }
    const submitResult = await postExerciseSubmission(
      exerciseDetails.id,
      files,
      apiConfig,
      { paste: true },
    )
    return submitResult.ok
      ? submitResult.val.pasteUrl || ""
      : submitResult.val.message
  }

  useEffect(() => {
    if (exerciseDetails &&
      exerciseDetails.deadline &&
      !exerciseDetails.expired &&
      time >= DateTime.fromISO(exerciseDetails.deadline)) {
      getExerciseDetails(
        organization,
        course,
        exercise,
        apiConfig,
      ).then((result) => result.ok && setExerciseDetails(result.val))
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
    <>
      <ProgrammingExercise
        initialFiles={srcFiles}
        submitFeedback={(testResults, feedback) => {
          if (testResults.feedbackAnswerUrl && feedback.length > 0) {
            postExerciseFeedback(testResults, feedback, apiConfig)
          }
        }}
        submitProgrammingExercise={submitAndWaitResult}
        submitToPaste={submitToPaste}
        signedIn={signedIn}
        editorHeight={height}
        outputHeight={outputHeight}
        outputPosition={outputPosition}
        ready={ready}
        expired={exerciseDetails?.expired}
        solutionUrl={
          exerciseDetails?.completed || exerciseDetails?.expired
            ? `https://tmc.mooc.fi/exercises/${exerciseDetails.id}/solution`
            : undefined
        }
      />
    </>
  )
}

export { ProgrammingExerciseLoader, ProgrammingExerciseLoaderProps, FileEntry }
