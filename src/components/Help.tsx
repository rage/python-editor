import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import {
  Button,
  Input,
  makeStyles,
  Typography,
  Tooltip,
  withStyles,
} from "@material-ui/core"
import ClickAwayListener from "@material-ui/core/ClickAwayListener"

type HelpProps = {
  getPasteUrl: () => Promise<string>
  pasteDisabled?: boolean
}

const useStyles = makeStyles({
  blueButton: {
    margin: "5px",
    backgroundColor: "#0275d8",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#0275d8",
    },
  },
  darkButton: {
    margin: "5px",
    backgroundColor: "#696969",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#808080",
    },
    "&:disabled": {
      backgroundColor: "#A9A9A9",
    },
  },
})

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: "#D3D3D3",
    color: "black",
    minWidth: 400,
    maxWidth: 600,
    fontSize: theme.typography.pxToRem(12),
  },
  arrow: {
    color: "#D3D3D3",
  },
}))(Tooltip)

const StyledInput = styled((props) => <Input {...props} />)`
  margin: 1rem;
  width: 60%;
`

const Help: React.FunctionComponent<HelpProps> = ({
  getPasteUrl,
  pasteDisabled,
}) => {
  const [copySuccess, setCopySuccess] = useState(false)
  const [rePasteDisabled, setRePasteDisabled] = useState(false)
  const [pasteUrl, setPasteUrl] = useState<string | undefined>()
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [t] = useTranslation()
  const classes = useStyles()

  const handleOpenTooltip = () => {
    setTooltipOpen(true)
    setShowHelp(true)
  }

  const handleCloseTooltip = () => {
    setTooltipOpen(false)
    setShowHelp(false)
    setRePasteDisabled(false)
    setPasteUrl(undefined)
    setCopySuccess(false)
  }

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

  const showHelpTooltip = () => {
    return (
      <div style={{ margin: "10px" }}>
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
              <Button
                className={classes.blueButton}
                data-cy="copy-text-btn"
                onClick={copyToClipboard}
              >
                {t("button.copy")}
              </Button>
            )}
            {copySuccess && (
              <span style={{ paddingLeft: "3px" }}>
                {t("copiedConfirmation")}
              </span>
            )}
          </div>
        )}
        <Button
          className={classes.darkButton}
          onClick={pasteHandler}
          disabled={rePasteDisabled}
          data-cy="send-to-paste-btn"
        >
          {t("sendToTmcPaste")}
        </Button>
      </div>
    )
  }

  return (
    <ClickAwayListener onClickAway={handleCloseTooltip}>
      <div>
        <HtmlTooltip
          PopperProps={{
            disablePortal: false,
          }}
          onClose={handleCloseTooltip}
          open={tooltipOpen}
          interactive
          disableFocusListener
          disableHoverListener
          disableTouchListener
          placement="bottom-end"
          title={showHelpTooltip()}
          arrow
        >
          <Button
            variant="contained"
            disabled={pasteDisabled}
            onClick={showHelp ? handleCloseTooltip : handleOpenTooltip}
            data-cy="need-help-btn"
            className={classes.blueButton}
          >
            {t("needHelp")}
          </Button>
        </HtmlTooltip>
      </div>
    </ClickAwayListener>
  )
}

export default Help
