import React, { useState, useEffect } from "react"
import { I18nextProvider, useTranslation } from "react-i18next"
import { Quiz, defaultFile } from "./Quiz"
import {
  getExerciseDetails,
  getExerciseZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
} from "../services/quiz"
import { TestResultObject, Language, ExerciseDetails } from "../types"
import { Results } from "ts-results"

type QuizLoaderProps = {
  onSubmissionResults?: (submissionResults: TestResultObject) => void
  organization: string
  course: string
  exercise: string
  token: string
  height?: string
  outputHeight?: string
  language: Language
}

type FileEntry = {
  fullName: string
  shortName: string
  originalContent: string
  content: string
}

/*  Loads the quiz from the server. Then returns a Quiz component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const QuizLoader: React.FunctionComponent<QuizLoaderProps> = ({
  onSubmissionResults,
  organization,
  course,
  exercise,
  token,
  height,
  outputHeight,
  language = "en",
}) => {
  const [t, i18n] = useTranslation()
  const [srcFiles, setSrcFiles] = useState([defaultFile])
  const [testFiles, setTestFiles] = useState([] as Array<FileEntry>)
  const [signedIn, setSignedIn] = useState(token !== "" && token !== null)
  const [exerciseDetails, setExerciseDetails] = useState<
    ExerciseDetails | undefined
  >()
  const apiConfig = { t, token }
  const mainSourceFile = "__main__.py"

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  const getFileEntries = (
    zip: any,
    directory: string,
    stateObject: object,
    setter: (newState: any, callback?: any) => void,
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
    return submissionResult.mapErr((error) =>
      wrapError(error.status, error.message),
    ).val
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
    Promise.all([
      getExerciseDetails(organization, course, exercise, apiConfig),
      getExerciseZip(organization, course, exercise, apiConfig),
    ])
      .then((res) => {
        const results = Results(...res)
        if (results.err) {
          return Promise.resolve([
            {
              ...defaultFile,
              content: `# ${results.val.status}: ${results.val.message}`,
            },
          ])
        }
        const [exerciseDetails, zip] = results.val
        setExerciseDetails(() => exerciseDetails)
        return getFileEntries(zip, "src", srcFiles, setSrcFiles, mainSourceFile)
      })
      .then((fileEntries) => setSrcFiles(fileEntries))
  }, [])

  return (
    <>
      <Quiz
        initialFiles={srcFiles}
        submitFeedback={(testResults, feedback) => {
          if (testResults.feedbackAnswerUrl && feedback.length > 0) {
            postExerciseFeedback(testResults, feedback, apiConfig)
          }
        }}
        submitQuiz={submitAndWaitResult}
        submitToPaste={submitToPaste}
        onSubmissionResults={onSubmissionResults}
        signedIn={signedIn}
        editorHeight={height}
        outputHeight={outputHeight}
      />
    </>
  )
}

export { QuizLoader, QuizLoaderProps, FileEntry }
