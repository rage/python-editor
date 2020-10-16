import React from "react"
import styled from "styled-components"
import { Button, Grid, Typography } from "@material-ui/core"
import TestProgressBar from "./TestProgressBar"

enum OutputHeaderColor {
  Blue = "#2196f3",
  Orange = "#FF9800",
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
  color: white;
  border-radius: 3px 3px 0 0;
  padding: 5px;
`

const OutputTitleText = styled(Typography)`
  && {
    font-size: 1 rem;
    display: inline-block;
    padding: 5px;
    color: white;
  }
`

const StyledOutputContent = styled(Grid)`
  padding: 10px;
  display: table-cell;
`

const MarginedButton = styled(Button)`
  margin: 3px !important;
`

const OutputBox: React.FunctionComponent = (props) => (
  <Grid container direction="column">
    {props.children}
  </Grid>
)

interface OutputHeaderButtonProps {
  dataCy?: string
  disabled?: boolean
  label: string
  onClick?: () => void
}

const OutputHeaderButton: React.FunctionComponent<OutputHeaderButtonProps> = (
  props,
) => (
  <MarginedButton
    disabled={props.disabled}
    onClick={props.onClick}
    variant="contained"
    data-cy={props.dataCy}
  >
    {props.label}
  </MarginedButton>
)

const OutputHeaderText = styled(Typography)`
  && {
    margin: 0 10px 0 10px;
    color: white;
  }
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
        <OutputTitleText>{title}</OutputTitleText>
      </Grid>
      <Grid container item xs={6} alignItems="center" justify="flex-end">
        {children}
      </Grid>
    </StyledOutputTitle>
  )
}

interface OutputHeaderWithPercentageProps extends OutputHeaderProps {
  percentage: number
  percentageTitle: string
}

const OutputHeaderWithPercentage: React.FunctionComponent<OutputHeaderWithPercentageProps> = (
  props,
) => {
  const { children, color, percentage, percentageTitle, title } = props

  return (
    <StyledOutputTitle backgroundColor={color}>
      <Grid item xs={2}>
        <OutputTitleText>{title}</OutputTitleText>
      </Grid>
      <Grid item xs={5}>
        <TestProgressBar percentage={percentage} title={percentageTitle} />
      </Grid>
      <Grid container item xs={4} alignItems="center" justify="flex-end">
        {children}
      </Grid>
    </StyledOutputTitle>
  )
}

export {
  OutputBox,
  OutputBody,
  OutputHeader,
  OutputHeaderButton,
  OutputHeaderColor,
  OutputHeaderText,
  OutputHeaderWithPercentage,
}
