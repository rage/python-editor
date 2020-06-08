import React from "react"
import { ControlledEditor } from "@monaco-editor/react"
import styled from "styled-components"

interface EditorWrapperProps {
  height?: string
}

const EditorWrapper = styled.div`
  min-height: 200px;
  max-height: 950px;
  border: 1px inset;
  height: ${(props: EditorWrapperProps) =>
    props.height ? props.height : "400px"};
`

type PyEditorProps = {
  editorValue: string
  editorHeight: string | undefined
  setEditorValue(editorValue: string): void
  setIsEditorReady(isReady: boolean): void
}

const PyEditor: React.FunctionComponent<PyEditorProps> = ({
  editorValue,
  setEditorValue,
  editorHeight,
  setIsEditorReady,
}) => {
  function handleEditorDidMount(_: any, editor: any) {
    setIsEditorReady(true)
  }

  const handleChange = (ev: any, value: string | undefined): string => {
    if (value) {
      setEditorValue(value)
      return value
    }
    return ""
  }

  return (
    <EditorWrapper height={editorHeight}>
      <ControlledEditor
        value={editorValue}
        language="python"
        editorDidMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          wordWrap: "on",
          scrollBeyondLastLine: false,
          hideCursorInOverviewRuler: true,
          scrollbar: { alwaysConsumeMouseWheel: false },
        }}
      />
    </EditorWrapper>
  )
}

export default PyEditor
