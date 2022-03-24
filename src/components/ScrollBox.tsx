import React, { useImperativeHandle } from "react"
import styled from "styled-components"

interface ScrollBoxRef {
  scrollToBottom: () => void
  scrollToTop: () => void
}

interface ScrollBoxProps {
  children?: React.ReactNode
  maxHeight?: string
}

const StyledScrollBox = styled.div<ScrollBoxProps>`
  max-height: ${(props) =>
    props.maxHeight && props.maxHeight !== "auto" ? props.maxHeight : "500px"};
  min-height: 100px;
  overflow: auto;
`

const ScrollBox = React.forwardRef<ScrollBoxRef, ScrollBoxProps>(
  (props, ref) => {
    const { children, maxHeight } = props
    const scrollBoxRef = React.createRef<HTMLInputElement>()

    const scrollToBottom = () => {
      if (scrollBoxRef?.current) {
        scrollBoxRef.current.scrollTop = scrollBoxRef.current.scrollHeight
      }
    }

    const scrollToTop = () => {
      if (scrollBoxRef?.current) {
        scrollBoxRef.current.scrollTop = 0
      }
    }

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToTop,
    }))

    return (
      <StyledScrollBox maxHeight={maxHeight} ref={scrollBoxRef}>
        {children}
      </StyledScrollBox>
    )
  },
)
ScrollBox.displayName = "ScrollBox"

export default ScrollBox
export { ScrollBoxRef }
