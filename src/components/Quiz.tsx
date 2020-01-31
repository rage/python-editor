import React, { useState } from "react"
import PyEditor from "./PyEditor"
import Output from "./Output"

type QuizProps = {
  editorInitialValue: string
}

type PyEditorProps = {
  initialValue: string
  handleRun: (code: string) => void
}

const worker = new Worker("./worker.js")

const Quiz: React.FunctionComponent<QuizProps> = ({ editorInitialValue }) => {
  const [progOutput, setProgOutput] = useState("")
  const [workerAvailable, setWorkerAvailable] = useState(true)

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
      // Delay to simulate user input delay
      setTimeout(() => {
        worker.postMessage({ type: "input", msg: "this is the input msg" })
      }, 3000)
    } else if (type === "error") {
      console.log(msg)
      setProgOutput(prevOutput => prevOutput + msg)
    } else if (type === "done") {
      setWorkerAvailable(true)
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
      <Output outputText={progOutput} clearOutput={() => setProgOutput("")} />
    </div>
  )
}

export { Quiz, QuizProps }
