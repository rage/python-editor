import React, { useState } from "react"
import Output from "./Output"
import { QuizProps } from "./Quiz"
import PyEditor from "./PyEditor"

const WorkerQuiz: React.FunctionComponent<QuizProps> = ({
  editorInitialValue,
}) => {
  const [progOutput, setProgOutput] = useState("")
  const [workerAvailable, setworkerAvailable] = useState(true)
  const worker = new Worker("skulptWorker.js")

  worker.onmessage = (msg: any) => {
    if (msg.data.error) {
      handleError(msg.data.error)
    }
    if (msg.data.result) {
      handleResult(msg.data.result)
    }
    if (msg.data.done) {
      console.log(`Received done signal`)
      setworkerAvailable(true)
    }
  }

  const handleError = (err: string) => {
    const errMsg = `Error while running code: ${err}`
    console.log(errMsg)
    setProgOutput(errMsg)
  }

  const handleResult = (res: string) => {
    setProgOutput(out => out + res)
  }

  const runInWorker = (code: string) => {
    setProgOutput("")
    setworkerAvailable(false)
    if (!code || code.length === 0) return
    worker.postMessage(code)
  }

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a worker quiz.</p>
      <PyEditor
        initialValue={editorInitialValue}
        handleRun={runInWorker}
        allowRun={workerAvailable}
      />
      <Output outputText={progOutput} clearOutput={() => setProgOutput("")} />
    </div>
  )
}

export default WorkerQuiz
