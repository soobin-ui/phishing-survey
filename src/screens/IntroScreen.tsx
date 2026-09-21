import { motion } from 'framer-motion'
import { survey } from '../lib/content'
import { unlockAudio } from '../lib/alarm'
import { lines } from '../lib/format'
import mascotLeft from '../assets/mascot-left.webp'
import mascotRight from '../assets/mascot-right.webp'

interface Props {
  onStart: () => void
}

function Star() {
  return (
    <svg viewBox="0 0 100 100" className="h-9 w-9 drop-shadow-[0_3px_0_rgba(38,59,124,0.25)]">
      <path
        d="M50 6 L63 36 L95 39 L71 61 L78 93 L50 76 L22 93 L29 61 L5 39 L37 36 Z"
        fill="#feca36"
        stroke="#263b7c"
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * [0] 설문 시작 화면.
 *
 * ★ 이 화면은 '설문 포스터'(크림색·설문지·별점)와 같은 얼굴이어야 합니다.
 *   응모 포스터(하늘색)와는 일부러 다르게 갑니다 — 두 개가 같으면 헷갈립니다.
 *   대신 캐릭터 둘은 같은 주최 측 표시로 유지합니다(그 신뢰가 있어야 방심합니다).
 */
export default function IntroScreen({ onStart }: Props) {
  const handleStart = () => {
    // 화면을 처음 건드리는 순간. 브라우저는 이때 소리를 열어줍니다(빨간 화면 사이렌용).
    unlockAudio()
    onStart()
  }

  return (
    <div className="sv-cream relative min-h-dvh overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-[clamp(20px,5vh,44px)] pb-[clamp(14px,3.5vh,30px)]">
        {/* ── 배지 ── */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="rounded-full border-4 border-white bg-[#e8245c] px-5 py-1.5 text-[13px] font-bold tracking-tight text-white shadow-[0_4px_10px_rgba(24,44,96,0.25)]">
            {survey.intro.badge}
          </span>
        </motion.div>

        <motion.p
          className="mt-4 text-center text-[14px] font-medium text-[#5a6aa0]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          {survey.intro.eventName}
        </motion.p>

        {/* ── 제목 ── */}
        <motion.h1
          className="mt-3 text-center leading-[1.1] font-bold"
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        >
          <span className="block text-[clamp(40px,11.5vw,52px)] text-[#263b7c]">
            {survey.intro.titleAccent}
          </span>
          <span className="sv-gold block text-[clamp(46px,13vw,60px)]">
            {survey.intro.titleMain}
          </span>
        </motion.h1>

        {/* ── 별점 5개 ── */}
        <motion.div
          className="mt-5 flex justify-center gap-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} />
          ))}
        </motion.div>

        <div className="flex-[0.7]" />

        {/* ── 안내 문구 ── */}
        <motion.p
          className="mx-auto max-w-[320px] text-center text-[17px] leading-relaxed font-medium break-keep text-[#33406e]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.36 }}
        >
          {lines(survey.intro.description).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.p>

        {/* ── 캐릭터 ── */}
        <div className="relative flex min-h-0 flex-1 items-end justify-center gap-1 pt-4">
          <motion.img
            src={mascotLeft}
            alt=""
            className="sv-mascot-shadow w-[42%] max-w-[190px] self-end"
            initial={{ opacity: 0, x: -34, y: 16, rotate: -6 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.5 }}
          />
          <motion.img
            src={mascotRight}
            alt=""
            className="sv-mascot-shadow mb-[1.5%] w-[42%] max-w-[190px] self-end"
            initial={{ opacity: 0, x: 34, y: 16, rotate: 6 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.62 }}
          />
        </div>

        {/* ── 소요 시간 배지 ── */}
        <motion.p
          className="mx-auto mt-2 rounded-full bg-white px-4 py-1.5 text-center text-[14px] font-bold text-[#263b7c] shadow-[0_3px_8px_rgba(38,59,124,0.14)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.72 }}
        >
          ⏱ {survey.intro.minute}
        </motion.p>

        {/* ── 시작 버튼 ── */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.82 }}
        >
          <button
            onClick={handleStart}
            className="sv-cta h-[58px] w-full rounded-2xl bg-[#263b7c] text-[19px] font-bold text-white"
          >
            {survey.intro.button}
          </button>
        </motion.div>

        {/* ── 각주 ── ★ 지우지 마세요. 포스터에도 같은 문장이 박혀 있는 고지 자리입니다. */}
        <motion.p
          className="mt-3.5 text-center text-[12px] leading-relaxed text-[#5a6aa0]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {survey.intro.footnote}
        </motion.p>
      </div>
    </div>
  )
}
