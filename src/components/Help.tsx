import React, { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Button, Input, Paper, Typography } from "@material-ui/core"

type HelpProps = {
  getPasteUrl: () => Promise<string>
  pasteDisabled?: boolean
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

const Help: React.FunctionComponent<HelpProps> = ({
  getPasteUrl,
  pasteDisabled,
}) => {
  const [copySuccess, setCopySuccess] = useState(false)
  const [rePasteDisabled, setRePasteDisabled] = useState(false)
  const [pasteUrl, setPasteUrl] = useState<string | undefined>()
  const [showHelp, setShowHelp] = useState(false)
  const [t] = useTranslation()

  const pasteHandler = async () => {
    getPasteUrl()
      .then((url) => {
        setPasteUrl(url)
        setRePasteDisabled(true)
      })
      .catch((error) => {
        setPasteUrl(error)
      })
  }

  const copyToClipboard = () => {
    const element = document.getElementById("textField")
    if (element instanceof HTMLInputElement) {
      element.select()
      document.execCommand("copy")
      setCopySuccess(true)
    }
  }

  if (!showHelp) {
    return (
      <div style={{ textAlign: "right" }}>
        <StyledButton
          disabled={pasteDisabled}
          onClick={() => setShowHelp(true)}
          data-cy="need-help-btn"
        >
          {t("needHelp")}
        </StyledButton>
      </div>
    )
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
          {copySuccess && (
            <span style={{ paddingLeft: "3px" }}>
              {t("copiedConfirmation")}
            </span>
          )}
        </div>
      )}
      <StyledButton
        onClick={pasteHandler}
        disabled={rePasteDisabled}
        data-cy="send-to-paste-btn"
      >
        {t("sendToTmcPaste")}
      </StyledButton>
    </StyledPaper>
  )
}

export default Help
