import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"

import { TestResultObject, FeedBackAnswer } from "../types"
import {
  Button,
  Slider,
  Typography,
  Grid,
  TextareaAutosize,
  Chip,
} from "@material-ui/core"
import { OverlayBox } from "./Overlay"

const StyledOutput = styled(Grid)`
  padding: 5px;
  display: table-cell;
  min-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
`

const HeaderWrapper = styled.div`
  padding: 1px 25px;
  background: #4caf50;
  font-family: Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji,
    Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  color: white !important;
  width: 100%;
`

const FooterWrapper = styled.div`
  border-top: 1px dashed black;
  width: 100%;
`

const FeedbackTitle = styled(Typography)`
  && {
    font-size: 1.5rem;
    padding: 9px 5px;
    font-weight: 500;
    color: white !important;
  }
`

const CloseButton = styled.span`
  cursor: pointer;
  font-size: 2rem;
  float: right;
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
    margin-right: 10px;
  }
`

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 5px !important;
`

const Question = styled.div`
  margin: 20px;
`

const StyledSpan = styled(Typography)`
  && {
    margin: 15px 10px 5px 10px;
    font-weight: bold;
  }
`

type FeedbackFormProps = {
  onSubmitFeedback: (feedback: Array<FeedBackAnswer>) => void
  onClose: () => void
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
  onClose,
  feedbackQuestions,
  solutionUrl,
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
      filterFields().map((item) => ({
        questionId: item.id,
        answer: item.value,
      })),
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

  const filterFields = () => {
    return formState.filter(
      (item) =>
        (item.kind === "intrange" && item.value >= item.min) ||
        (item.kind === "text" && item.value.toString().trim() !== ""),
    )
  }

  const isFeedbackQuestions = () => {
    return feedbackQuestions && feedbackQuestions.length > 0
  }

  const mapQuestions = () => {
    return formState.map((question) => {
      switch (question.kind) {
        case "intrange": {
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
        }
        case "text":
          return (
            <Question key={question.id}>
              <Typography gutterBottom>{question.question}</Typography>
              <TextareaAutosize
                data-cy="feedback-text"
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
    <OverlayBox>
      <HeaderWrapper>
        <FeedbackTitle>
          {t("feedbackTitle")}
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </FeedbackTitle>
        {awardedPoints?.length && awardedPoints.length > 0 && (
          <FeedbackText>
            {t("pointsAwarded")}: {mapPoints()}
          </FeedbackText>
        )}
      </HeaderWrapper>

      {isFeedbackQuestions() && (
        <Grid container direction="column">
          <StyledSpan>{t("pleaseGiveFeedback")}</StyledSpan>
          <StyledOutput>
            <form id="feedback-form" onSubmit={onSubmit}>
              {mapQuestions()}
            </form>
          </StyledOutput>
        </Grid>
      )}

      <FooterWrapper>
        {isFeedbackQuestions() && (
          <StyledButton
            form="feedback-form"
            disabled={filterFields().length <= 0}
            data-cy="yes-feedback"
            type="submit"
          >
            {t("button.send")}
          </StyledButton>
        )}
        <StyledButton onClick={onClose} data-cy="no-feedback">
          {isFeedbackQuestions() ? t("dontSend") : t("button.close")}
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
    </OverlayBox>
  )
}

export default FeedbackForm
