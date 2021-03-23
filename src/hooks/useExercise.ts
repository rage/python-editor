import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { defaultFile } from "../components/ProgrammingExercise"
import {
  createWebEditorModuleSource,
  extractExerciseArchive,
} from "../services/patch_exercise"
import {
  getExerciseDetails,
  getExerciseZip,
  getLatestSubmissionDetails,
  getLatestSubmissionZip,
} from "../services/programming_exercise"
import { ExerciseDetails, FileEntry } from "../types"
import { mergeArraysFromRight } from "../utils/arrays"

export interface WebEditorExercise {
  details: ExerciseDetails | undefined
  getTestProgram(code: string): string
  projectFiles: ReadonlyArray<FileEntry>
  ready: boolean
  reset(): void
  templateIssues: ReadonlyArray<string>
  updateDetails(): Promise<void>
}

export default function useExercise(
  organization: string,
  course: string,
  exercise: string,
  token: string,
): WebEditorExercise {
  const [ready, setReady] = useState(false)
  const [details, setDetails] = useState<ExerciseDetails>()
  const [projectFiles, setProjectFiles] = useState<ReadonlyArray<FileEntry>>([
    defaultFile,
  ])
  const [templateIssues, setTemplateIssues] = useState<ReadonlyArray<string>>(
    [],
  )
  const [testCode, setTestCode] = useState<string>()
  const [t] = useTranslation()
  const apiConfig = { t, token }

  useEffect(() => {
    const effect = async () => {
      setReady(false)
      try {
        const details = await getDetails()
        setDetails(details)
        if (!details.unlocked) {
          setProjectFiles([
            { ...defaultFile, content: `# ${t("exerciseNotYetUnlocked")}` },
          ])
          setTemplateIssues([])
          setTestCode(undefined)
          return
        }

        const template = await extractExerciseArchive(
          await getExercise(),
          apiConfig,
        )
        const submissionDetails = await getSubmissionDetails(details.id)
        const submission = await extractExerciseArchive(
          await getSubmission(submissionDetails.id),
          apiConfig,
        )
        setProjectFiles(
          mergeArraysFromRight(
            template.srcFiles,
            submission.srcFiles,
            (a, b) => a.fullName === b.fullName,
          ),
        )
        setTemplateIssues(template.problems ?? [])
        setTestCode(template.testSource)
      } catch (e) {
        setDetails(undefined)
        setProjectFiles([{ ...defaultFile, content: `# ${e.message}` }])
        setTemplateIssues([])
        setTestCode(undefined)
      }
      setReady(true)
    }

    console.log("Effect triggered")
    setReady(false)
    effect()
  }, [organization, course, exercise, token])

  const getDetails = () =>
    getExerciseDetails(organization, course, exercise, apiConfig)

  const getExercise = () =>
    getExerciseZip(organization, course, exercise, apiConfig)

  const getSubmissionDetails = (exerciseId: number) =>
    getLatestSubmissionDetails(exerciseId, apiConfig)

  const getSubmission = (submissionId: number) =>
    getLatestSubmissionZip(submissionId, apiConfig)

  const getTestProgram = (code: string) => `
__webeditor_module_source = ${createWebEditorModuleSource(code)}
${testCode}
`

  const reset = () => {
    setProjectFiles((prev) =>
      prev.map((x) => ({ ...x, content: x.originalContent })),
    )
  }

  const updateDetails = async () => {
    try {
      const details = await getDetails()
      setDetails(details)
    } catch (e) {}
  }

  return {
    details,
    getTestProgram,
    templateIssues,
    projectFiles,
    ready,
    reset,
    updateDetails,
  }
}
