import { motion } from 'framer-motion'
import { ui } from '../lib/content'
import { lines } from '../lib/format'
import mascotLeft from '../assets/mascot-left-nogift.webp'
import mascotRight from '../assets/mascot-right-nogift.webp'

/**
 * [4] 마지막 화면. 빨간 화면의 충격을 차분히 내려놓고 정리합니다.
 *   관람객마다 각자 본인 휴대폰이라 되돌아갈 일이 없습니다.
 */
export default function BoothScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#263b7c] px-6 text-center">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.22, delayChildren: 0.2 } } }}
        className="w-full max-w-[400px]"
      >
        <motion.div
          className="mb-7 flex items-end justify-center gap-1"
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
        >
          <img src={mascotLeft} alt="" className="w-[38%] max-w-[150px]" />
          <img src={mascotRight} alt="" className="mb-[1%] w-[38%] max-w-[150px]" />
        </motion.div>

        {ui.booth.lines.map((line, i) => (
          <motion.p
            key={i}
            className="text-[clamp(24px,7vw,30px)] leading-[1.34] font-bold tracking-tight break-keep text-white"
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } } }}
          >
            {line}
          </motion.p>
        ))}

        <motion.p
          className="mt-6 text-[15px] leading-relaxed break-keep text-white/70"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1 } } }}
        >
          {lines(ui.booth.sub).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.p>

        <motion.div
          className="mx-auto mt-8 h-px w-16 bg-white/25"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.8 } } }}
        />

        <motion.p
          className="mt-6 text-[14px] font-bold break-keep text-[#feca36]"
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.9 } } }}
        >
          {ui.booth.thanks}
        </motion.p>
      </motion.div>
    </div>
  )
}
