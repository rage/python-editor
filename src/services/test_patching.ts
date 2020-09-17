const DEF_LOAD_MODULE = (code: string): string => `\
    from types import ModuleType
    import base64
    global __code
    mod = ModuleType("editorcontent")
    code = base64.b64decode("${code}").decode("utf-8")
    exec(code, mod.__dict__)
    return mod
`

const DEF_RELOAD_MODULE = `\
    global _stdout_pointer
    _stdout_pointer = len(sys.stdout.getvalue())
    return load_module("editorcontent")
`

const patchTmcResultPy = (source: string): string => {
  let lines = source.split("\n")
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

const patchTmcUtilsPy = (source: string, editorCode: string): string => {
  let lines = source.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("def load_module")) {
      const blockEnd = findBlockEnd(lines, i)
      const body = DEF_LOAD_MODULE(editorCode)
      const newBlock = body.split("\n")
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
