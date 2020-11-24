import { LinearProgress, makeStyles } from "@material-ui/core"
import React from "react"
import { useTranslation } from "react-i18next"

import Help from "./Help"
import {
  OutputBody,
  OutputBox,
  OutputButton,
  OutputColor,
  OutputHeaderText,
  OutputFooter,
  OutputHeader,
} from "./OutputBox"

interface SubmissionOutputProps {
  getPasteLink: () => Promise<string>
  pasteDisabled: boolean
  onClose: () => void
}

const useStyles = makeStyles({
  blueButton: {
    backgroundColor: "#0275d8",
    color: "white",
    "&:hover": {
      backgroundColor: "#0275d8",
    },
  },
})

const SubmittingOutput: React.FunctionComponent<SubmissionOutputProps> = (
  props,
) => {
  const { getPasteLink, onClose } = props
  const [t] = useTranslation()
  const classes = useStyles()

  return (
    <OutputBox>
      <OutputHeader title={t("submitting")} color={OutputColor.Gray}>
        <Help getPasteUrl={getPasteLink} pasteDisabled={true} />
        <OutputButton
          label={t("button.close")}
          onClick={onClose}
          disabled={true}
          dataCy="close-btn"
        />
      </OutputHeader>
      <OutputBody>
        <div style={{ textAlign: "center", margin: "10px 0px" }}>
          <OutputHeaderText variant="h5">
            {t("submittingToServer")}
          </OutputHeaderText>
          <LinearProgress style={{ width: "42%", margin: "0 auto" }} />
        </div>
      </OutputBody>
      <OutputFooter color={OutputColor.Gray}>
        <OutputButton
          disabled={true}
          label={t("button.submit")}
          dataCy="submit-btn"
          className={classes.blueButton}
        />
      </OutputFooter>
    </OutputBox>
  )
}

export default SubmittingOutput
