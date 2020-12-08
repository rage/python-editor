import React from "react"
import { useTranslation } from "react-i18next"
import {
  OutputBody,
  OutputBox,
  OutputButton,
  OutputHeader,
  OutputColor,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"

interface EditorOutputProps {
  onClose: () => void
  outputHeight?: string
  problems: string[]
}

const EditorOutput: React.FunctionComponent<EditorOutputProps> = ({
  onClose,
  outputHeight,
  problems,
}) => {
  const [t] = useTranslation()
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  return (
    <OutputBox>
      <OutputHeader title={t("problemsTitle")} color={OutputColor.Gray}>
        <OutputButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          {t("incompatibleExerciseTemplate")}{" "}
          {t("pleaseReportFollowingErrorsToCourseInstructor")}:
          {problems.map((x, i) => (
            <div key={i}>{x}</div>
          ))}
        </ScrollBox>
      </OutputBody>
    </OutputBox>
  )
}

export default EditorOutput
