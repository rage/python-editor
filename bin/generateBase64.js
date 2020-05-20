const fs = require("fs")
const path = require("path")

const files = [
  ["static/skulpt.min.js", "skulptMinJsSource.ts"],
  ["static/skulpt-stdlib.js", "skulptStdlibJsSource.ts"],
  ["src/components/worker.js", "workerJsSource.ts"],
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
