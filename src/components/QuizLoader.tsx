import React, { useState, useEffect } from "react"
import { Quiz, defaultFile } from "./Quiz"
import {
  getZippedQuiz,
  submitQuiz,
  fetchSubmissionResult,
} from "../services/quiz"

type QuizLoaderProps = {
  organization: string
  course: string
  exercise: string
  token: string
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
  organization,
  course,
  exercise,
  token,
}) => {
  const [text, setText] = useState("Initial text")
  const [srcFiles, setSrcFiles] = useState([defaultFile])
  const [testFiles, setTestFiles] = useState([] as Array<FileEntry>)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const mainSourceFile = "__main__.py"

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
    const resultUrl = await submitQuiz(submissionUrl, token, files)
    const testCases = await fetchSubmissionResult(resultUrl, token)
    return testCases[0].name
  }

  useEffect(() => {
    const url = `https://tmc.mooc.fi/api/v8/org/${organization}/courses/${course}/exercises/${exercise}`
    Promise.all(getZippedQuiz(url, token))
      .then(result => {
        const [zip, subm] = result
        setSubmissionUrl(() => subm)
        return getFileEntries(zip, "src", srcFiles, setSrcFiles, mainSourceFile)
      })
      .then(fileEntries => {
        setSrcFiles(() => fileEntries)
      })
  }, [])

  return (
    <>
      <Quiz
        initialFiles={srcFiles}
        submitQuiz={submitAndWaitResult}
        submitToPaste={files =>
          submitQuiz(submissionUrl, token, files, { paste: true })
        }
      />
    </>
  )
}

export { QuizLoader, FileEntry }
