import { FileEntry } from "../types"
import useCache, { CachedData } from "./useCache"

type CachedFileEntries = CachedData<ReadonlyArray<FileEntry>>

export type FileEntries = [
  files: ReadonlyArray<FileEntry>,
  setFiles: (newValue: ReadonlyArray<FileEntry>) => void,
  setFilesIfNewer: (
    newValue: ReadonlyArray<FileEntry>,
    timestamp: number,
  ) => void,
]

export default function useCachedFileEntries(
  cacheKey: string | undefined,
  initialFiles: CachedFileEntries,
): FileEntries {
  const [value, setValue, setValueIfNewer] = useCache(
    cacheKey,
    initialFiles,
    areFileEntries,
  )

  const setFiles = (files: ReadonlyArray<FileEntry>) => {
    setValue({ value: files, timestamp: Date.now() })
  }

  const setFilesIfNewer = (
    newFiles: ReadonlyArray<FileEntry>,
    timestamp: number,
  ) => {
    setValueIfNewer({ value: newFiles, timestamp })
  }

  return [value, setFiles, setFilesIfNewer]
}

const areFileEntries = (data: unknown): data is Array<FileEntry> => {
  if (!Array.isArray(data)) return false
  return data.every((x) => isFileEntry(x))
}

const isFileEntry = (data: unknown): data is FileEntry => {
  if (typeof (data as FileEntry).content !== "string") return false
  if (typeof (data as FileEntry).fullName !== "string") return false
  if (typeof (data as FileEntry).originalContent !== "string") return false
  if (typeof (data as FileEntry).shortName !== "string") return false

  return true
}
