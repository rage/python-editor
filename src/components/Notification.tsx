import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Grid } from "@material-ui/core"
import React from "react"
import styled from "styled-components"

const WarningBox = styled(Grid)`
  background-color: #ff9800;
  color: white;
  border-radius: 3px 3px 0 0;
  padding: 8px;
  font-size: 1.25rem;
`

const Content = styled.span`
  margin-left: 10px;
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
