import React, { useState } from "react"
import { Quiz } from "../../src"
import { QuizLoader } from "../../src/components/QuizLoader"
import {
  FormControlLabel,
  Checkbox,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import SimpleErrorBoundary from "./SimpleErrorBoundary"
import { useInput, useLocalStorage } from "./customHooks"

const hello: string = '# A hello world program\nprint("Hello world")\n'

const App = () => {
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [fetch, setFetch] = useState(false)
  const handleFetch = () => {
    event.preventDefault()
    setFetch(true)
  }
  const loadQuiz = (url, token) => <QuizLoader url={url} token={token} />

  return (
    <>
      <form onSubmit={handleFetch}>
        <div>
          url
          <input
            type="url"
            value={url}
            name="URL"
            onChange={({ target }) => setUrl(target.value)}
          />
        </div>
        <div>
          token
          <input
            type="token"
            value={token}
            name="Token"
            onChange={({ target }) => setToken(target.value)}
          />
        </div>
        <button type="submit">fetch quiz</button>
      </form>
      {fetch && loadQuiz(url, token)}
      {!fetch && <Quiz editorInitialValue={hello} />}
    </>
  )
}

export default App
