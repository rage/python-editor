import React, { useState, useEffect } from "react"
import { InputLabel, Select } from "@material-ui/core"
import PyEditor from "./PyEditor"
import Output from "./Output"
import { v4 as uuid } from "uuid"
import { FileEntry } from "./QuizLoader"
import {
  PythonImportAll,
  PythonImportSome,
  parseImportAll,
  parseImportSome,
} from "../services/import_parsing"

type QuizProps = {
  initialFiles: Array<FileEntry>
}

let worker = new Worker("./worker.js")

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
  const [running, setRunning] = useState(false)

  function handleRun(code: string) {
    if (workerAvailable) {
      setOutput([])
      setWorkerAvailable(false)
      setRunning(true)
      worker.postMessage({ type: "run", msg: code })
    } else {
      console.log("Worker is busy")
    }
  }

  const handleRunWrapped = (code: string) => {
    try {
      const wrapped = wrap(code, [selectedFile.shortName])
      return handleRun(wrapped)
    } catch (error) {
      return handleRun(`print("${error}")`)
    }
  }

  /* Replace import statements of the form "import .mymodule" and
  "from .mymodule import myClass, myFunction" with the contents of
  mymodule.py, appropriately wrapped. Cyclical imports (module foo
  imports from module bar, bar imports from foo) are detected and
  result in an exception. */
  const wrap = (source: string, presentlyImported: Array<string>) => {
    const importAllPattern = /^import \./
    const importSomePattern = /^from \.\w+ import/
    const sourceLines = source.split("\n")
    const lines = sourceLines.map((line, num) => {
      if (line.match(importAllPattern)) {
        return replaceImportAll(parseImportAll(line), num, presentlyImported)
      }
      return line.match(importSomePattern)
        ? replaceImportSome(parseImportSome(line), num, presentlyImported)
        : line
    })
    return lines.join("\n")
  }

  const replaceImportAll = (
    im: PythonImportAll,
    lineNumber: number,
    presentlyImported: Array<string>,
  ): string => {
    const sourceShortName = im.pkg.slice(1) + ".py"
    if (presentlyImported.includes(sourceShortName)) {
      const errMsg =
        sourceShortName +
        " has already been imported. Mutually recursive imports are not allowed."
      throw errMsg
    }
    const source = getContentByShortName(sourceShortName, files)
    const wrapped = wrap(source, presentlyImported.concat([sourceShortName]))
    return `\n${wrapped}\n`
  }

  const replaceImportSome = (
    im: PythonImportSome,
    lineNumber: number,
    presentlyImported: Array<string>,
  ): string => {
    const sourceShortName = im.pkg.slice(1) + ".py"
    if (presentlyImported.includes(sourceShortName)) {
      const errMsg =
        sourceShortName +
        " has already been imported. Mutually recursive imports are not allowed."
      throw errMsg
    }
    const source = getContentByShortName(sourceShortName, files)
    const wrapped = wrap(source, presentlyImported.concat([sourceShortName]))
    const sourceLines = wrapped.split("\n").map((line: string) => "\t" + line)
    const names = im.names.join(", ")
    const functionName = `__wrap${lineNumber}`
    const head = `def ${functionName}():\n`
    const body = sourceLines.join("\n") + "\n"
    const ret = `\treturn ${names}\n`
    const tail = `${names} = ${functionName}()`
    return head + body + ret + tail
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
    } else if (type === "ready") {
      setWorkerAvailable(true)
    } else if (type === "print_batch") {
      if (running) {
        const prints = msg.map((text: string) => ({
          id: uuid(),
          type: "output",
          text,
        }))
        setOutput((prev: []) => prev.concat(prints))
      }
    } else if (type === "print_done") {
      setRunning(false)
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

  const stopWorker = () => {
    if (!workerAvailable) {
      worker.terminate()
      worker = new Worker("./worker.js")
    }
    worker.postMessage({ type: "stop" })
    setRunning(false)
    setInputRequested(false)
  }

  const clearOutput = () => {
    stopWorker()
    setOutput([])
  }

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a quiz.</p>
      <InputLabel id="label">Select File</InputLabel>
      <Select
        labelId="label"
        native
        value={selectedFile.shortName}
        onChange={handleChange}
        data-cy="select-file"
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
        handleRunWrapped={handleRunWrapped}
        allowRun={workerAvailable}
        handleStop={stopWorker}
        isRunning={running}
        editorValue={editorValue}
        setEditorValue={setEditorValue}
      />
      <Output
        outputText={output}
        clearOutput={clearOutput}
        inputRequested={inputRequested}
        sendInput={sendInput}
        isRunning={running}
        handleStop={stopWorker}
      />
    </div>
  )
}

const defaultSrcContent = `# No quiz has been loaded.
# This is the default file main.py

from .utils import greeting, getLocality

def greetWorld():
  print(greeting(getLocality()))

def foo():
  print("foo!")
`

const defaultTestContent = `# No quiz has been loaded.
# This is the default file test.py

from .main import greetWorld

greetWorld()
`

const defaultUtilsContent = `# No quiz has been loaded.
# This is the default file utils.py

# Mutually recursive imports are disallowed.
# Try uncommenting the line below!
#from .main import foo

def greeting(recipient):
  return "Hello " + recipient + "!"

def getLocality():
  return "world"
`

Quiz.defaultProps = {
  initialFiles: [
    {
      fullName: "main.py",
      shortName: "main.py",
      originalContent: defaultSrcContent,
      content: defaultSrcContent,
    },
    {
      fullName: "utils.py",
      shortName: "utils.py",
      originalContent: defaultUtilsContent,
      content: defaultUtilsContent,
    },
    {
      fullName: "test.py",
      shortName: "test.py",
      originalContent: defaultTestContent,
      content: defaultTestContent,
    },
  ],
}

export { Quiz, QuizProps }
