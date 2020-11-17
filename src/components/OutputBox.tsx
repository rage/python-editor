import React from "react"
import styled from "styled-components"
import {
  Button,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core"
import TestProgressBar from "./TestProgressBar"
import { useTranslation } from "react-i18next"

enum OutputHeaderColor {
  Orange = "rgb(255, 128, 0)",
  Gray = "#E8E8E8",
}

const StyledOutputTitle = styled(({ backgroundColor, ...props }) => (
  <Grid
    container
    item
    direction="row"
    alignItems="center"
    justify="space-between"
    {...props}
  />
))`
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: black;
  border-radius: 3px 3px 0 0;
  padding: 5px;
`

const OutputTitleText = styled(Typography)`
  display: inline-block;
  padding: 5px;
  margin-left: 10px !important;
  color: #252525;
`

const StyledOutputContent = styled(Grid)`
  padding: 10px;
  display: table-cell;
`

const StyledButton = styled(Button)`
  margin: 5px !important;
`

const OutputBox: React.FunctionComponent = (props) => (
  <Grid container direction="column">
    {props.children}
  </Grid>
)

interface OutputButtonProps {
  dataCy?: string
  disabled?: boolean
  label: string
  onClick?: () => void
  className?: string
}

const OutputButton: React.FunctionComponent<OutputButtonProps> = (props) => (
  <StyledButton
    disabled={props.disabled}
    onClick={props.onClick}
    variant="contained"
    data-cy={props.dataCy}
    className={props.className}
  >
    {props.label}
  </StyledButton>
)

const OutputHeaderText = styled(Typography)`
  margin: 0 10px !important;
  color: black;
`

const OutputBody: React.FunctionComponent<{}> = (props) => (
  <StyledOutputContent>{props.children}</StyledOutputContent>
)

interface OutputHeaderProps {
  color: OutputHeaderColor
  title: string
}

const OutputHeader: React.FunctionComponent<OutputHeaderProps> = (props) => {
  const { children, color, title } = props

  return (
    <StyledOutputTitle backgroundColor={color}>
      <Grid item xs={2}>
        <OutputTitleText variant="h6">{title}</OutputTitleText>
      </Grid>
      <Grid container item xs={10} alignItems="center" justify="flex-end">
        {children}
      </Grid>
    </StyledOutputTitle>
  )
}
interface OutputFooterWithPercentageProps extends OutputHeaderProps {
  percentage: number
  percentageTitle: string
  showAll?: boolean
  setShowAll?: (showAll: boolean) => void
}

const OutputFooterWithPercentage: React.FunctionComponent<OutputFooterWithPercentageProps> = (
  props,
) => {
  const {
    children,
    color,
    percentage,
    percentageTitle,
    title,
    showAll,
    setShowAll,
  } = props
  const [t] = useTranslation()

  return (
    <StyledOutputTitle backgroundColor={color}>
      <Grid style={{ borderRight: "solid 1px lightgray" }} item xs={2}>
        <FormControlLabel
          label={t("showAll")}
          style={{ paddingLeft: "5px" }}
          control={
            <Checkbox
              checked={showAll}
              onChange={() => setShowAll?.(!showAll)}
              color="primary"
              data-cy="show-all-results-checkbox"
            />
          }
        />
      </Grid>
      <Grid item xs={2}>
        <OutputTitleText>{title}</OutputTitleText>
      </Grid>
      <Grid item xs={5}>
        <TestProgressBar percentage={percentage} title={percentageTitle} />
      </Grid>
      <Grid container item xs={3} alignItems="center" justify="flex-end">
        {children}
      </Grid>
    </StyledOutputTitle>
  )
}
export {
  OutputBox,
  OutputBody,
  OutputHeader,
  OutputButton,
  OutputHeaderColor,
  OutputHeaderText,
  OutputFooterWithPercentage,
}
