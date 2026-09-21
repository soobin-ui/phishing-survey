import { useEffect, useRef } from 'react'
import { ui } from '../lib/content'

interface Props {
  onDone: () => void
}

/**
 * [2] 전송 중 — [설문 제출]을 누르고 빨간 화면 사이의 1.8초.
 *
 * ★ 이 화면은 절대 특별해 보이면 안 됩니다.
 *   흰 배경 / 도는 원 / 차오르는 막대. 어느 폼에나 있는 그 화면입니다.
 *   여기서 방심해야 다음 화면이 때립니다.
 * ★ "신청 완료"처럼 안심시키는 말은 넣지 마세요. '전송 중'까지만.
 *   같은 '전송'이 빨간 화면 뒤에는 정반대로 읽힙니다.
 */
export default function SendingScreen({ onDone }: Props) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const t = window.setTimeout(() => onDoneRef.current(), ui.sending.holdMs)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-white px-8 text-center"
      data-role="sending"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#263b7c]" />

      <p className="mt-6 text-[17px] leading-relaxed break-keep text-gray-600">
        {ui.sending.text}
      </p>

      <div className="mt-7 h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-gray-200">
        <div
          className="qr-sending-bar h-full rounded-full bg-[#263b7c]"
          style={{ animationDuration: `${ui.sending.holdMs}ms` }}
        />
      </div>
    </div>
  )
}
