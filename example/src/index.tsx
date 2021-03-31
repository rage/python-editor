import React, { useState } from "../../node_modules/react"
import { ProgrammingExercise as ProgrammingExerciseLoader } from "../.."
import { ProgrammingExercise } from "../../src/components/ProgrammingExercise"
import { Button, TextField, MenuItem, Grid } from "@material-ui/core"
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
  const userId = useInput("user-id", "")
  const [exerciseToLoad, setExerciseToLoad] = useState({
    userId: userId.value,
    organization: organization.value,
    course: course.value,
    exercise: exercise.value,
    token: token.value,
  })
  const [language, setLanguage] = useState("en")
  const [height, setHeight] = useState("400px")
  const [outputHeight, setOutputHeight] = useState("250px")
  const [fetch, setFetch] = useLocalStorage(
    "fetch",
    false,
    (object): object is boolean => typeof object === "boolean",
  )
  const [details, setDetails] = useState<{}>()
  const handleLoad = (event) => {
    event.preventDefault()
    setExerciseToLoad({
      userId: userId.value,
      organization: organization.value,
      course: course.value,
      exercise: exercise.value,
      token: token.value,
    })
    setFetch(true)
  }
  const handleUnload = (event) => {
    setExerciseToLoad({
      userId: "",
      organization: "",
      course: "",
      exercise: "",
      token: "",
    })
    event.preventDefault()
    setFetch(false)
  }

  return (
    <>
      <div>
        <Grid container direction="row" justify="space-between">
          <Grid item xs={4}>
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
          </Grid>
          <Grid item xs={4}>
            <StyledTextField
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              label="Height"
            />
          </Grid>
          <Grid item xs={4}>
            <StyledTextField
              value={outputHeight}
              onChange={(event) => setOutputHeight(event.target.value)}
              label="Output Height"
            />
          </Grid>
        </Grid>
        <Grid container direction="row" justify="space-between">
          <Grid item xs={6}>
            <StyledTextField
              {...userId}
              label="User id"
              data-cy="user-id-input"
            />
          </Grid>
          <Grid item xs={6}>
            <StyledTextField
              {...token}
              label="User token"
              data-cy="token-input"
            />
          </Grid>
        </Grid>
        <Grid container direction="row" justify="space-between">
          <Grid item xs={4}>
            <StyledTextField
              {...organization}
              label="Organization slug"
              data-cy="organization-input"
            />
          </Grid>
          <Grid item xs={4}>
            <StyledTextField
              {...course}
              label="Course"
              data-cy="course-input"
            />
          </Grid>
          <Grid item xs={4}>
            <StyledTextField
              {...exercise}
              label="Exercise"
              data-cy="exercise-input"
            />
          </Grid>
        </Grid>
        <StyledButton onClick={handleLoad} data-cy="load-btn">
          Reload exercise
        </StyledButton>
        <StyledButton onClick={handleUnload} data-cy="unload-btn">
          Unload exercise
        </StyledButton>
      </div>
      {fetch && (
        <ProgrammingExerciseLoader
          onExerciseDetailsChange={(d) => {
            setDetails(d)
          }}
          userId={exerciseToLoad.userId}
          organization={exerciseToLoad.organization}
          course={exerciseToLoad.course}
          debug={true}
          exercise={exerciseToLoad.exercise}
          token={exerciseToLoad.token}
          height={height}
          outputHeight={outputHeight}
          language={language}
        />
      )}
      {!fetch && (
        <I18nextProvider i18n={i18n}>
          <ProgrammingExercise
            debug={true}
            editorHeight={height}
            outputHeight={outputHeight}
          />
        </I18nextProvider>
      )}
      <h2>Debug</h2>
      {fetch && details && JSON.stringify(details)}
    </>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
