import React from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import {
  ProgrammingExerciseLoader,
  ProgrammingExerciseLoaderProps,
} from "./components/ProgrammingExerciseLoader"

const ProgrammingExercise: React.FunctionComponent<ProgrammingExerciseLoaderProps> =
  (props: ProgrammingExerciseLoaderProps) => (
    <I18nextProvider i18n={i18n}>
      <ProgrammingExerciseLoader {...props} />
    </I18nextProvider>
  )

export { ProgrammingExercise }
