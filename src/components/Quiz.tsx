import React, { useState, useEffect } from "react"
import { InputLabel, Select } from "@material-ui/core"
import PyEditor from "./PyEditor"
import Output from "./Output"
import { v4 as uuid } from "uuid"
import { FileEntry } from "./QuizLoader"

type QuizProps = {
  initialFiles: Array<FileEntry>
}

const worker = new Worker("./worker.js")

const defaultFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

const Quiz: React.FunctionComponent<QuizProps> = ({ initialFiles }) => {
  const [output, setOutput] = useState<any>([])
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)
  const [files, setFiles] = useState([defaultFile])
  const [selectedFile, setSelectedFile] = useState(defaultFile)
  const [editorValue, setEditorValue] = useState("")

  function handleRun(code: string) {
    if (workerAvailable) {
      setOutput([])
      setWorkerAvailable(false)
      worker.postMessage({ type: "run", msg: code })
    } else {
      console.log("Worker is busy")
    }
  }

  worker.onmessage = function(e) {
    const { type, msg } = e.data
    if (type === "print") {
      setOutput(output.concat({ id: uuid(), type: "output", text: msg }))
    } else if (type === "input_required") {
      setInputRequested(true)
    } else if (type === "error") {
      console.log(msg)
      setOutput(output.concat({ id: uuid(), type: "error", text: msg }))
      setWorkerAvailable(true)
    } else if (type === "done") {
      setWorkerAvailable(true)
    }
  }

  const sendInput = (input: string) => {
    if (inputRequested) {
      setInputRequested(false)
      setOutput(
        output.concat({ id: uuid(), type: "input", text: `${input}\n` }),
      )
      worker.postMessage({ type: "input", msg: input })
    }
  }

  const handleChange = (e: any) => {
    console.log("setting selected file to " + e.target.value)
    setFiles((prev: any) =>
      prev.map((file: any) =>
        file.shortName === selectedFile.shortName
          ? { ...file, content: editorValue }
          : file,
      ),
    )
    changeFile(e.target.value, files)
  }

  const changeFile = (shortName: string, fileList: Array<object>) => {
    setSelectedFile(getFileByShortName(shortName, fileList))
    setEditorValue(getContentByShortName(shortName, fileList))
  }

  const getContentByShortName = (name: string, fileSet: Array<any>) => {
    return getFileByShortName(name, fileSet).content
  }

  const getFileByShortName = (name: string, fileSet: Array<any>) => {
    let firstMatch = fileSet.filter(({ shortName }) => shortName === name)[0]
    return firstMatch
  }

  useEffect(() => {
    setFiles(initialFiles)
    changeFile(initialFiles[0].shortName, initialFiles)
  }, [initialFiles])

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a quiz.</p>
      <InputLabel id="label">Select File</InputLabel>
      <Select
        labelId="label"
        native
        value={selectedFile.shortName}
        onChange={handleChange}
      >
        {files.length > 0 && (
          <>
            {files.map(({ shortName }) => (
              <option key={shortName} value={shortName}>
                {shortName}
              </option>
            ))}
          </>
        )}
      </Select>
      <PyEditor
        handleRun={handleRun}
        allowRun={workerAvailable}
        editorValue={editorValue}
        setEditorValue={setEditorValue}
      />
      <Output
        outputText={output}
        clearOutput={() => setOutput([])}
        inputRequested={inputRequested}
        sendInput={sendInput}
      />
    </div>
  )
}

Quiz.defaultProps = {
  editorInitialValue: "",
  initialFiles: [
    {
      fullName: "default",
      shortName: "default",
      originalContent: "# No file has been loaded.",
      content: "# No file has been loaded.",
    },
  ],
}

export { Quiz, QuizProps }
