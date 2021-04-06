import { useState, useEffect } from "react"
import { DateTime } from "luxon"
import { useLocalStorage } from "./useLocalStorage"
import { isString } from "../utils/strings"

export function useInput(key: string, initialValue: string) {
  const [value, setValue] = useLocalStorage(key, initialValue, isString)

  const onChange = (e: any) => {
    setValue(e.target.value)
  }

  return { value, onChange }
}

export const useTime = (refreshCycle = 1000) => {
  const [now, setNow] = useState(getTime())
  useEffect(() => {
    const intervalId = setInterval(() => setNow(getTime()), refreshCycle)
    return () => clearInterval(intervalId)
  }, [refreshCycle, setNow])
  return now
}

const getTime = () => {
  return DateTime.local()
}
