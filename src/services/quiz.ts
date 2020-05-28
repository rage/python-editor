import { TFunction } from "i18next"
import axios from "axios"
import JSZip from "jszip"
import { Result, Err, Ok } from "ts-results"
import { FileEntry } from "../components/QuizLoader"
import { SubmissionResponse, TestResultObject, FeedBackAnswer } from "../types"
import { EDITOR_NAME, EDITOR_VERSION } from "../constants"

interface Error {
  status: number
  message: string
}

interface SubmitOptions {
  paste?: boolean
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  client: EDITOR_NAME,
  client_version: EDITOR_VERSION,
})

const getZippedQuiz = async (
  url: string,
  token: string,
  t: TFunction,
): Promise<Result<[JSZip, string], Error>> => {
  const headers = getHeaders(token)
  const zip = axios
    .request({
      responseType: "arraybuffer",
      url: `${url}/download`,
      method: "get",
      headers,
    })
    .then((res) => {
      const zip = new JSZip()
      return zip.loadAsync(res.data)
    })
    .catch((error) => {
      console.error(error)
      throw {
        status: error.response.status,
        message: t("failedToDownloadExercise"),
      }
    })
  const submissionUrl = axios
    .request({
      responseType: "json",
      url,
      method: "get",
      headers,
    })
    .then((res) => `https://tmc.mooc.fi/api/v8/core/exercises/${res.data.id}`)
    .catch((error) => {
      throw {
        status: error.response.status,
        message: t("failedToDownloadExercise"),
      }
    })
  try {
    return new Ok(await Promise.all([zip, submissionUrl]))
  } catch (error) {
    return new Err(error)
  }
}

const submitQuiz = async (
  url: string,
  token: string,
  t: TFunction,
  files: Array<FileEntry>,
  submitOptions?: SubmitOptions,
): Promise<Result<SubmissionResponse, Error>> => {
  const paste = submitOptions?.paste || false
  const zip = new JSZip()
  const form = new FormData()
  files.forEach((file) => {
    zip.file(file.fullName, file.content)
  })
  if (paste) {
    form.append("paste", "1")
  }
  form.append("submission[file]", await zip.generateAsync({ type: "blob" }))

  return axios
    .request({
      url: url + "/submissions",
      method: "post",
      data: form,
      headers: {
        ...getHeaders(token),
        "Content-Type": "multipart/form-data",
      },
    })
    .then(
      (result) =>
        new Ok({
          pasteUrl: paste ? result.data.paste_url : undefined,
          showSubmissionUrl: result.data.show_submission_url,
          submissionUrl: result.data.submission_url,
        }),
    )
    .catch((error) => {
      const status = error.response.status
      let message =
        status === 403
          ? t("authenticationRequired")
          : t("submissionProcessFailed")
      console.error(error.response)
      return new Err({ status, message })
    })
}

const fetchSubmissionResult = async (
  url: string,
  token: string,
  t: TFunction,
): Promise<Result<TestResultObject, Error>> => {
  const headers = getHeaders(token)
  const times = [2000, 2000, 1000, 1000, 1000, 2000, 2000, 4000, 8000, 16000]
  for (const time of times) {
    await new Promise((resolve) => setTimeout(resolve, time))
    const submissionStatus = await axios
      .request({
        responseType: "json",
        url,
        method: "get",
        headers,
      })
      .then((res) => {
        // console.log(res.data)
        return res.data
      })
      .catch((err) => {
        console.error(err.response)
        return { status: "error", statusCode: err.response.status }
      })

    if (submissionStatus.status === "error") {
      return new Err({
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
      return new Ok({
        allTestsPassed: submissionStatus.all_tests_passed,
        points,
        testCases,
        feedbackQuestions: submissionStatus.feedback_questions,
        feedbackAnswerUrl: submissionStatus.feedback_answer_url,
        solutionUrl: submissionStatus.solution_url,
      })
    }
  }
  return new Err({
    status: 418,
    message: t("submissionTookTooLong"),
  })
}

const submitFeedback = async (
  url: string,
  token: string,
  feedback: Array<FeedBackAnswer>,
): Promise<void> => {
  const form = new FormData()
  feedback.forEach((answer, index) => {
    form.append(`answers[${index}][question_id]`, answer.questionId.toString())
    form.append(`answers[${index}][answer]`, answer.answer.toString())
  })
  return axios
    .request({
      url,
      method: "post",
      data: form,
      headers: {
        ...getHeaders(token),
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => {
      // console.log(res.data)
    })
    .catch((error) => {
      console.error(error.response)
    })
}

export { getZippedQuiz, submitQuiz, fetchSubmissionResult, submitFeedback }
