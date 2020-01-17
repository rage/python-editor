import { useState } from "react"

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
