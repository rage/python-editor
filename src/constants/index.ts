import skulptMinJsSource from "./skulptMinJsSource"
import skulptStdlibJsSource from "./skulptStdlibJsSource"
import workerJsSource from "./workerJsSource"
import packageJson from "../../package.json"

const EDITOR_NAME = "moocfi_python_editor"
const EDITOR_VERSION = packageJson.version

export {
  EDITOR_NAME,
  EDITOR_VERSION,
  skulptMinJsSource,
  skulptStdlibJsSource,
  workerJsSource,
}
