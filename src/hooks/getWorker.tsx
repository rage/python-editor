import { useEffect, useState } from "react"
import { pyodideJsSource, newWorkerJsSource } from "../constants"

const blobObject = URL.createObjectURL(
  new Blob([pyodideJsSource, newWorkerJsSource], {
    type: "application/javascript",
  }),
)

interface Message {
  type: string
  msg?: any
}

const useWorker = () => {
  const [worker, setWorker] = useState<Worker | undefined>()
  const [messageBuffer, setMessageBuffer] = useState<Array<Message>>([])

  const createWorker = () => {
    console.log("Creating worker")
    const w = new Worker(blobObject)
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
    if (worker) {
      worker.terminate()
      setWorker(undefined)
    }
  }

  useEffect(() => {
    if (worker) {
      messageBuffer.forEach((message) => worker.postMessage(message))
      setMessageBuffer([])
    }
  }, [worker])

  return [{ setMessageListener, postMessage, terminate }]
}

export { useWorker }
