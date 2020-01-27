import React, { useState } from "react"
import WebWorker from "react-webworker"
import { QuizProps, PyEditor } from "./index"
import Output from "./Output"

const WorkerQuiz: React.FunctionComponent<QuizProps> = ({
  editorInitialValue,
}) => {
  const [progOutput, setProgOutput] = useState("")
  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a worker quiz.</p>
      <WebWorker url="/skulptWorker.js">
        {({ data, error, postMessage }: any) => {
          const runInWorker = (code: string) => {
            setProgOutput("")
            if (!code || code.length === 0) return
            postMessage(code)
          }
          if (data && data.error) {
            console.log(`The Web worker gave an error: ${data.error}`)
            setProgOutput(data.error)
          }
          if (data && data.result) {
            setProgOutput(data.result)
            console.log(JSON.stringify(data))
          }
          return (
            <div>
              <PyEditor
                initialValue={editorInitialValue}
                handleRun={runInWorker}
              />
              <Output
                outputText={progOutput}
                clearOutput={() => setProgOutput("")}
              />
            </div>
          )
        }}
      </WebWorker>
    </div>
  )
}

export default WorkerQuiz
