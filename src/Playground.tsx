import React, { useState } from "react"
import { Quiz } from "./components/Quiz"
import QuizLoader from "./components/QuizLoader"
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
// import SimpleErrorBoundary from "./SimpleErrorBoundary"
import { useInput, useLocalStorage } from "./hooks/customHooks"

const hello: string = '# A hello world program\nprint("Hello world")\n'
const infLoop: string = "# An infinite loop\nwhile True:\n pass"
const printis: string = "for i in range(3):\t print(i)"

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
        <StyledTextField {...url} label="Quiz url" data-cy="url-input" />
        <StyledTextField {...token} label="User token" data-cy="token-input" />
        <StyledButton onClick={handleLoad} data-cy="load-btn">
          Load Quiz
        </StyledButton>
        <StyledButton onClick={handleUnload} data-cy="unload-btn">
          Unload Quiz
        </StyledButton>
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
