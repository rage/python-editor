import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  CircularProgress,
  InputLabel,
  Select,
  Snackbar,
  Grid,
  Button,
  makeStyles,
} from "@material-ui/core"
import PyEditor from "./PyEditor"
import AnimatedOutputBox, { AnimatedOutputBoxRef } from "./AnimatedOutputBox"
import { v4 as uuid } from "uuid"
import {
  OutputObject,
  TestResultObject,
  FeedBackAnswer,
  EditorState,
  FileEntry,
} from "../types"
import FeedbackForm from "./FeedbackForm"
import styled from "styled-components"
import { OverlayBox, OverlayCenterWrapper } from "./Overlay"
import { useWorker } from "../hooks/getWorker"
import { parseTestCases } from "../services/test_parsing"
import { createWebEditorModuleSource } from "../services/patch_exercise"
import EditorOutput from "./EditorOutput"
import TestOutput from "./TestOutput"
import SubmissionOutput from "./SubmissionOutput"
import Problems from "./Problems"
import {
  faExclamationCircle,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye } from "@fortawesome/free-regular-svg-icons"

type ProgrammingExerciseProps = {
  submitFeedback: (
    testResults: TestResultObject,
    feedback: Array<FeedBackAnswer>,
  ) => void
  submitProgrammingExercise: (
    files: Array<FileEntry>,
  ) => Promise<TestResultObject>
  submitToPaste: (files: Array<FileEntry>) => Promise<string>
  debug?: boolean
  initialFiles: Array<FileEntry>
  problems?: string[]
  submitDisabled: boolean
  testSource?: string
  editorHeight?: string
  outputHeight?: string
  ready?: boolean
  solutionUrl?: string
}

const useStyles = makeStyles({
  problemsButton: {
    backgroundColor: "#BF0000",
    marginLeft: "5px",
  },
  runButton: {
    backgroundColor: "#0275d8",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#0275d8",
      color: "#228B22",
    },
  },
  stopButton: {
    "&:hover": {
      backgroundColor: "#0275d8",
      color: "#F44141",
    },
  },
  testButton: {
    backgroundColor: "#EBEBEB",
    color: "#FF7518",
    marginLeft: "5px",
    "&:hover": {
      backgroundColor: "#D5D5D5",
      color: "#FF7518",
    },
  },
  whiteText: {
    color: "#FFF",
    paddingLeft: "5px",
  },
})

const StyledOutput = styled(Grid)`
  padding: 5px;
  display: table-cell;
  min-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
`

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 0.5em;
  background-color: #0275d8;
  color: #fff;
`

const defaultFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

const ProgrammingExercise: React.FunctionComponent<ProgrammingExerciseProps> = ({
  submitFeedback,
  submitProgrammingExercise,
  submitToPaste,
  debug,
  initialFiles,
  problems,
  testSource,
  submitDisabled,
  editorHeight,
  outputHeight,
  ready = true,
}) => {
  const [t] = useTranslation()
  const [output, setOutput] = useState<OutputObject[]>([])
  const [testResults, setTestResults] = useState<TestResultObject | undefined>()
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [files, setFiles] = useState([defaultFile])
  const [selectedFile, setSelectedFile] = useState(defaultFile)
  const [editorValue, setEditorValue] = useState("")
  const [openNotification, setOpenNotification] = useState(false)
  const [executionTimeoutTimer, setExecutionTimeoutTimer] = useState<
    NodeJS.Timeout | undefined
  >()
  const [worker] = useWorker()
  const outputBoxRef = React.createRef<AnimatedOutputBoxRef>()
  const [editorState, setEditorState] = useState(EditorState.Initializing)
  const classes = useStyles()

  function handleRun(code?: string) {
    if (workerAvailable) {
      setOutput([])
      setTestResults(undefined)
      setWorkerAvailable(false)
      setEditorState(EditorState.WorkerInitializing)
      worker.postMessage({
        type: "run",
        msg: {
          code: code ?? editorValue,
          debug,
        },
      })
    } else {
      console.log("Worker is busy")
    }
  }

  function handleTests(code?: string) {
    if (workerAvailable) {
      const testCode = `
__webeditor_module_source = ${createWebEditorModuleSource(code ?? editorValue)}
${testSource}
`
      setOutput([])
      setTestResults(undefined)
      setWorkerAvailable(false)
      setEditorState(EditorState.WorkerInitializing)
      worker.postMessage({ type: "run_tests", msg: { code: testCode, debug } })
    } else {
      console.log("Worker is busy")
    }
  }

  worker.setMessageListener((e: any) => {
    let { type, msg } = e.data
    switch (type) {
      case "print":
        setOutput(output.concat({ id: uuid(), type: "output", text: msg }))
        break
      case "input_required":
        setEditorState(EditorState.WaitingInput)
        break
      case "error":
        console.error(msg)
        setOutput(output.concat({ id: uuid(), type: "error", text: msg }))
        setWorkerAvailable(true)
        break
      case "ready":
        setWorkerAvailable(true)
        break
      case "print_batch":
        if (editorState === EditorState.ExecutingCode) {
          const prints = msg.map((text: string) => ({
            id: uuid(),
            type: "output",
            text,
          }))
          setOutput((prevState) => prevState.concat(prints))
        }
        break
      case "print_done":
        setEditorState((previous) => {
          if (previous === EditorState.Testing) {
            return EditorState.ShowTestResults
          }
          return EditorState.Idle
        })
        break
      case "test_results": {
        const testCases = parseTestCases(msg)
        setOutput([])
        setTestResults({
          allTestsPassed: testCases.every((x) => x.passed),
          points: [],
          testCases,
        })
        break
      }
      case "start_run":
        setEditorState(EditorState.ExecutingCode)
        break
      case "start_test":
        setEditorState(EditorState.Testing)
        break
    }
  })

  const sendInput = (input: string) => {
    if (editorState === EditorState.WaitingInput) {
      setEditorState(EditorState.ExecutingCode)
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

  const handleSubmit = () => {
    setStateForSelectedFile()
    setEditorState(
      // paste ? EditorState.SubmittingToPaste : EditorState.Submitting,
      EditorState.Submitting,
    )
  }

  const handlePasteSubmit = () => {
    return submitToPaste(
      files.map((x) =>
        x.shortName === selectedFile.shortName
          ? { ...x, content: editorValue }
          : x,
      ),
    )
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
    switch (editorState) {
      case EditorState.Submitting:
        submitProgrammingExercise(files).then((data) => {
          closeOutput()
          setTestResults(data)
          setOutput([])
          setEditorState(
            data.allTestsPassed
              ? EditorState.ShowPassedFeedbackForm
              : EditorState.ShowSubmissionResults,
          )
        })
        break
      case EditorState.ExecutingCode:
      case EditorState.Testing:
        const msg = t("infiniteLoopMessage")
        const timeout = setTimeout(() => {
          setOutput([
            {
              id: uuid(),
              type: "output",
              text: msg,
            },
          ])
          stopWorker()
        }, 10000)
        setExecutionTimeoutTimer(timeout)
        break
      case EditorState.Idle:
      case EditorState.RunAborted:
      case EditorState.ShowTestResults:
      case EditorState.WaitingInput:
        if (executionTimeoutTimer) {
          clearTimeout(executionTimeoutTimer)
        }
        break
    }
  }, [editorState])

  const stopWorker = () => {
    if (!workerAvailable) {
      worker.terminate()
    }
    worker.postMessage({ type: "stop" })
    setEditorState(EditorState.RunAborted)
    setWorkerAvailable(true)
  }

  const closeOutput = () => {
    stopWorker()
    outputBoxRef.current?.close()
    setEditorState(EditorState.Idle)
    setOutput([])
  }

  const handleCloseNotification = (
    event?: React.SyntheticEvent,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return
    }
    setOpenNotification(false)
  }

  const mapStateToOutput = () => {
    switch (editorState) {
      case EditorState.ShowTestResults:
        return (
          <TestOutput
            getPasteLink={handlePasteSubmit}
            onClose={closeOutput}
            outputHeight={outputHeight}
            onSubmit={() => handleSubmit()}
            submitDisabled={submitDisabled}
            testResults={testResults ?? { points: [], testCases: [] }}
          />
        )
      case EditorState.Submitting:
      case EditorState.ShowPassedFeedbackForm:
      case EditorState.ShowSubmissionResults:
        return (
          <SubmissionOutput
            onClose={closeOutput}
            submitting={editorState === EditorState.Submitting}
            testResults={testResults ?? { points: [], testCases: [] }}
            getPasteLink={handlePasteSubmit}
            pasteDisabled={submitDisabled}
            outputHeight={outputHeight}
          />
        )
      case EditorState.ShowProblems:
        return (
          <Problems
            onClose={closeOutput}
            problems={problems ?? []}
            outputHeight={outputHeight}
          />
        )
      default:
        return (
          <EditorOutput
            editorState={editorState}
            getPasteLink={handlePasteSubmit}
            onClose={closeOutput}
            outputContent={output}
            outputHeight={outputHeight}
            pasteDisabled={submitDisabled}
            sendInput={sendInput}
          />
        )
    }
  }

  const ieOrEdge =
    window.StyleMedia && window.navigator.userAgent.indexOf("Edge") !== -1

  return (
    <div
      style={{
        position: "relative",
        width: "inherit",
      }}
    >
      {ieOrEdge && (
        <OverlayBox>
          <StyledOutput>
            {t("browserNotSupported")}
            <ul>
              <li>Google Chrome</li>
              <li>Firefox</li>
              <li>Safari</li>
            </ul>
          </StyledOutput>
        </OverlayBox>
      )}

      {editorState === EditorState.ShowPassedFeedbackForm && (
        <FeedbackForm
          awardedPoints={testResults?.points}
          onSubmitFeedback={(feedback) => {
            setEditorState(EditorState.ShowSubmissionResults)
            if (testResults) {
              submitFeedback(testResults, feedback)
              feedback.length > 0 && setOpenNotification(true)
            }
          }}
          onClose={() => setEditorState(EditorState.ShowSubmissionResults)}
          solutionUrl={testResults?.solutionUrl}
          feedbackQuestions={testResults?.feedbackQuestions}
        />
      )}

      {files.length > 1 && (
        <>
          <InputLabel id="label">{t("selectFile")}</InputLabel>
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

      {!ready && (
        <OverlayCenterWrapper>
          <CircularProgress thickness={5} color="inherit" />
        </OverlayCenterWrapper>
      )}

      <PyEditor
        editorValue={editorValue}
        setEditorValue={(value) => setEditorValue(value)}
        editorHeight={editorHeight}
        setIsEditorReady={(isReady) =>
          setEditorState(isReady ? EditorState.Idle : EditorState.Initializing)
        }
      />

      <div style={{ padding: "0.6em 0em" }}>
        {(editorState & EditorState.WorkerActive) === 0 ? (
          <StyledButton
            onClick={() => handleRun()}
            className={classes.runButton}
            disabled={
              !(
                workerAvailable &&
                (editorState & EditorState.WorkerActive) === 0
              )
            }
            data-cy="run-btn"
          >
            <FontAwesomeIcon icon={faPlay} />
            <span className={classes.whiteText}>{t("runButtonText")}</span>
          </StyledButton>
        ) : (
          <StyledButton
            className={classes.stopButton}
            onClick={() => stopWorker()}
            data-cy="stop-btn"
          >
            <FontAwesomeIcon icon={faStop} />
            <span className={classes.whiteText}>{t("stopButtonText")}</span>
          </StyledButton>
        )}
        <StyledButton
          onClick={() => handleTests()}
          disabled={
            !(!!testSource && (editorState & EditorState.WorkerActive) === 0)
          }
          style={{ backgroundColor: "#EBEBEB", color: "#FF7518" }}
          data-cy="test-btn"
        >
          <FontAwesomeIcon icon={faEye} />
          <span style={{ paddingLeft: "5px" }}>{t("testButtonText")}</span>
        </StyledButton>
        {problems && problems.length > 0 && (
          <StyledButton
            onClick={() => {
              setEditorState(EditorState.ShowProblems)
              outputBoxRef.current?.open()
            }}
            disabled={(editorState & EditorState.WorkerActive) > 0}
            className={classes.problemsButton}
            data-cy="problems-btn"
          >
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span className={classes.whiteText}>{`${t("problemsTitle")} (${
              problems.length
            })`}</span>
          </StyledButton>
        )}
      </div>

      <AnimatedOutputBox
        isRunning={(editorState & EditorState.WorkerActive) > 0}
        outputHeight={outputHeight}
        ref={outputBoxRef}
      >
        {mapStateToOutput()}
      </AnimatedOutputBox>

      {debug && <div>{EditorState[editorState]}</div>}

      <Snackbar
        open={openNotification}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        message={t("thankYouForFeedback")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        key="bottom-center"
      />
    </div>
  )
}

const defaultSrcContent = `# No ProgrammingExercise has been loaded.
# This is the default file main.py

from .utils import greeting, getLocality

def greetWorld():
  print(greeting(getLocality()))

def foo():
  print("foo!")
`

const defaultTestContent = `# No ProgrammingExercise has been loaded.
# This is the default file test.py

from .main import greetWorld

greetWorld()
`

const defaultUtilsContent = `# No ProgrammingExercise has been loaded.
# This is the default file utils.py

# Mutually recursive imports are disallowed.
# Try uncommenting the line below!
#from .main import foo

def greeting(recipient):
  return "Hello " + recipient + "!"

def getLocality():
  return "world"
`

ProgrammingExercise.defaultProps = {
  submitProgrammingExercise: () =>
    Promise.resolve({ points: [], testCases: [] }),
  submitToPaste: () => Promise.resolve("default paste called"),
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

export { ProgrammingExercise, ProgrammingExerciseProps, defaultFile }
