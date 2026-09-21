import type { PrizeFieldDef } from '../types'

/**
 * 배송 정보(덫) 입력 검사.
 *
 * ★ 값을 서버에 보내려는 게 아닙니다. 그런데도 형식을 따지는 이유 —
 *   진짜 같은 번호·주소를 스스로 적어야 빨간 화면에서 "내가 진짜 내 걸 또 적었구나"가 됩니다.
 * ★ 그래도 사람을 가두면 안 됩니다. 형식만 봅니다(값이 진짜인지는 따지지 않음).
 */
export function checkPrizeField(def: PrizeFieldDef, raw: string): string | null {
  const value = raw.trim()

  if (value === '') {
    return def.required ? (def.emptyMessage ?? '입력해 주세요.') : null
  }

  const bad = def.invalidMessage ?? '입력하신 내용을 확인해 주세요.'

  switch (def.rule) {
    case 'personName':
      if (!/^[가-힣a-zA-Z\s]+$/.test(value)) return bad
      if (value.replace(/\s/g, '').length < 2) return bad
      return null

    case 'phone': {
      const digits = value.replace(/\D/g, '')
      if (!/^010\d{8}$/.test(digits)) return bad
      return null
    }

    case 'address':
      // 도로명+상세가 들어갈 만한 최소 길이만 봅니다.
      if (value.replace(/\s/g, '').length < 8) return bad
      return null

    default:
      return null
  }
}

export function checkAllPrize(
  fields: PrizeFieldDef[],
  answers: Record<string, string>,
): { def: PrizeFieldDef; message: string }[] {
  const found: { def: PrizeFieldDef; message: string }[] = []
  for (const def of fields) {
    const message = checkPrizeField(def, answers[def.id] ?? '')
    if (message) found.push({ def, message })
  }
  return found
}
