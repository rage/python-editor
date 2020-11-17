import { faExclamation } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { CircularProgress } from "@material-ui/core"
import React from "react"
import { useTranslation } from "react-i18next"

import { EditorState, OutputObject } from "../types"
import Console from "./Console"
import Help from "./Help"
import {
  OutputBody,
  OutputBox,
  OutputHeader,
  OutputButton,
  OutputHeaderColor,
  OutputHeaderText,
} from "./OutputBox"
import ScrollBox, { ScrollBoxRef } from "./ScrollBox"

interface EditorOutputProps {
  editorState: EditorState
  getPasteLink: () => Promise<string>
  onClose: () => void
  outputContent: OutputObject[]
  outputHeight?: string
  pasteDisabled?: boolean
  sendInput: (input: string) => void
}

const EditorOutput: React.FunctionComponent<EditorOutputProps> = ({
  editorState,
  getPasteLink,
  onClose,
  outputContent,
  outputHeight,
  pasteDisabled,
  sendInput,
}) => {
  const [t] = useTranslation()
  const scrollBoxRef = React.createRef<ScrollBoxRef>()

  const initializing = editorState === EditorState.WorkerInitializing
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
          <OutputHeaderText>
            {initializing ? t("initializing") : t("running")}
          </OutputHeaderText>
        </>
      )
    }
    return null
  }

  return (
    <OutputBox>
      <OutputHeader
        title={t("outputTitle")}
        color={waitingInput ? OutputHeaderColor.Orange : OutputHeaderColor.Gray}
      >
        {getStatus()}
        <Help
          getPasteUrl={getPasteLink}
          pasteDisabled={running || pasteDisabled}
        />
        <OutputButton
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
        </ScrollBox>
      </OutputBody>
    </OutputBox>
  )
}

export default EditorOutput
