import { useState } from 'react'
import IntroScreen from './screens/IntroScreen'
import SurveyScreen from './screens/SurveyScreen'
import SendingScreen from './screens/SendingScreen'
import RewindScreen from './screens/RewindScreen'
import BoothScreen from './screens/BoothScreen'
import type { Answers } from './types'

type Step = 'intro' | 'survey' | 'sending' | 'reveal' | 'booth'

/**
 * 화면 흐름 (안전체험관의 세 번째 단계 — 마지막 반전)
 *   [0] 시작       — 만족도 조사 안내 + [설문 시작하기]
 *   [1] 설문       — 무해한 문항 → 맨 아래 '선착순 추가 상품 배송' 덫
 *   [2] 전송 중    — 흔한 폼처럼 보이는 1.8초
 *   [3] 되감기     — 가짜 신청 완료 → 잠깐만요 → 오늘의 체험 기록(도장) → "왜 또 적으셨나요?"
 *                    (시안. 응모판과 같은 경고 화면은 screens/RevealScreen.tsx 에 그대로 남겨 둠)
 *   [4] 마무리     — 차분한 정리
 *
 * ★ answers 는 이 컴포넌트의 메모리에만 존재합니다.
 *   서버 전송·localStorage·쿠키·콘솔 출력 어느 것도 하지 않으며,
 *   페이지를 닫으면 그대로 사라집니다.
 */
export default function App() {
  // 개발 서버에서만: 주소 끝에 #rewind 를 붙이면 설문을 건너뛰고 되감기 화면부터 봅니다(보기용 가짜 값).
  const preview = import.meta.env.DEV && window.location.hash === '#rewind'
  const [step, setStep] = useState<Step>(preview ? 'reveal' : 'intro')
  const [answers, setAnswers] = useState<Answers>(
    preview
      ? { name: '홍길동', phone: '010-1234-5678', address: '경기 고양시 일산서구 킨텍스로 217-60 (대화동) 제2전시장 10홀' }
      : {},
  )

  if (step === 'intro') return <IntroScreen onStart={() => setStep('survey')} />
  if (step === 'sending') return <SendingScreen onDone={() => setStep('reveal')} />
  if (step === 'reveal') return <RewindScreen answers={answers} onNext={() => setStep('booth')} />
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
