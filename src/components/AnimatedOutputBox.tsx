import React, { useEffect, useImperativeHandle, useState } from "react"
import styled, { keyframes } from "styled-components"
import { Paper } from "@material-ui/core"

const ContainerBox = styled.div`
  overflow: hidden;
  position: relative;
  width: 100%;
  bottom: 0;
  min-height: 100px;
  box-shadow: -2px 3px 2px 1px rgba(0, 0, 0, 0.2),
    0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
`

const show = (animateHeight: string | undefined) => keyframes`
    from {
      transform: translateY(${
        animateHeight && animateHeight !== "auto" ? animateHeight : "225px"
      });
    }

    to  {
      transform: translateY(0px);
    }
  }
`
const hide = (animateHeight: string | undefined) => keyframes`
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(${
      animateHeight && animateHeight !== "auto" ? animateHeight : "225px"
    });
  }
`

const AnimatedOutputBox = styled(Paper)<{
  open: boolean
  animatefrom: string | undefined
}>`
  animation: ${(props) =>
      props.open ? show(props.animatefrom) : hide(props.animatefrom)}
    0.2s ease-in-out;
  border: 4px 4px 0px 0px;
  position: relative;
  width: 100%;
`

interface AnimatedOutputBoxProps {
  children?: any
  isRunning: boolean
  outputHeight?: string
}

type AnimatedOutputBoxRef = {
  close(): void
  open(): void
}

const Output = React.forwardRef<AnimatedOutputBoxRef, AnimatedOutputBoxProps>(
  (props, ref) => {
    const [open, setOpen] = useState(false)
    const [render, setRender] = useState(false)
    const { isRunning, outputHeight } = props

    const close = () => {
      setOpen(false)
    }

    const openFn = () => {
      setOpen(true)
      setRender(true)
    }

    useEffect(() => {
      if (isRunning && !render) {
        setRender(true)
        if (!open) setOpen(true)
      }
    }, [isRunning, open, render])

    useImperativeHandle(ref, () => {
      return { close, open: openFn }
    })

    const onAnimationEnd = () => {
      if (!open) {
        setRender(false)
      }
    }

    if (!render) return null

    return (
      <ContainerBox data-cy="output-container">
        <AnimatedOutputBox
          animatefrom={outputHeight}
          open={open}
          onAnimationEnd={onAnimationEnd}
        >
          {props.children}
        </AnimatedOutputBox>
      </ContainerBox>
    )
  },
)
Output.displayName = "Output"

export default Output
export { AnimatedOutputBoxRef }
