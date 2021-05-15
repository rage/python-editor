import React, { useState } from "react"

interface ErrorProps {
  error: string
  trace: Array<[number, string]>
}

const PythonError: React.FunctionComponent<ErrorProps> = ({ error, trace }) => {
  const [showTrace, setShowTrace] = useState(true)

  return (
    <div>
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
    </div>
  )
}

export default PythonError
