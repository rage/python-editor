import { useState, useEffect } from "react"
import { DateTime } from "luxon"

export function useInput(key: string, initialValue: string) {
  const [value, setValue] = useLocalStorage(
    key,
    initialValue,
    (x): x is string => typeof x === "string",
  )

  const onChange = (e: any) => {
    setValue(e.target.value)
  }

  return { value, onChange }
}

export function useLocalStorage<T>(
  key: string | undefined,
  initialValue: T,
  isCachedData: (object: unknown) => object is T,
): [T, (t: T) => void] {
  const [storedValue, setStoredValue] = useState(() => {
    if (!key) return initialValue
    const cached = window.localStorage.getItem(key)
    if (!cached) return initialValue

    try {
      const parsed = JSON.parse(cached)
      if (isCachedData(parsed)) {
        return parsed
      }
    } catch (e) {}

    return initialValue
  })

  const setValue = (value: T): void => {
    setStoredValue(value)
    if (key) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
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
