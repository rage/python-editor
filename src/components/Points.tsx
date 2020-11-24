import { useTranslation } from "react-i18next"
import styled from "styled-components"
import { Chip, Paper } from "@material-ui/core"
import React from "react"

const StyledChip = styled(Chip)`
  && {
    margin-right: 10px;
  }
`

const StyledPointsPaper = styled(({ points, ...props }) => (
  <Paper {...props} />
))`
  border-left: 10px solid #4caf50;
  margin: 5px;
  padding: 10px;
`

type PointsProps = {
  points: string[]
}

const Points: React.FunctionComponent<PointsProps> = ({ points }) => {
  const [t] = useTranslation()
  const mapPoints = () => {
    return points.map((point) => (
      <StyledChip key={point} label={point} variant="outlined" />
    ))
  }
  return (
    <StyledPointsPaper points data-cy="submission-points">
      {t("pointsAwarded")}: {mapPoints()}
    </StyledPointsPaper>
  )
}

export default Points
