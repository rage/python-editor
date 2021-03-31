import { useLocalStorage } from "./customHooks"

export interface CachedData<T> {
  timestamp: number
  value: T
}

export type CacheHook<T> = [
  value: T,
  setValue: (newValue: CachedData<T>) => void,
  setValueIfNewer: (newValue: CachedData<T>) => void,
]

export default function useCache<T>(
  key: string | undefined,
  initialValue: CachedData<T>,
  isValidEntry: (object: unknown) => object is T,
): CacheHook<T> {
  const isValidAndFreshData = (object: unknown): object is CachedData<T> => {
    if (!isValidEntry((object as CachedData<T>).value)) return false
    if (typeof (object as CachedData<T>).timestamp !== "number") return false

    // Only use cached data if it is newer than provided timestamp.
    return (object as CachedData<T>).timestamp > initialValue.timestamp
  }

  const [cachedValue, setCachedValue] = useLocalStorage<CachedData<T>>(
    key,
    initialValue,
    isValidAndFreshData,
  )

  const setValue = (newValue: CachedData<T>) => {
    setCachedValue(newValue)
  }

  const setValueIfNewer = (newValue: CachedData<T>) => {
    if (newValue.timestamp >= cachedValue.timestamp) {
      setCachedValue(newValue)
    }
  }

  return [cachedValue.value, setValue, setValueIfNewer]
}
