import { FileEntry } from "../components/ProgrammingExerciseLoader"

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

const resolveTestImports = (
  code: string,
  test: FileEntry,
  tmcFiles: FileEntry[],
): string => {
  const utils = tmcFiles.find((x) => x.shortName === "utils.py")
  let content = utils?.content ?? ""
  content = replaceFunction(
    content,
    "load_module",
    `    mod = ModuleType("editorcontent")\n    exec(__code, mod.__dict__)\n    return mod\n`,
  )
  content = replaceFunction(
    content,
    "reload_module",
    '    return load_module("editorcontent")',
  )

  return wrap(
    `
__code = """
${code}
"""
${test.content}
`,
    [test.shortName],
    tmcFiles.map((x) => (x.shortName === "utils.py" ? { ...x, content } : x)),
  )
}

const wrap = (
  source: string,
  presentlyImported: Array<string>,
  files: FileEntry[],
) => {
  const importAllPattern = /^import \./
  const importSomePattern = /^from \.\w+ import/
  const importTmcPattern = /^from tmc\.?\w* import/
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
    if (line.match(importTmcPattern)) {
      return replaceImportTmc(line, num, presentlyImported, files)
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
  const importMatches = line.match(/^from \.(w+) import ([\w,\s]+$)/)
  if (importMatches) {
    pkg = importMatches[1]
    names = importMatches[2].split(",").map((s) => s.trim())
    return { pkg, names }
  }
  throw "Malformed import statement"
}

const getContentByShortName = (name: string, fileSet: Array<FileEntry>) => {
  console.log(name)
  console.log(fileSet)
  return fileSet.filter(({ shortName }) => shortName === name)[0].content
}

const replaceImportTmc = (
  line: string,
  lineNumber: number,
  presentlyImported: Array<string>,
  files: Array<FileEntry>,
): string => {
  const importMatches = line.match(/^from tmc import ([\w,\s]+)/)
  if (importMatches) {
    return importMatches[1]
      .split(",")
      .map((pkg) =>
        replaceImportAll({ pkg: pkg.trim() }, presentlyImported, files),
      )
      .join("\n")
  }

  const importMatches2 = line.match(/from tmc\.(\w+) import ([\w,\s]+)/)
  if (importMatches2) {
    const pkg = importMatches2[1]
    const names = importMatches2[2].split(",").map((x) => x.trim())
    return replaceImportSome(
      { pkg, names },
      lineNumber,
      presentlyImported,
      files,
    )
  }

  throw "Malformed import statement"
}

const replaceFunction = (
  file: string,
  functionName: string,
  replacement: string,
): string => {
  const lines = file.split("\n")
  const start = lines.findIndex((x) => x.startsWith(`def ${functionName}(`))
  if (start === -1) {
    return file
  }

  const startDepth = countIndentationDepth(lines[start])
  let end = start + 1
  while (end < lines.length && startDepth < countIndentationDepth(lines[end])) {
    end++
  }

  console.log(end)

  return lines
    .slice(0, start + 1)
    .concat(replacement)
    .concat(lines.slice(end))
    .join("\n")
}

const countIndentationDepth = (line: string): number => {
  if (line.trim() === "") {
    return Number.MAX_SAFE_INTEGER
  }
  return line.search(/\S/)
}

export { resolveImports, resolveTestImports }
