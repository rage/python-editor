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
  const match = input.match(/^False is not true : ([\s\S]+)/i)
  return match ? match[1] : input
}

export { removeFalseIsNotTrue, parseTestCases }
