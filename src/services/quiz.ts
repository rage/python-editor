import axios from "axios"
import JSZip from "jszip"

const getZippedQuiz = (url: string, token: string): Promise<any> => {
  return axios
    .request({
      responseType: "arraybuffer",
      url,
      method: "get",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    .then(res => {
      const zip = new JSZip()
      return zip.loadAsync(res.data)
    })
}

export { getZippedQuiz }
