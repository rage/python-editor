import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"

import { TestResultObject, FeedBackAnswer } from "../types"
import {
  Button,
  Paper,
  Slider,
  Typography,
  Grid,
  TextareaAutosize,
  Chip,
} from "@material-ui/core"

const Background = styled(Paper)`
  width: 80%;
  margin: 3% 10% 3% 10%;
  border-radius: 10px;
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

const HeaderWrapper = styled.div`
  padding: 1px 25px;
  border-radius: 10px 10px 0px 0px;
  background: rgb(39, 139, 82);
  background: linear-gradient(
    180deg,
    rgba(39, 139, 82, 1) 0%,
    rgba(19, 181, 89, 1) 50%,
    rgba(15, 201, 96, 1) 100%
  );
  font-family: Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji,
    Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  color: white;
`

const FooterWrapper = styled.div`
  border-top: 1px dashed black;
`

const FeedbackTitle = styled(Typography)`
  && {
    font-size: 1.5rem;
    padding: 9px 5px;
    font-weight: 500;
  }
`

const FeedbackText = styled.div`
  && {
    font-size: 1rem;
    padding: 9px 5px;
  }
`

const StyledChip = styled(Chip)`
  && {
    color: white;
  }
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
  const [t] = useTranslation()
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

  const mapPoints = () => {
    return awardedPoints?.map((point) => (
      <StyledChip key={point} label={point} variant="outlined" />
    ))
  }

  const mapQuestions = () => {
    return formState.map((question) => {
      switch (question.kind) {
        case "intrange":
          const marks = [{ value: question.min - 1, label: "-" }]
          for (let i = question.min; i <= question.max; i++) {
            marks.push({ value: i, label: i.toString() })
          }
          return (
            <Question key={question.id}>
              <Typography gutterBottom>{question.question}</Typography>
              <Slider
                defaultValue={question.min - 1}
                valueLabelFormat={(x) => (x < question.min ? null : x)}
                aria-labelledby="discrete-slider-custom"
                step={1}
                marks={marks}
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
        <HeaderWrapper>
          <FeedbackTitle>{t("feedbackTitle")}</FeedbackTitle>
          {awardedPoints?.length && (
            <FeedbackText>
              {t("pointsAwarded")}: {mapPoints()}
            </FeedbackText>
          )}
        </HeaderWrapper>

        {feedbackQuestions && feedbackQuestions.length > 0 && (
          <Grid container direction="column">
            <StyledOutput /*height={editorHeight}*/>
              <form id="feedback-form" onSubmit={onSubmit}>
                {mapQuestions()}
              </form>
            </StyledOutput>
          </Grid>
        )}

        <FooterWrapper>
          {feedbackQuestions && feedbackQuestions.length > 0 && (
            <StyledButton form="feedback-form" type="submit">
              {t("button.submit")}
            </StyledButton>
          )}
          <StyledButton onClick={onClose} data-cy="no-feedback">
            {feedbackQuestions && feedbackQuestions.length > 0
              ? t("dontSend")
              : t("button.close")}
          </StyledButton>
          {solutionUrl && (
            <StyledButton
              onClick={() => {
                window.open(solutionUrl, "_blank")
              }}
              style={{ float: "right" }}
            >
              {t("viewModelSolution")}
            </StyledButton>
          )}
        </FooterWrapper>
      </Background>
    </Overlay>
  )
}

export default FeedbackForm
