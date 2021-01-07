import { TFunction } from "i18next"
import axios from "axios"
import JSZip from "jszip"
import { Result, Err, Ok } from "ts-results"
import {
  SubmissionResponse,
  TestResultObject,
  FeedBackAnswer,
  ExerciseDetails,
  FileEntry,
  SubmissionDetails,
} from "../types"
import { EDITOR_NAME, EDITOR_VERSION } from "../constants"

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

interface Error {
  status: number
  message: string
}

const getZipFromUrl = async (
  url: string,
  configuration: Configuration,
): Promise<Result<JSZip, Error>> => {
  const { t, token } = configuration
  try {
    const zip = new JSZip()
    const response = await axios.get(url, {
      headers: getHeaders(token),
      responseType: "arraybuffer",
    })
    return Ok(await zip.loadAsync(response.data))
  } catch (error) {
    return error?.response?.status
      ? Err({
          status: error.response.status,
          message: t("failedToDownloadExercise"),
        })
      : Err({
          status: 418,
          message: t("failedToEstablishConnectionToServer"),
        })
  }
}

const getExerciseDetails = async (
  organization: string,
  course: string,
  exercise: string,
  configuration: Configuration,
): Promise<Result<ExerciseDetails, Error>> => {
  const { t, token } = configuration
  const url = `${baseURL}/org/${organization}/courses/${course}/exercises/${exercise}`
  const headers = getHeaders(token)
  try {
    const data = (await axios.get(url, { headers, responseType: "json" })).data
    return Ok({
      id: data.id,
      availablePoints: data.available_points?.length,
      awardedPoints: data.awarded_points?.length,
      completed: data.completed,
      deadline: data.deadline,
      expired: data.expired,
      softDeadline: data.soft_deadline,
    })
  } catch (error) {
    return error?.response?.status
      ? Err({
          status: error.response.status,
          message: t("couldNotFindExerciseDetails"),
        })
      : Err({
          status: 418,
          message: t("failedToEstablishConnectionToServer"),
        })
  }
}

const getExerciseZip = async (
  organization: string,
  course: string,
  exercise: string,
  configuration: Configuration,
): Promise<Result<JSZip, Error>> => {
  return getZipFromUrl(
    `${baseURL}/org/${organization}/courses/${course}/exercises/${exercise}/download`,
    configuration,
  )
}

const getLatestSubmissionDetails = async (
  exerciseId: number,
  configuration: Configuration,
): Promise<Result<SubmissionDetails, Error>> => {
  const { t, token } = configuration
  const url = `${baseURL}/exercises/${exerciseId}/users/current/submissions`
  const headers = getHeaders(token)
  let submissions: any[]
  try {
    const response = await axios.get(url, { headers, responseType: "json" })
    submissions = response.data as any[]
  } catch (error) {
    return Err({
      status: error.response.status,
      message: t("failedToDownloadExercise"),
    })
  }
  if (submissions.length <= 0) {
    return Err({
      status: 9001,
      message: "No submissions",
    })
  }
  const latestSubmissionDetails: SubmissionDetails[] = submissions.map(
    (submission) => ({
      id: submission.id,
      createdAtMillis: Date.parse(submission.created_at),
    }),
  )
  const latest = latestSubmissionDetails.reduce((latest, current) => {
    return current.createdAtMillis > latest.createdAtMillis ? current : latest
  }, latestSubmissionDetails[0])
  return Ok(latest)
}

const getLatestSubmissionZip = async (
  submissionId: number,
  configuration: Configuration,
): Promise<Result<JSZip | undefined, Error>> => {
  return getZipFromUrl(
    `${baseURL}/core/submissions/${submissionId}/download`,
    configuration,
  )
}

const getModelSolutionZip = (
  exerciseId: number,
  configuration: Configuration,
): Promise<Result<JSZip, Error>> => {
  return getZipFromUrl(
    `${baseURL}/core/exercises/${exerciseId}/solution/download`,
    configuration,
  )
}

const getSubmissionResults = async (
  submissionResponse: SubmissionResponse,
  configuration: Configuration,
): Promise<Result<TestResultObject, Error>> => {
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
      return Err({
        status: submissionStatus.statusCode,
        message: t("submissionProcessFailed"),
      })
    } else if (submissionStatus.status !== "processing") {
      const tests = submissionStatus.test_cases as any[]
      const testCases = tests.map((test, index) => ({
        id: index.toString(),
        testName: test.name,
        passed: test.successful,
        feedback: test.message,
      }))
      const points = submissionStatus.points as string[]
      return Ok({
        allTestsPassed: submissionStatus.all_tests_passed,
        points,
        testCases,
        feedbackQuestions: submissionStatus.feedback_questions,
        feedbackAnswerUrl: submissionStatus.feedback_answer_url,
        solutionUrl: submissionStatus.solution_url,
      })
    }
  }
  return Err({
    status: 418,
    message: t("submissionTookTooLong"),
  })
}

interface ExerciseSubmissionOptions {
  paste?: boolean
}

const postExerciseSubmission = async (
  exerciseId: number,
  files: Array<FileEntry>,
  configuration: Configuration,
  submissionOptions?: ExerciseSubmissionOptions,
): Promise<Result<SubmissionResponse, Error>> => {
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
    return Ok({
      pasteUrl: paste ? response.data.paste_url : undefined,
      showSubmissionUrl: response.data.show_submission_url,
      submissionUrl: response.data.submission_url,
    })
  } catch (error) {
    const status = error.response.status
    const message =
      status === 403
        ? t("authenticationRequired")
        : t("submissionProcessFailed")
    console.error(error.response)
    return Err({ status, message })
  }
}

const postExerciseFeedback = async (
  testResults: TestResultObject,
  feedback: Array<FeedBackAnswer>,
  configuration: Configuration,
): Promise<Result<void, Error>> => {
  const { t, token } = configuration
  const headers = getHeaders(token, { "Content-Type": "multipart/form-data" })
  if (!testResults.feedbackAnswerUrl || testResults.feedbackAnswerUrl === "") {
    return Ok.EMPTY
  }
  const form = new FormData()
  feedback.forEach((answer, index) => {
    form.append(`answers[${index}][question_id]`, answer.questionId.toString())
    form.append(`answers[${index}][answer]`, answer.answer.toString())
  })
  try {
    const response = await axios.post(testResults.feedbackAnswerUrl, form, {
      headers,
    })
    return Ok.EMPTY
  } catch (error) {
    return Err({
      status: error.response.status,
      message: JSON.parse(error.response),
    })
  }
}

export {
  getExerciseDetails,
  getExerciseZip,
  getLatestSubmissionZip,
  getLatestSubmissionDetails,
  getModelSolutionZip,
  getSubmissionResults,
  postExerciseFeedback,
  postExerciseSubmission,
}
