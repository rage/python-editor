type PythonImport = {
  pkg: string
  names: Array<string>
}

const parseImport = (line: string): PythonImport => {
  let pkg: string
  let names: Array<string>
  const simpleImportMatches = line.match(
    /^from (\.\w+) import (\w+|(\w+, ?)\w+)$/,
  )
  if (simpleImportMatches) {
    pkg = simpleImportMatches[1]
    names = simpleImportMatches[2].split(",").map(s => s.trim())
    return { pkg, names }
  }
  return { pkg: "", names: [] }
}

export { PythonImport, parseImport }
