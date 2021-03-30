import { FileEntry } from "../types"

export const emptyFile: FileEntry = {
  fullName: "",
  shortName: "",
  originalContent: "",
  content: "",
}

const defaultSrcContent = `# No ProgrammingExercise has been loaded.
# This is the default file main.py

from .utils import greeting, getLocality

def greetWorld():
  print(greeting(getLocality()))

def foo():
  print("foo!")
`

const defaultTestContent = `# No ProgrammingExercise has been loaded.
# This is the default file test.py

from .main import greetWorld

greetWorld()
`

const defaultUtilsContent = `# No ProgrammingExercise has been loaded.
# This is the default file utils.py

# Mutually recursive imports are disallowed.
# Try uncommenting the line below!
#from .main import foo

def greeting(recipient):
  return "Hello " + recipient + "!"

def getLocality():
  return "world"
`

export const exampleFiles: ReadonlyArray<FileEntry> = [
  {
    fullName: "main.py",
    shortName: "main.py",
    originalContent: defaultSrcContent,
    content: defaultSrcContent,
  },
  {
    fullName: "utils.py",
    shortName: "utils.py",
    originalContent: defaultUtilsContent,
    content: defaultUtilsContent,
  },
  {
    fullName: "test.py",
    shortName: "test.py",
    originalContent: defaultTestContent,
    content: defaultTestContent,
  },
]
