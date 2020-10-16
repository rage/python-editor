import React, { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Button, Input, Paper, Typography } from "@material-ui/core"

type HelpProps = {
  getPasteUrl: () => Promise<string>
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
  const { getPasteUrl } = props
  const [t] = useTranslation()
  const [pasteUrl, setPasteUrl] = useState<string | undefined>()
  const [copySuccess, setCopySuccess] = useState("")

  const pasteHandler = async () => {
    getPasteUrl()
      .then((url) => {
        setPasteUrl(url)
      })
      .catch((error) => {
        setPasteUrl(error)
      })
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
      {pasteUrl && (
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
        disabled={pasteUrl?.startsWith("error")}
        data-cy="send-to-paste-btn"
      >
        {t("sendToTmcPaste")}
      </StyledButton>
    </StyledPaper>
  )
}

export default Help
