import React, { useCallback, useEffect, useState } from "react"

export function useLocalStorage<T>(
  key: string | undefined,
  initialValue: T,
  isCachedData: (object: unknown) => object is T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState(() => {
    return readValueFromLocalStorage(key, isCachedData) ?? initialValue
  })

  useEffect(() => {
    setStoredValue(readValueFromLocalStorage(key, isCachedData) ?? initialValue)
  }, [key, isCachedData, initialValue])

  const setValue = useCallback(
    (value: React.SetStateAction<T>) => {
      setStoredValue(value)
      if (key) {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    },
    [key],
  )

  return [storedValue, setValue]
}

function readValueFromLocalStorage<T>(
  key: string | undefined,
  isCachedData: (object: unknown) => object is T,
): T | undefined {
  if (!key) {
    return
  }

  const cached = window.localStorage.getItem(key)
  if (!cached) {
    return
  }

  try {
    const parsed = JSON.parse(cached)
    if (isCachedData(parsed)) {
      return parsed
    }
  } catch (e) {
    // No op
  }
}
