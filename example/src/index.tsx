import * as React from "react"
import { Quiz } from "../../src"
import {
  FormControlLabel,
  Checkbox,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import SimpleErrorBoundary from "./SimpleErrorBoundary"
import { useInput, useLocalStorage } from "./customHooks"

const hello: string = '# A hello world program\nprint("Hello world")\n'

const App = () => {
  return <Quiz editorInitialValue={hello} />
}

export default App
