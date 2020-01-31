import React, { useState } from "react"
import { Quiz, WorkerQuiz, QuizLoader } from "../../src/index"
import {} from "../../src/components/QuizLoader"
import {
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import SimpleErrorBoundary from "./SimpleErrorBoundary"
import { useInput, useLocalStorage } from "../../src/hooks/customHooks"

const hello: string = '# A hello world program\nprint("Hello world")\n'
const infLoop: string = "# An infinite loop\nwhile True:\n pass"
const printis: string = "for i in range(3):\n print(i)"

const StyledTextField = styled(props => (
  <TextField variant="outlined" fullWidth {...props} />
))`
  margin: 1rem;
`

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

const App = () => {
  const url = useInput("url", "")
  const token = useInput("token", "")
  const [fetch, setFetch] = useLocalStorage("fetch", false)
  const handleLoad = () => {
    event.preventDefault()
    setFetch(true)
  }
  const handleUnload = () => {
    event.preventDefault()
    setFetch(false)
  }
  const loadQuiz = (url, token) => {
    console.log(`Got url=${url}, token=${token}`)
    return <QuizLoader url={url} token={token} />
  }

  return (
    <>
      <div>
        <StyledTextField {...url} label="Quiz url" />
        <StyledTextField {...token} label="User token" />
        <StyledButton onClick={handleLoad}>Load Quiz</StyledButton>
        <StyledButton onClick={handleUnload}>Unload Quiz</StyledButton>
      </div>
      {fetch && loadQuiz(url.value, token.value)}
      {!fetch && <Quiz editorInitialValue={printis} />}
    </>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
