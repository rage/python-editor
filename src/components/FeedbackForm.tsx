import React, { useState } from "react"
import styled from "styled-components"

import { TestResultObject, FeedBackAnswer } from "../types"
import { Button, Paper, Slider, Typography, TextField } from "@material-ui/core"

const Background = styled(Paper)`
  width: 80%;
  height: 300px;
  margin: 10%;
  padding: 10px;
`

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 9001;
  background-color: rgba(127, 127, 127, 0.7);
`

const QuestionContainer = styled.div``

const Question = styled.div`
  margin: 20px;
`

type FeedbackFormProps = {
  onSubmitFeedback: (feedback: Array<FeedBackAnswer>) => void
  awardedPoints?: Array<string>
  feedbackQuestions: TestResultObject["feedbackQuestions"]
  solutionUrl?: string
}

type FormQuestion = {
  id: number
  question: string
  value: string | number
} & (
  | {
      kind: "text" | "other"
    }
  | {
      kind: "intrange"
      min: number
      max: number
    }
)

const FeedbackForm: React.FunctionComponent<FeedbackFormProps> = ({
  awardedPoints,
  onSubmitFeedback,
  feedbackQuestions,
  solutionUrl,
}) => {
  const [formState, setFormState] = useState<Array<FormQuestion>>(
    feedbackQuestions?.map((question) => {
      if (question.kind === "text") {
        return { ...question, kind: "text", value: "" }
      }
      const intrangeMatch = question.kind.match(
        /intrange\[(-?[0-9]+)\.\.(-?[0-9]+)\]/,
      )
      if (intrangeMatch && intrangeMatch[0] === question.kind) {
        const min = parseInt(intrangeMatch[1])
        const max = parseInt(intrangeMatch[2])
        return {
          ...question,
          kind: "intrange",
          value: min - 1,
          min,
          max,
        }
      }
      return { ...question, kind: "other", value: -1 }
    }) || [],
  )

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmitFeedback(
      formState
        .filter(
          (item) =>
            (item.kind === "intrange" && item.value >= item.min) ||
            (item.kind === "text" && item.value.toString().trim() !== ""),
        )
        .map((item) => ({ id: item.id, answer: item.value })),
    )
    setFormState([])
  }

  const onChange = (key: number, newValue: string | number) => {
    setFormState((prev) =>
      prev.map((item) =>
        item.id !== key ? item : { ...item, value: newValue },
      ),
    )
  }

  const mapQuestions = () => {
    return formState.map((question) => {
      switch (question.kind) {
        case "intrange":
          return (
            <Question key={question.id}>
              <Typography gutterBottom>{question.question}</Typography>
              <Slider
                defaultValue={question.min - 1}
                valueLabelFormat={(x) => (x < question.min ? null : x)}
                aria-labelledby="discrete-slider"
                step={1}
                marks
                min={question.min - 1}
                max={question.max}
                valueLabelDisplay="auto"
                onChange={(e, value) => onChange(question.id, value as number)}
              />
            </Question>
          )
        case "text":
          return (
            <Question key={question.id}>
              <Typography gutterBottom>{question.question}</Typography>
              <TextField
                onChange={(e) => onChange(question.id, e.target.value)}
              />
            </Question>
          )
        default:
          return null
      }
    })
  }

  return (
    <Overlay>
      <Background>
        <h2>Congratulations! Exercise completed!</h2>
        {awardedPoints?.length && (
          <p>Points awarded: {awardedPoints?.join(", ")}</p>
        )}
        {solutionUrl && <a href={solutionUrl}>View model solution</a>}
        <form onSubmit={onSubmit}>
          {mapQuestions()}
          <Button type="submit">Submit</Button>
        </form>
      </Background>
    </Overlay>
  )
}

export default FeedbackForm
