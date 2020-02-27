import React, { useState } from "react"
import PyEditor from "./PyEditor"
import Output from "./Output"
import { v4 as uuid } from "uuid"
import { Button } from "@material-ui/core"

type QuizProps = {
  editorInitialValue: string
}

let worker = new Worker("./worker.js")

const Quiz: React.FunctionComponent<QuizProps> = ({ editorInitialValue }) => {
  const [output, setOutput] = useState<any>([])
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)
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
        const mapped = msg.map(t => ({ id: uuid(), type: "output", text: t }))
        setOutput(prev => prev.concat(mapped))
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

  const stopWorker = () => {
    if (!workerAvailable) {
      worker.terminate()
      worker = new Worker("./worker.js")
    }
    worker.postMessage({ type: "stop" })
    setRunning(false)
  }

  const clearOutput = () => {
    stopWorker()
    setOutput([])
  }

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a quiz.</p>
      <Button
        variant="contained"
        disabled={!running}
        style={{ float: "right" }}
        onClick={() => stopWorker()}
      >
        Terminate
      </Button>
      <PyEditor
        initialValue={editorInitialValue}
        handleRun={handleRun}
        allowRun={workerAvailable}
      />
      <Output
        outputText={output}
        clearOutput={clearOutput}
        inputRequested={inputRequested}
        sendInput={sendInput}
      />
    </div>
  )
}

export { Quiz, QuizProps }
