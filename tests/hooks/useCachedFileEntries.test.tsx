import { renderHook } from "@testing-library/react-hooks"

import { emptyFile } from "../../src/constants/defaultFiles"
import useCachedFileEntries from "../../src/hooks/useCachedFileEntries"
import { FileEntry } from "../../src/types"

const INITIAL_FILES: Array<FileEntry> = [emptyFile]

const TEMPLATE_FILES: Array<FileEntry> = [
  {
    content: `print("Hello world!")`,
    fullName: "src/hello.py",
    originalContent: `print("Hello world!")`,
    shortName: "hello.py",
  },
]

const CHANGED_FILES: Array<FileEntry> = [
  {
    content: `print("Hello changed world!")`,
    fullName: "src/hello.py",
    originalContent: `print("Hello world!")`,
    shortName: "hello.py",
  },
]

describe("useCachedFileEntries hook", () => {
  test("sets initial files", () => {
    const cacheKey = "sets-initial-files"
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, { value: INITIAL_FILES, timestamp: -1 }),
    )
    const [files] = hookResult.result.current
    expect(files).toBe(INITIAL_FILES)
  })

  test("sets template files", () => {
    const cacheKey = "sets-new-files"
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, { value: INITIAL_FILES, timestamp: -1 }),
    )
    const [, setFiles] = hookResult.result.current
    setFiles(TEMPLATE_FILES)
    const [files2] = hookResult.result.current
    expect(files2).toBe(TEMPLATE_FILES)
  })

  test("changes file content when timestamp is newer", () => {
    const cacheKey = "changes-file-content-when-timestamp-is-newer"
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, { value: INITIAL_FILES, timestamp: -1 }),
    )
    const [, , setFilesIfNewer] = hookResult.result.current
    setFilesIfNewer({
      value: TEMPLATE_FILES,
      timestamp: new Date("2022-01-31").getTime(),
    })
    const [files2] = hookResult.result.current
    expect(files2).toBe(TEMPLATE_FILES)
  })

  test("doesn't change file content when timestamp is older", () => {
    const cacheKey = "doesnt-change-file-content-when-timestamp-is-older"
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, {
        value: CHANGED_FILES,
        timestamp: new Date("2022-02-01").getTime(),
      }),
    )
    const [, , setFilesIfNewer] = hookResult.result.current
    setFilesIfNewer({
      value: TEMPLATE_FILES,
      timestamp: new Date("2022-01-31").getTime(),
    })
    const [files2] = hookResult.result.current
    expect(files2).toBe(CHANGED_FILES)
  })

  test("doesn't change cached file content when timestamp is older", () => {
    const cacheKey = "doesnt-change-cached-file-content-to-placeholder-files"
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        value: CHANGED_FILES,
        timestamp: new Date("2022-02-01").getTime(),
      }),
    )
    const initialData = { value: INITIAL_FILES, timestamp: -1 }
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, initialData),
    )
    const [files] = hookResult.result.current
    expect(files).toStrictEqual(CHANGED_FILES)
  })

  test("does change cached file content when timestamp is newer", () => {
    const cacheKey = "does-change-cached-file-content-when-timestamp-is-newer"
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        value: TEMPLATE_FILES,
        timestamp: new Date("2022-01-31").getTime(),
      }),
    )
    const initialData = {
      value: CHANGED_FILES,
      timestamp: new Date("2022-02-01").getTime(),
    }
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, initialData),
    )
    const [files] = hookResult.result.current
    expect(files).toStrictEqual(CHANGED_FILES)
  })

  test("does change cached file content if it is empty.py", () => {
    const cacheKey = "does-change-cached-file-content-if-it-is-empty-py"
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        value: [emptyFile],
        timestamp: new Date("2022-02-01").getTime(),
      }),
    )
    const initialData = { value: [emptyFile], timestamp: -1 }
    const hookResult = renderHook(() =>
      useCachedFileEntries(cacheKey, initialData),
    )
    const [, , setFilesIfNewer] = hookResult.result.current
    setFilesIfNewer({
      value: INITIAL_FILES,
      timestamp: new Date("2022-01-31").getTime(),
    })
    const [files] = hookResult.result.current
    expect(files).toStrictEqual(INITIAL_FILES)
  })
})
