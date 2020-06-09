export type ExerciseDetails = {
  id: number
  availablePoints?: number
  awardedPoints?: number
  completed: boolean
  deadline?: string
  expired: boolean
  softDeadline?: string
}

export type FeedBackAnswer = {
  questionId: number
  answer: string | number
}

export type OutputObject = {
  id: string
  type: string
  text: string
}

export type Language = "en" | "fi"

export type SubmissionResponse = {
  pasteUrl?: string
  showSubmissionUrl: string
  submissionUrl: string
}

export type TestResultObject = {
  allTestsPassed?: boolean
  points: string[]
  testCases: Array<{
    id: string
    testName: string
    passed: boolean
    feedback: string
  }>
  feedbackQuestions?: Array<{
    id: number
    question: string
    kind: string
  }>
  feedbackAnswerUrl?: string
  solutionUrl?: string
}
