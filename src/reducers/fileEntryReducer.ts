import { FileEntry } from "../types"
import { mergeArraysFromRight } from "../utils/arrays"

type FileEntries = ReadonlyArray<FileEntry>

interface CacheEntry {
  timestamp: number
  files: FileEntries
}

export interface FileEntryState {
  files: ReadonlyArray<FileEntry>
  cacheKey?: string
}

export type FileEntryAction =
  | { type: "CACHE_FILES" }
  | { type: "INITIALIZE_FILES"; payload: FileEntries }
  | {
      type: "INITIALIZE_FILES_WITH_CACHE"
      payload: { cacheKey: string } & CacheEntry
    }
  | { type: "RESET" }
  | { type: "UPDATE_FILE"; payload: FileEntry }

export default function reducer(
  state: FileEntryState,
  action: FileEntryAction,
): FileEntryState {
  switch (action.type) {
    case "CACHE_FILES": {
      if (state.cacheKey) {
        const entry: CacheEntry = { files: state.files, timestamp: Date.now() }
        localStorage.setItem(state.cacheKey, JSON.stringify(entry))
      }
      return state
    }
    case "INITIALIZE_FILES":
      return { ...state, files: action.payload }
    case "INITIALIZE_FILES_WITH_CACHE": {
      const payload = action.payload
      const cacheKey = payload.cacheKey
      const cached = getCachedFileEntry(cacheKey)
      if (cached && cached.timestamp > payload.timestamp) {
        const files = mergeArraysFromRight(
          payload.files,
          cached.files,
          (a, b) => a.fullName === b.fullName,
        )
        return { cacheKey, files }
      }
      return { cacheKey, files: payload.files }
    }
    case "RESET": {
      const files = state.files.map((x) => ({
        ...x,
        content: x.originalContent,
      }))
      if (state.cacheKey) {
        localStorage.removeItem(state.cacheKey)
      }
      return { ...state, files }
    }
    case "UPDATE_FILE": {
      const files = state.files.map((x) =>
        x.fullName !== action.payload.fullName ? x : action.payload,
      )
      const cacheKey = state.cacheKey
      if (cacheKey) {
        const entry: CacheEntry = { files, timestamp: Date.now() }
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      }
      return { cacheKey, files }
    }
  }
}

const getCachedFileEntry = (key: string): CacheEntry | undefined => {
  const cached = localStorage.getItem(key) ?? ""

  try {
    const parsed = JSON.parse(cached)
    if (isCacheEntry(parsed)) {
      return parsed
    }
  } catch (e) {}

  return undefined
}

const isCacheEntry = (data: unknown): data is CacheEntry => {
  if (!Array.isArray((data as CacheEntry).files)) return false
  if (!(data as CacheEntry).files.every((x) => isFileEntry(x))) return false
  if (typeof (data as CacheEntry).timestamp !== "number") return false

  return true
}

const isFileEntry = (data: unknown): data is FileEntry => {
  if (typeof (data as FileEntry).content !== "string") return false
  if (typeof (data as FileEntry).fullName !== "string") return false
  if (typeof (data as FileEntry).originalContent !== "string") return false
  if (typeof (data as FileEntry).shortName !== "string") return false

  return true
}
