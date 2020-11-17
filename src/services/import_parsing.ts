import { FileEntry } from "../types"

type PythonImportAll = {
  pkg: string
}

type PythonImportSome = {
  pkg: string
  names: Array<string>
}

/**
 * Replace import statements of the form `import .mymodule` and `from .mymodule
 * import myClass, myFunction` with the contents of mymodule.py, appropriately
 * wrapped. Cyclical imports (module foo imports from module bar, bar imports
 * from foo) are detected and result in an exception.
 *
 * @param start Initial file where to start
 * @param files List of files used for replacing imports.
 * @returns File content with imports resolved.
 */
const resolveImports = (start: FileEntry, files: FileEntry[]): string => {
  return wrap(start.content, [start.shortName], files)
}

const wrap = (
  source: string,
  presentlyImported: Array<string>,
  files: FileEntry[],
) => {
  const importAllPattern = /^import \./
  const importSomePattern = /^from \.\w+ import/
  const sourceLines = source.split("\n")
  const lines = sourceLines.map((line, num) => {
    if (line.match(importAllPattern)) {
      return replaceImportAll(parseImportAll(line), presentlyImported, files)
    }
    if (line.match(importSomePattern)) {
      return replaceImportSome(
        parseImportSome(line),
        num,
        presentlyImported,
        files,
      )
    }
    return line
  })
  return lines.join("\n")
}

const replaceImportAll = (
  im: PythonImportAll,
  presentlyImported: Array<string>,
  files: Array<FileEntry>,
): string => {
  const sourceShortName = im.pkg + ".py"
  if (presentlyImported.includes(sourceShortName)) {
    const errMsg =
      sourceShortName +
      " has already been imported. Mutually recursive imports are not allowed."
    throw errMsg
  }
  const source = getContentByShortName(sourceShortName, files)
  const wrapped = wrap(
    source,
    presentlyImported.concat([sourceShortName]),
    files,
  )
  return `\n${wrapped}\n`
}

const replaceImportSome = (
  im: PythonImportSome,
  lineNumber: number,
  presentlyImported: Array<string>,
  files: Array<FileEntry>,
): string => {
  const sourceShortName = im.pkg + ".py"
  if (presentlyImported.includes(sourceShortName)) {
    const errMsg =
      sourceShortName +
      " has already been imported. Mutually recursive imports are not allowed."
    throw errMsg
  }
  const source = getContentByShortName(sourceShortName, files)
  const wrapped = wrap(
    source,
    presentlyImported.concat([sourceShortName]),
    files,
  )
  const sourceLines = wrapped.split("\n").map((line: string) => "\t" + line)
  const names = im.names.join(", ")
  const functionName = `__wrap${lineNumber}`
  const head = `def ${functionName}():\n`
  const body = sourceLines.join("\n") + "\n"
  const ret = `\treturn ${names}\n`
  const tail = `${names} = ${functionName}()`
  return head + body + ret + tail
}

/* Parse a Python import statement of the type
"import .foo" */
const parseImportAll = (line: string): PythonImportAll => {
  let pkg: string
  const importMatches = line.match(/^import \.(\w+)[ \t]*$/)
  if (importMatches) {
    pkg = importMatches[1]
    return { pkg }
  }
  throw "Malformed import statement"
}

/* Parse a Python import statement of the type
"from .foo import myClass, myFunction" */
const parseImportSome = (line: string): PythonImportSome => {
  let pkg: string
  let names: Array<string>
  const importMatches = line.match(/^from \.(\w+) import ([\w,\s]+)/)
  if (importMatches) {
    pkg = importMatches[1]
    names = importMatches[2].split(",").map((s) => s.trim())
    return { pkg, names }
  }
  throw `Malformed import statement: ${line}`
}

const getContentByShortName = (name: string, fileSet: Array<FileEntry>) => {
  console.log(name)
  console.log(fileSet)
  return fileSet.filter(({ shortName }) => shortName === name)[0].content
}

export { resolveImports }
