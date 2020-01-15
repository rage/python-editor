import { useState } from "react"

export function useInput(key, initialValue) {
  const [value, setValue] = useLocalStorage(key, initialValue)

  const onChange = e => {
    setValue(e.target.value)
  }

  return { value, onChange }
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    return window.localStorage.getItem(key) || initialValue
  })

  const setValue = value => {
    setStoredValue(value)
    window.localStorage.setItem(key, value)
  }

  return [storedValue, setValue]
}
