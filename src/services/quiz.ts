import axios from "axios"
import JSZip from "jszip"
import { FileEntry } from "../components/QuizLoader"

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
    .then(res => {
      console.log(res.data)
      return `https://tmc.mooc.fi/api/v8/core/exercises/${res.data.id}`
    })
  return [zip, submissionUrl]
}

const submitQuiz = async (
  url: string,
  token: string,
  files: Array<FileEntry>,
  submitOptions?: SubmitOptions,
): Promise<string> => {
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
    .then(res => {
      console.log(res.data)
      return paste ? res.data.paste_url : res.data.show_submission_url
    })
    .catch(error => {
      console.error(error)
      return "Error when submiting"
    })
}

export { getZippedQuiz, submitQuiz }
