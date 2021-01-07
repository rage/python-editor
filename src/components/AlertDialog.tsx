import React from "react"
import { useTranslation } from "react-i18next"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import { useState } from "react"
import styled from "styled-components"
import useStyles from "../hooks/useStyles"

type AlertDialogProps = {
  resetExercise: () => void
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 0.5em;
`

const AlertDialog: React.FunctionComponent<AlertDialogProps> = ({
  resetExercise,
}) => {
  const [open, setOpen] = useState(false)
  const [t] = useTranslation()
  const classes = useStyles()

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleCloseAccept = () => {
    resetExercise()
    setOpen(false)
  }

  const handleCloseCancel = () => {
    setOpen(false)
  }

  return (
    <div style={{ display: "inline" }}>
      <StyledButton
        data-cy="reset-btn"
        className={classes.normalButton}
        onClick={handleClickOpen}
      >
        {t("button.reset")}
      </StyledButton>
      <Dialog
        open={open}
        onClose={handleCloseCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t("resetExerciseHeader")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("resetExerciseConfirmation")}
            {t("resetExerciseNotify")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancel} color="primary" autoFocus>
            {t("button.cancel")}
          </Button>
          <Button onClick={handleCloseAccept} color="primary">
            {t("button.ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AlertDialog
