import { useLocalStorage } from "./customHooks"

export interface CachedData<T> {
  timestamp: number
  value: T
}

export interface DispatchOptions {
  override: boolean
}

export type Cache<T> = [
  value: T,
  setValue: (newValue: CachedData<T>, options?: DispatchOptions) => void,
]

export default function useCache<T>(
  key: string | undefined,
  initialValue: CachedData<T>,
  isValidEntry: (object: unknown) => object is T,
): Cache<T> {
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

  const setValue = (
    newValue: CachedData<T>,
    options?: { override: boolean },
  ) => {
    if (newValue.timestamp >= cachedValue.timestamp || options?.override) {
      setCachedValue(newValue)
    }
  }

  return [cachedValue.value, setValue]
}
