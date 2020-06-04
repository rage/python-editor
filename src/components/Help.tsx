import React, { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Button, Input, Paper, Typography } from "@material-ui/core"

type HelpProps = {
  handlePasteSubmit: () => void
  pasteUrl: string
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 0.7rem !important;
`

const StyledInput = styled((props) => <Input {...props} />)`
  margin: 1rem;
  width: 60%;
`

const StyledPaper = styled(({ ...props }) => <Paper {...props} />)`
  margin: 5px;
  padding: 10px;
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
    setCopySuccess(t("copiedConfirmation"))
  }

  return (
    <StyledPaper>
      <Typography>{t("tmcPasteDescription")}</Typography>
      {pasteTriggered && (
        <div>
          <StyledInput
            id="textField"
            value={pasteUrl}
            data-cy="paste-input"
            readOnly
          />
          {document.queryCommandSupported("copy") && (
            <StyledButton data-cy="copy-text-btn" onClick={copyToClipboard}>
              {t("button.copy")}
            </StyledButton>
          )}
          <span style={{ paddingLeft: "3px" }}>{copySuccess}</span>
        </div>
      )}
      <StyledButton
        onClick={pasteHandler}
        disabled={pasteTriggered}
        data-cy="send-to-paste-btn"
      >
        {t("sendToTmcPaste")}
      </StyledButton>
    </StyledPaper>
  )
}

export default Help
