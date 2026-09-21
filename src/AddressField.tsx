import { useEffect, useRef, useState } from 'react'
import { loadPostcode, toBaseAddress } from './lib/postcode'
import type { PrizeFieldDef } from './types'

interface Props {
  def: PrizeFieldDef
  isBad: boolean
  /** 합친 한 줄 주소("기본 주소 상세 주소")를 부모 answers 로 올립니다. */
  onChange: (value: string) => void
}

/**
 * 배송 주소 — [주소찾기] + 상세 주소. 쇼핑몰에서 늘 보던 그 모양이어야 의심 없이 적습니다.
 *
 * ★ 우편번호·기본·상세 주소는 이 컴포넌트의 메모리에만 있습니다(전송·저장 없음).
 *   외부로 나가는 것은 카카오 검색창에 친 검색어뿐입니다 — lib/postcode.ts 참조.
 */
export default function AddressField({ def, isBad, onChange }: Props) {
  const [zip, setZip] = useState('')
  const [base, setBase] = useState('')
  const [detail, setDetail] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  // 검색창을 못 불러오면 기본 주소 칸을 풀어 직접 적게 합니다(사람을 가두지 않음).
  const [manual, setManual] = useState(false)
  const holderRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLInputElement | null>(null)

  const emit = (b: string, d: string) => onChange(`${b} ${d}`.trim())

  const openSearch = async () => {
    if (busy || open) return
    setBusy(true)
    try {
      await loadPostcode()
      setManual(false)
      setOpen(true)
    } catch {
      setManual(true)
    } finally {
      setBusy(false)
    }
  }

  // 검색창이 열리면 카카오 iframe 을 그 안에 심습니다.
  useEffect(() => {
    if (!open || !holderRef.current || !window.daum) return
    const holder = holderRef.current
    new window.daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: (data) => {
        const b = toBaseAddress(data)
        setZip(data.zonecode)
        setBase(b)
        emit(b, detail)
        setOpen(false)
        requestAnimationFrame(() => detailRef.current?.focus())
      },
    }).embed(holder, { autoClose: false })

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      holder.replaceChildren()
    }
    // 의존은 open 하나 — 열려 있는 동안 iframe 을 다시 심지 않습니다.
  }, [open])

  const box = `w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-[#22315f] placeholder:text-[#aeb6cf] focus:outline-none ${
    isBad ? 'border-[#ff5f7a]' : 'border-transparent'
  }`

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={zip}
          readOnly
          tabIndex={-1}
          onClick={openSearch}
          placeholder={def.zipPlaceholder}
          aria-label={def.zipPlaceholder}
          className={`${box} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={openSearch}
          data-role="address-search"
          className="h-[50px] flex-none rounded-xl bg-[#feca36] px-4 text-[15px] font-bold text-[#1c2e63] disabled:opacity-60"
          disabled={busy}
        >
          {def.searchButton}
        </button>
      </div>

      {/* 도로명 주소는 길어서 한 줄 칸에서는 끝이 잘립니다 — 길면 두 줄로 늘립니다. */}
      <textarea
        value={base}
        readOnly={!manual}
        rows={base.length > 20 ? 2 : 1}
        onClick={manual ? undefined : openSearch}
        onChange={(e) => {
          setBase(e.target.value)
          emit(e.target.value, detail)
        }}
        placeholder={manual ? def.manualPlaceholder : def.placeholder}
        aria-label={def.label}
        className={`${box} block resize-none break-keep`}
      />
      {manual && <p className="text-[12px] text-[#ffd24d]">{def.searchFailMessage}</p>}

      <input
        ref={detailRef}
        type="text"
        value={detail}
        onChange={(e) => {
          setDetail(e.target.value)
          emit(base, e.target.value)
        }}
        placeholder={def.detailPlaceholder}
        aria-label={def.detailPlaceholder}
        maxLength={60}
        className={box}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[min(560px,86dvh)] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 flex-none items-center justify-between border-b border-[#e6e8f0] pr-1 pl-4">
              <span className="text-[16px] font-bold text-[#22315f]">{def.searchTitle}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-11 w-11 items-center justify-center text-[22px] text-[#5a6aa0]"
              >
                ×
              </button>
            </div>
            <div ref={holderRef} data-role="address-holder" className="min-h-0 flex-1" />
          </div>
        </div>
      )}
    </div>
  )
}
