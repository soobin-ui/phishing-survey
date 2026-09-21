import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { survey, questions, prizeFields } from '../lib/content'
import { formatPhone, lines } from '../lib/format'
import { checkPrizeField } from '../lib/validate'
import type { Answers } from '../types'

interface Props {
  onSubmit: (answers: Answers) => void
}

/**
 * [1] 설문 화면. 이 화면이 이 기획의 핵심입니다.
 *
 *   앞부분(별점·객관식)은 무해합니다 — 여기서 방심하게 만듭니다.
 *   맨 아래 '선착순 추가 상품 배송'이 덫입니다 — 이름·번호·주소를 '다시' 적게 합니다.
 *   방금 피싱을 배운 사람이 또 적는 것 자체가 체험입니다.
 *
 * ★ 절대 원칙: 입력값을 전송·저장하지 않습니다.
 *   fetch·form action·localStorage·콘솔출력·URL전달 어느 것도 하지 않습니다.
 *   answers 는 이 컴포넌트의 메모리에만 있다가 페이지를 닫으면 사라집니다.
 */
export default function SurveyScreen({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [popup, setPopup] = useState<string[] | null>(null)
  const [bad, setBad] = useState<Set<string>>(new Set())
  const firstBadRef = useRef<HTMLDivElement | null>(null)

  const set = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }))

  const toggleMulti = (id: string, opt: string) => {
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? (a[id] as string[]) : []
      return { ...a, [id]: cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt] }
    })
  }

  // 문항 중 미응답, 배송 항목 중 비었거나 형식 오류인 것을 모읍니다.
  const collectIssues = () => {
    const issues: string[] = []
    const badSet = new Set<string>()

    for (const q of questions) {
      if (!q.required) continue
      const v = answers[q.id]
      const empty = q.type === 'multi' ? !(Array.isArray(v) && v.length) : !v
      if (empty) {
        issues.push(q.label)
        badSet.add(q.id)
      }
    }
    for (const f of prizeFields) {
      const msg = checkPrizeField(f, String(answers[f.id] ?? ''))
      if (msg) {
        issues.push(`${f.label} — ${msg}`)
        badSet.add(f.id)
      }
    }
    return { issues, badSet }
  }

  const handleSubmit = (e: React.FormEvent) => {
    // ★ 이 한 줄이 없으면 GET 으로 입력값이 URL 에 실립니다. 반드시 유지.
    e.preventDefault()
    const { issues, badSet } = collectIssues()
    setBad(badSet)
    if (issues.length) {
      setPopup(issues)
      requestAnimationFrame(() =>
        firstBadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
      return
    }
    // 값은 메모리 상태 그대로 넘깁니다(전송·저장 없음).
    onSubmit(answers)
  }

  // 첫 오류 항목을 찾기 위한 순서(문항 → 배송)
  const firstBadId = useMemo(() => {
    for (const q of questions) if (bad.has(q.id)) return q.id
    for (const f of prizeFields) if (bad.has(f.id)) return f.id
    return null
  }, [bad])

  return (
    <div className="sv-cream min-h-dvh overflow-x-hidden">
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="mx-auto w-full max-w-[460px] px-4 pt-6 pb-10">
        {/* 머리글 */}
        <div className="mb-5 text-center">
          <p className="text-[13px] font-medium text-[#5a6aa0]">{survey.intro.eventName}</p>
          <h1 className="mt-1 text-[26px] font-bold text-[#263b7c]">만족도 조사</h1>
        </div>

        {/* ── 문항 카드들 ── */}
        <div className="space-y-4">
          {questions.map((q) => {
            const isBad = bad.has(q.id)
            const anchor = q.id === firstBadId
            return (
              <div
                key={q.id}
                ref={anchor ? firstBadRef : undefined}
                className={`rounded-2xl border bg-white p-5 shadow-[0_4px_14px_rgba(38,59,124,0.07)] ${
                  isBad ? 'border-[#e8245c]' : 'border-[#e7e3d0]'
                }`}
              >
                <p className="text-[16px] leading-snug font-bold break-keep text-[#22315f]">
                  {q.label}
                  {q.required && <span className="ml-1 text-[#e8245c]">*</span>}
                </p>

                {/* 별점 */}
                {q.type === 'stars' && (
                  <div className="mt-3 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = Number(answers[q.id] ?? 0) >= n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => set(q.id, String(n))}
                          className="p-0.5"
                          aria-label={`${n}점`}
                        >
                          <svg viewBox="0 0 100 100" className="h-11 w-11">
                            <path
                              d="M50 6 L63 36 L95 39 L71 61 L78 93 L50 76 L22 93 L29 61 L5 39 L37 36 Z"
                              fill={on ? '#feca36' : '#eee6c8'}
                              stroke={on ? '#263b7c' : '#d8cfae'}
                              strokeWidth="6"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 하나만 고르기 */}
                {q.type === 'single' && (
                  <div className="mt-3 space-y-2">
                    {q.options?.map((opt) => {
                      const on = answers[q.id] === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set(q.id, opt)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[16px] font-medium break-keep transition-colors ${
                            on ? 'border-[#263b7c] bg-[#eef3ff] text-[#22315f]' : 'border-[#e2ddc8] bg-white text-[#4a5578]'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
                              on ? 'border-[#263b7c]' : 'border-[#c9c2a6]'
                            }`}
                          >
                            {on && <span className="h-3 w-3 rounded-full bg-[#263b7c]" />}
                          </span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 여러 개 고르기 */}
                {q.type === 'multi' && (
                  <div className="mt-3 space-y-2">
                    {q.options?.map((opt) => {
                      const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []
                      const on = arr.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti(q.id, opt)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[16px] font-medium break-keep transition-colors ${
                            on ? 'border-[#263b7c] bg-[#eef3ff] text-[#22315f]' : 'border-[#e2ddc8] bg-white text-[#4a5578]'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border-2 ${
                              on ? 'border-[#263b7c] bg-[#263b7c]' : 'border-[#c9c2a6]'
                            }`}
                          >
                            {on && (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12 l5 5 l9 -11" />
                              </svg>
                            )}
                          </span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 자유 입력 */}
                {q.type === 'text' && (
                  <textarea
                    value={String(answers[q.id] ?? '')}
                    onChange={(e) => set(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-[#e2ddc8] bg-[#fcfbf5] px-4 py-3 text-[16px] text-[#22315f] placeholder:text-[#b3ac93] focus:border-[#263b7c] focus:outline-none"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── 덫: 선착순 추가 상품 배송 ── */}
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-[#feca36] bg-[#263b7c] shadow-[0_8px_24px_rgba(38,59,124,0.22)]">
          <div className="flex items-center gap-2 bg-[#feca36] px-5 py-2.5">
            <span className="text-[18px]">🎁</span>
            <span className="text-[14px] font-bold tracking-tight text-[#1c2e63]">{survey.prize.badge}</span>
          </div>
          <div className="p-5">
            <h2 className="text-[22px] font-bold text-white">{survey.prize.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed break-keep text-white/80">
              {lines(survey.prize.desc).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>

            <div className="mt-4 space-y-3">
              {prizeFields.map((f) => {
                const isBad = bad.has(f.id)
                const anchor = f.id === firstBadId
                const val = String(answers[f.id] ?? '')
                return (
                  <div key={f.id} ref={anchor ? firstBadRef : undefined}>
                    <label className="mb-1 block text-[14px] font-bold text-white">
                      {f.label}
                      {f.required && <span className="ml-1 text-[#ffd24d]">*</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={val}
                        onChange={(e) => set(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        rows={2}
                        className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-[16px] text-[#22315f] placeholder:text-[#aeb6cf] focus:outline-none ${
                          isBad ? 'border-[#ff5f7a]' : 'border-transparent'
                        }`}
                      />
                    ) : (
                      <input
                        type={f.type === 'phone' ? 'tel' : 'text'}
                        inputMode={f.type === 'phone' ? 'numeric' : undefined}
                        value={val}
                        onChange={(e) =>
                          set(f.id, f.type === 'phone' ? formatPhone(e.target.value) : e.target.value)
                        }
                        placeholder={f.placeholder}
                        maxLength={f.type === 'phone' ? 13 : f.maxLength}
                        className={`w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-[#22315f] placeholder:text-[#aeb6cf] focus:outline-none ${
                          isBad ? 'border-[#ff5f7a]' : 'border-transparent'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] text-white/55">{survey.prize.note}</p>
          </div>
        </div>

        {/* 제출 — 문서 흐름에 두고 아래 여백을 줍니다(키보드가 올라와도 스크롤로 닿음). */}
        <button
          type="submit"
          className="sv-cta mt-6 h-[60px] w-full rounded-2xl bg-[#e8245c] text-[18px] font-bold text-white"
        >
          {survey.submitButton}
        </button>

        <p className="mt-4 text-center text-[12px] text-[#5a6aa0]">
          ※ 체험용 정보 입력 내용은 저장되지 않습니다.
        </p>
      </form>

      {/* 확인 팝업 */}
      <AnimatePresence>
        {popup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopup(null)}
          >
            <motion.div
              className="w-full max-w-[360px] rounded-2xl bg-white p-6 text-center"
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[18px] font-bold text-[#22315f]">{survey.requiredPopup.title}</p>
              <ul className="mt-3 max-h-[180px] space-y-1 overflow-y-auto text-left text-[14px] text-[#e8245c]">
                {popup.map((m, i) => (
                  <li key={i} className="break-keep">• {m}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="mt-5 h-12 w-full rounded-xl bg-[#263b7c] text-[16px] font-bold text-white"
              >
                {survey.requiredPopup.button}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
