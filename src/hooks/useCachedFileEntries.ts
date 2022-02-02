import React, { useCallback } from "react"
import { FileEntry } from "../types"
import useCache, { CachedData } from "./useCache"

type FileEntries = ReadonlyArray<FileEntry>
type CachedFileEntries = CachedData<FileEntries>

export type CachedFileEntriesHook = [
  files: ReadonlyArray<FileEntry>,
  setFiles: React.Dispatch<React.SetStateAction<ReadonlyArray<FileEntry>>>,
  setFilesIfNewer: (newFiles: CachedFileEntries) => void,
]

export default function useCachedFileEntries(
  cacheKey: string | undefined,
  initialFiles: CachedFileEntries,
): CachedFileEntriesHook {
  const [value, setValue, setValueIfNewer] = useCache(
    cacheKey,
    initialFiles,
    areFileEntries,
  )

  const setFiles = useCallback(
    (newFiles: React.SetStateAction<FileEntries>) => {
      if (typeof newFiles === "function") {
        newFiles = newFiles(value)
      }

      setValue({ value: newFiles, timestamp: Date.now() })
    },
    [value, setValue],
  )

  const setFilesIfNewer = useCallback(
    (newFiles: CachedFileEntries) => {
      // Dirty solution of getting rid of sometimes cached empty.py
      if (value.every((x) => x.fullName === "empty.py")) {
        setValue(newFiles)
      } else {
        setValueIfNewer(newFiles)
      }
    },
    [setValue, setValueIfNewer, value],
  )

  return [value, setFiles, setFilesIfNewer]
}

const areFileEntries = (data: unknown): data is Array<FileEntry> => {
  if (!Array.isArray(data)) return false
  return data.every((x) => isFileEntry(x))
}

const isFileEntry = (data: unknown): data is FileEntry => {
  if (typeof (data as FileEntry).content !== "string") return false
  if (typeof (data as FileEntry).fullName !== "string") return false
  if ((data as FileEntry).fullName.length <= 0) return false
  if (typeof (data as FileEntry).originalContent !== "string") return false
  if (typeof (data as FileEntry).shortName !== "string") return false
  return true
}
