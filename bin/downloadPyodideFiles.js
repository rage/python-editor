const fetch = require("node-fetch")
const fs = require("fs")
const path = require("path")

const BASE_DL_URL = "https://download.mooc.fi/pyodide-cdn/v0.16.1"
const PYODIDE_FIXTURE_PATH = path.join(
  __dirname,
  "..",
  "example",
  "cypress",
  "fixtures",
  "pyodide",
)

if (!fs.existsSync(PYODIDE_FIXTURE_PATH)) {
  fs.mkdirSync(PYODIDE_FIXTURE_PATH, { recursive: true })
}

/**
 * @param {import("node-fetch").RequestInfo} url
 * @param {string} fileName
 */
const download = async (url, fileName) => {
  const downloadPath = path.join(PYODIDE_FIXTURE_PATH, fileName)

  if (fs.existsSync(downloadPath)) {
    console.log("File", downloadPath, "already exists.")
    return
  }

  console.log("Downloading", fileName, "from", url)
  const res = await fetch(url)
  if (!res.ok) {
    throw "Failed to download from " + url
  }

  fs.writeFileSync(downloadPath, await res.buffer())
  console.log(fileName, "downloaded!")
}

;(async () => {
  const files = [
    "packages.json",
    "pyodide.js",
    "pyodide.asm.js",
    "pyodide.asm.data",
    "pyodide.asm.data.js",
    "pyodide.asm.wasm",
  ]
  await Promise.all(
    files.map((file) => download(`${BASE_DL_URL}/${file}`, file)),
  )
  console.log("Done")
})()
