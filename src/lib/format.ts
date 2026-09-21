/**
 * 휴대폰 번호에 하이픈을 자동으로 넣습니다.
 * (유효성 검사가 아닙니다 — 형식만 맞추고, 값은 저장·전송하지 않습니다.)
 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** JSON 문구의 줄바꿈(\n)을 실제 줄바꿈으로 렌더링하기 위해 잘라줍니다. */
export function lines(text: string): string[] {
  return text.split('\n')
}

/** "{name} 님" 의 {자리}를 실제 값으로 채웁니다. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  )
}
