import { useState, useEffect } from "react"
import { DateTime } from "luxon"

export function useInput(key: any, initialValue: any) {
  const [value, setValue] = useLocalStorage(key, initialValue)

  const onChange = (e: any) => {
    setValue(e.target.value)
  }

  return { value, onChange }
}

export function useLocalStorage(key: any, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    return window.localStorage.getItem(key) || initialValue
  })

  const setValue = (value: any) => {
    setStoredValue(value)
    window.localStorage.setItem(key, value)
  }

  return [storedValue, setValue]
}

export const useTime = (refreshCycle = 1000) => {
  const [now, setNow] = useState(getTime())
  useEffect(() => {
    const intervalId = setInterval(() => setNow(getTime()), refreshCycle)
    return () => clearInterval(intervalId)
  }, [refreshCycle, setInterval, clearInterval, setNow, getTime])
  return now
}

const getTime = () => {
  return DateTime.local()
}
