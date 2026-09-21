/** 설문 문항의 종류 — survey.json 의 "type" 값과 1:1로 대응합니다. */
export type QuestionType = 'stars' | 'single' | 'multi' | 'text'

export interface QuestionDef {
  id: string
  label: string
  type: QuestionType
  required?: boolean
  options?: string[]
  placeholder?: string
}

/** 배송 정보(덫) 입력 항목 — survey.json 의 prizeFields 와 1:1. */
export type PrizeFieldType = 'text' | 'phone' | 'textarea' | 'address'
export type PrizeFieldRule = 'personName' | 'phone' | 'address'

export interface PrizeFieldDef {
  id: string
  label: string
  type: PrizeFieldType
  required?: boolean
  rule?: PrizeFieldRule
  emptyMessage?: string
  invalidMessage?: string
  placeholder?: string
  maxLength?: number
  /** type 이 address 일 때만 — [주소찾기] 둘레 문구 */
  searchButton?: string
  searchTitle?: string
  zipPlaceholder?: string
  detailPlaceholder?: string
  manualPlaceholder?: string
  searchFailMessage?: string
}

/** 빨간 화면에서 되돌려주는 카드 한 장. */
export interface RevealCard {
  id: string
  label: string
  value: string
}

/**
 * 참가자가 적은 값(설문 답 + 배송 정보).
 * 이 객체는 React 상태(메모리)에만 존재합니다.
 * 저장·전송하지 않으며 페이지를 닫으면 사라집니다.
 */
export type Answers = Record<string, string | string[]>
