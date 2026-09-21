import surveyJson from '../content/survey.json'
import uiJson from '../content/ui.json'
import revealJson from '../content/reveal.json'
import type { QuestionDef, PrizeFieldDef } from '../types'

export const survey = surveyJson
export const questions = surveyJson.questions as unknown as QuestionDef[]
export const prizeFields = surveyJson.prizeFields as unknown as PrizeFieldDef[]
export const ui = uiJson
export const reveal = revealJson
