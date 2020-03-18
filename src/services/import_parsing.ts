type PythonImport = {
  pkg: string
  names: Array<string>
}

const parseImport = (line: string): PythonImport => {
  console.log('this is parseImport with line "' + line + '"')
  let pkg: string
  let names: Array<string>
  const simpleImportMatches = line.match(
    /^from (\.\w+) import (\w+|(\w+, ?)\w+)$/,
  )
  if (simpleImportMatches) {
    console.log(line + " matches")
    pkg = simpleImportMatches[1]
    console.log("pkg is " + pkg)
    names = simpleImportMatches[2].split(",").map(s => s.trim())
    return { pkg, names }
  }
  return { pkg: "", names: [] }
}

export { PythonImport, parseImport }
