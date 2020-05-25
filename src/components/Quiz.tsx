import React, { useState, useEffect } from "react"
import { InputLabel, Select, Grid } from "@material-ui/core"
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
import { OutputObject, TestResultObject } from "../types"
import {
  skulptMinJsSource,
  skulptStdlibJsSource,
  workerJsSource,
} from "../constants"

type QuizProps = {
  submitQuiz: (files: Array<FileEntry>) => Promise<TestResultObject>
  submitToPaste: (files: Array<FileEntry>) => Promise<string>
  onSubmissionResults?: (submissionResults: TestResultObject) => void
  initialFiles: Array<FileEntry>
  signedIn: boolean
  editorHeight?: string
  outputHeight?: string
}

const blobObject = URL.createObjectURL(
  new Blob([skulptMinJsSource, skulptStdlibJsSource, workerJsSource], {
    type: "application/javascript",
  }),
)
let worker = new Worker(blobObject)

const defaultFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

const Quiz: React.FunctionComponent<QuizProps> = ({
  submitQuiz,
  submitToPaste,
  onSubmissionResults,
  initialFiles,
  signedIn,
  editorHeight,
  outputHeight,
}) => {
  const [output, setOutput] = useState<OutputObject[]>([])
  const [testResults, setTestResults] = useState<TestResultObject | undefined>()
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)
  const [files, setFiles] = useState([defaultFile])
  const [selectedFile, setSelectedFile] = useState(defaultFile)
  const [editorValue, setEditorValue] = useState("")
  const [running, setRunning] = useState(false)
  const [aborted, setAborted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    submitting: boolean
    paste?: boolean
  }>({ submitting: false })
  const [testing, setTesting] = useState(false)
  const [pasteUrl, setPasteUrl] = useState("")

  function handleRun(code: string) {
    if (workerAvailable) {
      setOutput([])
      setTestResults(undefined)
      setWorkerAvailable(false)
      setRunning(true)
      setAborted(false)
      setTesting(false)
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

  worker.onmessage = function (e) {
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
        setOutput((prevState) => prevState.concat(prints))
      }
    } else if (type === "print_done") {
      setRunning(false)
    } else if (type === "testResults") {
      console.log("[TEST RESULTS]", msg)
      setRunning(false)
      const results = msg.map((result: any) => ({
        id: uuid(),
        testName: result.testName,
        passed: result.passed,
        feedback: result.feedback || null,
        points: result.points,
      }))
      setTestResults(results)
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
    setStateForSelectedFile()
    changeFile(e.target.value, files)
  }

  const handleSubmit = (paste: boolean) => {
    setStateForSelectedFile()
    setSubmitStatus({ submitting: true, paste })
  }

  const setStateForSelectedFile = () => {
    setFiles((prev: any) =>
      prev.map((file: any) =>
        file.shortName === selectedFile.shortName
          ? { ...file, content: editorValue }
          : file,
      ),
    )
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

  useEffect(() => {
    if (submitStatus.submitting) {
      if (submitStatus.paste) {
        submitToPaste(files).then((res) => setPasteUrl(res))
        setSubmitStatus(() => ({ submitting: false }))
      } else {
        submitQuiz(files).then((data) => {
          console.log(data)
          clearOutput()
          setTestResults(data)
          setOutput([])
          setTesting(true)
          setSubmitStatus(() => ({ submitting: false }))
          onSubmissionResults?.(data)
        })
      }
    }
  }, [submitStatus])

  const stopWorker = () => {
    if (!workerAvailable) {
      worker.terminate()
      worker = new Worker(blobObject)
    }
    worker.postMessage({ type: "stop" })
    setRunning(false)
    setAborted(true)
    setInputRequested(false)
  }

  const clearOutput = () => {
    stopWorker()
    setOutput([])
  }

  /*
  const runTests = () => {
    console.log("Running tests")
    setOutput([])
    setRunning(true)
    setTesting(true)
    worker.postMessage({ type: "runTests" })
  }
  */

  return (
    <div
      style={{
        position: "relative",
        width: "inherit",
        minHeight: "400px",
        maxHeight: "1000px",
      }}
    >
      {files.length > 1 && (
        <>
          <InputLabel id="label">Select File</InputLabel>
          <Select
            labelId="label"
            native
            value={selectedFile.shortName}
            onChange={handleChange}
            data-cy="select-file"
          >
            {
              <>
                {files.map(({ shortName }) => (
                  <option key={shortName} value={shortName}>
                    {shortName}
                  </option>
                ))}
              </>
            }
          </Select>
        </>
      )}
      {/* <Button variant="contained" onClick={runTests} data-cy="run-tests-btn">
        Run tests
      </Button> */}
      <PyEditor
        handleRun={handleRun}
        handleRunWrapped={handleRunWrapped}
        allowRun={workerAvailable}
        handleStop={stopWorker}
        isRunning={running}
        editorValue={editorValue}
        setEditorValue={setEditorValue}
        editorHeight={editorHeight}
      />
      <Output
        outputContent={output}
        testResults={testResults}
        clearOutput={clearOutput}
        inputRequested={inputRequested}
        sendInput={sendInput}
        isRunning={running}
        isAborted={aborted}
        handleSubmit={() => handleSubmit(false)}
        handlePasteSubmit={() => handleSubmit(true)}
        pasteUrl={pasteUrl}
        isSubmitting={submitStatus.submitting}
        handleStop={stopWorker}
        testing={testing}
        signedIn={signedIn}
        outputHeight={outputHeight}
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
  submitQuiz: () => Promise.resolve({ points: [], testCases: [] }),
  submitToPaste: () => Promise.resolve("default paste called"),
  onSubmissionResults: (result) => {
    console.log(result)
  },
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

export { Quiz, QuizProps, defaultFile }
