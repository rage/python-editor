const fs = require("fs")
const path = require("path")

const files = [
  ["static/skulpt.min.js", "skulptMinJsSource64.ts"],
  ["static/skulpt-stdlib.js", "skulptStdlibJsSource64.ts"],
  ["src/components/worker.js", "workerJsSource64.ts"],
]

files.forEach(([source, targetName]) => {
  const encoded = fs.readFileSync(
    path.resolve(__dirname, "..", source),
    "base64",
  )
  fs.writeFileSync(
    path.resolve(__dirname, "../src/constants", targetName),
    `export default "${encoded}"\n`,
  )
})
