import packageJson from "../../package.json"

import pyodideJsSource from "./pyodideJsSource"
import workerJsSource from "./workerJsSource"

const EDITOR_NAME = "moocfi_python_editor"
const EDITOR_VERSION = packageJson.version

export { EDITOR_NAME, EDITOR_VERSION, pyodideJsSource, workerJsSource }
