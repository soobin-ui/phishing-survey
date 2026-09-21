import { prizeFields, reveal } from './content'
import type { Answers, RevealCard } from '../types'

const shortLabels = reveal.shortLabels as Record<string, string>

/**
 * 빨간 화면에 되돌려줄 카드.
 * ★ 설문 답이 아니라 '배송 정보(이름·번호·주소)'만 되돌려줍니다.
 *   충격의 핵심은 개인정보를 또 넘겼다는 점이지, 별점 몇 개가 아닙니다.
 *   실제로 적은 항목만 카드로 만듭니다.
 */
export function buildCards(answers: Answers): RevealCard[] {
  const cards: RevealCard[] = []
  for (const field of prizeFields) {
    const raw = String(answers[field.id] ?? '').trim()
    if (raw === '') continue
    cards.push({
      id: field.id,
      label: shortLabels[field.id] ?? field.label,
      value: raw,
    })
  }
  return cards
}

/**
 * 진동은 보조입니다. 지원하지 않는 기기(아이폰 전부)에서는 조용히 무시됩니다.
 * 배열이면 [진동, 쉬고, 진동, …], 0이면 진행 중인 진동을 멈춥니다.
 */
export function buzz(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}
