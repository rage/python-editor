const fs = require("fs")
const path = require("path")

const files = [
  ["src/components/worker.js", "workerJsSource.ts"],
  ["static/pyodide.js", "pyodideJsSource.ts"],
]

files.forEach(([source, targetName]) => {
  const encoded = fs.readFileSync(
    path.resolve(__dirname, "..", source),
    "base64",
  )
  fs.writeFileSync(
    path.resolve(__dirname, "../src/constants", targetName),
    `export default atob("${encoded}")\n`,
  )
})
