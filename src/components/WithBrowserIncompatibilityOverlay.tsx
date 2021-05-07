import { Grid } from "@material-ui/core"
import React from "react"
import styled from "styled-components"

import { useTranslation } from "react-i18next"
import { OverlayBox } from "./Overlay"

const StyledOutput = styled(Grid)`
  padding: 5px;
  display: table-cell;
  min-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
`

const WithBrowserIncompatibilityOverlay: React.FunctionComponent = ({
  children,
}) => {
  const [t] = useTranslation()

  const ieOrEdge =
    window.StyleMedia && window.navigator.userAgent.indexOf("Edge") !== -1

  return (
    <div
      style={{
        position: "relative",
        width: "inherit",
      }}
    >
      {ieOrEdge && (
        <OverlayBox>
          <StyledOutput>
            {t("browserNotSupported")}
            <ul>
              <li>Apple Safari</li>
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
            </ul>
          </StyledOutput>
        </OverlayBox>
      )}
      {children}
    </div>
  )
}

export default WithBrowserIncompatibilityOverlay
