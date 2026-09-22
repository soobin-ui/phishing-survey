import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { reveal } from '../lib/content'
import { buildCards, buzz } from '../lib/reveal'
import { fill, lines } from '../lib/format'
import type { Answers } from '../types'

interface Props {
  answers: Answers
  onNext: () => void
}

/**
 * [3] 되감기 화면 — 시안(2026-09-21). RevealScreen(응모판과 같은 '개인정보 유출' 경고)을 대신합니다.
 *
 *   참가자는 30분 전에 그 경고 화면을 이미 봤습니다. 같은 걸 또 띄우면 "아, 또 그거네"로 끝납니다.
 *   그래서 여기서는 겁주지 않고, 방금 한 행동을 돌려 보여 줍니다.
 *     1) done   — 가짜 "신청 완료" + 가짜 [확인]. 흔한 폼의 끝 화면 그대로 안심시킵니다.
 *                 [확인]을 누르면 그 자리에서 바로 뒤집힙니다 — 나가려고 누른 손가락이 방아쇠.
 *                 기본은 [확인]을 기다리고, 안 누르면 doneMs(8초) 뒤에야 자동. (2026-09-22 사용자 지시: 안 눌렀는데 넘어가면 안 됨)
 *     2) twist  — 체크가 물음표로 바뀌고, 흰 화면이 남색으로 가라앉습니다.
 *     3) record — 오늘의 체험 기록. 앞 줄은 '체험 완료', 마지막 줄에만 빨간 도장.
 *     4) punch  — "체험을 다 마치고도 왜 또 적으셨을까요?" + 속은 3가지 + 혼내지 않고 받아 주는 한 줄.
 *                 (2026-09-21 사용자 요청으로 두 화면을 하나로 합침 — 간단하게)
 *
 * ★ 소리·경광등·점멸이 없습니다(광과민성 걱정도 없음). 진동은 도장 찍힐 때 한 번.
 * ★ answers 는 여기서도 화면에 되돌려 보여 주기만 합니다. 전송·저장 없음.
 */
type Stage = 'done' | 'twist' | 'record' | 'punch'

const R = reveal.rewind
const NAVY = '#16224d'
const EASE = [0.2, 0.7, 0.2, 1] as const

export default function RewindScreen({ answers, onNext }: Props) {
  const cards = useMemo(() => buildCards(answers), [answers])
  const name = String(answers.name ?? '').trim()
  const [stage, setStage] = useState<Stage>('done')
  // 기록 화면: 몇 번째 줄까지 나왔는지 / 도장이 찍혔는지 / [다음]이 켜졌는지
  const [rowsShown, setRowsShown] = useState(0)
  const [stamped, setStamped] = useState(false)
  const [ready, setReady] = useState(false)

  // [확인] 탭과 자동 진행이 겹쳐도 한 번만 넘어갑니다.
  const toTwist = () => setStage((s) => (s === 'done' ? 'twist' : s))

  useEffect(() => {
    if (stage === 'done') {
      // 기본은 [확인]을 기다립니다. doneMs 는 안 누르는 사람을 위한 안전장치(0 이면 없음).
      if (!R.timing.doneMs) return
      const t = window.setTimeout(toTwist, R.timing.doneMs)
      return () => clearTimeout(t)
    }
    if (stage === 'twist') {
      const t = window.setTimeout(() => setStage('record'), R.timing.twistMs)
      return () => clearTimeout(t)
    }
    if (stage === 'record') {
      const T = R.timing
      const n = R.record.rows.length
      const timers: number[] = []
      for (let i = 1; i <= n; i++) {
        timers.push(window.setTimeout(() => setRowsShown(i), 500 + (i - 1) * T.rowGapMs))
      }
      const tStamp = 500 + (n - 1) * T.rowGapMs + T.stampDelayMs
      timers.push(
        window.setTimeout(() => {
          setStamped(true)
          buzz(180)
        }, tStamp),
      )
      timers.push(window.setTimeout(() => setReady(true), tStamp + 1700))
      return () => timers.forEach(clearTimeout)
    }
  }, [stage])

  const dark = stage !== 'done'
  const punchLines = name === '' ? R.punch.linesNoName : R.punch.lines
  const lastRow = R.record.rows.length - 1

  return (
    <div className="fixed inset-0 overflow-hidden bg-white" data-role="rewind" data-stage={stage}>
      {/* 흰 화면이 남색으로 '가라앉습니다' — 번쩍이지 않고 1초에 걸쳐. [확인]을 누른 직후라 더 느리면 안 눌린 줄 압니다. */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: NAVY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: dark ? 1 : 0 }}
        transition={{ duration: 1.0, ease: 'easeInOut' }}
      />

      {/* ── 1·2단계 · 가짜 신청 완료 → 잠깐만요 ── */}
      <Layer active={stage === 'done' || stage === 'twist'}>
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          <div className="relative h-[92px] w-[92px]">
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                backgroundColor: stage === 'done' ? '#1fa971' : '#feca36',
              }}
              transition={{ duration: 0.5, ease: EASE, backgroundColor: { duration: 0.8 } }}
            />
            {/* 체크 표시 */}
            <motion.svg
              viewBox="0 0 92 92"
              className="absolute inset-0"
              animate={{ opacity: stage === 'done' ? 1 : 0, rotate: stage === 'done' ? 0 : -40 }}
              transition={{ duration: 0.45 }}
              aria-hidden="true"
            >
              <motion.path
                d="M27 47 L41 61 L66 33"
                fill="none"
                stroke="#fff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.35, ease: 'easeOut' }}
              />
            </motion.svg>
            {/* 물음표 */}
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-[54px] leading-none font-bold text-[#16224d]"
              initial={{ opacity: 0, scale: 0.4, rotate: 40 }}
              animate={
                stage === 'done'
                  ? { opacity: 0, scale: 0.4, rotate: 40 }
                  : { opacity: 1, scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.55, delay: stage === 'done' ? 0 : 0.25, ease: EASE }}
              aria-hidden="true"
            >
              ?
            </motion.span>
          </div>

          <div className="relative mt-7 min-h-[112px] w-full">
            <Swap show={stage === 'done'}>
              <p className="text-[24px] leading-[1.35] font-bold break-keep text-[#22315f]">
                {lines(R.done.title).map((l, i) => (
                  <span key={i} className="block">
                    {l}
                  </span>
                ))}
              </p>
              <p className="mt-3 text-[15px] break-keep text-gray-500">{R.done.sub}</p>
            </Swap>
            <Swap show={stage === 'twist'} delay={0.25}>
              <p className="text-[28px] leading-[1.3] font-bold break-keep text-white">{R.twist.title}</p>
              <p className="mt-3 text-[17px] break-keep text-white/70">{R.twist.sub}</p>
            </Swap>
          </div>

          {/* 가짜 [확인] — 흔한 폼의 그 버튼. 누르면 즉시 twist. 뒤집히는 동안 사라집니다. */}
          <motion.button
            type="button"
            onClick={toTwist}
            onTap={toTwist}
            data-role="done-confirm"
            className="mt-2 h-14 w-full rounded-2xl bg-[#263b7c] text-[17px] font-bold text-white"
            style={{ pointerEvents: stage === 'done' ? 'auto' : 'none' }}
            initial={{ opacity: 0, y: 10 }}
            animate={stage === 'done' ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: stage === 'done' ? 0.5 : 0.25, delay: stage === 'done' ? 0.45 : 0 }}
            whileTap={{ scale: 0.97 }}
          >
            {R.done.button}
          </motion.button>
        </div>
      </Layer>

      {/* ── 3단계 · 오늘의 체험 기록 ── */}
      <Layer active={stage === 'record'}>
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <motion.div
            className="sv-record w-full rounded-[22px] px-5 pt-[clamp(14px,2.6vh,20px)] pb-[clamp(16px,3vh,24px)]"
            initial={{ opacity: 0, y: 26, rotate: -1.5 }}
            animate={stage === 'record' ? { opacity: 1, y: 0, rotate: -1.5 } : { opacity: 0, y: 26 }}
            transition={{ duration: 0.7, ease: EASE }}
            data-role="record-card"
          >
            <p className="text-center text-[11px] tracking-[0.08em] text-[#8b7a3c]">{R.record.eyebrow}</p>
            <h2 className="mt-1 text-center text-[clamp(22px,6.4vw,27px)] font-bold tracking-tight text-[#263b7c]">
              {R.record.title}
            </h2>
            <div className="sv-record-rule mt-3" />

            <ul className="mt-1">
              {R.record.rows.map((row, i) => {
                const isLast = i === lastRow
                return (
                  <motion.li
                    key={i}
                    className="relative flex items-center gap-3 border-b border-dashed border-[#d9cc9a] py-[clamp(10px,1.9vh,15px)] last:border-b-0"
                    initial={{ opacity: 0, x: -14 }}
                    animate={rowsShown > i ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <span
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 ${
                        isLast ? 'border-[#c9bd8e] bg-transparent' : 'border-[#1fa971] bg-[#1fa971]'
                      }`}
                    >
                      {!isLast && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12 l5 5 l9 -11" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[clamp(15px,4.3vw,17px)] leading-snug font-bold break-keep text-[#22315f]">
                        {row.label}
                      </span>
                      <span
                        className={`block text-[13px] break-keep ${
                          isLast ? 'font-bold text-[#d81f4f]' : 'text-[#7d8398]'
                        }`}
                        style={isLast ? { opacity: stamped ? 1 : 0, transition: 'opacity .5s .25s' } : undefined}
                      >
                        {row.status}
                      </span>
                    </span>

                    {isLast && (
                      <motion.span
                        className="sv-stamp pointer-events-none absolute top-[-5px] right-0"
                        initial={{ opacity: 0, scale: 2.6, rotate: 22 }}
                        animate={
                          stamped
                            ? { opacity: 1, scale: 1, rotate: 7 }
                            : { opacity: 0, scale: 2.6, rotate: 22 }
                        }
                        transition={{ duration: 0.28, ease: [0.5, 0, 0.9, 0.6] }}
                        data-role="stamp"
                      >
                        {R.record.stamp}
                      </motion.span>
                    )}
                  </motion.li>
                )
              })}
            </ul>

            {/* 방금 다시 적은 것 — 크게 겁주지 않고, 기록 아래 조용히. */}
            {cards.length > 0 && (
              <motion.div
                className="mt-3 rounded-xl bg-[#263b7c] px-4 py-3"
                initial={{ opacity: 0, y: 10 }}
                animate={stamped ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
                data-role="wrote"
              >
                <p className="text-[12px] font-bold text-[#feca36]">
                  {name === '' ? R.record.wroteLeadNoName : fill(R.record.wroteLead, { name })}
                </p>
                <dl className="mt-1.5 space-y-1">
                  {cards.map((c) => (
                    <div key={c.id} className="flex gap-2.5 text-[clamp(13px,3.7vw,14px)] leading-snug">
                      <dt className="w-[52px] flex-none whitespace-nowrap text-white/55">{c.label}</dt>
                      <dd className="min-w-0 flex-1 font-bold break-keep [overflow-wrap:anywhere] text-white">
                        {c.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </motion.div>

          <motion.button
            onClick={() => setStage('punch')}
            onTap={() => setStage('punch')}
            data-role="record-next"
            disabled={!ready}
            className="mt-[clamp(12px,3vh,28px)] h-[clamp(50px,8.6vh,56px)] w-full rounded-2xl bg-white text-[17px] font-bold text-[#16224d]"
            style={{ pointerEvents: ready ? 'auto' : 'none' }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 14 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {R.record.nextButton}
          </motion.button>
        </div>
      </Layer>

      {/* ── 4단계 · 한 방 문구 + 속은 3가지 (한 화면) ── */}
      {/* "왜 또 적으셨나요?"라는 물음에 바로 아래 세 줄이 답합니다. 정리 멘트는 마지막 화면(BoothScreen)이 맡습니다. */}
      <Layer active={stage === 'punch'}>
        <motion.div
          className="w-full max-w-[400px] text-center"
          initial="hidden"
          animate={stage === 'punch' ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.3, delayChildren: 0.4 } } }}
        >
          {punchLines.map((line, i) => (
            <motion.p
              key={i}
              className={`leading-[1.26] font-bold tracking-tight break-keep ${
                i === punchLines.length - 1
                  ? 'sv-gold text-[clamp(28px,8.4vw,38px)]'
                  : 'text-[clamp(24px,7.2vw,34px)] text-white'
              }`}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
              }}
            >
              {fill(line, { name })}
            </motion.p>
          ))}

          <div className="mt-[clamp(16px,3.4vh,30px)] w-full space-y-[clamp(7px,1.3vh,10px)]">
            {R.punch.tricks.map((t, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-2xl bg-[#fff6d6] px-4 py-[clamp(9px,1.6vh,12px)] text-left"
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
                }}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#e8245c] text-[14px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[clamp(14px,4.1vw,17px)] leading-snug font-bold break-keep text-[#22315f]">
                  {t}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="mt-[clamp(16px,3.2vh,28px)] text-[clamp(17px,4.9vw,21px)] leading-[1.4] font-bold break-keep text-white"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
            }}
          >
            {lines(R.punch.soothe).map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </motion.p>

          <motion.p
            className="mt-[clamp(10px,2vh,18px)] text-[clamp(12px,3.3vw,13px)] leading-relaxed text-white/50"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1 } } }}
          >
            {lines(R.punch.note).map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </motion.p>

          <motion.button
            onClick={onNext}
            onTap={onNext}
            data-role="punch-next"
            className="mt-[clamp(14px,3vh,28px)] h-[clamp(50px,8.6vh,56px)] w-full rounded-2xl bg-white text-[17px] font-bold text-[#16224d]"
            whileTap={{ scale: 0.97 }}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
            }}
          >
            {R.punch.nextButton}
          </motion.button>
        </motion.div>
      </Layer>
    </div>
  )
}

/** 같은 자리에서 문구를 교차시킵니다(빈 화면이 한 프레임도 생기지 않게 겹쳐 둠). */
function Swap({ show, delay = 0, children }: { show: boolean; delay?: number; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0"
      initial={{ opacity: 0, y: 10 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: show ? 0.7 : 0.35, delay: show ? delay : 0, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * 바깥 스크롤 + 안쪽 가운데정렬 두 겹.
 * ★ 한 겹에 justify-center 와 overflow-y-auto 를 같이 걸면 내용이 길 때 위쪽에 스크롤로 못 닿습니다.
 */
function Layer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex min-h-full flex-col items-center justify-center px-5 py-[clamp(14px,3vh,28px)]">
        {children}
      </div>
    </motion.div>
  )
}
