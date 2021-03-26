import { FileEntry } from "../types"
import useCache, { CachedData, DispatchOptions } from "./useCache"

type CachedFileEntries = CachedData<ReadonlyArray<FileEntry>>

export type FileEntries = [
  files: ReadonlyArray<FileEntry>,
  setValue: (newValue: CachedFileEntries, options?: DispatchOptions) => void,
  updateFile: (file: FileEntry) => void,
]

export default function useCachedFileEntries(
  cacheKey: string | undefined,
  initialFiles: CachedFileEntries,
): FileEntries {
  const [files, setFiles] = useCache(cacheKey, initialFiles, areFileEntries)

  const updateFile = (newFile: FileEntry) => {
    const value = files.map((file) =>
      file.fullName === newFile.fullName ? newFile : file,
    )
    setFiles({ value, timestamp: Date.now() }, { override: true })
  }

  return [files, setFiles, updateFile]
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
