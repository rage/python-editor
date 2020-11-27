import { TFunction } from "i18next"
import { Base64 } from "js-base64"
import JSZip, { JSZipObject } from "jszip"
import { FileEntry } from "../types"
import { resolveImports } from "./import_parsing"

interface Configuration {
  t: TFunction
}

interface Exercise {
  problems?: string[]
  srcFiles: FileEntry[]
  successful: boolean
  testSource: string
}

const extractExerciseArchive = async (
  zip: JSZip,
  configuration: Configuration,
): Promise<Exercise> => {
  const { t } = configuration
  const rootFiles = await getFileEntries(zip)
  const srcFiles = await getFileEntries(zip, "src")
  const testFiles = await getFileEntries(zip, "test")
  const tmcFiles = await getFileEntries(zip, "tmc")
  const problems: string[] = []
  let successful = true

  const fileSorter = (files: FileEntry[]): FileEntry[] =>
    files.sort((a, b) => a.shortName.localeCompare(b.shortName))
  const pickedSrcFiles =
    srcFiles.length > 0 ? fileSorter(srcFiles) : fileSorter(rootFiles)
  if (pickedSrcFiles.length === 0) {
    problems.push(t("noExerciseFilesFound"))
  }

  let testSource = ""
  try {
    testSource = inlineAndPatchTestSources(testFiles, tmcFiles)
  } catch (e) {
    Array.isArray(e) ? problems.push(...e) : problems.push(e)
    successful = false
  }

  return {
    problems,
    srcFiles: pickedSrcFiles,
    successful,
    testSource,
  }
}

const getFileEntries = (
  zip: JSZip,
  directory?: string,
  main?: string,
): Promise<FileEntry[]> => {
  const fileSelector: RegExp = directory
    ? RegExp(`${directory}/\\w*\\.py$`)
    : /^\w+\/\w+\/\w*\.py$/
  const files = orderFiles(zip.file(fileSelector), main)
  return Promise.all(files.map((f: JSZipObject) => createEntry(f)))
}

const createEntry = async (f: JSZipObject): Promise<FileEntry> => {
  const content = await f.async("string")
  const fullName: string = f.name
  const matches = fullName.match(/(\w+\.py)/)
  let shortName: string | null = null
  if (matches) {
    shortName = matches[0]
    return { fullName, shortName, originalContent: content, content }
  }
  return { fullName: "", shortName: "", originalContent: "", content: "" }
}

const orderFiles = (files: JSZipObject[], main?: string) => {
  if (main) {
    const mainIndex = files.findIndex((file: any) => file.name.includes(main))
    if (mainIndex > -1) {
      const mainEntry = files.splice(mainIndex, 1)[0]
      files.unshift(mainEntry)
      return files
    }
  }
  return files
}

/**
 * Creates python source code for webeditor utility module.
 *
 * @param code Raw python code from web editor to be executed.
 */
const createWebEditorModuleSource = (code: string) => {
  return `\
"""
import base64
code = base64.b64decode("${Base64.encode(code)}").decode("utf-8")
"""`
}

/**
 * Inlines test and tmc files to executable python code. Expects
 * `__webeditor_module_source` to be defined when executed.
 *
 * @param testFiles Files from test folder in exercise.
 * @param tmcFiles Files from tmc folder in exercise.
 */
const inlineAndPatchTestSources = (
  testFiles: FileEntry[],
  tmcFiles: FileEntry[],
): string => {
  const test = findMainTestFile(testFiles)
  const tmcPoints = findFileByShortName("points.py", tmcFiles)
  const tmcResult = findFileByShortName("result.py", tmcFiles)
  const tmcRunner = findFileByShortName("runner.py", tmcFiles)
  const tmcUtils = findFileByShortName("utils.py", tmcFiles)

  const testCode = `
import base64, contextlib, importlib, io, json, sys
from types import ModuleType

_stdout_pointer = 0

def __decode(code_b64):
    return base64.b64decode(code_b64).decode("utf-8")

def __wrap_import(module_name, code):
    mod = ModuleType(module_name)
    sys.modules[module_name] = mod
    exec(code, mod.__dict__)

__wrap_import("tmc_webeditor", __webeditor_module_source)
__wrap_import("tmc_points", __decode("${patchAndEncodeTmcFile(
    tmcPoints,
    tmcFiles,
  )}"))
__wrap_import("tmc_result", __decode("${patchAndEncodeTmcFile(
    tmcResult,
    tmcFiles,
  )}"))
__wrap_import("tmc_runner", __decode("${patchAndEncodeTmcFile(
    tmcRunner,
    tmcFiles,
  )}"))
__wrap_import("tmc_utils", __decode("${patchAndEncodeTmcFile(
    tmcUtils,
    tmcFiles,
  )}"))

${patchTestSource(test, "PythonEditorTest", testFiles)}

testOutput = ""
from tmc_runner import TMCTestRunner
from tmc_result import results
from tmc_webeditor import code

import inspect
def getsource(module):
    return code
inspect.getsource = getsource

test_suite = unittest.TestLoader().loadTestsFromTestCase(PythonEditorTest)
with io.StringIO() as buf:
    with contextlib.redirect_stdout(buf):
        TMCTestRunner(stream=buf).run(test_suite)
    testOutput = json.dumps(results, ensure_ascii=False)
`

  //console.log(testCode)
  return testCode
}

const findFileByShortName = (name: string, files: FileEntry[]): FileEntry => {
  const file = files.find((file) => file.shortName === name)

  if (!file) {
    throw `Expected to find file "${name}"`
  }

  return file
}

const findMainTestFile = (testFiles: FileEntry[]): FileEntry => {
  const testFile = testFiles.find((file) => file.shortName !== "__init__.py")

  if (!testFile) {
    throw "Couldn't find test file"
  }

  return testFile
}

const patchTestSource = (
  testFile: FileEntry,
  testClassName: string,
  testFiles: FileEntry[],
): string => {
  const lines = testFile.content.split("\n")
  const patched = lines
    .map((line) => {
      const importMatches = line.match(/^from tmc import ([\w,\s]+)/)
      if (importMatches) {
        return importMatches[1]
          .split(",")
          .map((pkg) => `from tmc_${pkg.trim()} import ${pkg.trim()}`)
          .join("\n")
      }

      const importMatches2 = line.match(/from tmc\.(\w+) import ([\w,\s]+)/)
      if (importMatches2) {
        return `from tmc_${importMatches2[1]} import ${importMatches2[2]}`
      }

      return line.replace(
        /\w+Test\(unittest.TestCase\)/,
        `${testClassName}(unittest.TestCase)`,
      )
    })
    .join("\n")

  return resolveImports({ ...testFile, content: patched }, testFiles)
}

const removeRelativeTmcImports = (source: string): string => {
  const lines = source.split("\n")
  return lines
    .map((line) => {
      let match = line.match(/^import \.(\w+)/)
      if (match) {
        return `import tmc_${match[1]}`
      }

      match = line.match(/^from \.(\w+) import ([\w,\s]+)/)
      if (match) {
        return `from tmc_${match[1]} import ${match[2]}`
      }

      return line
    })
    .join("\n")
}

const patchAndEncodeTmcFile = (
  file: FileEntry,
  tmcFiles: FileEntry[],
): string => {
  let content = removeRelativeTmcImports(file.content)
  switch (file.shortName) {
    case "utils.py":
      content = patchTmcUtilsPy(content)
      break
  }
  const wrapped = resolveImports({ ...file, content }, tmcFiles)
  return Base64.encode(wrapped)
}

const patchTmcUtilsPy = (source: string): string => {
  let stdOutPointerFound = false
  let loadModuleFound = false
  let reloadModuleFound = false

  const defLoadModule = `\
    from types import ModuleType
    from tmc_webeditor import code
    mod = ModuleType("editorcontent")
    try:
        exec(code, mod.__dict__)
    except Exception as e:
        return AssertionError(e)
    return mod
`

  const defReloadModule = `\
    global _stdout_pointer
    if isinstance(module, AssertionError):
        raise module
    _stdout_pointer = len(sys.stdout.getvalue())
    return load_module("editorcontent")
`

  let lines = [
    "import inspect",
    "def getsource(module):",
    "    return code",
    "inspect.getsource = getsource",
  ].concat(source.split("\n"))
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("_stdout_pointer")) {
      stdOutPointerFound = true
      i++
    } else if (line.startsWith("def load_module")) {
      loadModuleFound = true
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = defLoadModule.split("\n")
      lines = replaceLines(lines, i + 1, blockEnd, newBlock)
      i += newBlock.length
    } else if (line.startsWith("def reload_module")) {
      reloadModuleFound = true
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = defReloadModule.split("\n")
      lines = replaceLines(lines, i + 1, blockEnd, newBlock)
      i += newBlock.length
    } else {
      i++
    }
  }

  const missing: string[] = []
  !stdOutPointerFound &&
    missing.push("Expected to find global `_stdout_pointer` from tmc/utils.py.")
  !loadModuleFound &&
    missing.push("Expected to find function `load_module` from tmc/utils.py.")
  !reloadModuleFound &&
    missing.push("Expected to find function `reload_module` from tmc/utils.py.")
  if (missing.length > 0) {
    throw missing
  }

  return lines.join("\n")
}

const replaceLines = (
  lines: string[],
  from: number,
  to: number,
  replaceWith: string[],
) => {
  return lines.slice(0, from).concat(replaceWith).concat(lines.slice(to))
}

const findBlockEnd = (lines: string[], at: number): number => {
  const startDepth = countIndentationDepth(lines[at])
  let end = at + 1
  while (end < lines.length && startDepth < countIndentationDepth(lines[end])) {
    end++
  }

  return end
}

const countIndentationDepth = (line: string): number => {
  if (line.trim() === "") {
    return Number.MAX_SAFE_INTEGER
  }
  return line.search(/\S/)
}

export { createWebEditorModuleSource, extractExerciseArchive }
