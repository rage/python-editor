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
  const [exerciseToLoad, setExerciseToLoad] = useState({
    organization: organization.value,
    course: course.value,
    exercise: exercise.value,
  })
  const [language, setLanguage] = useState("en")
  const [height, setHeight] = useState("400px")
  const [outputHeight, setOutputHeight] = useState("250px")
  const [fetch, setFetch] = useLocalStorage("fetch", false)
  const [details, setDetails] = useState<{}>()
  const handleLoad = (event) => {
    event.preventDefault()
    setExerciseToLoad({
      organization: organization.value,
      course: course.value,
      exercise: exercise.value,
    })
    setFetch(true)
  }
  const handleUnload = (event) => {
    setExerciseToLoad({ organization: "", course: "", exercise: "" })
    event.preventDefault()
    setFetch(false)
  }
  const loadExercise = (organization, course, exercise, token) => {
    console.log(
      `Got organization=${organization}, course=${course}, exercise=${exercise}, token=${token}`,
    )
    return (
      <ProgrammingExerciseLoader
        onExerciseDetailsChange={(d) => {
          setDetails(d)
        }}
        organization={organization}
        course={course}
        debug={true}
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
        <Grid container direction="row" justify="space-between">
          <StyledTextField
            {...token}
            label="User token"
            data-cy="token-input"
          />
        </Grid>
        <Grid container direction="row" justify="space-between">
          <Grid item xs={6}>
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
        </Grid>
        <Grid container direction="row" justify="space-between">
          <Grid item xs={6}>
            <StyledTextField
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              label="Height"
            />
          </Grid>
          <Grid item xs={6}>
            <StyledTextField
              value={outputHeight}
              onChange={(event) => setOutputHeight(event.target.value)}
              label="Output Height"
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
        <>
          {loadExercise(
            exerciseToLoad.organization,
            exerciseToLoad.course,
            exerciseToLoad.exercise,
            token.value,
          )}
        </>
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
