import { useState } from 'react'
import IntroScreen from './screens/IntroScreen'
import SurveyScreen from './screens/SurveyScreen'
import SendingScreen from './screens/SendingScreen'
import RevealScreen from './screens/RevealScreen'
import BoothScreen from './screens/BoothScreen'
import type { Answers } from './types'

type Step = 'intro' | 'survey' | 'sending' | 'reveal' | 'booth'

/**
 * 화면 흐름 (안전체험관의 세 번째 단계 — 마지막 반전)
 *   [0] 시작       — 만족도 조사 안내 + [설문 시작하기]
 *   [1] 설문       — 무해한 문항 → 맨 아래 '선착순 추가 상품 배송' 덫
 *   [2] 전송 중    — 흔한 폼처럼 보이는 1.8초
 *   [3] 빨간 화면  — "방금 배우셨는데도 또 넘어가셨습니다"
 *   [4] 마무리     — 차분한 정리
 *
 * ★ answers 는 이 컴포넌트의 메모리에만 존재합니다.
 *   서버 전송·localStorage·쿠키·콘솔 출력 어느 것도 하지 않으며,
 *   페이지를 닫으면 그대로 사라집니다.
 */
export default function App() {
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<Answers>({})

  if (step === 'intro') return <IntroScreen onStart={() => setStep('survey')} />
  if (step === 'sending') return <SendingScreen onDone={() => setStep('reveal')} />
  if (step === 'reveal') return <RevealScreen answers={answers} onNext={() => setStep('booth')} />
  if (step === 'booth') return <BoothScreen />

  return (
    <SurveyScreen
      onSubmit={(a) => {
        setAnswers(a)
        setStep('sending')
      }}
    />
  )
}
