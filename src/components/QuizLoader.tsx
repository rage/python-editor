import React, { useState, useEffect } from "react"
import { Quiz } from "./Quiz"
import { getZippedQuiz } from "../services/quiz"
// import { InputLabel, Select } from "@material-ui/core"

type QuizLoaderProps = {
  url: string
  token: string
}

type FileEntry = {
  fullName: string
  shortName: string
  originalContent: string
  content: string
}

const defaultFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

/*  Loads the quiz from the server. Then returns a Quiz component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const QuizLoader: React.FunctionComponent<QuizLoaderProps> = ({
  url,
  token,
}) => {
  const [text, setText] = useState("Initial text")
  const [srcFiles, setSrcFiles] = useState([defaultFile] as Array<FileEntry>)
  const [testFiles, setTestFiles] = useState([] as Array<FileEntry>)
  const mainSourceFile = "__main__.py"

  const getFileEntries = (
    zip: any,
    directory: string,
    stateObject: object,
    setter: (newState: any, callback?: any) => void,
    main: string | null,
  ) => {
    const fileSelector: RegExp = RegExp(`${directory}/\\w*\\.py$`)
    const files = orderFiles(zip.file(fileSelector), main)
    return Promise.all(files.map(f => createEntry(zip, f)))
  }

  const orderFiles = (files, main: string | null) => {
    if (main) {
      const mainIndex = files.findIndex(file => file.name.includes(main))
      if (mainIndex > -1) {
        const mainEntry = files.splice(mainIndex, 1)[0]
        files.unshift(mainEntry)
        return files
      }
    }
    return files
  }

  const createEntry = async (zip, f) => {
    const file = zip.file(f.name)
    const content = await f.async("string")
    const fullName: string = f.name
    const matches = fullName.match(/(\w+\.py)/)
    let shortName: string | null = null
    if (matches) {
      shortName = matches[0]
    }
    return { fullName, shortName, originalContent: content, content }
  }

  useEffect(() => {
    getZippedQuiz(url, token)
      .then(zip =>
        getFileEntries(zip, "src", srcFiles, setSrcFiles, mainSourceFile),
      )
      .then(fileEntries => {
        setSrcFiles(() => fileEntries)
      })
  }, [])

  return (
    <>
      <Quiz initialFiles={srcFiles} />
    </>
  )
}

export { QuizLoader, FileEntry }
