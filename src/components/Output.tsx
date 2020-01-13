import React from "react"

type OutputProps = {
  outputText: string
  clearOutput: () => void
}

const Output: React.FunctionComponent<OutputProps> = props => {
  const { outputText, clearOutput } = props
  if (!outputText || outputText.length === 0) return null

  const outputContainerStyle = {
    width: "100%",
    height: "200px",
    border: "solid 1px #dcdcdc",
    backgroundColor: "white",
    position: "absolute" as "absolute",
    bottom: 0,
  }

  const outputStyle = {
    overflow: "auto",
    whiteSpace: "pre-wrap" as "pre-wrap",
    height: "140px",
  }

  return (
    <div style={outputContainerStyle}>
      <h3 style={{ display: "inline-block" }}>Output</h3>
      <button onClick={clearOutput} style={{ float: "right" }}>
        Close
      </button>
      <div style={outputStyle}>{props.outputText}</div>
    </div>
  )
}

export default Output
