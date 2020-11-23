import { useEffect, useState } from "react"
import { pyodideJsSource, workerJsSource } from "../constants"

const blobObject = URL.createObjectURL(
  new Blob([pyodideJsSource, workerJsSource], {
    type: "application/javascript",
  }),
)

// interface WorkerEventKind<T1, T2> {
//   type: T1
//   msg: T2
// }

// type WorkerEvent =
//   | WorkerEventKind<"error", string>
//   | WorkerEventKind<"print_batch", string[]>
//   | WorkerEventKind<"print_done", void>
//   | WorkerEventKind<"ready", void>
//   | WorkerEventKind<"start_run", void>
//   | WorkerEventKind<"start_tests", void>
//   | WorkerEventKind<string, unknown>

interface Message {
  type: string
  msg?: any
}

console.log("Creating first worker")
const workerPool = [new Worker(blobObject)]

interface WorkerProps {
  // messageListener?: Listener
  debug?: boolean
}

const useWorker = ({ debug }: WorkerProps) => {
  const [worker, setWorker] = useState<Worker | undefined>()
  const [messageBuffer, setMessageBuffer] = useState<Array<Message>>([])

  const createWorker = () => {
    debug && console.log("Workerpool length is", workerPool.length)
    const w = workerPool.pop()
    if (workerPool.length === 0) {
      debug && console.log("Creating another worker")
      workerPool.push(new Worker(blobObject))
    } else {
      debug && console.log("Returning worker without creating new")
    }
    setWorker(w)
  }

  const setMessageListener = (listener: (e: any) => void) => {
    if (worker) {
      worker.onmessage = listener
    }
  }

  const postMessage = (message: Message) => {
    if (worker) {
      worker.postMessage(message)
    } else {
      setMessageBuffer((prev) => prev.concat(message))
      createWorker()
    }
  }

  const terminate = () => {
    debug && console.log("Terminating worker")
    if (worker) {
      worker.onmessage = null
      worker.terminate()
      setWorker(undefined)
    }
  }

  const recycle = () => {
    if (worker) {
      workerPool.push(worker)
      debug && console.log("Recycling worker, pool size:", workerPool.length)
    }
    setWorker(undefined)
  }

  useEffect(() => {
    if (worker) {
      messageBuffer.forEach((message) => worker.postMessage(message))
      setMessageBuffer([])
    }
  }, [worker])

  return [{ setMessageListener, postMessage, recycle, terminate }]
}

export { useWorker }
