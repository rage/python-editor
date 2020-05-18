import fs from "fs"
import path from "path"

const skulptMinSource = fs.readFileSync(
  __dirname + "/../../static/skulpt.min.js",
  "utf8",
)
const skulptStdlibSource = fs.readFileSync(
  __dirname + "/../../static/skulpt-stdlib.js",
  "utf8",
)
const workerSource = fs.readFileSync(
  __dirname + "/../components/worker.js",
  "utf8",
)

export { skulptMinSource, skulptStdlibSource, workerSource }
