import React from "react"
import { Quiz } from "../../src/components/Quiz"
import { QuizLoader } from "../../src/components/QuizLoader"
import { Button, TextField } from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import { useInput, useLocalStorage } from "../../src/hooks/customHooks"

const StyledTextField = styled((props) => (
  <TextField variant="outlined" fullWidth {...props} />
))`
  margin: 1rem;
`

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 1rem;
`

const App = () => {
  const organization = useInput("organization", "")
  const course = useInput("course", "")
  const exercise = useInput("exercise", "")
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
  const loadQuiz = (organization, course, exercise, token) => {
    console.log(
      `Got organization=${organization}, course=${course}, exercise=${exercise}, token=${token}`,
    )
    return (
      <QuizLoader
        organization={organization}
        course={course}
        exercise={exercise}
        token={token}
        height={"400px"}
      />
    )
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
      {fetch &&
        loadQuiz(organization.value, course.value, exercise.value, token.value)}
      {!fetch && <Quiz editorHeight={"400px"} outputHeight={"250px"} />}
    </>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
