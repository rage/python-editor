import React from "react"
import Editor, { OnChange, OnMount } from "@monaco-editor/react"
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
  const handleEditorDidMount: OnMount = () => {
    setIsEditorReady(true)
  }

  const handleChange: OnChange = (value) => {
    if (value) {
      setEditorValue(value)
    }
  }

  return (
    <EditorWrapper height={editorHeight}>
      <Editor
        value={editorValue}
        language="python"
        onChange={handleChange}
        onMount={handleEditorDidMount}
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
