import packageJson from "../../package.json"

import workerJsSource from "./workerJsSource"

export * from "./defaultFiles"
export { workerJsSource }

export const EDITOR_NAME = "moocfi_python_editor"
export const EDITOR_VERSION = packageJson.version
