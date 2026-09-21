import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { reveal } from '../lib/content'
import { buildCards, buzz } from '../lib/reveal'
import { startAlarm } from '../lib/alarm'
import { fill, lines } from '../lib/format'
import type { Answers } from '../types'

interface Props {
  answers: Answers
  onNext: () => void
}

/**
 * [3] 빨간 화면. 세 박자.
 *   1) 순차 등장 — ! → [경고] → '개인정보 유출' → 적은 배송 정보가 주르륵 → [다음]
 *   2) 큰 글씨: "방금 배우셨는데도 또 넘어가셨습니다"
 *   3) 경광봉 + 질문 → 이번에 속은 3가지 수법 정리
 *
 * ★ 이 화면의 연출·타이밍·광과민성 기준은 응모판(phishing-qr)에서 그대로 가져왔습니다.
 *   경광봉 점멸 등 CSS 는 index.css 의 qr-* 클래스를 공유합니다.
 */
type Stage = 'alarm' | 'punch' | 'question' | 'after'

const NIGHT = '#05060a'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function NeonTriangle({ small = false, still = false }: { small?: boolean; still?: boolean }) {
  const w = small ? 'min(104px, 12vh, 30vw)' : 'min(150px, 17vh, 40vw)'
  return (
    <svg
      className={still ? 'qr-neon-still' : 'qr-neon'}
      style={{ width: w, height: `calc(${w} * 132 / 150)` }}
      viewBox="0 0 150 132"
      aria-hidden="true"
    >
      <path d="M75 10 L142 122 H8 Z" fill="none" stroke="#ff2d3c" strokeWidth="9" strokeLinejoin="round" />
      <path d="M75 48 V86" stroke="#ff2d3c" strokeWidth="10" strokeLinecap="round" />
      <circle cx="75" cy="103" r="6" fill="#ff2d3c" />
    </svg>
  )
}

const EASE = [0.2, 0.7, 0.2, 1] as const
const GLIDE = [0.65, 0, 0.35, 1] as const

export default function RevealScreen({ answers, onNext }: Props) {
  const cards = useMemo(() => buildCards(answers), [answers])
  const [stage, setStage] = useState<Stage>('alarm')
  const alarming = stage === 'alarm' || stage === 'punch'
  const reduced = usePrefersReducedMotion()

  const [phase, setPhase] = useState(0)

  const titleLines = reveal.alarm.titleLines
  const titleLen = titleLines.join('').length
  const triScale = phase >= 3 ? 1 : phase >= 2 ? 1.22 : 1.5

  const name = String(answers.name ?? '').trim()
  const punchLines =
    cards.length === 0
      ? reveal.punch.zeroLines
      : name === ''
        ? reveal.punch.linesNoName
        : reveal.punch.lines

  const stopAlarmRef = useRef<() => void>(() => {})
  const tailTimerRef = useRef<number | undefined>(undefined)
  const advancedRef = useRef(false)

  useEffect(() => {
    const stopAlarm = reveal.sound.enabled ? startAlarm(reveal.sound.volume) : () => {}
    stopAlarmRef.current = stopAlarm
    buzz([120, 90, 120, 90, 120, 90, 600])
    return () => {
      if (tailTimerRef.current) clearTimeout(tailTimerRef.current)
      stopAlarm()
      buzz(0)
    }
  }, [])

  useEffect(() => {
    const T = reveal.timing
    if (reduced) {
      setPhase(4)
      return
    }
    setPhase(0)
    const timers: number[] = []
    const tTag = T.triAloneMs
    const tTitle = tTag + T.tagAloneMs
    const tTitleDone = tTitle + 150 + titleLen * T.titleCharMs + 400
    const tRows = tTitleDone + T.titleAloneMs
    const tButton = tRows + 200 + Math.max(cards.length - 1, 0) * T.rowGapMs + 800

    timers.push(window.setTimeout(() => setPhase(1), tTag))
    timers.push(window.setTimeout(() => setPhase(2), tTitle))
    timers.push(
      window.setTimeout(() => {
        setPhase(3)
        buzz(200)
      }, tRows),
    )
    timers.push(window.setTimeout(() => setPhase(4), tButton))

    return () => timers.forEach(clearTimeout)
  }, [reduced, cards.length, titleLen])

  const goQuestion = useCallback(() => {
    if (advancedRef.current) return
    advancedRef.current = true
    setStage('question')
    tailTimerRef.current = window.setTimeout(() => {
      stopAlarmRef.current()
      buzz(0)
    }, reveal.timing.sirenTailMs)
  }, [])

  useEffect(() => {
    if (stage !== 'punch') return
    const t = window.setTimeout(goQuestion, reveal.timing.punchMs)
    return () => clearTimeout(t)
  }, [stage, goQuestion])

  const toPunch = useCallback(() => {
    setStage('punch')
    buzz(300)
  }, [])

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${alarming ? 'qr-night' : ''}`}
      style={{ backgroundColor: NIGHT }}
    >
      {/* ── 1단계 · 순차 등장 ── */}
      <Layer active={stage === 'alarm'}>
        <motion.div layout className="flex w-full max-w-[400px] flex-col items-center text-center">
          <motion.div layout className="qr-blink-group flex w-full flex-col items-center">
            <motion.div
              layout
              animate={{ scale: triScale }}
              transition={{ duration: 0.55, ease: GLIDE }}
              style={{ transformOrigin: '50% 50%' }}
            >
              <NeonTriangle still />
            </motion.div>

            {phase >= 1 && (
              <motion.span
                layout
                className="qr-neon-tag mt-[clamp(10px,2vh,16px)] px-3.5 py-0.5 text-[clamp(17px,4.8vw,25px)] font-bold tracking-[0.14em]"
                initial={{ opacity: 0, scale: 1.4, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {reveal.alarm.badge}
              </motion.span>
            )}

            {phase >= 2 && (
              <motion.h2
                layout
                className="qr-neon-text mt-[clamp(6px,1.4vh,12px)] text-[clamp(26px,8vw,44px)] leading-[1.06] font-bold tracking-tight text-white"
              >
                {(() => {
                  let n = -1
                  return titleLines.map((line, li) => (
                    <span key={li} className="block">
                      {[...line].map((chr) => {
                        n += 1
                        return (
                          <motion.span
                            key={n}
                            className="inline-block"
                            initial={{ opacity: 0, y: '0.4em', scale: 1.6, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.6, delay: n * (reveal.timing.titleCharMs / 1000), ease: EASE }}
                          >
                            {chr}
                          </motion.span>
                        )
                      })}
                    </span>
                  ))
                })()}
              </motion.h2>
            )}
          </motion.div>

          {phase >= 3 && (
            <motion.div layout className="mt-[clamp(12px,2.2vh,24px)] w-full" data-role="leak-record">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="mb-[clamp(6px,1.2vh,10px)]"
                  initial={{ opacity: 0, y: -22, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: i * (reveal.timing.rowGapMs / 1000), ease: EASE }}
                >
                  <p className="text-[clamp(10px,2.8vw,11px)] tracking-[0.24em] text-[#ff6a76]">
                    {card.label}
                  </p>
                  {/* 주소처럼 긴 값은 한 단계 작게, 줄은 낱말 사이에서만 바꿉니다("217-6/0" 처럼 숫자가 갈리지 않게). */}
                  <p
                    className={`qr-neon-text min-h-[1.25em] leading-[1.3] font-bold break-keep [overflow-wrap:anywhere] text-white ${
                      card.value.length > 16 ? 'text-[clamp(15px,4.5vw,20px)]' : 'text-[clamp(17px,5.4vw,25px)]'
                    }`}
                  >
                    {card.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.button
              onClick={toPunch}
              onTap={toPunch}
              data-role="alarm-next"
              disabled={phase < 4}
              className="mt-[clamp(14px,2.4vh,26px)] h-[52px] w-full rounded-sm bg-white text-[17px] font-bold text-[#0a0b12]"
              style={{ pointerEvents: phase >= 4 ? 'auto' : 'none' }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 14 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {reveal.alarm.nextButton}
            </motion.button>
          )}
        </motion.div>
      </Layer>

      {/* ── 2단계 · 마지막 문구 ── */}
      <Layer active={stage === 'punch'}>
        <div className="flex w-full max-w-[400px] flex-col items-center text-center">
          <NeonTriangle small />

          <motion.div
            className="mt-7 w-full"
            initial="hidden"
            animate={stage === 'punch' ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.34, delayChildren: 0.5 } } }}
          >
            {punchLines.map((line, i) => (
              <motion.p
                key={i}
                className="qr-neon-text text-[clamp(27px,7.6vw,34px)] leading-[1.24] font-bold tracking-tight break-keep text-white"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
                }}
              >
                {fill(line, { name })}
              </motion.p>
            ))}

            <motion.p
              className="mt-8 text-[14px] leading-relaxed text-white/55"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 1.1, ease: 'easeOut' } },
              }}
            >
              {lines(reveal.punch.note).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </motion.p>

            <motion.button
              onClick={goQuestion}
              onTap={goQuestion}
              data-role="punch-next"
              className="mt-9 h-14 w-full rounded-sm bg-white text-[17px] font-bold text-[#0a0b12]"
              whileTap={{ scale: 0.97 }}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
            >
              {reveal.punch.nextButton}
            </motion.button>
          </motion.div>
        </div>
      </Layer>

      {(stage === 'question' || stage === 'after') && (
        <div className="qr-screenflash">
          <div className="qr-screenflash-red" />
          <div className="qr-screenflash-blue" />
        </div>
      )}

      {/* ── 3단계 · 경광봉 + 질문 ── */}
      <Layer active={stage === 'question'}>
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <PoliceBar />

          <motion.div
            className="mt-12 w-full px-1 text-center"
            initial="hidden"
            animate={stage === 'question' ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.28, delayChildren: 0.6 } } }}
          >
            {reveal.question.lines.map((line, i) => (
              <motion.p
                key={i}
                className="qr-lit text-[clamp(23px,6.8vw,28px)] leading-[1.34] font-bold tracking-tight break-keep text-white"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
                }}
              >
                {line}
              </motion.p>
            ))}

            <motion.button
              onClick={() => setStage('after')}
              onTap={() => setStage('after')}
              data-role="question-next"
              className="mt-10 h-14 w-full rounded-sm border border-white/45 text-[17px] font-bold text-white active:bg-white/10"
              whileTap={{ scale: 0.97 }}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
            >
              {reveal.question.nextButton}
            </motion.button>
          </motion.div>
        </div>
      </Layer>

      {/* ── 4단계 · 속은 3가지 수법 ── */}
      <Layer active={stage === 'after'}>
        <motion.div
          className="w-full max-w-[400px] px-1 text-center"
          initial="hidden"
          animate={stage === 'after' ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.26, delayChildren: 0.35 } } }}
        >
          <motion.p
            className="mb-4 text-[clamp(15px,4.2vw,18px)] leading-relaxed tracking-[0.04em] break-keep text-white/65"
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
            }}
          >
            {reveal.after.lead}
          </motion.p>

          {reveal.after.lines.map((line, i) => (
            <motion.p
              key={i}
              className="text-[clamp(24px,7vw,30px)] leading-[1.3] font-bold tracking-tight break-keep text-white"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: 'easeOut' } },
              }}
            >
              {line}
            </motion.p>
          ))}

          {/* 이번에 속은 3가지 — 포스터에 심어 둔 단서와 이어집니다 */}
          <div className="mt-6 w-full space-y-2.5">
            {reveal.after.tricks.map((t, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-left"
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
                }}
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#ff2d3c] text-[15px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[clamp(15px,4.2vw,17px)] leading-snug font-bold break-keep text-white">
                  {t}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="qr-neon-text mt-6 text-[clamp(17px,4.9vw,21px)] leading-snug font-bold break-keep text-[#ff8a92]"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: 'easeOut' } },
            }}
          >
            {reveal.after.highlight}
          </motion.p>

          <motion.p
            className="mt-7 text-[clamp(24px,7vw,31px)] leading-[1.38] font-bold break-keep text-white"
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: 'easeOut' } },
            }}
          >
            {reveal.after.closing.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </motion.p>

          <motion.p
            className="mt-5 text-[clamp(11px,3vw,13px)] leading-relaxed break-keep text-white/40"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1 } } }}
          >
            {reveal.after.source}
          </motion.p>

          <motion.button
            onClick={onNext}
            onTap={onNext}
            data-role="after-next"
            className="mt-10 h-14 w-full border border-white/40 text-[17px] font-bold text-white active:bg-white/10"
            whileTap={{ scale: 0.97 }}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
            }}
          >
            {reveal.after.nextButton}
          </motion.button>
        </motion.div>
      </Layer>

      <div className="qr-vignette" />
      <div className="qr-grain" />
    </div>
  )
}

function PoliceBar() {
  return (
    <div className="qr-bar-unit">
      <div className="qr-bar-anchor">
        <div className="qr-beam qr-beam-left">
          <div className="qr-beam-red" />
        </div>
        <div className="qr-beam qr-beam-right">
          <div className="qr-beam-blue" />
        </div>
        <div className="qr-halo qr-halo-l">
          <div className="qr-halo-red" />
        </div>
        <div className="qr-halo qr-halo-r">
          <div className="qr-halo-blue" />
        </div>
      </div>

      <div className="qr-bar">
        {['red', 'red', 'red', 'blue', 'blue', 'blue'].map((side, i) => (
          <div key={i} className={`qr-seg qr-seg-${side}`}>
            <div className="qr-seg-lens" />
          </div>
        ))}
      </div>

      <div className="qr-bar-lip" />
      <div className="qr-bar-feet">
        <span />
        <span />
      </div>

      <div className="qr-bar-floor">
        <div className="qr-floor-red" />
        <div className="qr-floor-blue" />
      </div>
    </div>
  )
}

function Layer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex min-h-full flex-col items-center justify-center px-5 py-[clamp(12px,2.5vh,24px)]">
        {children}
      </div>
    </motion.div>
  )
}
