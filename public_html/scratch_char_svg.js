function getCharacterSvg(charId, size = 60) {
  const svgs = {
    nano: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#ffedd5" stroke="#f97316" stroke-width="2.5"/>
        <!-- 귀 -->
        <polygon points="26,38 18,12 40,24" fill="#f97316"/>
        <polygon points="28,34 22,17 38,25" fill="#fbcfe8"/>
        <polygon points="74,38 82,12 60,24" fill="#f97316"/>
        <polygon points="72,34 78,17 62,25" fill="#fbcfe8"/>
        <!-- 여우 얼굴 -->
        <circle cx="50" cy="54" r="32" fill="#ea580c"/>
        <polygon points="24,52 50,86 76,52" fill="#ea580c"/>
        <polygon points="32,54 50,82 68,54" fill="#ffffff"/>
        <!-- 볼터치 -->
        <circle cx="33" cy="62" r="5" fill="#fda4af" opacity="0.8"/>
        <circle cx="67" cy="62" r="5" fill="#fda4af" opacity="0.8"/>
        <!-- 눈 -->
        <circle cx="41" cy="52" r="4" fill="#1e293b"/>
        <circle cx="42.5" cy="50.5" r="1.5" fill="#ffffff"/>
        <circle cx="59" cy="52" r="4" fill="#1e293b"/>
        <circle cx="60.5" cy="50.5" r="1.5" fill="#ffffff"/>
        <!-- 코 & 입 -->
        <polygon points="47,66 53,66 50,69" fill="#0f172a"/>
        <path d="M47 70 Q50 73 53 70" stroke="#0f172a" stroke-width="1.5" fill="none"/>
        <!-- 탐정 돋보기 안경 -->
        <circle cx="40" cy="52" r="9" fill="none" stroke="#eab308" stroke-width="2.5"/>
        <line x1="49" y1="52" x2="51" y2="52" stroke="#eab308" stroke-width="2.5"/>
        <circle cx="60" cy="52" r="9" fill="none" stroke="#eab308" stroke-width="2.5"/>
        <line x1="67" y1="57" x2="74" y2="65" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
    booki: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#ccfbf1" stroke="#0d9488" stroke-width="2.5"/>
        <!-- 부엉이 깃털 귀 -->
        <polygon points="25,32 18,18 36,25" fill="#0f766e"/>
        <polygon points="75,32 82,18 64,25" fill="#0f766e"/>
        <!-- 몸통 -->
        <circle cx="50" cy="56" r="32" fill="#0d9488"/>
        <ellipse cx="50" cy="62" rx="20" ry="22" fill="#f0fdfa"/>
        <!-- 가슴 깃털 무늬 -->
        <path d="M44 58 Q50 63 56 58" stroke="#14b8a6" stroke-width="2" fill="none"/>
        <path d="M42 66 Q50 71 58 66" stroke="#14b8a6" stroke-width="2" fill="none"/>
        <!-- 커다란 눈 -->
        <circle cx="38" cy="48" r="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
        <circle cx="39" cy="48" r="5" fill="#0f172a"/>
        <circle cx="41" cy="46" r="2" fill="#ffffff"/>
        <circle cx="62" cy="48" r="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
        <circle cx="61" cy="48" r="5" fill="#0f172a"/>
        <circle cx="63" cy="46" r="2" fill="#ffffff"/>
        <!-- 부리 -->
        <polygon points="46,55 54,55 50,63" fill="#f59e0b"/>
        <!-- 머리 위 학사 책 -->
        <rect x="36" y="16" width="28" height="7" rx="2" fill="#2563eb"/>
        <rect x="38" y="14" width="24" height="4" rx="1.5" fill="#60a5fa"/>
        <path d="M50 14 L50 21" stroke="#ffffff" stroke-width="1"/>
        <circle cx="50" cy="13" r="2" fill="#fbbf24"/>
      </svg>`,
    toto: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#fce7f3" stroke="#ec4899" stroke-width="2.5"/>
        <!-- 긴 토끼 귀 -->
        <ellipse cx="34" cy="22" rx="7" ry="18" fill="#f472b6" transform="rotate(-10 34 22)"/>
        <ellipse cx="34" cy="22" rx="3.5" ry="12" fill="#fdf2f8" transform="rotate(-10 34 22)"/>
        <ellipse cx="66" cy="22" rx="7" ry="18" fill="#f472b6" transform="rotate(10 66 22)"/>
        <ellipse cx="66" cy="22" rx="3.5" ry="12" fill="#fdf2f8" transform="rotate(10 66 22)"/>
        <!-- 얼굴 -->
        <circle cx="50" cy="58" r="30" fill="#f472b6"/>
        <ellipse cx="50" cy="64" rx="18" ry="16" fill="#ffffff"/>
        <!-- 볼터치 -->
        <circle cx="32" cy="62" r="5" fill="#fb7185" opacity="0.8"/>
        <circle cx="68" cy="62" r="5" fill="#fb7185" opacity="0.8"/>
        <!-- 눈 -->
        <ellipse cx="40" cy="53" rx="3.5" ry="5" fill="#1e293b"/>
        <circle cx="41.5" cy="51" r="1.5" fill="#ffffff"/>
        <ellipse cx="60" cy="53" rx="3.5" ry="5" fill="#1e293b"/>
        <circle cx="61.5" cy="51" r="1.5" fill="#ffffff"/>
        <!-- 코 & 토끼 이빨 -->
        <polygon points="47,62 53,62 50,65" fill="#f43f5e"/>
        <rect x="48.5" y="66" width="3" height="4" rx="1" fill="#ffffff" stroke="#f43f5e" stroke-width="0.5"/>
        <!-- 당근 책갈피 -->
        <polygon points="74,68 84,54 78,50" fill="#f97316"/>
        <polygon points="80,50 85,44 86,52" fill="#22c55e"/>
      </svg>`,
    lumi: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2.5"/>
        <!-- 반짝이는 요정 날개 -->
        <ellipse cx="26" cy="46" rx="14" ry="9" fill="#c4b5fd" opacity="0.75" transform="rotate(-25 26 46)"/>
        <ellipse cx="74" cy="46" rx="14" ry="9" fill="#c4b5fd" opacity="0.75" transform="rotate(25 74 46)"/>
        <!-- 요정 얼굴 -->
        <circle cx="50" cy="55" r="28" fill="#a78bfa"/>
        <path d="M28 44 Q50 34 72 44 Q70 60 50 62 Q30 60 28 44 Z" fill="#7c3aed"/>
        <!-- 둥근 앞머리 -->
        <circle cx="40" cy="44" r="8" fill="#6d28d9"/>
        <circle cx="60" cy="44" r="8" fill="#6d28d9"/>
        <ellipse cx="50" cy="62" rx="18" ry="15" fill="#fdf4ff"/>
        <!-- 별빛 눈망울 -->
        <circle cx="41" cy="58" r="4.5" fill="#4c1d95"/>
        <polygon points="42,56 43,58 41,58" fill="#ffffff"/>
        <circle cx="59" cy="58" r="4.5" fill="#4c1d95"/>
        <polygon points="60,56 61,58 59,58" fill="#ffffff"/>
        <!-- 볼터치와 미소 -->
        <circle cx="34" cy="65" r="4" fill="#f472b6" opacity="0.7"/>
        <circle cx="66" cy="65" r="4" fill="#f472b6" opacity="0.7"/>
        <path d="M47 67 Q50 70 53 67" stroke="#6d28d9" stroke-width="1.5" fill="none"/>
        <!-- 머리 위 별 왕관 -->
        <polygon points="50,15 54,24 63,24 56,30 59,39 50,33 41,39 44,30 37,24 46,24" fill="#fbbf24"/>
        <circle cx="50" cy="27" r="2" fill="#ffffff"/>
      </svg>`,
    popo: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/>
        <!-- 곰 귀 -->
        <circle cx="28" cy="30" r="12" fill="#92400e"/>
        <circle cx="28" cy="30" r="6" fill="#fcd34d"/>
        <circle cx="72" cy="30" r="12" fill="#92400e"/>
        <circle cx="72" cy="30" r="6" fill="#fcd34d"/>
        <!-- 곰 얼굴 -->
        <circle cx="50" cy="56" r="32" fill="#92400e"/>
        <ellipse cx="50" cy="64" rx="16" ry="13" fill="#fef3c7"/>
        <!-- 눈 -->
        <circle cx="39" cy="52" r="3.5" fill="#0f172a"/>
        <circle cx="40.5" cy="50.5" r="1.2" fill="#ffffff"/>
        <circle cx="61" cy="52" r="3.5" fill="#0f172a"/>
        <circle cx="62.5" cy="50.5" r="1.2" fill="#ffffff"/>
        <!-- 볼터치 -->
        <circle cx="32" cy="60" r="4.5" fill="#f87171" opacity="0.7"/>
        <circle cx="68" cy="60" r="4.5" fill="#f87171" opacity="0.7"/>
        <!-- 코 & 입 -->
        <ellipse cx="50" cy="62" rx="4.5" ry="3.5" fill="#451a03"/>
        <path d="M47 66 Q50 69 53 66" stroke="#451a03" stroke-width="1.5" fill="none"/>
        <!-- 품에 안은 두꺼운 책 -->
        <rect x="32" y="74" width="36" height="15" rx="3" fill="#15803d"/>
        <rect x="35" y="72" width="30" height="4" rx="1" fill="#f8fafc"/>
        <line x1="50" y1="74" x2="50" y2="89" stroke="#14532d" stroke-width="1.5"/>
      </svg>`,
    pico: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
        <!-- 펭귄 몸체 -->
        <ellipse cx="50" cy="56" rx="30" ry="32" fill="#0f172a"/>
        <!-- 흰 배 -->
        <ellipse cx="50" cy="62" rx="20" ry="24" fill="#ffffff"/>
        <!-- 날개 -->
        <ellipse cx="20" cy="58" rx="6" ry="14" fill="#1e293b" transform="rotate(-15 20 58)"/>
        <ellipse cx="80" cy="58" rx="6" ry="14" fill="#1e293b" transform="rotate(15 80 58)"/>
        <!-- 큰 눈망울 -->
        <circle cx="40" cy="48" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
        <circle cx="41" cy="48" r="3.8" fill="#0284c7"/>
        <circle cx="42" cy="46" r="1.5" fill="#ffffff"/>
        <circle cx="60" cy="48" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
        <circle cx="59" cy="48" r="3.8" fill="#0284c7"/>
        <circle cx="60" cy="46" r="1.5" fill="#ffffff"/>
        <!-- 주황 부리 -->
        <polygon points="46,55 54,55 50,62" fill="#ea580c"/>
        <!-- 볼터치 -->
        <circle cx="33" cy="56" r="4" fill="#fb923c" opacity="0.6"/>
        <circle cx="67" cy="56" r="4" fill="#fb923c" opacity="0.6"/>
        <!-- 우주 헬멧 바이저 빛 -->
        <path d="M26 38 A 30 30 0 0 1 74 38" stroke="#38bdf8" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
        <circle cx="72" cy="36" r="3" fill="#38bdf8"/>
        <!-- 머리 안테나 -->
        <line x1="50" y1="24" x2="50" y2="15" stroke="#0284c7" stroke-width="2"/>
        <circle cx="50" cy="14" r="3.5" fill="#ef4444"/>
      </svg>`,
    chichi: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#ffedd5" stroke="#ea580c" stroke-width="2.5"/>
        <!-- 풍성한 다람쥐 꼬리 -->
        <path d="M70 65 Q88 45 84 25 Q78 12 68 20 Q62 26 66 38 Z" fill="#c2410c"/>
        <path d="M72 60 Q84 45 80 30" stroke="#fed7aa" stroke-width="2.5" fill="none"/>
        <!-- 다람쥐 귀 -->
        <ellipse cx="32" cy="30" rx="7" ry="10" fill="#c2410c" transform="rotate(-15 32 30)"/>
        <ellipse cx="32" cy="30" rx="4" ry="6" fill="#ffedd5" transform="rotate(-15 32 30)"/>
        <ellipse cx="68" cy="30" rx="7" ry="10" fill="#c2410c" transform="rotate(15 68 30)"/>
        <ellipse cx="68" cy="30" rx="4" ry="6" fill="#ffedd5" transform="rotate(15 68 30)"/>
        <!-- 통통한 얼굴 -->
        <circle cx="50" cy="57" r="30" fill="#ea580c"/>
        <ellipse cx="50" cy="65" rx="18" ry="16" fill="#fff7ed"/>
        <!-- 이마 줄무늬 -->
        <line x1="50" y1="36" x2="50" y2="48" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>
        <line x1="43" y1="38" x2="44" y2="46" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
        <line x1="57" y1="38" x2="56" y2="46" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
        <!-- 볼터치 (도토리 가득한 빵빵한 볼) -->
        <circle cx="31" cy="64" r="6" fill="#fdba74"/>
        <circle cx="69" cy="64" r="6" fill="#fdba74"/>
        <!-- 눈 -->
        <circle cx="39" cy="54" r="4.5" fill="#1e293b"/>
        <circle cx="41" cy="52" r="1.5" fill="#ffffff"/>
        <circle cx="61" cy="54" r="4.5" fill="#1e293b"/>
        <circle cx="63" cy="52" r="1.5" fill="#ffffff"/>
        <!-- 코 & 입 -->
        <circle cx="50" cy="61" r="2.5" fill="#7c2d12"/>
        <path d="M47 64 Q50 67 53 64" stroke="#7c2d12" stroke-width="1.5" fill="none"/>
        <!-- 도토리 모자 -->
        <ellipse cx="50" cy="28" rx="12" ry="7" fill="#78350f"/>
        <line x1="50" y1="21" x2="52" y2="15" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    mir: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#d1fae5" stroke="#059669" stroke-width="2.5"/>
        <!-- 아기 청룡 뿔 -->
        <polygon points="32,32 20,15 36,22" fill="#fbbf24"/>
        <polygon points="68,32 80,15 64,22" fill="#fbbf24"/>
        <!-- 용 얼굴 -->
        <circle cx="50" cy="55" r="30" fill="#10b981"/>
        <ellipse cx="50" cy="64" rx="20" ry="16" fill="#a7f3d0"/>
        <!-- 이마 비늘 -->
        <circle cx="50" cy="38" r="3" fill="#047857"/>
        <circle cx="43" cy="40" r="2" fill="#047857"/>
        <circle cx="57" cy="40" r="2" fill="#047857"/>
        <!-- 총명한 용의 눈 -->
        <circle cx="38" cy="50" r="5" fill="#064e3b"/>
        <circle cx="39.5" cy="48.5" r="1.8" fill="#ffffff"/>
        <circle cx="62" cy="50" r="5" fill="#064e3b"/>
        <circle cx="63.5" cy="48.5" r="1.8" fill="#ffffff"/>
        <!-- 귀여운 콧구멍 & 수염 -->
        <circle cx="47" cy="61" r="1.5" fill="#065f46"/>
        <circle cx="53" cy="61" r="1.5" fill="#065f46"/>
        <path d="M34 62 Q24 64 26 72" stroke="#fbbf24" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M66 62 Q76 64 74 72" stroke="#fbbf24" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- 구름 방석 -->
        <path d="M30 84 Q40 76 50 84 Q60 76 70 84 Q74 90 60 92 Q40 92 30 84 Z" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
        <!-- 여의주 -->
        <circle cx="50" cy="78" r="6" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
      </svg>`,
    choco: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#fef9c3" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- 처진 강아지 귀 -->
        <ellipse cx="24" cy="52" rx="9" ry="18" fill="#713f12" transform="rotate(15 24 52)"/>
        <ellipse cx="76" cy="52" rx="9" ry="18" fill="#713f12" transform="rotate(-15 76 52)"/>
        <!-- 얼굴 -->
        <circle cx="50" cy="56" r="30" fill="#fef08a"/>
        <!-- 눈 주변 얼룩 -->
        <ellipse cx="40" cy="50" rx="9" ry="11" fill="#ca8a04" opacity="0.3"/>
        <ellipse cx="50" cy="65" rx="16" ry="14" fill="#ffffff"/>
        <!-- 눈 -->
        <circle cx="40" cy="51" r="4" fill="#1e293b"/>
        <circle cx="41.5" cy="49.5" r="1.5" fill="#ffffff"/>
        <circle cx="60" cy="51" r="4" fill="#1e293b"/>
        <circle cx="61.5" cy="49.5" r="1.5" fill="#ffffff"/>
        <!-- 코 & 혓바닥 -->
        <ellipse cx="50" cy="61" rx="5" ry="4" fill="#451a03"/>
        <path d="M47 66 Q50 69 53 66" stroke="#451a03" stroke-width="1.5" fill="none"/>
        <path d="M48 68 Q50 75 52 68 Z" fill="#f43f5e"/>
        <!-- 볼터치 -->
        <circle cx="32" cy="62" r="4.5" fill="#fca5a5" opacity="0.8"/>
        <circle cx="68" cy="62" r="4.5" fill="#fca5a5" opacity="0.8"/>
        <!-- 예술가 빵모자 (베레모) -->
        <ellipse cx="46" cy="27" rx="18" ry="10" fill="#dc2626" transform="rotate(-12 46 27)"/>
        <circle cx="42" cy="18" r="2.5" fill="#dc2626"/>
      </svg>`,
    jelly: `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="50" cy="50" r="48" fill="#cffafe" stroke="#06b6d4" stroke-width="2.5"/>
        <!-- 말랑 젤리 몸체 -->
        <path d="M50 18 C30 18 20 40 22 65 C24 82 38 88 50 88 C62 88 76 82 78 65 C80 40 70 18 50 18 Z" fill="#22d3ee"/>
        <!-- 젤리 하이라이트 광택 -->
        <ellipse cx="36" cy="38" rx="5" ry="10" fill="#ffffff" opacity="0.6" transform="rotate(-25 36 38)"/>
        <circle cx="42" cy="28" r="3" fill="#ffffff" opacity="0.7"/>
        <!-- 윙크하는 눈 -->
        <path d="M36 54 Q41 49 46 54" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="59" cy="53" r="4.5" fill="#0f172a"/>
        <circle cx="60.5" cy="51" r="1.8" fill="#ffffff"/>
        <!-- 볼터치 -->
        <circle cx="32" cy="62" r="5" fill="#f472b6" opacity="0.8"/>
        <circle cx="68" cy="62" r="5" fill="#f472b6" opacity="0.8"/>
        <!-- 미소 -->
        <path d="M47 62 Q50 67 53 62" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- 머리 꼭지 작은 별 -->
        <polygon points="50,10 52,14 56,14 53,17 54,21 50,18 46,21 47,17 44,14 48,14" fill="#fbbf24"/>
      </svg>`
  };
  return svgs[charId] || svgs.booki;
}
