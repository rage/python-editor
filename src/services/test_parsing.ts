import { TestResultObject } from "../types"

interface TestRunnerResult {
  message: string
  name: string
  passed: boolean
}

const parseTestCases = (
  testCases: unknown[],
): TestResultObject["testCases"] => {
  return testCases.map((x, id) => {
    const feedback = (x as TestRunnerResult).message ?? "null"
    const passed = (x as TestRunnerResult).passed ?? false
    const testName = (x as TestRunnerResult).name ?? "noTestName"

    return { id: id.toString(), feedback, passed, testName }
  })
}

const removeFalseIsNotTrue = (input: string): string => {
  const matchFalse = input.match(/^False is not true : ([\s\S]+)/i)
  const matchTrue = input.match(/^True is not false : ([\s\S]+)/i)
  if (matchFalse) {
    return matchFalse[1]
  } else if (matchTrue) {
    return matchTrue[1]
  } else {
    return input
  }
}

export { removeFalseIsNotTrue, parseTestCases }
