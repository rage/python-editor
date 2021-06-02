import { Button } from "@material-ui/core"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"

interface ErrorProps {
  error: string
  trace: Array<string>
}

const StyledPythonError = styled.div`
  border-color: f23535;
  border-style: solid;
  border-radius: 7px;
  margin-top: 4px;
  padding: 10px;
  width: auto;
`

const PythonError: React.FunctionComponent<ErrorProps> = ({ error, trace }) => {
  const [showTrace, setShowTrace] = useState(false)
  const [t] = useTranslation()

  return (
    <StyledPythonError>
      <p>{error}</p>
      {trace.length > 0 ? (
        <Button
          onClick={() => setShowTrace(!showTrace)}
          variant="contained"
          data-cy="show-trace-button"
        >
          {showTrace ? t("hideFunctionCalls") : t("showFunctionCalls")}
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
