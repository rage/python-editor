import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  CircularProgress,
  InputLabel,
  Select,
  Snackbar,
  Button,
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
import { OverlayCenterWrapper } from "./Overlay"
import { useWorker } from "../hooks/useWorker"
import { parseTestCases } from "../services/test_parsing"
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
import SubmittingOutput from "./SubmittingOutput"
import useStyles from "../hooks/useStyles"
import AlertDialog from "./AlertDialog"
import { WebEditorExercise } from "../hooks/useExercise"
import useCachedFileEntries from "../hooks/useCachedFileEntries"
import { emptyFile, exampleFiles } from "../constants"
import WithBrowserIncompatibilityOverlay from "./WithBrowserIncompatibilityOverlay"

export interface ProgrammingExerciseProps {
  submitFeedback: (
    testResults: TestResultObject,
    feedback: Array<FeedBackAnswer>,
  ) => void
  submitProgrammingExercise: (
    files: ReadonlyArray<FileEntry>,
  ) => Promise<TestResultObject>
  submitToPaste: (files: ReadonlyArray<FileEntry>) => Promise<string>
  cacheKey?: string
  debug?: boolean
  exercise: WebEditorExercise
  submitDisabled: boolean
  editorHeight?: string
  outputHeight?: string
  solutionUrl?: string
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 0.5em;
`

const initialFiles = { value: [emptyFile], timestamp: -1 }

const ProgrammingExercise: React.FunctionComponent<ProgrammingExerciseProps> =
  ({
    submitFeedback,
    submitProgrammingExercise,
    submitToPaste,
    cacheKey,
    debug,
    exercise,
    submitDisabled,
    solutionUrl,
    editorHeight,
    outputHeight,
  }) => {
    const [t] = useTranslation()
    const [output, setOutput] = useState<OutputObject[]>([])
    const [testResults, setTestResults] = useState<
      TestResultObject | undefined
    >()
    const [workerAvailable, setWorkerAvailable] = useState(true)
    const [files, setFiles, setFilesIfNewer] = useCachedFileEntries(
      cacheKey,
      initialFiles,
    )
    const [activeFile, setActiveFile] = useState(0)
    const [openNotification, setOpenNotification] = useState(false)
    const [executionTimeoutTimer, setExecutionTimeoutTimer] = useState<
      NodeJS.Timeout | undefined
    >()
    const [worker] = useWorker({ debug })
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
            code: code ?? files[activeFile].content,
            debug,
          },
        })
      } else {
        console.log("Worker is busy")
      }
    }

    function handleTests(code?: string) {
      if (workerAvailable) {
        const testCode = exercise.getTestProgram(
          code ?? files[activeFile].content,
        )
        setOutput([])
        setTestResults(undefined)
        setWorkerAvailable(false)
        setEditorState(EditorState.WorkerInitializing)
        worker.postMessage({
          type: "run_tests",
          msg: { code: testCode, debug },
        })
      } else {
        console.log("Worker is busy")
      }
    }

    const handleSubmit = () => {
      setEditorState(EditorState.Submitting)
      setTestResults(undefined)
    }

    const handleReset = () => {
      setFiles(
        exercise.projectFiles.map((x) => ({
          ...x,
          content: x.originalContent,
        })),
      )
      setActiveFile(0)
      setOutput([])
      setTestResults(undefined)
    }

    worker.setMessageListener((e: any) => {
      const { type, msg } = e.data
      switch (type) {
        case "print":
          setOutput(output.concat({ id: uuid(), type: "output", text: msg }))
          break
        case "input_required":
          setEditorState(EditorState.WaitingInput)
          break
        case "error":
          console.error(msg)
          setOutput(
            output.concat({
              id: uuid(),
              type: "error",
              text: msg,
              traceback: e.data.traceback,
            }),
          )
          setWorkerAvailable(true)
          worker.recycle()
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
            switch (previous) {
              case EditorState.Testing:
                if (testResults?.allTestsPassed && !submitDisabled) {
                  handleSubmit()
                }
                return EditorState.ShowTestResults
              default:
                return EditorState.Idle
            }
          })
          worker.recycle()
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

    useEffect(() => {
      // If exercise includes previous submission data, compare against cache.
      setFilesIfNewer({
        value: exercise.projectFiles,
        timestamp: exercise.submissionDetails?.createdAtMillis ?? -1,
      })
    }, [
      exercise.projectFiles,
      exercise.submissionDetails?.createdAtMillis,
      setFilesIfNewer,
    ])

    useEffect(() => {
      debug && console.log(EditorState[editorState])
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
        case EditorState.Testing: {
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
        }
        case EditorState.Idle:
        case EditorState.RunAborted:
        case EditorState.ShowTestResults:
        case EditorState.WaitingInput:
          if (executionTimeoutTimer) {
            clearTimeout(executionTimeoutTimer)
          }
          break
      }
      // FIXME
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleFileChange = (e: any) => {
      setActiveFile(files.findIndex((x) => x.shortName === e.target.value) ?? 0)
    }

    const mapStateToOutput = () => {
      switch (editorState) {
        case EditorState.ShowTestResults:
          return (
            <TestOutput
              getPasteLink={() => submitToPaste(files)}
              onClose={closeOutput}
              outputHeight={outputHeight}
              onSubmit={() => handleSubmit()}
              submitDisabled={submitDisabled}
              testResults={testResults ?? { points: [], testCases: [] }}
            />
          )
        case EditorState.ShowPassedFeedbackForm:
        case EditorState.ShowSubmissionResults:
          return (
            <SubmissionOutput
              onClose={closeOutput}
              onSubmit={() => handleSubmit()}
              testResults={testResults ?? { points: [], testCases: [] }}
              getPasteLink={() => submitToPaste(files)}
              pasteDisabled={submitDisabled}
              outputHeight={outputHeight}
            />
          )
        case EditorState.Submitting:
          return (
            <SubmittingOutput
              onClose={closeOutput}
              getPasteLink={() => submitToPaste(files)}
              pasteDisabled={true}
            />
          )
        case EditorState.ShowProblems:
          return (
            <Problems
              onClose={closeOutput}
              problems={exercise.templateIssues}
              outputHeight={outputHeight}
            />
          )
        default:
          return (
            <EditorOutput
              editorState={editorState}
              getPasteLink={() => submitToPaste(files)}
              onClose={closeOutput}
              outputContent={output}
              outputHeight={outputHeight}
              pasteDisabled={submitDisabled}
              sendInput={sendInput}
            />
          )
      }
    }

    const handleEditorValueChange = (newContent: string) => {
      if (!exercise.ready) return
      setFiles((prev) =>
        prev.map((x, i) =>
          i !== activeFile ? x : { ...x, content: newContent },
        ),
      )
    }

    const pyEditorButtonsDisabled =
      (editorState & (EditorState.WorkerActive | EditorState.Submitting)) === 0

    return (
      <WithBrowserIncompatibilityOverlay>
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
              value={files[activeFile].shortName}
              onChange={handleFileChange}
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

        {!exercise.ready && (
          <OverlayCenterWrapper>
            <CircularProgress thickness={5} color="inherit" />
          </OverlayCenterWrapper>
        )}

        <PyEditor
          editorValue={files[activeFile].content}
          setEditorValue={handleEditorValueChange}
          editorHeight={editorHeight}
          setIsEditorReady={(isReady) =>
            setEditorState(
              isReady ? EditorState.Idle : EditorState.Initializing,
            )
          }
        />

        <div style={{ padding: "0.6em 0em" }}>
          {(editorState & EditorState.WorkerActive) === 0 ? (
            <StyledButton
              onClick={() => handleRun()}
              className={classes.runButton}
              disabled={!(workerAvailable && pyEditorButtonsDisabled)}
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
            disabled={!pyEditorButtonsDisabled}
            className={classes.testButton}
            data-cy="test-btn"
          >
            <FontAwesomeIcon icon={faEye} />
            <span style={{ paddingLeft: "5px" }}>{t("testButtonText")}</span>
          </StyledButton>
          <AlertDialog resetExercise={handleReset} />
          {solutionUrl && (
            <StyledButton
              className={classes.normalButton}
              onClick={() => window.open(solutionUrl, "_blank")}
            >
              {t("modelSolution")}
            </StyledButton>
          )}
          {exercise.templateIssues.length > 0 && (
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
                exercise.templateIssues.length
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

        {debug && (
          <div>
            <div>EditorState: {EditorState[editorState]}</div>
            <div>Cache key: {cacheKey || "undefined"}</div>
            <div>Active file: {files[activeFile].fullName}</div>
          </div>
        )}

        <Snackbar
          open={openNotification}
          autoHideDuration={5000}
          onClose={handleCloseNotification}
          message={t("thankYouForFeedback")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          key="bottom-center"
        />
      </WithBrowserIncompatibilityOverlay>
    )
  }

ProgrammingExercise.defaultProps = {
  submitProgrammingExercise: () =>
    Promise.resolve({ points: [], testCases: [] }),
  submitToPaste: () => Promise.resolve("default paste called"),
  exercise: {
    details: undefined,
    projectFiles: exampleFiles,
    ready: true,
    reset: () => console.log("Called for exercise reset."),
    templateIssues: [],
    updateDetails: async () =>
      console.log("Called for exercise details update."),
    getTestProgram: () => 'print("Default test called.")',
  },
}

export { ProgrammingExercise }
