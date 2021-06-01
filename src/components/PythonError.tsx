import { Button } from "@material-ui/core"
import React, { useState } from "react"
import styled from "styled-components"

interface ErrorProps {
  error: string
  trace: Array<string>
}

const StyledPythonError = styled.div`
  border-color: f97777;
  border-style: solid;
  border-radius: 10px;
  padding: 10px;
  width: auto;
`

const PythonError: React.FunctionComponent<ErrorProps> = ({ error, trace }) => {
  const [showTrace, setShowTrace] = useState(false)

  return (
    <StyledPythonError>
      {error}
      {trace.length > 0 ? (
        <Button
          onClick={() => setShowTrace(!showTrace)}
          data-cy="show-trace-button"
        >
          Toggle calls
        </Button>
      ) : null}
      {showTrace && (
        <ol>
          {trace.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      )}
    </StyledPythonError>
  )
}

export default PythonError
