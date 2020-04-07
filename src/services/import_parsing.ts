type PythonImportAll = {
  pkg: string
}

type PythonImportSome = {
  pkg: string
  names: Array<string>
}

/* Parse a Python import statement of the type
"import .foo" */
const parseImportAll = (line: string): PythonImportAll => {
  let pkg: string
  const importMatches = line.match(/^import (\.\w+)[ \t]*$/)
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
  const importMatches = line.match(
    /^from (\.\w+) import (\w+|(\w+, ?)\w+)[ \t]*$/,
  )
  if (importMatches) {
    pkg = importMatches[1]
    names = importMatches[2].split(",").map(s => s.trim())
    return { pkg, names }
  }
  throw "Malformed import statement"
}

export { PythonImportAll, PythonImportSome, parseImportAll, parseImportSome }
