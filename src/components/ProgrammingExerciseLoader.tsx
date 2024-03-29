import { DateTime } from "luxon"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useTime } from "../hooks/customHooks"
import {
  TestResultObject,
  Language,
  ExerciseDetails,
  FileEntry,
} from "../types"
import { ProgrammingExercise } from "./ProgrammingExercise"
import {
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
} from "../services/programming_exercise"
import Notification from "./Notification"
import useExercise from "../hooks/useExercise"

interface ProgrammingExerciseLoaderProps {
  onExerciseDetailsChange?: (exerciseDetails?: ExerciseDetails) => void
  organization: string
  course: string
  exercise: string
  token: string
  userId: string
  height?: string
  outputHeight?: string
  debug?: boolean
  language?: Language
}

/*  Loads the ProgrammingExercise from the server. Then returns a ProgrammingExercise component
    with the initial editor text set to the contents of the first
    file whose path contains "/src/__main__.py".
*/
const ProgrammingExerciseLoader: React.FunctionComponent<ProgrammingExerciseLoaderProps> =
  ({
    onExerciseDetailsChange,
    organization,
    course,
    exercise,
    token,
    userId,
    height,
    outputHeight,
    debug,
    language = "en",
  }) => {
    const time = useTime(10000)
    const [t, i18n] = useTranslation()
    const exerciseObject = useExercise(
      organization,
      course,
      exercise,
      userId,
      token,
    )

    const apiConfig = { t, token }
    const signedIn = userId && token
    const exerciseDefined = organization && course && exercise

    const cacheKey =
      signedIn && exerciseDefined
        ? `${userId}:${organization}-${course}-${exercise}`
        : undefined

    const submitAndWaitResult = async (files: ReadonlyArray<FileEntry>) => {
      const wrapError = (message: string): TestResultObject => ({
        points: [],
        testCases: [
          {
            id: "0",
            testName: "Exercise submission",
            passed: false,
            feedback: `Error ${message}`,
          },
        ],
      })
      if (!exerciseObject.details) {
        return wrapError("418: Exercise details missing")
      }

      try {
        const postResult = await postExerciseSubmission(
          exerciseObject.details.id,
          files,
          apiConfig,
        )
        try {
          const submissionResult = await getSubmissionResults(
            postResult,
            apiConfig,
          )
          exerciseObject.updateDetails()
          return submissionResult
        } catch (e: any) {
          return wrapError(e.message)
        }
      } catch (e: any) {
        return wrapError(e.message)
      }
    }

    const submitToPaste = async (
      files: ReadonlyArray<FileEntry>,
    ): Promise<string> => {
      if (!exerciseObject.details) {
        return ""
      }
      try {
        const submitResult = await postExerciseSubmission(
          exerciseObject.details.id,
          files,
          apiConfig,
          { paste: true },
        )
        return submitResult.pasteUrl ?? ""
      } catch (e: any) {
        return Promise.reject(e.message)
      }
    }

    useEffect(() => {
      const exerciseDetails = exerciseObject.details
      if (
        exerciseDetails &&
        exerciseDetails.deadline &&
        !exerciseDetails.expired &&
        time >= DateTime.fromISO(exerciseDetails.deadline)
      ) {
        exerciseObject.updateDetails()
      }
    }, [exerciseObject, time])

    useEffect(() => {
      onExerciseDetailsChange?.(exerciseObject.details)
    }, [exerciseObject.details, onExerciseDetailsChange])

    useEffect(() => {
      if (i18n.language !== language) {
        i18n.changeLanguage(language)
      }
    }, [i18n, language])

    const submitDisabled =
      exerciseObject.details?.expired ||
      !exerciseObject.details?.downloadable ||
      !signedIn

    return (
      <div>
        {!signedIn && (
          <Notification style="warning">
            {t("signInToSubmitExercise")}
          </Notification>
        )}
        {exerciseObject.details?.expired && (
          <Notification style="warning">{t("deadlineExpired")}</Notification>
        )}
        <ProgrammingExercise
          cacheKey={cacheKey}
          debug={debug}
          exercise={exerciseObject}
          submitFeedback={(testResults, feedback) => {
            if (testResults.feedbackAnswerUrl && feedback.length > 0) {
              postExerciseFeedback(testResults, feedback, apiConfig)
            }
          }}
          submitProgrammingExercise={submitAndWaitResult}
          submitToPaste={submitToPaste}
          submitDisabled={submitDisabled}
          editorHeight={height}
          outputHeight={outputHeight}
          solutionUrl={
            exerciseObject.details?.completed || exerciseObject.details?.expired
              ? `https://tmc.mooc.fi/exercises/${exerciseObject.details.id}/solution`
              : undefined
          }
        />
      </div>
    )
  }

export { ProgrammingExerciseLoader, ProgrammingExerciseLoaderProps }
