import React, { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Button, Input } from "@material-ui/core"

type HelpProps = {
  handlePasteSubmit: () => void
  pasteUrl: string
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 1rem;
`

const StyledInput = styled((props) => <Input {...props} />)`
  margin: 1rem;
  width: 50%;
`

const Help: React.FunctionComponent<HelpProps> = (props) => {
  const { handlePasteSubmit, pasteUrl } = props
  const [t] = useTranslation()
  const [pasteTriggered, setPasteTriggered] = useState(false)
  const [copySuccess, setCopySuccess] = useState("")

  const pasteHandler = async () => {
    setPasteTriggered(true)
    handlePasteSubmit()
  }

  const copyToClipboard = () => {
    const element = document.getElementById("textField") as HTMLInputElement
    element.select()
    document.execCommand("copy")
    setCopySuccess("Copied!")
  }

  return (
    <div>
      <p>{t("tmcPasteDescription")}</p>
      {pasteTriggered && document.queryCommandSupported("copy") ? (
        <div>
          <StyledInput
            id="textField"
            value={pasteUrl}
            data-cy="paste-input"
            readOnly
          />
          <StyledButton data-cy="copy-text-btn" onClick={copyToClipboard}>
            {t("button.copy")}
          </StyledButton>
          {copySuccess}
        </div>
      ) : null}
      <StyledButton
        onClick={pasteHandler}
        disabled={pasteTriggered}
        data-cy="send-to-paste-btn"
      >
        {t("sendToTmcPaste")}
      </StyledButton>
    </div>
  )
}

export default Help
