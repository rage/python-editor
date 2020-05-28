import React, { useState } from "react"
import styled from "styled-components"

import { TestResultObject, FeedBackAnswer } from "../types"
import {
  Button,
  Paper,
  Slider,
  Typography,
  Grid,
  TextareaAutosize,
} from "@material-ui/core"

const Background = styled(Paper)`
  width: 80%;
  margin: 3% 10% 3% 10%;
  border-radius: 5px;
`
// For scrollbar and responsiveness, height 100%
const Overlay = styled.div`
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  z-index: 9001;
  background-color: rgba(127, 127, 127, 0.7);
`
interface StyledOutputProps {
  height?: string
}

/* StyledOutput "responsiveness"
max-height: ${(props: StyledOutputProps) =>
    props.height
      ? Math.min(Number(props.height.split("px")[0]) * 0.6, 775).toString() +
        "px"
      : "250px"};
      */
const StyledOutput = styled(Grid)`
  padding: 5px;
  display: table-cell;
  min-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
`

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 5px;
`

const Question = styled.div`
  margin: 20px;
`

type FeedbackFormProps = {
  onSubmitFeedback: (feedback: Array<FeedBackAnswer>) => void
  onClose: () => void
  awardedPoints?: Array<string>
  feedbackQuestions: TestResultObject["feedbackQuestions"]
  solutionUrl?: string
  editorHeight?: string | undefined
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
  onClose,
  feedbackQuestions,
  solutionUrl,
  editorHeight,
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
        .map((item) => ({ questionId: item.id, answer: item.value })),
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
                aria-labelledby="discrete-slider-custom"
                step={1}
                marks={Array.from([...Array(question.max + 1).keys()], (x) =>
                  x !== 0
                    ? Object({ value: x, label: x })
                    : Object({ value: x, label: "-" }),
                )}
                min={question.min - 1}
                max={question.max}
                valueLabelDisplay="auto"
                onChange={(e, value) => onChange(question.id, value as number)}
                style={{ width: "100%" }}
              />
            </Question>
          )
        case "text":
          return (
            <Question key={question.id}>
              <Typography gutterBottom>{question.question}</Typography>
              <TextareaAutosize
                rowsMin={5}
                rowsMax={10}
                style={{ width: "100%" }}
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
        <div
          style={{
            padding: "1px 25px",
            borderRadius: "5px 5px 0px 0px",
            borderBottom: "1px solid black",
            background: "#13B559",
          }}
        >
          <h2>Congratulations! Exercise completed!</h2>
          {awardedPoints?.length && (
            <p>Points awarded: {awardedPoints?.join(", ")}</p>
          )}
        </div>
        {feedbackQuestions && feedbackQuestions.length > 0 && (
          <Grid container direction="column">
            <StyledOutput /*height={editorHeight}*/>
              <form id="feedback-form" onSubmit={onSubmit}>
                {mapQuestions()}
              </form>
            </StyledOutput>
          </Grid>
        )}
        <div style={{ borderTop: "1px dashed black" }}>
          {feedbackQuestions && feedbackQuestions.length > 0 && (
            <StyledButton form="feedback-form" type="submit">
              Submit
            </StyledButton>
          )}
          <StyledButton onClick={onClose} data-cy="no-feedback">
            {feedbackQuestions && feedbackQuestions.length > 0
              ? "Don't send"
              : "Close"}
          </StyledButton>
          {solutionUrl && (
            <StyledButton
              onClick={() => {
                window.open(solutionUrl, "_blank")
              }}
              style={{ float: "right" }}
            >
              View model solution
            </StyledButton>
          )}
        </div>
      </Background>
    </Overlay>
  )
}

export default FeedbackForm
