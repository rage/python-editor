import React, { useState, useEffect } from "react"
import { InputLabel, Select, Button } from "@material-ui/core"
import PyEditor from "./PyEditor"
import Output from "./Output"
import { v4 as uuid } from "uuid"
import { FileEntry } from "./QuizLoader"
import {
  PythonImportAll,
  PythonImportSome,
  parseImportAll,
  parseImportSome,
} from "../services/import_parsing"
import { OutputObject, TestResultObject } from "../types"

type QuizProps = {
  initialFiles: Array<FileEntry>
  loadedTestFiles: Array<FileEntry>
}

let worker = new Worker("./worker.js")

const defaultFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

const Quiz: React.FunctionComponent<QuizProps> = ({
  initialFiles,
  loadedTestFiles,
}) => {
  const [output, setOutput] = useState<OutputObject[]>([])
  const [testResults, setTestResults] = useState<TestResultObject[]>([])
  const [workerAvailable, setWorkerAvailable] = useState(true)
  const [inputRequested, setInputRequested] = useState(false)
  const [files, setFiles] = useState([defaultFile])
  const [testFiles, setTestFiles] = useState([defaultFile])
  const [selectedFile, setSelectedFile] = useState(defaultFile)
  const [editorValue, setEditorValue] = useState("")
  const [running, setRunning] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setFiles(initialFiles)
    changeFile(initialFiles[0].shortName, initialFiles)
  }, [initialFiles])

  useEffect(() => {
    setTestFiles(loadedTestFiles)
  }, [loadedTestFiles])

  function handleRun(code: string) {
    if (workerAvailable) {
      setOutput([])
      setTestResults([])
      setWorkerAvailable(false)
      setRunning(true)
      setTesting(false)
      worker.postMessage({ type: "run", msg: code })
    } else {
      console.log("Worker is busy")
    }
  }

  const handleRunWrapped = (code: string) => {
    try {
      const wrapped = wrap(code, [selectedFile.shortName])
      return handleRun(wrapped)
    } catch (error) {
      return handleRun(`print("${error}")`)
    }
  }

  const wrap = (
    source: string,
    presentlyImported: Array<string>,
    isTesting: boolean = false,
  ) => {
    const importAllPattern = /^import \./
    const importSomePattern = /^from \.\w+ import/
    const sourceLines = source.split("\n")
    const lines = sourceLines.map((line, num) => {
      if (line.match(importAllPattern)) {
        return replaceImportAll(parseImportAll(line), num, presentlyImported)
      }
      return line.match(importSomePattern)
        ? replaceImportSome(
            parseImportSome(line),
            num,
            presentlyImported,
            isTesting,
          )
        : line
    })
    return lines.join("\n")
  }

  const replaceImportAll = (
    im: PythonImportAll,
    lineNumber: number,
    presentlyImported: Array<string>,
  ): string => {
    const sourceShortName = im.pkg.slice(1) + ".py"
    if (presentlyImported.includes(sourceShortName)) {
      const errMsg =
        sourceShortName +
        " has already been imported. Mutually recursive imports are not allowed."
      throw errMsg
    }
    const source = getContentByShortName(sourceShortName, files)
    const wrapped = wrap(source, presentlyImported.concat([sourceShortName]))
    return `\n${wrapped}\n`
  }

  const replaceImportSome = (
    im: PythonImportSome,
    lineNumber: number,
    presentlyImported: Array<string>,
    testing: boolean,
  ): string => {
    const sourceShortName = im.pkg.slice(1) + ".py"
    if (presentlyImported.includes(sourceShortName)) {
      const errMsg =
        sourceShortName +
        " has already been imported. Mutually recursive imports are not allowed."
      throw errMsg
    }
    const source = getContentByShortName(sourceShortName, files)
    const wrapped = wrap(source, presentlyImported.concat([sourceShortName]))
    const sourceLines = wrapped.split("\n").map((line: string) => "\t" + line)
    const names = im.names.join(", ")
    const functionName = `__wrap${lineNumber}`
    const head = `def ${functionName}():\n`
    const body = sourceLines.join("\n") + "\n"
    const ret = `\treturn ${names}\n`
    const tail = testing
      ? `${names} = ${functionName}`
      : `${names} = ${functionName}()`
    return head + body + ret + tail
  }

  worker.onmessage = function(e) {
    const { type, msg } = e.data
    if (type === "print") {
      setOutput(output.concat({ id: uuid(), type: "output", text: msg }))
    } else if (type === "input_required") {
      setInputRequested(true)
    } else if (type === "error") {
      console.log(msg)
      setOutput(output.concat({ id: uuid(), type: "error", text: msg + "\n" }))
      setWorkerAvailable(true)
      setRunning(false)
    } else if (type === "ready") {
      setWorkerAvailable(true)
    } else if (type === "print_batch") {
      if (running) {
        const prints = msg.map((text: string) => ({
          id: uuid(),
          type: "output",
          text,
        }))
        setOutput(prevState => prevState.concat(prints))
      }
    } else if (type === "print_done") {
      setRunning(false)
    } else if (type === "testResults") {
      console.log("[TEST RESULTS]", msg)
      setRunning(false)
      const results = msg.map((result: any) => ({
        id: uuid(),
        testName: result.testName,
        passed: result.passed,
        feedback: result.feedback || null,
        points: result.points,
      }))
      setTestResults(prev => prev.concat(results))
    } else if (type === "test_error") {
      setRunning(false)
      setTestResults(prev =>
        prev.concat({
          id: uuid(),
          testName: msg.testName,
          passed: msg.passed,
          feedback: msg.feedback || null,
          points: msg.points,
        }),
      )
    }
  }

  const sendInput = (input: string) => {
    if (inputRequested) {
      setInputRequested(false)
      setOutput(
        output.concat({ id: uuid(), type: "input", text: `${input}\n` }),
      )
      worker.postMessage({ type: "input", msg: input })
    }
  }

  const handleChange = (e: any) => {
    setFiles((prev: any) =>
      prev.map((file: any) =>
        file.shortName === selectedFile.shortName
          ? { ...file, content: editorValue }
          : file,
      ),
    )
    changeFile(e.target.value, files)
  }

  const changeFile = (shortName: string, fileList: Array<object>) => {
    setSelectedFile(getFileByShortName(shortName, fileList))
    setEditorValue(getContentByShortName(shortName, fileList))
  }

  const getContentByShortName = (name: string, fileSet: Array<any>) => {
    /* When running tests, take into account that 
       changes in the selected file are not in state yet */
    if (testing && name === selectedFile.shortName) {
      return editorValue
    }

    return getFileByShortName(name, fileSet).content
  }

  const getFileByShortName = (name: string, fileSet: Array<any>) => {
    let firstMatch = fileSet.filter(({ shortName }) => shortName === name)[0]
    return firstMatch
  }

  const stopWorker = () => {
    if (!workerAvailable) {
      worker.terminate()
      worker = new Worker("./worker.js")
    }
    worker.postMessage({ type: "stop" })
    setRunning(false)
    setInputRequested(false)
  }

  const clearOutput = () => {
    stopWorker()
    setOutput([])
  }

  /* 
    Modifies given test file content with Skulpt compatible imports
    Implementation status of usable modules can be checked in e.g. 
    https://github.com/skulpt/skulpt/tree/master/src/lib

    Unittest is only partially supported and imports TMC needs should be
    switched out for something that Skulpt can use. Encapsulating any TMC
    specific usage to helper functions should be done at the beginning 
    of the file and swapped with Skulpt counterparts before running the test file. 

    When capturing output with Skulpt, any errors encountered during it stops 
    the test from running and all tests after it silently; solved for now by running the
    same code before capturing output to get error without failing.
  */

  const modifyTestSkulptCompatible = (content: string, shortName: string) => {
    const usedModule = shortName.slice(0, -3)
    let testContent = content
    const testFileBeginningImports = `
import unittest
import sys
import StringIO

from .${usedModule} import ${usedModule}
module_name = ${usedModule}

def points(*args):
    def jsonify_arr(arr):
        return str(arr).replace("'", '"')

    def wrapper(fn):
        print('Points: {"name": "{}", "points": {}}'.format(fn.__name__, jsonify_arr(list(args))))
        return fn
    return wrapper

def use_input(val):
    sys.stdin = StringIO.StringIO(val+'\\n'+val)

def get_stdout_from(fn):
    fn()
    sys.stdout = StringIO.StringIO()
    fn()
    output = sys.stdout.getvalue().strip()
    sys.stdout = sys.__stdout__
    return output

`
    // Find the first test class and replace the contents before it
    const firstPointsIdx = testContent.indexOf("@points")
    const firstTestClassIdx = testContent.indexOf("class")
    if (firstPointsIdx !== -1 && firstPointsIdx < firstTestClassIdx) {
      testContent = testContent.slice(firstPointsIdx)
    } else {
      testContent = testContent.slice(firstTestClassIdx)
    }

    /*
      Add a test setup method at the beginning of every test class

      A workaround for setting the module wihtout using
      @classmethod, setUpClass or/and tmc module's loaders, since they 
      are not usable with Skulpt. 
    */
    const setUp = `

    def setUp(self):
        self.module = module_name`

    const regex = /\(unittest.TestCase\):/g
    let result = null
    while ((result = regex.exec(testContent))) {
      const testClassBegin = result.index + "(unittest.TestCase):".length
      testContent =
        testContent.substring(0, testClassBegin) +
        setUp +
        testContent.substring(testClassBegin)
    }

    return testFileBeginningImports + testContent
  }

  const runTests = (testCode?: string) => {
    setOutput([])
    setRunning(true)
    setTesting(true)
    worker.postMessage({ type: "runTests", msg: testCode })
  }

  const runTestsWrapped = () => {
    setTestResults([])
    testFiles.forEach(testFile => {
      let testContent = testFile?.content
      const modifiedTestContent = modifyTestSkulptCompatible(
        testContent,
        selectedFile.shortName,
      )
      try {
        if (!testContent) {
          throw "FileError: No tests found"
        }
        const wrappedTestContent = wrap(modifiedTestContent, [], true)
        return runTests(wrappedTestContent)
      } catch (error) {
        setTestResults(prev =>
          prev.concat({
            id: uuid(),
            testName: "Running a test file failed",
            passed: false,
            feedback: error.toString(),
            points: [],
          }),
        )
      }
    })
  }

  return (
    <div style={{ position: "relative", width: "70vw" }}>
      <p>This is a quiz.</p>
      <InputLabel id="label">Select File</InputLabel>
      <Select
        labelId="label"
        native
        value={selectedFile.shortName}
        onChange={handleChange}
        data-cy="select-file"
      >
        {files.length > 0 && (
          <>
            {files.map(({ shortName }) => (
              <option key={shortName} value={shortName}>
                {shortName}
              </option>
            ))}
          </>
        )}
      </Select>
      <Button variant="contained" onClick={() => runTests()}>
        Run tests
      </Button>
      <Button
        variant="contained"
        onClick={runTestsWrapped}
        data-cy="run-tests-btn"
      >
        Run tests with wrapped imports
      </Button>
      <PyEditor
        handleRun={handleRun}
        handleRunWrapped={handleRunWrapped}
        allowRun={workerAvailable}
        handleStop={stopWorker}
        isRunning={running}
        editorValue={editorValue}
        setEditorValue={setEditorValue}
      />
      <Output
        outputContent={output}
        testResults={testResults}
        clearOutput={clearOutput}
        inputRequested={inputRequested}
        sendInput={sendInput}
        isRunning={running}
        handleStop={stopWorker}
        testing={testing}
      />
    </div>
  )
}

const defaultSrcContent = `
syote = input("anna syöte: ")
print(syote)
print(syote)
`

/*
  Test file in the format that's used with TMC
 
  The tmc module is not usable with Skulpt because of missing dependencies,
  same with the io module.

  Running the unittest with verbosity > 1 is not necessary with TMC, but
  right now needed with Skulpt to get info about failing/passing tests.
*/

const defaultTests = `
import unittest
from tmc import points
from tmc.utils import get_stdout, load_module, reload_module
from io import StringIO
import sys

module_name='src.main'

def use_input(val):
    sys.stdin = StringIO(val)

def get_stdout_from(fn):
    reload_module(fn)
    return get_stdout()

@points('1.3')
class SyoteTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        use_input(" ")
        cls.module = load_module(module_name)

    def test_syotteen_tulostus_1(self):
        use_input("Pekka")
        output = get_stdout_from(self.module)
        self.assertEqual(output, 'anna syöte: Pekka\\nPekka', 'Tuloste ei toiminut oikein syötteellä: Pekka')

    def test_syotteen_tulostus_2(self):
        use_input("Ada")
        output = get_stdout_from(self.module)
        self.assertEqual(output, 'anna syöte: Ada\\nAda', 'Tuloste ei toiminut oikein syötteellä: Ada')

if __name__ == '__main__':
    unittest.main(2)
`

Quiz.defaultProps = {
  initialFiles: [
    {
      fullName: "main.py",
      shortName: "main.py",
      originalContent: defaultSrcContent,
      content: defaultSrcContent,
    },
  ],
  loadedTestFiles: [
    {
      fullName: "test_main.py",
      shortName: "test_main.py",
      originalContent: defaultTests,
      content: defaultTests,
    },
  ],
}

export { Quiz, QuizProps }
