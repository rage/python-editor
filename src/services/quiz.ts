import axios from "axios"
import JSZip from "jszip"
import { FileEntry } from "../components/QuizLoader"
import { SubmissionResponse, TestResultObject } from "../types"

interface SubmitOptions {
  paste?: boolean
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  client: "python_editor",
  client_version: "0.5.0",
})

const getZippedQuiz = (
  url: string,
  token: string,
): [Promise<JSZip>, Promise<string>] => {
  const headers = getHeaders(token)
  const zip = axios
    .request({
      responseType: "arraybuffer",
      url: `${url}/download`,
      method: "get",
      headers,
    })
    .then(res => {
      const zip = new JSZip()
      return zip.loadAsync(res.data)
    })
  const submissionUrl = axios
    .request({
      responseType: "json",
      url,
      method: "get",
      headers,
    })
    .then(res => `https://tmc.mooc.fi/api/v8/core/exercises/${res.data.id}`)
  return [zip, submissionUrl]
}

const submitQuiz = async (
  url: string,
  token: string,
  files: Array<FileEntry>,
  submitOptions?: SubmitOptions,
): Promise<SubmissionResponse> => {
  const paste = submitOptions?.paste || false
  const zip = new JSZip()
  const form = new FormData()
  files.forEach(file => {
    zip.file(file.fullName, file.content)
  })
  if (paste) {
    console.log("this is paste submission")
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
    .then(res => ({
      pasteUrl: paste ? res.data.paste_url : undefined,
      showSubmissionUrl: res.data.show_submission_url,
      submissionUrl: res.data.submission_url,
    }))
}

const fetchSubmissionResult = async (
  url: string,
  token: string,
): Promise<TestResultObject> => {
  const headers = getHeaders(token)
  let resultObject: TestResultObject = { points: [], testCases: [] }
  let timeWaited = 0
  let statusProcessing = true
  while (statusProcessing) {
    const submissionStatus = await axios
      .request({
        responseType: "json",
        url,
        method: "get",
        headers,
      })
      .then(res => {
        console.log(res.data)
        return res.data
      })
      .catch(err => {
        console.log(err)
      })

    if (submissionStatus.status !== "processing") {
      console.log(submissionStatus)
      statusProcessing = false
      const tests = submissionStatus.test_cases as any[]
      const testCases = tests.map((test, index) => ({
        id: index.toString(),
        testName: test.name,
        passed: test.successful,
        feedback: test.message,
        points: submissionStatus.points,
      }))
      const points = submissionStatus.points as string[]
      resultObject = { points, testCases }
    } else if (timeWaited >= 10000) {
      // TODO: Return test result objekt
      console.log("Tests timed out")
      break
    }

    await new Promise(resolve => setTimeout(resolve, 2500))
    timeWaited += 2500
  }
  return resultObject
}

export { getZippedQuiz, submitQuiz, fetchSubmissionResult }
