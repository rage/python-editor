import React, { useState, useEffect } from "react"
import JSZip from "jszip"
import JSZipUtils from "jszip-utils"
import axios from "axios"
import fs from "fs"

type QuizLoaderProps = {
  url: string
  token: string
}

const QuizLoader: React.FunctionComponent<QuizLoaderProps> = ({
  url,
  token,
}) => {
  const [text, setText] = useState("Initial text")
  useEffect(() => {
    console.log("This is the effect")
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
        setText("Fetched " + res.data)
        console.log(res)
      })
  }, [])

  return (
    <>
      <p>Hello world, this is your QuizLoader!</p>
      <p>{text}</p>
    </>
  )
}

export { QuizLoader }
