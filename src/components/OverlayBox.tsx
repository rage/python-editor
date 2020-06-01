import styled from "styled-components"
import { Paper, Grid } from "@material-ui/core"
import React from "react"

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9000;
  background-color: rgba(127, 127, 127, 0.7);
`
const Background = styled(Paper)`
  position: absolute;
  overflow: hidden;
  z-index: 9001;
  width: 80%;
  box-shadow: -2px 3px 2px 1px rgba(0, 0, 0, 0.2),
    0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
  margin: 3% 10% 3% 10%;
  border-radius: 10px !important;
`

const OverlayBox: React.FunctionComponent = (props) => {
  return (
    <Overlay>
      <Background>
        <Grid container direction="row">
          {props.children}
        </Grid>
      </Background>
    </Overlay>
  )
}

export default OverlayBox
