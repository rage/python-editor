import React, { useState } from "react"
import PyEditor from "./PyEditor"
import Output from "./Output"
import { v4 as uuid } from "uuid"

type QuizProps = {
  editorInitialValue: string
  // editorValueGetter: any
  setContentBuffer: any
}

const worker = new Worker("./worker.js")

const Quiz: React.FunctionComponent<QuizProps> = ({
  editorInitialValue,
  // editorValueGetter,
  setContentBuffer,
}) => {
  const [output, setOutput] = useState<any>([])
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)

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

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a quiz.</p>
      <PyEditor
        initialValue={editorInitialValue}
        handleRun={handleRun}
        allowRun={workerAvailable}
        // editorValueGetter={editorValueGetter}
        setContentBuffer={setContentBuffer}
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

export { Quiz, QuizProps }
