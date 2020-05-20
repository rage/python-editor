import axios from "axios"
import JSZip from "jszip"
import { Result, Err, Ok } from "ts-results"
import { FileEntry } from "../components/QuizLoader"
import { SubmissionResponse, TestResultObject } from "../types"

interface Error {
  status: number
  message: string
}

interface SubmitOptions {
  paste?: boolean
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  client: "python_editor",
  client_version: "0.6.1",
})

const getZippedQuiz = async (
  url: string,
  token: string,
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
        message: "Failed to download exercise.",
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
        message: "Failed to download exercise.",
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
        status === 403 ? "Authentication required" : "Submission process failed"
      console.error(error.response)
      return new Err({ status, message })
    })
}

const fetchSubmissionResult = async (
  url: string,
  token: string,
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
        console.log(res.data)
        return res.data
      })
      .catch((err) => {
        console.error(err.response)
        return { status: "error", statusCode: err.response.status }
      })

    if (submissionStatus.status === "error") {
      return new Err({
        status: submissionStatus.statusCode,
        message: "Submission process failed",
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
      return new Ok({ points, testCases })
    }
  }
  return new Err({
    status: 418,
    message: "Submission was taking a really long time.",
  })
}

export { getZippedQuiz, submitQuiz, fetchSubmissionResult }
