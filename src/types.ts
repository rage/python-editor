export type OutputObject = {
  id: string
  type: string
  text: string
}

export type SubmissionResponse = {
  pasteUrl?: string
  showSubmissionUrl: string
  submissionUrl: string
}

export type TestResultObject = {
  id: string
  testName: string
  passed: boolean
  feedback: string
  points: string[]
}
