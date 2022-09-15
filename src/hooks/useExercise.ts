import { useTranslation } from "react-i18next"
import { useQuery } from "react-query"
import { emptyFile } from "../constants"
import {
  createWebEditorModuleSource,
  extractExerciseArchive,
} from "../services/patch_exercise"
import {
  Configuration,
  getExerciseDetails,
  getExerciseZip,
  getOldSubmissions,
  getSubmissionZip,
} from "../services/programming_exercise"
import { ExerciseDetails, FileEntry, SubmissionDetails } from "../types"

export interface WebEditorExerciseReady {
  ready: true
  details: ExerciseDetails | undefined
  getTestProgram(code: string): string
  projectFiles: ReadonlyArray<FileEntry>
  reset(): void
  submissionDetails: SubmissionDetails | undefined
  templateIssues: ReadonlyArray<string>
  updateDetails(): Promise<void>
}

export interface WebEditorExerciseLoading {
  ready: false
  details: undefined
  getTestProgram(code: string): string
  projectFiles: ReadonlyArray<FileEntry>
  reset(): void
  submissionDetails: undefined
  templateIssues: ReadonlyArray<never>
  updateDetails(): Promise<void>
}

export type WebEditorExercise =
  | WebEditorExerciseLoading
  | WebEditorExerciseReady

interface InternalExercise {
  details: ExerciseDetails | undefined
  projectFiles: ReadonlyArray<FileEntry>
  templateIssues: ReadonlyArray<string>
  testCode: string | undefined
  submissionDetails: SubmissionDetails | undefined
}

export default function useExercise(
  organization: string,
  course: string,
  exercise: string,
  userId: string,
  token: string,
): WebEditorExercise {
  const [t] = useTranslation()
  const getExerciseInfo = useQuery(
    ["exercise", organization, course, exercise, userId],
    async (): Promise<InternalExercise> => {
      try {
        const apiConfig = { token, t }
        const details = await getExerciseDetails(
          organization,
          course,
          exercise,
          apiConfig,
        )
        if (!details.downloadable) {
          return {
            details,
            projectFiles: [
              { ...emptyFile, content: `# ${t("exerciseNotYetUnlocked")}` },
            ],
            templateIssues: [],
            testCode: undefined,
            submissionDetails: undefined,
          }
        }

        const template = await getExercise(
          organization,
          course,
          exercise,
          apiConfig,
        )
        if (!userId || !token) {
          return {
            details,
            projectFiles: guaranteeAtLeastOneFile(template.srcFiles),
            templateIssues: template.problems ?? [],
            testCode: template.testSource,
            submissionDetails: undefined,
          }
        }

        const latestSubmissionDetails = await getLatestSubmissionDetails(
          details.id,
          apiConfig,
        )
        if (latestSubmissionDetails) {
          const submission = await getSubmission(
            latestSubmissionDetails.id,
            apiConfig,
          )
          if (submission) {
            const mapped = template.srcFiles.map<FileEntry>((templateFile) => {
              const submittedFile = submission.srcFiles.find(
                (y) => y.fullName === templateFile.fullName,
              )
              return submittedFile
                ? { ...templateFile, content: submittedFile.content }
                : templateFile
            })
            return {
              details,
              projectFiles: guaranteeAtLeastOneFile(mapped),
              templateIssues: template.problems ?? [],
              testCode: template.testSource,
              submissionDetails: latestSubmissionDetails,
            }
          } else {
            return {
              details,
              projectFiles: guaranteeAtLeastOneFile(template.srcFiles),
              templateIssues: template.problems ?? [],
              testCode: template.testSource,
              submissionDetails: latestSubmissionDetails,
            }
          }
        } else {
          return {
            details,
            projectFiles: guaranteeAtLeastOneFile(template.srcFiles),
            templateIssues: template.problems ?? [],
            testCode: template.testSource,
            submissionDetails: undefined,
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          return {
            details: undefined,
            projectFiles: [{ ...emptyFile, content: `# ${e.message}` }],
            templateIssues: [],
            testCode: undefined,
            submissionDetails: undefined,
          }
        } else {
          return {
            details: undefined,
            projectFiles: [{ ...emptyFile, content: `# Unknown error.` }],
            templateIssues: [],
            testCode: undefined,
            submissionDetails: undefined,
          }
        }
      }
    },
  )

  const getTestProgram = (code: string) => `
__webeditor_module_source = ${createWebEditorModuleSource(code)}
${getExerciseInfo.data?.testCode}
`

  const reset = () => {
    // This is a bit dirty but useQuery doesn't provide a way to mutate the result.
    // TODO: Needs refactoring to decouple stuff from useQuery.
    getExerciseInfo.data?.projectFiles.forEach((x) => ({
      ...x,
      content: x.originalContent,
    }))
  }

  const updateDetails = async () => {
    // This is a bit dirty but useQuery doesn't provide a way to mutate the result.
    // TODO: Needs refactoring to decouple stuff from useQuery.
    try {
      if (getExerciseInfo.isSuccess) {
        const details = await getExerciseDetails(
          organization,
          course,
          exercise,
          {
            token,
            t,
          },
        )
        getExerciseInfo.data.details = details
      }
    } catch (e) {
      // no op
    }
  }

  if (getExerciseInfo.isSuccess) {
    return {
      ready: true,
      details: getExerciseInfo.data.details,
      getTestProgram,
      templateIssues: getExerciseInfo.data.templateIssues,
      projectFiles: getExerciseInfo.data.projectFiles,
      reset,
      submissionDetails: getExerciseInfo.data.submissionDetails,
      updateDetails,
    }
  } else {
    return {
      ready: false,
      details: undefined,
      getTestProgram,
      templateIssues: [],
      projectFiles: [emptyFile],
      reset,
      submissionDetails: undefined,
      updateDetails,
    }
  }
}

const getExercise = async (
  organization: string,
  course: string,
  exercise: string,
  apiConfig: Configuration,
) => {
  const zip = await getExerciseZip(organization, course, exercise, apiConfig)
  const parsed = await extractExerciseArchive(zip, apiConfig)
  return parsed
}

const getLatestSubmissionDetails = async (
  exerciseId: number,
  apiConfig: Configuration,
) => {
  const submissions = await getOldSubmissions(exerciseId, apiConfig)
  if (submissions.length <= 0) {
    return undefined
  }
  const latest = submissions.reduce((latest, current) => {
    return current.createdAtMillis > latest.createdAtMillis ? current : latest
  }, submissions[0])
  return latest
}

const getSubmission = async (
  submissionId: number,
  apiConfig: Configuration,
) => {
  try {
    const zip = await getSubmissionZip(submissionId, apiConfig)
    const parsed = await extractExerciseArchive(zip, apiConfig)
    return parsed
  } catch (e) {
    // Stop caring, show template
    return undefined
  }
}

function guaranteeAtLeastOneFile(files: FileEntry[]): FileEntry[] {
  if (files.length > 0) {
    return files
  } else {
    return [emptyFile]
  }
}
