const DEF_LOAD_MODULE = `\
    from types import ModuleType
    mod = ModuleType("editorcontent")
    exec(__code, mod.__dict__)
    return mod
`

const DEF_RELOAD_MODULE = `\
    _stdout_pointer = len(sys.stdout.getvalue())
    return load_module("editorcontent")
`

const patchTmcResultPy = (code: string): string => {
  let lines = code.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trimStart().startsWith("def addResult")) {
      lines = lines
        .slice(0, i + 1)
        .concat("        global results")
        .concat(lines.slice(i + 1))
      i += 2
    } else {
      i++
    }
  }

  return lines.join("\n")
}

const patchTmcUtilsPy = (code: string): string => {
  let lines = code.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("def load_module")) {
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = DEF_LOAD_MODULE.split("\n")
      lines = replaceLines(lines, i + 1, blockEnd, newBlock)
      i += newBlock.length
    } else if (line.startsWith("def reload_module")) {
      const blockEnd = findBlockEnd(lines, i)
      const newBlock = DEF_RELOAD_MODULE.split("\n")
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

export { patchTmcResultPy, patchTmcUtilsPy }
