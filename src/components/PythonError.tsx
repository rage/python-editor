import React, { useState } from "react"
import styled from "styled-components"

interface ErrorProps {
  error: string
  trace: Array<[number, string]>
}

const StyledPythonError = styled.div`
  border-color: f97777;
  border-style: solid;
  border-radius: 10px;
  padding: 10px;
  width: auto;
`

const PythonError: React.FunctionComponent<ErrorProps> = ({ error, trace }) => {
  const [showTrace, setShowTrace] = useState(true)

  return (
    <StyledPythonError>
      {error}
      {showTrace && (
        <ul>
          {trace.map((x) => (
            <li key={x[0]}>
              {x[0]} {x[1]}
            </li>
          ))}
        </ul>
      )}
    </StyledPythonError>
  )
}

export default PythonError
