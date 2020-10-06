import { Base64 } from "js-base64"
import { FileEntry } from "../components/ProgrammingExerciseLoader"
import { resolveImports } from "./import_parsing"

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

test_suite = unittest.TestLoader().loadTestsFromTestCase(PythonEditorTest)
with io.StringIO() as buf:
    with contextlib.redirect_stdout(buf):
        TMCTestRunner(stream=buf).run(test_suite)
    testOutput = json.dumps(results, ensure_ascii=False)
`

  console.log(testCode)
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
  console.log(file.shortName, wrapped)
  return Base64.encode(wrapped)
}

const patchTmcUtilsPy = (source: string): string => {
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

  let lines = source.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("def load_module")) {
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = defLoadModule.split("\n")
      lines = replaceLines(lines, i + 1, blockEnd, newBlock)
      i += newBlock.length
    } else if (line.startsWith("def reload_module")) {
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = defReloadModule.split("\n")
      lines = replaceLines(lines, i + 1, blockEnd, newBlock)
      i += newBlock.length
    } else {
      i++
    }
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

export { createWebEditorModuleSource, inlineAndPatchTestSources }
