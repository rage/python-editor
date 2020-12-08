import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Grid } from "@material-ui/core"
import React from "react"
import styled from "styled-components"

const WarningBox = styled(Grid)`
  background-color: #e8e8e8;
  color: #ff9800;
  border-radius: 3px 3px;
  padding: 12px;
  font-size: 1rem;
`

const Content = styled.span`
  margin-left: 10px;
  color: black;
`

type NotificationProps = {
  style: "warning"
}

const Notification: React.FunctionComponent<NotificationProps> = ({
  children,
  style,
}) => {
  switch (style) {
    case "warning":
    default:
      return (
        <WarningBox>
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <Content>{children}</Content>
        </WarningBox>
      )
  }
}

export default Notification
