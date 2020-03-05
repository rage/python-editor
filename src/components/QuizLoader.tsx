import React, { useState, useEffect, useRef } from "react"
import { Quiz } from "./Quiz"
import { getZippedQuiz } from "../services/quiz"
import { InputLabel, Select } from "@material-ui/core"

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

/*  Loads the quiz from the server. Then returns a Quiz component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const QuizLoader: React.FunctionComponent<QuizLoaderProps> = ({
  url,
  token,
}) => {
  const [text, setText] = useState("Initial text")
  const [srcFiles, setSrcFiles] = useState([] as Array<FileEntry>)
  const [testFiles, setTestFiles] = useState([] as Array<FileEntry>)
  const [selectedFile, setSelectedFile] = useState("")
  const [contentBuffer, setContentBuffer] = useState("")
  const mainSourceFile = "__main__.py"

  const getContentByShortName = (name: string, fileSet: Array<any>) => {
    return getFileByShortName(name, fileSet).content
  }

  const getFileByShortName = (name: string, fileSet: Array<any>) => {
    let firstMatch = fileSet.filter(({ shortName }) => shortName === name)[0]
    return firstMatch
  }

  const handleChange = (e: any) => {
    console.log("setting selected file to " + e.target.value)
    setSrcFiles((prev: any) =>
      prev.map((file: any) =>
        file.shortName === selectedFile
          ? { ...file, content: contentBuffer }
          : file,
      ),
    )
    changeFile(e.target.value, srcFiles)
  }

  const changeFile = (shortName: string, fileList: Array<object>) => {
    setSelectedFile(shortName)
    setText(getContentByShortName(shortName, fileList))
  }

  const getFiles = (
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
      .then(zip => getFiles(zip, "src", srcFiles, setSrcFiles, mainSourceFile))
      .then(files => {
        setSrcFiles(files)
        if (files.length > 0) {
          changeFile(files[0].shortName, files)
        }
      })
  }, [])

  return (
    <>
      <InputLabel id="label">Select File</InputLabel>
      <Select
        labelId="label"
        native
        value={selectedFile}
        onChange={handleChange}
      >
        {srcFiles.length > 0 && (
          <>
            {srcFiles.map(({ shortName }) => (
              <option key={shortName} value={shortName}>
                {shortName}
              </option>
            ))}
          </>
        )}
      </Select>
      <Quiz editorInitialValue={text} setContentBuffer={setContentBuffer} />
    </>
  )
}

export default QuizLoader
