import React, { useState } from "react"
import PyEditor from "./PyEditor"
import Output from "./Output"

type QuizProps = {
  editorInitialValue: string
}

const worker = new Worker("./worker.js")

const Quiz: React.FunctionComponent<QuizProps> = ({ editorInitialValue }) => {
  const [progOutput, setProgOutput] = useState("")
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)

  function handleRun(code: string) {
    if (workerAvailable) {
      setProgOutput("")
      setWorkerAvailable(false)
      worker.postMessage({ type: "run", msg: code })
    } else {
      console.log("Worker is busy")
    }
  }

  worker.onmessage = function(e) {
    const { type, msg } = e.data
    if (type === "print") {
      setProgOutput(prevOutput => prevOutput + msg)
    } else if (type === "input_required") {
      setInputRequested(true)
    } else if (type === "error") {
      console.log(msg)
      setProgOutput(prevOutput => prevOutput + msg)
      setWorkerAvailable(true)
    } else if (type === "done") {
      setWorkerAvailable(true)
    }
  }

  const sendInput = (input: string) => {
    if (inputRequested) {
      console.log("sending input to web worker....")
      setInputRequested(false)
      setProgOutput(prevOutput => prevOutput + "\n" + input + "\n")
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
      />
      <Output
        outputText={progOutput}
        clearOutput={() => setProgOutput("")}
        inputRequested={inputRequested}
        sendInput={sendInput}
      />
    </div>
  )
}

export { Quiz, QuizProps }
