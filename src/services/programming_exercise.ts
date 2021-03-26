import { TFunction } from "i18next"
import axios from "axios"
import JSZip from "jszip"

import {
  SubmissionResponse,
  TestResultObject,
  FeedBackAnswer,
  ExerciseDetails,
  FileEntry,
  SubmissionDetails,
} from "../types"
import { EDITOR_NAME, EDITOR_VERSION } from "../constants"

// const baseURL = "http://localhost:3000/api/v8"
const baseURL = "https://tmc.mooc.fi/api/v8"

const getHeaders = (token: string, additional?: any) => ({
  ...additional,
  Authorization: `Bearer ${token}`,
  client: EDITOR_NAME,
  client_version: EDITOR_VERSION,
})

interface Configuration {
  t: TFunction
  token: string
}

const getZipFromUrl = async (
  url: string,
  configuration: Configuration,
): Promise<JSZip> => {
  const { t, token } = configuration
  try {
    const zip = new JSZip()
    const response = await axios.get(url, {
      headers: getHeaders(token),
      responseType: "arraybuffer",
    })
    return await zip.loadAsync(response.data)
  } catch (error) {
    throw error?.response?.status
      ? new Error(`${error.response.status}: ${t("failedToDownloadExercise")}`)
      : new Error(`418: ${t("failedToEstablishConnectionToServer")}`)
  }
}

const getExerciseDetails = async (
  organization: string,
  course: string,
  exercise: string,
  configuration: Configuration,
): Promise<ExerciseDetails> => {
  const { t, token } = configuration
  const url = `${baseURL}/org/${organization}/courses/${course}/exercises/${exercise}`
  const headers = getHeaders(token)
  try {
    const data = (await axios.get(url, { headers, responseType: "json" })).data
    return {
      id: data.id,
      availablePoints: data.available_points?.length,
      awardedPoints: data.awarded_points?.length,
      completed: data.completed,
      deadline: data.deadline,
      expired: data.expired,
      softDeadline: data.soft_deadline,
      unlocked: data.unlocked,
    }
  } catch (error) {
    throw error?.response?.status
      ? new Error(
          `${error.response.status}: ${t("couldNotFindExerciseDetails")}`,
        )
      : new Error(`418: ${t("failedToEstablishConnectionToServer")}`)
  }
}

const getExerciseZip = async (
  organization: string,
  course: string,
  exercise: string,
  configuration: Configuration,
): Promise<JSZip> => {
  return getZipFromUrl(
    `${baseURL}/org/${organization}/courses/${course}/exercises/${exercise}/download`,
    configuration,
  )
}

export const getOldSubmissions = async (
  exerciseId: number,
  configuration: Configuration,
): Promise<Array<SubmissionDetails>> => {
  const { t, token } = configuration
  const url = `${baseURL}/exercises/${exerciseId}/users/current/submissions`
  const headers = getHeaders(token)
  let submissions: any[]
  try {
    const response = await axios.get(url, { headers, responseType: "json" })
    submissions = response.data as any[]
  } catch (error) {
    throw new Error(
      `${error.response.status}: ${t("failedToDownloadExercise")}`,
    )
  }
  return submissions.map<SubmissionDetails>((submission) => ({
    id: submission.id,
    createdAtMillis: Date.parse(submission.created_at),
  }))
}

export const getSubmissionZip = async (
  submissionId: number,
  configuration: Configuration,
): Promise<JSZip> => {
  return getZipFromUrl(
    `${baseURL}/core/submissions/${submissionId}/download`,
    configuration,
  )
}

const getModelSolutionZip = (
  exerciseId: number,
  configuration: Configuration,
): Promise<JSZip> => {
  return getZipFromUrl(
    `${baseURL}/core/exercises/${exerciseId}/solution/download`,
    configuration,
  )
}

const getSubmissionResults = async (
  submissionResponse: SubmissionResponse,
  configuration: Configuration,
): Promise<TestResultObject> => {
  const { t, token } = configuration
  const headers = getHeaders(token)
  const times = [2000, 2000, 1000, 1000, 1000, 2000, 2000, 4000, 8000, 16000]
  for (const time of times) {
    await new Promise((resolve) => setTimeout(resolve, time))
    let submissionStatus
    try {
      submissionStatus = (
        await axios.get(submissionResponse.submissionUrl, {
          headers,
          responseType: "json",
        })
      ).data
    } catch (error) {
      console.error(error.response)
      submissionStatus = { status: "error", statusCode: error.response.status }
    }
    if (submissionStatus.status === "error") {
      throw new Error(
        `${submissionStatus.statusCode}: ${t("submissionProcessFailed")}`,
      )
    } else if (submissionStatus.status !== "processing") {
      const tests = submissionStatus.test_cases as any[]
      const testCases = tests.map((test, index) => ({
        id: index.toString(),
        testName: test.name,
        passed: test.successful,
        feedback: test.message,
      }))
      const points = submissionStatus.points as string[]
      return {
        allTestsPassed: submissionStatus.all_tests_passed,
        points,
        testCases,
        feedbackQuestions: submissionStatus.feedback_questions,
        feedbackAnswerUrl: submissionStatus.feedback_answer_url,
        solutionUrl: submissionStatus.solution_url,
      }
    }
  }
  throw new Error(`418: ${t("submissionTookTooLong")}`)
}

interface ExerciseSubmissionOptions {
  paste?: boolean
}

const postExerciseSubmission = async (
  exerciseId: number,
  files: ReadonlyArray<FileEntry>,
  configuration: Configuration,
  submissionOptions?: ExerciseSubmissionOptions,
): Promise<SubmissionResponse> => {
  const { t, token } = configuration
  const headers = getHeaders(token, { "Content-Type": "multipart/form-data" })
  const paste = submissionOptions?.paste || false
  const zip = new JSZip()
  files.forEach((file) => {
    zip.file(file.fullName, file.content)
  })
  const form = new FormData()
  paste && form.append("paste", "1")
  form.append("submission[file]", await zip.generateAsync({ type: "blob" }))
  try {
    const response = await axios.post(
      `${baseURL}/core/exercises/${exerciseId}/submissions`,
      form,
      { headers },
    )
    return {
      pasteUrl: paste ? response.data.paste_url : undefined,
      showSubmissionUrl: response.data.show_submission_url,
      submissionUrl: response.data.submission_url,
    }
  } catch (error) {
    const status = error.response.status
    const message =
      status === 403
        ? t("authenticationRequired")
        : t("submissionProcessFailed")
    console.error(error.response)
    throw new Error(`${status}: ${message}`)
  }
}

const postExerciseFeedback = async (
  testResults: TestResultObject,
  feedback: Array<FeedBackAnswer>,
  configuration: Configuration,
): Promise<void> => {
  const { token } = configuration
  const headers = getHeaders(token, { "Content-Type": "multipart/form-data" })
  if (!testResults.feedbackAnswerUrl || testResults.feedbackAnswerUrl === "") {
    return
  }
  const form = new FormData()
  feedback.forEach((answer, index) => {
    form.append(`answers[${index}][question_id]`, answer.questionId.toString())
    form.append(`answers[${index}][answer]`, answer.answer.toString())
  })
  try {
    await axios.post(testResults.feedbackAnswerUrl, form, {
      headers,
    })
    return
  } catch (error) {
    throw new Error(`${error.response.status}: ${JSON.parse(error.response)}`)
  }
}

export {
  getExerciseDetails,
  getExerciseZip,
  getModelSolutionZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
}
