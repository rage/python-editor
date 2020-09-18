export enum EditorState {
  ExecutingCode = 1 << 0,
  Idle = 1 << 1,
  Initializing = 1 << 2,
  RunAborted = 1 << 3,
  ShowHelp = 1 << 4,
  ShowPassedFeedbackForm = 1 << 5,
  ShowPasteResults = 1 << 6,
  ShowSubmissionResults = 1 << 7,
  ShowTestResults = 1 << 8,
  Submitting = 1 << 9,
  SubmittingToPaste = 1 << 10,
  Testing = 1 << 11,
  WaitingInput = 1 << 12,
  WorkerActive = ExecutingCode | WaitingInput | Testing,
}

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
