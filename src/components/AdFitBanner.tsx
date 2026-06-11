'use client'
import { useEffect, useRef } from 'react'

export default function AdFitBanner() {
  const insRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!insRef.current) return

    // 스크립트가 이미 로드된 경우 재삽입으로 재초기화
    const existing = document.getElementById('adfit-script')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = 'adfit-script'
    script.src = '//t1.kakaocdn.net/kas/static/ba.min.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return (
    <div className="flex justify-center py-2">
      <ins
        ref={insRef}
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit="DAN-BuLvdcVnY1FZMfUh"
        data-ad-width="320"
        data-ad-height="50"
      />
    </div>
  )
}
