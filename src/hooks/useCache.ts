import React, { useCallback, useEffect } from "react"
import { useLocalStorage } from "./useLocalStorage"

export interface CachedData<T> {
  timestamp: number
  value: T
}

export type CacheHook<T> = [
  value: T,
  setValue: React.Dispatch<React.SetStateAction<CachedData<T>>>,
  setValueIfNewer: React.Dispatch<React.SetStateAction<CachedData<T>>>,
]

export default function useCache<T>(
  key: string | undefined,
  initialValue: CachedData<T>,
  isValidEntry: (object: unknown) => object is T,
): CacheHook<T> {
  const isValidAndFreshData = useCallback(
    (object: unknown): object is CachedData<T> => {
      if (!isValidEntry((object as CachedData<T>).value)) return false
      if (typeof (object as CachedData<T>).timestamp !== "number") return false

      // Only use cached data if it is newer than provided timestamp.
      return (object as CachedData<T>).timestamp > initialValue.timestamp
    },
    [initialValue.timestamp, isValidEntry],
  )

  const [cachedValue, setCachedValue] = useLocalStorage(
    key,
    initialValue,
    isValidAndFreshData,
  )

  const setValueIfNewer = useCallback(
    (newValue: React.SetStateAction<CachedData<T>>) => {
      setCachedValue((prev) => {
        if (typeof newValue === "function") {
          newValue = newValue(prev)
        }

        return newValue.timestamp >= prev.timestamp ? newValue : prev
      })
    },
    [setCachedValue],
  )

  return [cachedValue.value, setCachedValue, setValueIfNewer]
}
