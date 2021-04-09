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
    (newValue: React.SetStateAction<T>) => {
      setStoredValue((prev) => {
        // This will likely break if T is callable
        if (newValue instanceof Function) {
          newValue = newValue(prev)
        }
        if (key) {
          window.localStorage.setItem(key, JSON.stringify(newValue))
        }
        return newValue
      })
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
