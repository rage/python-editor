import packageJson from "../../package.json"

import newWorkerJsSource from "./newWorkerJsSource"
import pyodideJsSource from "./pyodideJsSource"
import skulptMinJsSource from "./skulptMinJsSource"
import skulptStdlibJsSource from "./skulptStdlibJsSource"
import workerJsSource from "./workerJsSource"

const EDITOR_NAME = "moocfi_python_editor"
const EDITOR_VERSION = packageJson.version

export {
  EDITOR_NAME,
  EDITOR_VERSION,
  newWorkerJsSource,
  pyodideJsSource,
  skulptMinJsSource,
  skulptStdlibJsSource,
  workerJsSource,
}
