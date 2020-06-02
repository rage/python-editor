import React, { useState } from "../../node_modules/react"
import { ProgrammingExercise as QuizLoader } from "../.."
import { Quiz } from "../../src/components/Quiz"
import { Button, TextField, MenuItem } from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import { useInput, useLocalStorage } from "../../src/hooks/customHooks"
import { I18nextProvider } from "../../node_modules/react-i18next"
import i18n from "../../src/i18n"

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
  const [language, setLanguage] = useState("en")
  const [height, setHeight] = useState("400px")
  const [outputHeight, setOutputHeight] = useState("250px")
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
        height={height}
        outputHeight={outputHeight}
        language={language}
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
        <StyledTextField
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          label="Language"
          data-cy="language-input"
          select
        >
          {["en", "fi"].map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </StyledTextField>
        <StyledTextField
          value={height}
          onChange={(event) => setHeight(event.target.value)}
          label="Height"
        />
        <StyledTextField
          value={outputHeight}
          onChange={(event) => setOutputHeight(event.target.value)}
          label="Output Height"
        />
        <StyledButton onClick={handleLoad} data-cy="load-btn">
          Load Quiz
        </StyledButton>
        <StyledButton onClick={handleUnload} data-cy="unload-btn">
          Unload Quiz
        </StyledButton>
      </div>
      {fetch && (
        <>
          {loadQuiz(
            organization.value,
            course.value,
            exercise.value,
            token.value,
          )}
        </>
      )}
      {!fetch && (
        <I18nextProvider i18n={i18n}>
          <Quiz editorHeight={height} outputHeight={outputHeight} />
        </I18nextProvider>
      )}
    </>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
