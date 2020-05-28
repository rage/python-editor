import React from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import { QuizLoader, QuizLoaderProps } from "./components/QuizLoader"

const ProgrammingExercise: React.FunctionComponent<QuizLoaderProps> = (
  props: QuizLoaderProps,
) => (
  <I18nextProvider i18n={i18n}>
    <QuizLoader {...props} />
  </I18nextProvider>
)

export { ProgrammingExercise }
