import React from "react"
import { Quiz, QuizLoader } from "../../"
import { Button, TextField } from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import { useInput, useLocalStorage } from "../../"

const StyledTextField = styled(props => (
  <TextField variant="outlined" fullWidth {...props} />
))`
  margin: 1rem;
`

const StyledButton = styled(props => <Button variant="contained" {...props} />)`
  margin: 1rem;
`

const App = () => {
  const organization = useInput("organization", "")
  const course = useInput("course", "")
  const exercise = useInput("exercise", "")
  const token = useInput("token", "")
  const [fetch, setFetch] = useLocalStorage("fetch", false)
  const url = `https://tmc.mooc.fi/api/v8/org/${organization.value}/courses/${course.value}/exercises/${exercise.value}`
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
        <StyledTextField
          {...organization}
          label="Organization slug"
          data-cy="organization-input"
        />
        <StyledTextField {...course} label="Course" data-cy="course-input" />
        <StyledTextField
          {...exercise}
          label="Exercise"
          data-cy="exercise-input"
        />
        <StyledTextField {...token} label="User token" data-cy="token-input" />
        <StyledButton onClick={handleLoad} data-cy="load-btn">
          Load Quiz
        </StyledButton>
        <StyledButton onClick={handleUnload} data-cy="unload-btn">
          Unload Quiz
        </StyledButton>
      </div>
      {fetch && loadQuiz(url, token.value)}
      {!fetch && <Quiz />}
    </>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
