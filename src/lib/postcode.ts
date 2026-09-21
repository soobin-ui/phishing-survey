/**
 * 카카오(다음) 우편번호 검색 — [주소찾기]를 누를 때만 불러옵니다.
 *
 * ★ 이 앱에서 유일한 외부 요청입니다(2026-09-21 사용자 결정).
 *   - 검색창은 카카오가 띄우는 iframe 이고, 검색어는 카카오 서버로 갑니다(우리 쪽으로는 오지 않음).
 *   - 고른 주소는 oncomplete 로 받아 React 상태(메모리)에만 둡니다. 전송·저장 없음은 그대로입니다.
 *   - 처음부터 불러오지 않습니다 — 버튼을 누르지 않은 참가자는 외부 요청이 0건입니다.
 *   - 전시장 망에서 안 열리면 reject → 화면은 직접 입력으로 넘어갑니다.
 */
const SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
const TIMEOUT_MS = 6000

export interface PostcodeResult {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  autoJibunAddress: string
  userSelectedType: 'R' | 'J'
  bname: string
  buildingName: string
  apartment: 'Y' | 'N'
}

interface PostcodeInstance {
  embed: (el: HTMLElement, opts?: { autoClose?: boolean }) => void
}
interface DaumGlobal {
  Postcode: new (opts: {
    oncomplete: (data: PostcodeResult) => void
    width: string
    height: string
  }) => PostcodeInstance
}
declare global {
  interface Window {
    daum?: DaumGlobal
  }
}

let loading: Promise<DaumGlobal> | null = null

export function loadPostcode(): Promise<DaumGlobal> {
  if (window.daum?.Postcode) return Promise.resolve(window.daum)
  if (loading) return loading

  loading = new Promise<DaumGlobal>((resolve, reject) => {
    const s = document.createElement('script')
    const fail = () => {
      s.remove()
      loading = null // 다시 누르면 다시 시도합니다
      reject(new Error('postcode load failed'))
    }
    const timer = window.setTimeout(fail, TIMEOUT_MS)
    s.src = SRC
    s.async = true
    s.onload = () => {
      window.clearTimeout(timer)
      if (window.daum?.Postcode) resolve(window.daum)
      else fail()
    }
    s.onerror = () => {
      window.clearTimeout(timer)
      fail()
    }
    document.head.appendChild(s)
  })
  return loading
}

/** 고른 결과를 한 줄 주소로 — 도로명이면 (법정동, 건물명)을 붙이는 흔한 표기 그대로. */
export function toBaseAddress(d: PostcodeResult): string {
  if (d.userSelectedType === 'J') return d.jibunAddress || d.autoJibunAddress
  const extra: string[] = []
  if (d.bname && /[동로가]$/.test(d.bname)) extra.push(d.bname)
  if (d.buildingName && d.apartment === 'Y') extra.push(d.buildingName)
  return extra.length ? `${d.roadAddress} (${extra.join(', ')})` : d.roadAddress
}
