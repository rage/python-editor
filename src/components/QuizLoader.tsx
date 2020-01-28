import React, { useState, useEffect } from "react"
import JSZip from "jszip"
import axios from "axios"
import WorkerQuiz from "./WorkerQuiz"

type QuizLoaderProps = {
  url: string
  token: string
}

/*  Loads the quiz from the server. Then returns a Quiz component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const QuizLoader: React.FunctionComponent<QuizLoaderProps> = ({
  url,
  token,
}) => {
  const [text, setText] = useState("Initial text")
  useEffect(() => {
    axios
      .request({
        responseType: "arraybuffer",
        url,
        method: "get",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
      .then(res => {
        const zip = new JSZip()
        return zip.loadAsync(res.data)
      })
      .then(zip => zip.file(/src\/__main__.py/)[0].async("string"))
      .then(str => {
        setText(str)
      })
  }, [])

  return (
    <>
      <WorkerQuiz editorInitialValue={text} />
    </>
  )
}

export { QuizLoader }
