import skulptMinJsSource64 from "./skulptMinJsSource64"
import skulptStdlibJsSource64 from "./skulptStdlibJsSource64"
import workerJsSource64 from "./workerJsSource64"

const skulptMinJsSource = atob(skulptMinJsSource64) + "\n"
const skulptStdlibJsSource = atob(skulptStdlibJsSource64) + "\n"
const workerJsSource = atob(workerJsSource64) + "\n"

export { skulptMinJsSource, skulptStdlibJsSource, workerJsSource }
