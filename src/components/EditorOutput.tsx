import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { CircularProgress, Grid } from "@material-ui/core"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { EditorState, OutputObject } from "../types"
import Console from "./Console"
import Help from "./Help"
import {
  OutputBody,
  OutputHeader,
  OutputHeaderButton,
  OutputHeaderColor,
  OutputHeaderText,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"

const { Blue, Orange } = OutputHeaderColor

interface EditorOutputProps {
  editorState: EditorState
  getPasteLink: () => Promise<string>
  onClose: () => void
  outputContent: OutputObject[]
  outputHeight?: string
  pasteDisabled?: boolean
  sendInput: (input: string) => void
}

const EditorOutput: React.FunctionComponent<EditorOutputProps> = (props) => {
  const {
    editorState,
    getPasteLink,
    onClose,
    outputContent,
    outputHeight,
    pasteDisabled,
    sendInput,
  } = props
  const [t] = useTranslation()
  const [showHelp, setShowHelp] = useState(false)
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  const hasErrors = outputContent.some((item: any) => item.type === "error")
  const running = (editorState & EditorState.WorkerActive) !== 0
  const waitingInput = editorState === EditorState.WaitingInput

  const getStatus = () => {
    if (waitingInput) {
      return (
        <>
          <FontAwesomeIcon icon={faExclamation} />
          <OutputHeaderText>{t("waitingForInput")}</OutputHeaderText>
        </>
      )
    } else if (running) {
      return (
        <>
          <CircularProgress size={25} color="inherit" disableShrink />
          <OutputHeaderText>{t("running")}</OutputHeaderText>
        </>
      )
    }
    return null
  }

  return (
    <Grid container direction="column">
      <OutputHeader
        title={t("outputTitle")}
        color={waitingInput ? Orange : Blue}
      >
        {getStatus()}
        {hasErrors && (
          <OutputHeaderButton
            disabled={pasteDisabled}
            label={t("needHelp")}
            onClick={() => setShowHelp(true)}
            dataCy="need-help-btn"
          />
        )}
        <OutputHeaderButton
          label={t("button.close")}
          onClick={onClose}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <ScrollBox maxHeight={outputHeight} ref={scrollBoxRef}>
          <Console
            inputRequested={waitingInput}
            outputContent={outputContent}
            scrollToBottom={() => scrollBoxRef.current?.scrollToBottom()}
            sendInput={sendInput}
          />
          {showHelp && <Help getPasteUrl={getPasteLink} />}
        </ScrollBox>
      </OutputBody>
    </Grid>
  )
}

export default EditorOutput