// ==============================================================
// 8. 결제 및 구독 관리 모듈 (Academy Payment & Subscription)
// ==============================================================

// 학원 현재 이용 중인 플랜 정보 (실제 학원 계약 데이터와 실시간 동기화)
var currentAcademyPlan = {
  tier: 'standard',
  name: '스탠다드',
  slots: 50,
  monthlyPrice: 100000,
  startDate: '2025-01-01',
  expiryDate: '2026-12-31',
  expiryDateDot: '2026.12.31',
  nextBillingDate: '2027-01-01',
  nextBillingDateDot: '2027.01.01',
  daysRemaining: 60,
  ddayText: 'D-60'
};

var currentSelectedTier = 'standard';
var currentSelectedPeriod = '6month';
var currentSelectedPayMethod = '신용카드';

// 요금제(Tier) 정의: 원생 정원 규모별
var planTiers = {
  'basic': {
    code: 'basic',
    name: '베이직 (Basic)',
    slots: 25,
    monthlyPrice: 80000,
    rank: 1,
    badgeColor: 'badge-secondary',
    desc: '소규모 학원 및 공부방 최적화'
  },
  'standard': {
    code: 'standard',
    name: '스탠다드 (Standard)',
    slots: 50,
    monthlyPrice: 120000,
    rank: 2,
    badgeColor: 'badge-success',
    desc: '표준 학원 운영에 최적화된 대표 플랜'
  },
  'premium': {
    code: 'premium',
    name: '프리미엄 (Premium)',
    slots: 100,
    monthlyPrice: 180000,
    rank: 3,
    badgeColor: 'badge-warning',
    desc: '원생 확장에 대비하는 중대형 학원 플랜'
  },
  'vip': {
    code: 'vip',
    name: '로열 (Royal)',
    slots: '협의',
    monthlyPrice: 300000,
    rank: 4,
    badgeColor: 'badge-danger',
    desc: '대형 프랜차이즈 및 전문 브랜드'
  }
};

// 매월 25일(주말·공휴일인 경우 다음 평일) 차월 사용분 정기결제일 및 당월 잔여 일수 산출 헬퍼
function getNext25thBillingDateInfo(baseDate) {
  var now = baseDate ? new Date(baseDate.getTime()) : new Date();
  now.setHours(0, 0, 0, 0);
  var pad = function(n) { return n < 10 ? '0' + n : String(n); };

  // 대한민국 주요 양력 공휴일 (MM-DD)
  var fixedHolidays = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'];
  var isHolidayOrWeekend = function(d) {
    var day = d.getDay();
    if (day === 0 || day === 6) return true;
    var mmdd = pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return fixedHolidays.indexOf(mmdd) !== -1;
  };
  var adjustToNextBusinessDay = function(d) {
    var copy = new Date(d.getTime());
    var shifted = false;
    while (isHolidayOrWeekend(copy)) {
      copy.setDate(copy.getDate() + 1);
      shifted = true;
    }
    return { date: copy, shifted: shifted };
  };

  var year = now.getFullYear();
  var month = now.getMonth();
  var candidate25 = new Date(year, month, 25);
  var adjustedThisMonth = adjustToNextBusinessDay(candidate25);

  var targetBillingObj = adjustedThisMonth.date;
  var wasShifted = adjustedThisMonth.shifted;
  if (now.getTime() > targetBillingObj.getTime()) {
    var nextMonth25 = new Date(year, month + 1, 25);
    var adjustedNextMonth = adjustToNextBusinessDay(nextMonth25);
    targetBillingObj = adjustedNextMonth.date;
    wasShifted = adjustedNextMonth.shifted;
  }

  var billingStr = targetBillingObj.getFullYear() + '-' + pad(targetBillingObj.getMonth() + 1) + '-' + pad(targetBillingObj.getDate());
  var billingDot = billingStr.replace(/-/g, '.');

  // 차월 사용 기간 (다음 달 1일 ~ 말일)
  var usageStartObj = new Date(targetBillingObj.getFullYear(), targetBillingObj.getMonth() + 1, 1);
  var usageEndObj = new Date(targetBillingObj.getFullYear(), targetBillingObj.getMonth() + 2, 0);
  var nextMonthUsageStart = usageStartObj.getFullYear() + '-' + pad(usageStartObj.getMonth() + 1) + '-' + pad(usageStartObj.getDate());
  var nextMonthUsageEnd = usageEndObj.getFullYear() + '-' + pad(usageEndObj.getMonth() + 1) + '-' + pad(usageEndObj.getDate());
  var nextMonthLabel = usageStartObj.getFullYear() + '년 ' + (usageStartObj.getMonth() + 1) + '월분';

  // 이번 달 총 일수 및 오늘 포함 이번 달 남은 일수 (일할 계산용)
  var lastDayOfThisMonth = new Date(year, month + 1, 0);
  var totalDaysInMonth = lastDayOfThisMonth.getDate();
  var remainingDaysInMonth = Math.max(1, totalDaysInMonth - now.getDate() + 1);
  var thisMonthEndStr = year + '-' + pad(month + 1) + '-' + pad(totalDaysInMonth);

  return {
    billingDateStr: billingStr,
    billingDateDot: billingDot,
    wasShifted: wasShifted,
    nextMonthUsageStart: nextMonthUsageStart,
    nextMonthUsageEnd: nextMonthUsageEnd,
    nextMonthLabel: nextMonthLabel,
    totalDaysInMonth: totalDaysInMonth,
    remainingDaysInMonth: remainingDaysInMonth,
    thisMonthEndStr: thisMonthEndStr
  };
}

// 학원 실제 계약 정보(currentAcademyInfo)를 기반으로 결제 관리 상단 카드·요금제 선택 UI를 동기화
function syncCurrentAcademyPlan(resetSelectedTier) {
  if (typeof currentAcademyInfo === 'undefined' || !currentAcademyInfo) return;

  var maxSlots = Number(currentAcademyInfo.maxStudents) || 50;
  var rawPlan = String(currentAcademyInfo.plan || '').trim().toLowerCase();

  // 계약 정원(maxSlots)과 플랜명(plan)을 함께 반영하여 실제 요금제 단계(tierCode) 산출
  var tierCode = 'standard';
  if (rawPlan === 'vip' || rawPlan === 'royal' || rawPlan === '로얄' || rawPlan === '로열' || maxSlots > 100) {
    tierCode = 'vip';
  } else if (maxSlots >= 80 || rawPlan === 'premium' || rawPlan === '프리미엄') {
    tierCode = 'premium';
  } else if (maxSlots <= 25 || rawPlan === 'basic' || rawPlan === '베이직') {
    tierCode = 'basic';
  } else {
    tierCode = 'standard';
  }
  if (maxSlots === 100 && tierCode !== 'vip') {
    tierCode = 'premium';
  } else if (maxSlots === 50 && tierCode !== 'vip') {
    tierCode = 'standard';
  } else if (maxSlots <= 25 && tierCode !== 'vip') {
    tierCode = 'basic';
  }

  // 기본 슬롯 초기화
  planTiers.basic.slots = 25;
  planTiers.standard.slots = 50;
  planTiers.premium.slots = 100;
  planTiers.vip.slots = '협의';
  if (tierCode !== 'vip') {
    planTiers[tierCode].slots = maxSlots;
  }

  var activeTier = planTiers[tierCode];

  // 월 결제액 파싱 (문자열 "180,000원" 또는 숫자 모두 안전하게 처리)
  var parsedFee = parseInt(String(currentAcademyInfo.monthlyFee || '').replace(/[^0-9]/g, ''), 10);
  var displayMonthlyFee = (!isNaN(parsedFee) && parsedFee > 0)
    ? parsedFee
    : Math.round(activeTier.monthlyPrice * 1.1);

  // 시작일·만료일·매월 25일 정기결제일·D-Day 계산
  var startStr = String(currentAcademyInfo.startDate || currentAcademyInfo.contractDate || currentAcademyInfo.joinDate || '2025-01-01').slice(0, 10);
  var endStr = String(currentAcademyInfo.endDate || currentAcademyInfo.expireDate || '2026-12-31').slice(0, 10);
  var endDot = endStr.replace(/-/g, '.');

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var endDateObj = new Date(endStr + 'T00:00:00');
  if (isNaN(endDateObj.getTime())) {
    endDateObj = new Date('2026-12-31T00:00:00');
  }
  var diffDays = Math.ceil((endDateObj.getTime() - today.getTime()) / 86400000);
  var ddayLabel = diffDays > 0 ? ('D-' + diffDays) : (diffDays === 0 ? 'D-Day' : ('만료 +' + Math.abs(diffDays) + '일'));

  var billingInfo = getNext25thBillingDateInfo(today);

  currentAcademyPlan.tier = tierCode;
  currentAcademyPlan.name = activeTier.name;
  currentAcademyPlan.slots = maxSlots;
  currentAcademyPlan.monthlyPrice = activeTier.monthlyPrice;
  currentAcademyPlan.startDate = startStr;
  currentAcademyPlan.expiryDate = endStr;
  currentAcademyPlan.expiryDateDot = endDot;
  currentAcademyPlan.nextBillingDate = billingInfo.billingDateStr;
  currentAcademyPlan.nextBillingDateDot = billingInfo.billingDateDot;
  currentAcademyPlan.nextMonthLabel = billingInfo.nextMonthLabel;
  currentAcademyPlan.nextMonthUsageStart = billingInfo.nextMonthUsageStart;
  currentAcademyPlan.nextMonthUsageEnd = billingInfo.nextMonthUsageEnd;
  currentAcademyPlan.totalDaysInMonth = billingInfo.totalDaysInMonth;
  currentAcademyPlan.remainingDaysInMonth = billingInfo.remainingDaysInMonth;
  currentAcademyPlan.thisMonthEndStr = billingInfo.thisMonthEndStr;
  currentAcademyPlan.daysRemaining = Math.max(0, diffDays);
  currentAcademyPlan.ddayText = ddayLabel;

  // 1) 상단 요약 카드 1: 현재 요금제 안내
  var payPlanNameEl = document.getElementById('paymentStatPlanName');
  var payPlanFeeEl = document.getElementById('paymentStatPlanFee');
  if (payPlanNameEl) {
    var pendingText = currentAcademyPlan.reservedNextTier
      ? ' <span class="badge-soft badge-soft-warn ml-1" style="font-size: 10.5px; vertical-align: middle;">차월 ' + planTiers[currentAcademyPlan.reservedNextTier].name.split(' ')[0] + ' 예정</span>'
      : '';
    payPlanNameEl.innerHTML = activeTier.name + ' (' + maxSlots + '명) <span class="badge-soft badge-soft-success ml-2" style="font-size: 11px; vertical-align: middle;">이용중</span>' + pendingText;
  }
  if (payPlanFeeEl) {
    payPlanFeeEl.innerHTML = '월 결제액: <strong>' + Number(displayMonthlyFee).toLocaleString() + '원</strong> <small>(VAT 포함)</small>';
  }

  // 2) 상단 요약 카드 2: 서비스 이용 기간 및 만료일 (매월 25일 정기결제 반영)
  var payExpireEl = document.getElementById('paymentStatExpireDday');
  var payStartEl = document.getElementById('paymentStatStartDate');
  var payNextEl = document.getElementById('paymentStatNextDate');
  if (payExpireEl) {
    payExpireEl.style.color = diffDays <= 30 ? '#dc2626' : 'var(--text-main)';
    payExpireEl.innerHTML = ddayLabel + ' <small class="text-muted font-weight-normal" style="font-size: 14px;">(' + endDot + ' 만료)</small>';
  }
  if (payStartEl) {
    payStartEl.innerText = '시작일: ' + startStr;
  }
  if (payNextEl) {
    payNextEl.className = 'font-weight-bold';
    payNextEl.style.color = 'var(--btn-primary)';
    payNextEl.innerText = '정기 결제일: ' + billingInfo.billingDateStr + ' (매월 25일·차월분)';
  }

  // 3) '요금제 선택' 우측 상단 '현재 이용중: ...' 요약 라벨 및 드롭박스 옵션 텍스트 갱신
  var summaryLabelEl = document.getElementById('currentPlanSummaryLabel');
  if (summaryLabelEl) {
    var displaySlotText = (tierCode === 'vip') ? (maxSlots > 0 ? maxSlots + '명 (협의)' : '협의') : (maxSlots + '명');
    summaryLabelEl.innerHTML = '현재 이용중: <strong>' + activeTier.name + ' (' + displaySlotText + ')</strong>';
  }

  var dropdownEl = document.getElementById('planTierSelectDropdown');
  if (dropdownEl) {
    var optionLabels = {
      basic: '베이직 · ' + planTiers.basic.slots + '명 · 88,000원 / 월',
      standard: '스탠다드 · ' + planTiers.standard.slots + '명 · 132,000원 / 월',
      premium: '프리미엄 · ' + planTiers.premium.slots + '명 · 198,000원 / 월',
      vip: '로열 · 정원 협의 · 330,000원 / 월'
    };
    Array.from(dropdownEl.options).forEach(function(opt) {
      var code = opt.value;
      if (optionLabels[code]) {
        opt.text = optionLabels[code] + (code === tierCode ? ' [현재 이용중]' : '');
      }
    });
  }

  // 4) 자동갱신 상태 및 선택 요금제 상세·카카오톡 충전 카드 동기화
  if (typeof updateAutoRenewUI === 'function') {
    updateAutoRenewUI();
  }
  if (resetSelectedTier || !currentSelectedTier || currentSelectedTier === 'kakao') {
    currentSelectedTier = tierCode;
  }
  if (typeof selectPlanTier === 'function') {
    selectPlanTier(currentSelectedTier);
  }
  if (typeof updateKakaoTopupCardUI === 'function') {
    updateKakaoTopupCardUI();
  }
}

// 구독 기간 정의 (매월 25일 차월 사용분 정기결제)
var periodDefinitions = {
  'monthly': {
    code: 'monthly',
    name: '월 정기구독 (차월 사용분)',
    shortName: '1개월',
    periodMonths: 1,
    discountRate: 0,
    badge: '월 정기구독 (매월 25일 자동결제)',
    desc: '매월 25일(공휴일 시 다음 평일) 차월 사용분 정기결제'
  }
};

var currentKakaoTopupQty = 1;
var currentUpgradeApplyTiming = 'now'; // 'now' (지금 바로 적용 - 일할 차액 결제) | 'next_month' (차월부터 적용 - 추가 결제 없음)
var currentCheckoutMode = 'monthly';   // 'monthly' | 'upgrade_now' | 'kakao'

// 현재 학원이 활성 정기구독(정기결제)을 등록하여 이용 중인지 확인하는 함수
function hasActiveSubscription() {
  if (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo) {
    if (typeof currentAcademyInfo.hasSubscription === 'boolean') {
      return currentAcademyInfo.hasSubscription;
    }
    if (currentAcademyInfo.subscriptionStatus === 'inactive' || currentAcademyInfo.subscriptionStatus === 'none') {
      return false;
    }
    if (currentAcademyInfo.subscriptionStatus === 'active') {
      return true;
    }
  }
  // 결제 내역 중 월 정기결제 건이 존재하고 자동갱신(isAutoRenewActive)이 켜져 있는지 확인
  if (Array.isArray(academyPaymentList) && academyPaymentList.length > 0) {
    var hasPaidMonthly = academyPaymentList.some(function(p) {
      return p.status === 'paid' && (p.planType === 'monthly' || String(p.planType).indexOf('monthly') !== -1 || String(p.planType).indexOf('upgrade') !== -1);
    });
    if (hasPaidMonthly && isAutoRenewActive) return true;
  }
  return false;
}

function updateKakaoTopupCardUI() {
  var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
  var kakaoSupply = qty * 5000;
  var kakaoVat = qty * 500;
  var kakaoTotal = qty * 5500;
  var approxCount = Math.floor(kakaoTotal / 8.5); // 5,500원 결제 시 5,500원 충전 (건당 8.5원 기준 647건/단위)

  var input = document.getElementById('kakaoTopupQtyInput');
  if (input && Number(input.value) !== qty) input.value = String(qty);

  var creditSummary = document.getElementById('kakaoCreditSummaryText');
  if (creditSummary) {
    creditSummary.innerText = Number(kakaoTotal).toLocaleString() + '원 충전 · ' + Number(approxCount).toLocaleString() + '건 발송 가능';
  }
  var supplyEl = document.getElementById('kakaoTopupSupplyText');
  if (supplyEl) supplyEl.innerText = Number(kakaoTotal).toLocaleString() + '원';
  var vatEl = document.getElementById('kakaoTopupVatText');
  if (vatEl) vatEl.innerText = Number(kakaoSupply).toLocaleString() + '원 / ' + Number(kakaoVat).toLocaleString() + '원';
  var totalEl = document.getElementById('kakaoTopupTotalText');
  if (totalEl) totalEl.innerText = Number(kakaoTotal).toLocaleString() + '원';
  var btnEl = document.getElementById('btnKakaoTopupSubmit');
  if (btnEl) {
    btnEl.innerHTML = Number(kakaoTotal).toLocaleString() + '원 충전 결제';
  }
}

function changeKakaoTopupQty(delta) {
  var next = (Number(currentKakaoTopupQty) || 1) + Number(delta || 0);
  if (next < 1) next = 1;
  if (next > 100) next = 100;
  currentKakaoTopupQty = next;
  updateKakaoTopupCardUI();
}

function onKakaoTopupQtyInput(val) {
  var next = parseInt(val, 10);
  if (isNaN(next) || next < 1) next = 1;
  if (next > 100) next = 100;
  currentKakaoTopupQty = next;
  updateKakaoTopupCardUI();
}

function openKakaoTopupCheckout() {
  openCheckoutModal('kakao');
}

function onUpgradeTimingChange(timing) {
  currentUpgradeApplyTiming = (timing === 'next_month') ? 'next_month' : 'now';
  var rNow = document.getElementById('radioUpgradeNow');
  var rNext = document.getElementById('radioUpgradeNextMonth');
  var lNow = document.getElementById('labelUpgradeTimingNow');
  var lNext = document.getElementById('labelUpgradeTimingNext');
  if (rNow) rNow.checked = (currentUpgradeApplyTiming === 'now');
  if (rNext) rNext.checked = (currentUpgradeApplyTiming === 'next_month');
  if (lNow) {
    lNow.style.border = (currentUpgradeApplyTiming === 'now') ? '1.5px solid #dc2626' : '1px solid #e2e8f0';
    lNow.style.background = (currentUpgradeApplyTiming === 'now') ? '#ffffff' : '#f8fafc';
  }
  if (lNext) {
    lNext.style.border = (currentUpgradeApplyTiming === 'next_month') ? '1.5px solid #5a4b3d' : '1px solid #e2e8f0';
    lNext.style.background = (currentUpgradeApplyTiming === 'next_month') ? '#ffffff' : '#f8fafc';
  }
  selectPlanTier(currentSelectedTier);
}

// 당월 남은 일수 일할 차액 계산 헬퍼 (업그레이드 '지금 바로 적용' 선택 시)
function calculateUpgradeProratedDiff(targetTier) {
  var billingInfo = getNext25thBillingDateInfo();
  var totalDays = billingInfo.totalDaysInMonth || 30;
  var remainDays = billingInfo.remainingDaysInMonth || 1;
  var currentMonthlySupply = Number(currentAcademyPlan.monthlyPrice) || 120000;
  var targetMonthlySupply = Number(targetTier.monthlyPrice) || 180000;
  var monthlySupplyDiff = Math.max(0, targetMonthlySupply - currentMonthlySupply);

  var proratedSupply = Math.round((monthlySupplyDiff * remainDays) / totalDays);
  var proratedVat = Math.round(proratedSupply * 0.1);
  var proratedTotal = proratedSupply + proratedVat;

  return {
    monthlySupplyDiff: monthlySupplyDiff,
    totalDays: totalDays,
    remainDays: remainDays,
    proratedSupply: proratedSupply,
    proratedVat: proratedVat,
    proratedTotal: proratedTotal,
    billingInfo: billingInfo
  };
}

// 요금제(Tier 4종) 드롭박스 선택 시 우측 설명·비용·버튼 업데이트 함수
function selectPlanTier(tierCode) {
  if (tierCode === 'kakao') { openKakaoTopupCheckout(); return; }
  var tier = planTiers[tierCode] || planTiers.standard;
  currentSelectedTier = tier.code;
  var dropdown = document.getElementById('planTierSelectDropdown');
  if (dropdown) dropdown.value = tier.code;
  var billing = getNext25thBillingDateInfo();
  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var upgrade = tier.rank > currentRank;
  var downgrade = tier.rank < currentRank;
  var immediate = upgrade && currentUpgradeApplyTiming === 'now';
  var deferred = downgrade || (upgrade && !immediate);
  var supply = tier.monthlyPrice;
  var vat = Math.round(supply * 0.1);
  var regularTotal = supply + vat;
  var amount = deferred ? 0 : regularTotal;

  var hasSub = hasActiveSubscription();
  var headingEl = document.getElementById('paymentPlanHeading');
  if (headingEl) {
    headingEl.textContent = hasSub ? '요금제 변경' : '정기결제 신청';
  }

  var note = '매월 25일에 다음 달 이용료를 결제합니다. 휴일이면 다음 평일에 결제됩니다.';
  var action = hasSub ? '정기결제 유지중' : '정기결제 신청';
  var status = hasSub ? '현재 이용 중' : '정기결제 신청';

  if (!hasSub) {
    note = '매월 25일에 다음 달 이용료가 결제됩니다. 등록 시 다음 달부터 정기 결제됩니다.';
    action = '정기결제 신청';
    status = '정기결제 신청';
  } else if (immediate) {
    var prorated = calculateUpgradeProratedDiff(tier);
    supply = prorated.proratedSupply;
    vat = prorated.proratedVat;
    amount = prorated.proratedTotal;
    note = '결제 후 즉시 적용 · 이번 달 남은 ' + prorated.remainDays + '일의 차액입니다.';
    action = Number(amount).toLocaleString() + '원 결제 후 적용';
    status = '즉시 변경';
  } else if (deferred) {
    note = '이번 달은 현재 요금제를 유지하고, 다음 달부터 변경합니다. 지금 추가 결제는 없습니다.';
    action = '다음 달 요금제 변경 신청';
    status = '다음 달 적용';
  }

  var setText = function(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
  var timing = document.getElementById('upgradeTimingOptionWrap');
  if (timing) timing.style.display = (hasSub && upgrade) ? 'block' : 'none';
  var cancel = document.getElementById('btnCancelAutoRenewAction');
  if (cancel) cancel.style.display = (hasSub && !upgrade && !downgrade) ? 'block' : 'none';
  setText('selectedPlanStatusChip', status);
  setText('planTierPolicyNoticeBox', note);
  setText('supplyPriceLabelText', immediate ? '이번 달 일할 차액' : '월 공급가액');
  setText('vatPriceLabelText', '부가세 (10%)');
  setText('periodPrice_monthly', Number(supply).toLocaleString() + '원');
  setText('pgMonthlyVatText', Number(vat).toLocaleString() + '원');
  var total = document.getElementById('periodVatPrice_monthly');
  if (total) total.innerHTML = '<span>' + (deferred || immediate ? '지금 결제할 금액' : '월 결제 금액') + ' <small>(부가세 포함)</small></span><strong>' + Number(amount).toLocaleString() + '원</strong>';
  setText('nextBillingDateSummaryText', billing.billingDateDot + ' · ' + Number(regularTotal).toLocaleString() + '원 / 월');
  var button = document.getElementById('btnPeriodSubmit_monthly');
  if (button) { button.className = 'payment-action'; button.textContent = action; }
}

// 우측 메인 액션 버튼 클릭 핸들러 (정기결제 신청 / 동일 요금제 결제 등록 / 다운그레이드 무결제 변경신청 / 업그레이드 즉시 일할결제 or 차월 무결제 변경신청)
function handlePlanPrimaryAction() {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var hasSub = hasActiveSubscription();

  // 정기결제를 아직 안 한 학원은 즉시 정기결제 신청 모달로 진입
  if (!hasSub) {
    openCheckoutModal('monthly');
    return;
  }

  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var targetRank = tier.rank;

  if (targetRank < currentRank) {
    submitPlanChangeWithoutPayment('downgrade');
    return;
  }
  if (targetRank > currentRank) {
    if (currentUpgradeApplyTiming === 'next_month') {
      submitPlanChangeWithoutPayment('upgrade_next_month');
    } else {
      openCheckoutModal('upgrade_now');
    }
    return;
  }
  openCheckoutModal('monthly');
}

// 추가 결제 없이 차월분 요금제 변경 신청만 완료하는 함수 (다운그레이드 / 업그레이드 '차월부터 적용')
function submitPlanChangeWithoutPayment(changeMode) {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;
  var isDowngrade = (changeMode === 'downgrade');
  var modeLabel = isDowngrade ? '다운그레이드' : '업그레이드 (차월부터 적용)';

  var confirmMsg = '[' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')] 요금제로 ' + modeLabel + ' 변경을 신청하시겠습니까?\n\n' +
    '• 적용 시점: 차월 사용분(' + billingInfo.nextMonthLabel + ')부터 적용\n' +
    '• 지금 결제 금액: 0원 (추가 결제 없음)\n' +
    '• 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일, 공휴일 시 다음 평일)\n' +
    '• 차월부터 결제될 정액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)';

  if (!confirm(confirmMsg)) return;

  currentAcademyPlan.reservedNextTier = tier.code;

  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : n; };
  var dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
                pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  var newId = 'CHG-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(100 + Math.random() * 900);

  academyPaymentList.unshift({
    id: newId,
    planType: tier.code + '_next_month',
    planName: '[' + tier.name + '] 차월 요금제 ' + (isDowngrade ? '다운그레이드' : '업그레이드') + ' 신청 (추가결제 없음)',
    supply: 0,
    vat: 0,
    total: 0,
    method: '변경 신청 완료 (차월 25일 ' + Number(regularTotal).toLocaleString() + '원 자동결제)',
    date: dateStr,
    startDate: billingInfo.nextMonthUsageStart,
    endDate: billingInfo.nextMonthUsageEnd,
    status: 'pending'
  });

  renderAcademyPaymentTable(academyPaymentList);
  syncCurrentAcademyPlan(false);

  showAcademyToast('📅 [' + tier.name + '] 차월 요금제 변경 신청이 추가 결제 없이 완료되었습니다. (' + billingInfo.billingDateDot + '부터 적용)');
  alert('✅ 요금제 변경 신청이 완료되었습니다!\n\n' +
        '· 신청 구분: ' + modeLabel + '\n' +
        '· 변경 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
        '· 지금 결제 금액: 0원 (추가 결제 없음)\n' +
        '· 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일)\n' +
        '· 차월 정액 결제액: ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n\n' +
        '이번 달은 기존 요금제가 유지되며, 차월 사용분부터 변경된 요금제로 자동 적용됩니다.');
}

var academyPaymentList = [
  {
    id: "PAY-20260820-001",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-08-20 10:15:22",
    startDate: "2026-08-20",
    endDate: "2026-09-19",
    status: "paid"
  },
  {
    id: "PAY-20260720-003",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-07-20 10:00:11",
    startDate: "2026-07-20",
    endDate: "2026-08-19",
    status: "paid"
  },
  {
    id: "PAY-20260620-002",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-06-20 10:00:05",
    startDate: "2026-06-20",
    endDate: "2026-07-19",
    status: "paid"
  }
];
if (window.NANO_SERVER_DATA) academyPaymentList = (window.NANO_SERVER_PAYMENTS || []).filter(function(item) { return item.academyId === currentAcademyInfo.id; });

// 결제번호 요약 표시 및 복사 헬퍼 함수
function formatPaymentIdSummary(id) {
  if (!id) return '-';
  var rawId = String(id).trim();

  // MANUAL-07d01661-6b73-4b30-b92e-00e799a9608b -> MANUAL-07d01661 (8자리 요약)
  // TOPUP-07d01661-6b73... -> TOPUP-07d01661
  var shortText = rawId;
  var isManual = rawId.startsWith('MANUAL-');
  var isTopup = rawId.startsWith('TOPUP-');

  if (isManual || isTopup) {
    var prefix = isManual ? 'MANUAL' : 'TOPUP';
    var uuidPart = rawId.replace(/^(MANUAL|TOPUP)-/, '');
    var shortHash = uuidPart.split('-')[0] || uuidPart.slice(0, 8);
    shortText = prefix + '-' + shortHash;
  } else if (rawId.length > 18) {
    shortText = rawId.slice(0, 14) + '…';
  }

  return '<span class="payment-code-pill" title="클릭하여 전체 결제번호 복사: ' + rawId + '" onclick="copyPaymentCodeToClipboard(\'' + rawId + '\', event)">' +
    '<i class="fa-regular fa-copy mr-1 text-muted"></i>' + shortText +
  '</span>';
}

function copyPaymentCodeToClipboard(code, event) {
  if (event) event.stopPropagation();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(function() {
      if (typeof showAcademyToast === 'function') {
        showAcademyToast('결제번호가 복사되었습니다: ' + code);
      } else {
        alert('결제번호가 복사되었습니다: ' + code);
      }
    }).catch(function() {
      prompt('결제번호 전체 복사:', code);
    });
  } else {
    prompt('결제번호 전체 복사:', code);
  }
}

// 결제 내역 렌더링
function renderAcademyPaymentTable(data) {
  var list = data || academyPaymentList;
  var tbody = document.getElementById('academyPaymentTableBody');
  if (!tbody) return;

  var countBadge = document.getElementById('academyPaymentCountBadge');
  if (countBadge) countBadge.innerText = '총 ' + list.length + '건';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">결제 내역이 존재하지 않습니다.</td></tr>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var statusBadge = '';
    if (item.status === 'paid') {
      statusBadge = '<span class="badge-soft badge-soft-success font-weight-bold"><i class="fa-solid fa-circle-check mr-1"></i>결제완료</span>';
    } else if (item.status === 'pending') {
      statusBadge = '<span class="badge-soft badge-soft-warn font-weight-bold"><i class="fa-solid fa-clock mr-1"></i>결제대기</span>';
    } else if (item.status === 'cancelled') {
      statusBadge = '<span class="badge-soft badge-soft-danger font-weight-bold"><i class="fa-solid fa-xmark mr-1"></i>결제취소</span>';
    } else {
      statusBadge = '<span class="badge-soft badge-soft-neutral">' + item.status + '</span>';
    }

    html += '<tr style="font-size:13px;">' +
      '<td>' + formatPaymentIdSummary(item.id) + '</td>' +
      '<td><span class="font-weight-bold" style="color:var(--text-main);">' + item.planName + '</span></td>' +
      '<td>' + Number(item.supply).toLocaleString() + '원</td>' +
      '<td>' + Number(item.vat).toLocaleString() + '원</td>' +
      '<td class="font-weight-bold" style="color:#1f8a7e; font-size:13.5px;">' + Number(item.total).toLocaleString() + '원</td>' +
      '<td><small class="text-muted"><i class="fa-solid fa-credit-card mr-1"></i>' + item.method + '</small></td>' +
      '<td><small class="text-muted">' + item.date + '</small></td>' +
      '<td><span class="badge badge-light border" style="font-size:11.5px;">' + item.startDate + ' ~ ' + item.endDate + '</span></td>' +
      '<td class="text-center">' + statusBadge + '</td>' +
      '<td class="text-center">' +
        (item.status === 'paid' 
          ? '<button type="button" class="btn btn-xs btn-outline-secondary" onclick="viewPaymentReceipt(\'' + item.id + '\')" style="border-radius:6px; font-size:11px; padding:3px 8px;"><i class="fa-solid fa-file-invoice mr-1"></i>영수증</button>' 
          : '<small class="text-muted">-</small>') +
      '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

// 결제 내역 상태 필터링
function filterAcademyPaymentTable() {
  var filterSelect = document.getElementById('filterPaymentStatus');
  var status = filterSelect ? filterSelect.value : 'ALL';

  if (status === 'ALL') {
    renderAcademyPaymentTable(academyPaymentList);
  } else {
    var filtered = academyPaymentList.filter(function(item) {
      return item.status === status;
    });
    renderAcademyPaymentTable(filtered);
  }
}

// ==============================================================
// 11. 정기 결제 자동 갱신 ON/OFF 및 구독 배너 제어
// ==============================================================
var isAutoRenewActive = true;

function toggleAutoRenew() {
  isAutoRenewActive = !isAutoRenewActive;
  updateAutoRenewUI();
  if (isAutoRenewActive) {
    showAcademyToast('정기 결제 자동 갱신이 활성화되었습니다. 만료일에 맞추어 자동으로 연장 결제됩니다.');
  } else {
    showAcademyToast('정기 결제 자동 갱신이 해제되었습니다. 만료일 전 수동 연장이 필요합니다.');
  }
}

function updateAutoRenewUI() {
  var hasSub = hasActiveSubscription();
  var headingEl = document.getElementById('paymentPlanHeading');
  if (headingEl) {
    headingEl.textContent = hasSub ? '요금제 변경' : '정기결제 신청';
  }

  var toggleContainer = document.getElementById('autoRenewToggleContainer');
  if (toggleContainer) {
    if (!hasSub) {
      toggleContainer.innerHTML = '<span class="badge badge-light border text-muted font-weight-normal" style="font-size:11px; padding:3px 7px;">정기결제 미신청</span>';
    } else if (isAutoRenewActive) {
      toggleContainer.innerHTML = '<button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="toggleAutoRenew()" style="border-radius:6px; padding:2px 8px;"><i class="fa-solid fa-toggle-on mr-1"></i>자동갱신 ON</button>';
    } else {
      toggleContainer.innerHTML = '<button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold" onclick="toggleAutoRenew()" style="border-radius:6px; padding:2px 8px;"><i class="fa-solid fa-toggle-off mr-1"></i>자동갱신 OFF</button>';
    }
  }

  var expDot = currentAcademyPlan.expiryDateDot || String(currentAcademyPlan.expiryDate || '2026-12-31').replace(/-/g, '.');
  var expDash = currentAcademyPlan.expiryDate || '2026-12-31';
  var ddayLabel = currentAcademyPlan.ddayText || ('D-' + currentAcademyPlan.daysRemaining);
  var remainDays = currentAcademyPlan.daysRemaining || 0;

  // 사이드바 뱃지 업데이트
  var navPaymentBadge = document.querySelector('#btn-nav-payment .badge');
  if (navPaymentBadge) {
    if (hasSub && isAutoRenewActive) {
      navPaymentBadge.className = 'badge badge-success text-white ml-1';
      navPaymentBadge.style.background = '#16a34a';
      navPaymentBadge.innerText = '구독중';
    } else if (hasSub && !isAutoRenewActive) {
      navPaymentBadge.className = 'badge badge-danger text-white ml-1';
      navPaymentBadge.style.background = '#dc2626';
      navPaymentBadge.innerText = ddayLabel;
    } else {
      navPaymentBadge.className = 'badge badge-secondary text-white ml-1';
      navPaymentBadge.style.background = '#64748b';
      navPaymentBadge.innerText = '미구독';
    }
  }

  // 상단 만료 안내 배너 업데이트 (우측 결제 내역 관리 버튼은 표시하지 않음)
  var banner = document.getElementById('paymentExpireAlertBanner');
  var iconWrap = document.getElementById('paymentAlertIconWrap');
  var titleEl = document.getElementById('paymentAlertTitle');
  var descEl = document.getElementById('paymentAlertDesc');
  var btnWrap = document.getElementById('paymentAlertBtnWrap');
  var cancelActionBtn = document.getElementById('btnCancelAutoRenewAction');

  if (btnWrap) btnWrap.innerHTML = '';
  if (cancelActionBtn) {
    if (!hasSub) {
      cancelActionBtn.style.display = 'none';
    } else if (isAutoRenewActive) {
      cancelActionBtn.style.display = 'block';
      cancelActionBtn.className = 'payment-secondary';
      cancelActionBtn.textContent = '자동갱신 해지';
    } else {
      cancelActionBtn.style.display = 'block';
      cancelActionBtn.className = 'payment-secondary';
      cancelActionBtn.textContent = '자동갱신 다시 켜기';
    }
  }

  if (!banner || !titleEl || !descEl) return;

  if (isAutoRenewActive) {
    banner.style.display = 'flex';
    banner.style.background = '#f0fdf4';
    banner.style.borderColor = '#bbf7d0';
    banner.style.color = '#166534';
    if (iconWrap) {
      iconWrap.style.background = '#dcfce7';
      iconWrap.style.color = '#16a34a';
      iconWrap.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-success mr-2" style="font-size:11.5px; padding:4px 8px; background:#16a34a;">정기 구독 이용 중</span> 정기 결제 구독 중 <strong style="color:#15803d;">(자동 갱신 ON)</strong> - ' + remainDays + '일 후(' + expDot + ') 자동 갱신 결제됩니다.';
    descEl.innerText = '등록된 결제 수단으로 만료일에 맞춰 자동 연장되며, 자동갱신을 취소하거나 본사에서 해지 처리하면 자동결제가 종료됩니다.';
  } else {
    banner.style.display = 'flex';
    banner.style.background = '#fff7ed';
    banner.style.borderColor = '#fed7aa';
    banner.style.color = '#9a3412';
    if (iconWrap) {
      iconWrap.style.background = '#ffedd5';
      iconWrap.style.color = '#ea580c';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-danger mr-2" style="font-size:11.5px; padding:4px 8px;">자동갱신 해지됨</span> 정기 자동결제가 종료 예정입니다. 만료일(' + expDash + ', ' + ddayLabel + ')까지 이용 후 자동결제가 종료됩니다.';
    descEl.innerText = '원장님 또는 본사 요청으로 자동 갱신이 해제되었습니다. 계속 이용하시려면 자동갱신을 다시 켜거나 카드를 재등록해 주세요.';
  }
}

// 만료 알림 상태 시뮬레이션 (D-3 / D-7 / normal)
function setExpireAlert(type) {
  var banner = document.getElementById('paymentExpireAlertBanner');
  var iconWrap = document.getElementById('paymentAlertIconWrap');
  var titleEl = document.getElementById('paymentAlertTitle');
  var descEl = document.getElementById('paymentAlertDesc');
  var btnWrap = document.getElementById('paymentAlertBtnWrap');
  if (!banner || !titleEl || !descEl) return;

  var expDash = currentAcademyPlan.expiryDate || '2026-12-31';

  if (type === 'd3') {
    isAutoRenewActive = false;
    banner.style.display = 'flex';
    banner.style.background = '#fff7ed';
    banner.style.borderColor = '#fed7aa';
    banner.style.color = '#9a3412';
    if (iconWrap) {
      iconWrap.style.background = '#ffedd5';
      iconWrap.style.color = '#ea580c';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-danger mr-2" style="font-size:11.5px; padding:4px 8px;">D-3 만료 임박</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#c2410c;">3일 후</strong> 만료됩니다! (만료 예정일: ' + expDash + ')';
    descEl.innerText = '자동 갱신이 해제되어 있습니다. 원활한 원생 학습 및 북퀴즈 서비스를 위해 이용권을 미리 연장해 주세요.';
    if (btnWrap) {
      btnWrap.innerHTML = '<button type="button" class="btn btn-sm btn-danger px-3 py-2 font-weight-bold" onclick="scrollToPlans()" style="border-radius:10px; white-space:nowrap; box-shadow:0 2px 8px rgba(220,53,69,0.3);"><i class="fa-solid fa-bolt mr-1"></i>지금 바로 연장하기</button>';
    }
    showAcademyToast('만료 3일 전(D-3) 알림 상태로 시뮬레이션 전환되었습니다.');
  } else if (type === 'd7') {
    isAutoRenewActive = false;
    banner.style.display = 'flex';
    banner.style.background = '#fefce8';
    banner.style.borderColor = '#fef08a';
    banner.style.color = '#854d0e';
    if (iconWrap) {
      iconWrap.style.background = '#fef9c3';
      iconWrap.style.color = '#ca8a04';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-warning text-dark mr-2" style="font-size:11.5px; padding:4px 8px;">D-7 만료 사전 안내</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#a16207;">7일 후</strong> 만료됩니다. (만료 예정일: ' + expDash + ')';
    descEl.innerText = '학원 정기 구독 갱신 안내 알림톡이 발송되었습니다. 미리 이용권을 연장하시면 기존 커리큘럼 및 원생 포트폴리오가 끊김 없이 보존됩니다.';
    if (btnWrap) {
      btnWrap.innerHTML = '<button type="button" class="btn btn-sm btn-warning text-dark px-3 py-2 font-weight-bold" onclick="scrollToPlans()" style="border-radius:10px; white-space:nowrap;"><i class="fa-solid fa-bolt mr-1"></i>이용권 미리 연장</button>';
    }
    showAcademyToast('만료 7일 전(D-7) 사전 안내 상태로 시뮬레이션 전환되었습니다.');
  } else {
    isAutoRenewActive = true;
    updateAutoRenewUI();
    showAcademyToast('정상 정기구독(자동 갱신 ON) 상태로 전환되었습니다.');
  }
}

// 요금제 섹션으로 부드럽게 스크롤
function scrollToPlans() {
  var el = document.getElementById('sectionPaymentPlans');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// 결제 내역 섹션으로 부드럽게 스크롤
function scrollToPaymentHistory() {
  var el = document.getElementById('sectionPaymentHistory');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// 결제 신청 모달 열기 (카카오톡 1회성 충전 결제 / 업그레이드 즉시 적용 일할 차액 결제 / 차월 사용분 정기결제 등록 분기)
function openCheckoutModal(modeCode) {
  currentCheckoutMode = modeCode || 'monthly';
  var isKakao = (currentCheckoutMode === 'kakao');
  var isUpgradeNow = (currentCheckoutMode === 'upgrade_now');

  var modalTitleEl = document.getElementById('checkoutModalTitle');
  var modalAcadEl = document.getElementById('checkoutModalAcademyName');
  var kcpGuideTitle = document.getElementById('checkoutKcpGuideTitle');
  var kcpGuideDesc = document.getElementById('checkoutKcpGuideDesc');
  var kcpStep3 = document.getElementById('checkoutKcpStep3Label');
  var badgeEl = document.getElementById('checkoutPlanBadge');
  var typeBadgeEl = document.getElementById('checkoutChangeTypeBadge');
  var policyDescEl = document.getElementById('checkoutChangePolicyDesc');
  var supplyEl = document.getElementById('checkoutPlanSupply');
  var vatEl = document.getElementById('checkoutPlanVat');
  var totalEl = document.getElementById('checkoutPlanTotal');
  var submitBtnTextEl = document.getElementById('btnSubmitPaymentText');

  if (modalAcadEl && typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo) {
    var cleanDir = String(currentAcademyInfo.director || '').replace(/\s*원장님?$/, '');
    modalAcadEl.innerText = (currentAcademyInfo.name || '가맹 학원') + (cleanDir ? ' (원장: ' + cleanDir + ')' : '');
  }

  // [A] 카카오톡 알림 (1회성 충전 구매)
  if (isKakao) {
    var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
    var kakaoSupply = qty * 5000;
    var kakaoVat = qty * 500;
    var kakaoTotal = qty * 5500;
    var approxCount = Math.floor(kakaoTotal / 8.5); // 5,500원 결제 시 5,500원 전액 충전

    if (modalTitleEl) modalTitleEl.innerText = 'NHN KCP 카카오톡 알림 1회성 충전';
    if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-comment-sms mr-1 text-primary"></i>NHN KCP 1회성 단건 결제 (비구독형 선불 충전)';
    if (kcpGuideDesc) kcpGuideDesc.innerHTML = '카카오톡 알림 충전은 <strong>정기구독(매월 25일 자동결제) 상품이 아닌 1회성 구매 상품</strong>입니다. 결제 즉시 <strong>' + Number(kakaoTotal).toLocaleString() + '원</strong>이 학원 알림톡 지갑에 전액 충전 적립됩니다.';
    if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>알림톡 잔액 즉시 적립';
    if (badgeEl) badgeEl.innerText = '카카오톡 알림 · ' + qty + '단위 (1회성 충전)';
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-warn font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-coins mr-1"></i>1회성 선불 충전 (자동결제 없음)';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML =
        '<div class="font-weight-bold mb-1" style="color: #b45309;"><i class="fa-solid fa-circle-check mr-1"></i>1회성 알림톡 충전 조건</div>' +
        '• 결제 금액 <strong>' + Number(kakaoTotal).toLocaleString() + '원(VAT 포함)</strong> 전액이 충전금으로 적립됩니다.<br>' +
        '• 약 <strong>' + Number(approxCount).toLocaleString() + '건</strong> 발송 가능하며(건당 8.5원), 잔액 소진 시까지 만료 기한 없이 유지됩니다.';
    }
    if (supplyEl) supplyEl.innerText = Number(kakaoTotal).toLocaleString() + '원 (충전 금액)';
    if (vatEl) vatEl.innerText = Number(kakaoSupply).toLocaleString() + '원 / ' + Number(kakaoVat).toLocaleString() + '원 (공급가/부가세)';
    if (totalEl) totalEl.innerText = Number(kakaoTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = Number(kakaoTotal).toLocaleString() + '원 충전 결제하기';

    selectPayMethod('신용카드');
    $('#paymentCheckoutModal').modal('show');
    return;
  }

  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var nextBillingDot = billingInfo.billingDateDot;
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;
  var hasSub = hasActiveSubscription();

  // [B] 업그레이드 — 지금 바로 적용 (이번 달 남은 일수에 대한 일할 차액 결제 + 차월 25일부터 업그레이드 정액 결제)
  if (isUpgradeNow) {
    var prorated = calculateUpgradeProratedDiff(tier);

    if (modalTitleEl) modalTitleEl.innerText = 'NHN KCP 요금제 즉시 업그레이드 (일할 차액 결제)';
    if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-bolt mr-1 text-danger"></i>이번 달 잔여 일수 일할 차액 결제 및 차월 정액결제 안내';
    if (kcpGuideDesc) {
      kcpGuideDesc.innerHTML =
        '이번 달 남은 <strong>' + prorated.remainDays + '일분 차액(' + Number(prorated.proratedTotal).toLocaleString() + '원, VAT 포함)</strong>을 지금 결제하면 즉시 <strong>' + tier.name + '(' + tier.slots + '명)</strong>으로 상향 적용되며, 차월 정기결제일(<strong>' + nextBillingDot + '</strong>, 매월 25일)부터는 <strong>월 ' + Number(regularTotal).toLocaleString() + '원</strong>이 정액 결제됩니다.';
    }
    if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>즉시 상향 & 차월 정액 등록';
    if (badgeEl) badgeEl.innerText = tier.name + ' (' + tier.slots + '명) · 즉시 업그레이드';
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-danger font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-bolt mr-1"></i>당월 잔여 ' + prorated.remainDays + '일 일할 차액 결제';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML =
        '<div class="text-danger font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>업그레이드 즉시 적용 및 차월 정액결제 조건</div>' +
        '• <strong>당월 일할 차액</strong>: 월 공급가 차액(' + Number(prorated.monthlySupplyDiff).toLocaleString() + '원) × 남은 ' + prorated.remainDays + '일 / 당월 ' + prorated.totalDays + '일 = <strong>' + Number(prorated.proratedSupply).toLocaleString() + '원</strong> (+ 부가세 ' + Number(prorated.proratedVat).toLocaleString() + '원)<br>' +
        '• <strong>즉시 적용</strong>: 결제 즉시 가맹 원생 정원이 <strong>' + currentAcademyPlan.slots + '명 ➔ ' + tier.slots + '명</strong>으로 상향 적용됩니다.<br>' +
        '• <strong>차월 정액 결제</strong>: 차월 정기결제일(<strong>' + nextBillingDot + '</strong>, 매월 25일·공휴일 시 다음 평일)부터 업그레이드된 요금제 정액 <strong>' + Number(regularTotal).toLocaleString() + '원(VAT 포함)</strong>으로 자동 결제됩니다.';
    }
    if (supplyEl) supplyEl.innerText = Number(prorated.proratedSupply).toLocaleString() + '원 (당월 ' + prorated.remainDays + '일 일할 차액)';
    if (vatEl) vatEl.innerText = Number(prorated.proratedVat).toLocaleString() + '원';
    if (totalEl) totalEl.innerText = Number(prorated.proratedTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = '일할 차액 ' + Number(prorated.proratedTotal).toLocaleString() + '원 결제 및 즉시 적용';

    selectPayMethod('신용카드');
    $('#paymentCheckoutModal').modal('show');
    return;
  }

  // [C] 차월 사용분 정기결제 등록 / 신규 정기결제 신청 (매월 25일 자동결제)
  currentSelectedPeriod = 'monthly';

  if (modalTitleEl) modalTitleEl.innerText = hasSub ? 'NHN KCP 차월 사용분 정기결제 등록' : 'NHN KCP 차월 사용분 정기결제 신청';
  if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-shield-halved mr-1 text-primary"></i>NHN KCP 정기결제 ' + (hasSub ? '등록' : '신청') + ' (매월 25일 차월분 자동결제)';
  if (kcpGuideDesc) {
    kcpGuideDesc.innerHTML =
      '사용자가 결제하는 금액은 <strong>차월 사용분(' + billingInfo.nextMonthLabel + ')</strong>에 대한 금액입니다. 정기 자동결제는 항상 <strong>매월 25일(공휴일·주말인 경우 다음 평일)</strong>에 이루어지며, 학원 또는 본사에서 취소 시 자동결제가 종료됩니다.';
  }
  if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>매월 25일 정기결제 ' + (hasSub ? '등록' : '신청');

  var displayBadge = tier.name + ' (' + tier.slots + '명) · 차월분 정기결제 ' + (hasSub ? '등록' : '신청');
  if (badgeEl) badgeEl.innerText = displayBadge;

  if (typeBadgeEl) {
    typeBadgeEl.className = 'badge-soft badge-soft-success font-weight-bold';
    typeBadgeEl.innerHTML = '<i class="fa-solid fa-arrows-rotate mr-1"></i>차월 사용분 정기결제 (매월 25일)';
  }
  if (policyDescEl) {
    policyDescEl.innerHTML =
      '<div class="text-success font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>차월 사용분 정기결제 안내</div>' +
      '• <strong>적용 대상 기간</strong>: 차월 사용분 (' + billingInfo.nextMonthUsageStart.replace(/-/g, '.') + ' ~ ' + billingInfo.nextMonthUsageEnd.replace(/-/g, '.') + ')<br>' +
      '• <strong>정기 자동결제일</strong>: 매월 25일 (공휴일·주말인 경우 다음 평일, 차기 예정일: <strong>' + nextBillingDot + '</strong>)<br>' +
      '• 원장님 또는 본사에서 자동갱신을 취소하면 다음 결제일부터 자동결제가 즉시 종료됩니다.';
  }

  if (supplyEl) supplyEl.innerText = Number(regularSupply).toLocaleString() + '원';
  if (vatEl) vatEl.innerText = Number(regularVat).toLocaleString() + '원';
  if (totalEl) totalEl.innerText = Number(regularTotal).toLocaleString() + '원';
  if (submitBtnTextEl) submitBtnTextEl.innerText = Number(regularTotal).toLocaleString() + '원 정기결제 ' + (hasSub ? '등록하기' : '신청하기');

  selectPayMethod('신용카드');
  $('#paymentCheckoutModal').modal('show');
}

// 결제 수단 선택
function selectPayMethod(method) {
  currentSelectedPayMethod = method;
  var labels = ['Card', 'Bank', 'VBank'];
  labels.forEach(function(l) {
    var el = document.getElementById('labelPayMethod' + l);
    if (el) el.classList.remove('active');
  });

  if (method === '신용카드') {
    var el = document.getElementById('labelPayMethodCard');
    if (el) el.classList.add('active');
  } else if (method === '실시간 계좌이체') {
    var el = document.getElementById('labelPayMethodBank');
    if (el) el.classList.add('active');
  } else {
    var el = document.getElementById('labelPayMethodVBank');
    if (el) el.classList.add('active');
  }
}

// 결제 신청 제출 (카카오톡 1회성 충전 / 업그레이드 당월 일할 차액 결제 / 차월 사용분 정기결제 등록)
async function submitSimulatedPayment() {
  var agree = document.getElementById('checkoutAgreeTerms');
  if (agree && !agree.checked) {
    alert('이용약관 및 결제 취소/환불 규정에 동의하셔야 결제 신청이 가능합니다.');
    return;
  }

  // [A] 카카오톡 알림 1회성 충전 결제 처리
  if (currentCheckoutMode === 'kakao') {
    var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
    var kakaoSupply = qty * 5000;
    var kakaoVat = qty * 500;
    var kakaoTotal = qty * 5500;

    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.api('/api/billing', {
          operation: 'topup',
          amount: kakaoTotal,
          requestId: crypto.randomUUID()
        }, 45000);
        $('#paymentCheckoutModal').modal('hide');
        if (window.NanoBilling && typeof NanoBilling.load === 'function') {
          await NanoBilling.load();
        }
        showAcademyToast('카카오톡 알림 ' + qty + '단위(' + Number(kakaoTotal).toLocaleString() + '원) 충전 신청이 접수되었습니다.');
      } catch (e) {
        showAcademyToast(e.message || '충전 신청 중 오류가 발생했습니다.');
      }
      return;
    }

    var nowK = new Date();
    var padK = function(n) { return n < 10 ? '0' + n : n; };
    var dateStrK = nowK.getFullYear() + '-' + padK(nowK.getMonth() + 1) + '-' + padK(nowK.getDate()) + ' ' +
                   padK(nowK.getHours()) + ':' + padK(nowK.getMinutes()) + ':' + padK(nowK.getSeconds());
    var newKakaoId = 'PAY-' + nowK.getFullYear() + padK(nowK.getMonth() + 1) + padK(nowK.getDate()) + '-' + Math.floor(100 + Math.random() * 900);
    academyPaymentList.unshift({
      id: newKakaoId,
      planType: 'kakao',
      planName: '카카오톡 알림 충전 (' + qty + '단위 · 1회성)',
      supply: kakaoSupply,
      vat: kakaoVat,
      total: kakaoTotal,
      method: currentSelectedPayMethod + ' (NHN KCP 1회성 결제)',
      date: dateStrK,
      startDate: '—',
      endDate: '소진 시까지',
      status: 'paid'
    });
    renderAcademyPaymentTable(academyPaymentList);
    $('#paymentCheckoutModal').modal('hide');
    showAcademyToast('💬 카카오톡 알림 ' + Number(kakaoSupply).toLocaleString() + '원이 1회성 충전되었습니다.');
    return;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    $('#paymentCheckoutModal').modal('hide');
    showAcademyToast('NHN KCP 정기결제 가맹점 심사 완료 후 실시간 카드 빌링 결제가 연결됩니다.');
    return;
  }

  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;

  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : n; };
  var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var dateStr = todayStr + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  var newId = 'PAY-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(100 + Math.random() * 900);

  // [B] 업그레이드 — 지금 바로 적용 (당월 남은 일수 일할 차액 결제 + 즉시 요금제 적용 + 차월부터 업그레이드 요금제 정액 결제)
  if (currentCheckoutMode === 'upgrade_now') {
    var prorated = calculateUpgradeProratedDiff(tier);

    var newPayment = {
      id: newId,
      planType: tier.code + '_upgrade_prorated',
      planName: '[' + tier.name + ' ' + tier.slots + '명] 즉시 업그레이드 (당월 잔여 ' + prorated.remainDays + '일 일할 차액)',
      supply: prorated.proratedSupply,
      vat: prorated.proratedVat,
      total: prorated.proratedTotal,
      method: currentSelectedPayMethod + ' (즉시 적용 · 차월 25일 정액결제)',
      date: dateStr,
      startDate: todayStr,
      endDate: billingInfo.thisMonthEndStr,
      status: 'paid'
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    // 학원 현재 요금제 및 슬롯 즉시 상향 적용
    delete currentAcademyPlan.reservedNextTier;
    currentAcademyInfo.maxStudents = tier.slots === '협의' ? 150 : tier.slots;
    currentAcademyInfo.plan = tier.code === 'vip' ? 'VIP' : (tier.code === 'premium' ? 'Premium' : (tier.code === 'basic' ? 'Basic' : 'Standard'));
    currentAcademyInfo.monthlyFee = regularTotal + '원';
    updateAllStudentCounts();
    syncCurrentAcademyPlan(true);

    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('🎉 [' + tier.name + '] 즉시 적용 완료! 당월 일할 차액(' + Number(prorated.proratedTotal).toLocaleString() + '원)이 결제되었습니다.');
    alert('⚡ 요금제 즉시 업그레이드 완료!\n\n' +
          '· 변경 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
          '· 당월 일할 차액 결제액: ' + Number(prorated.proratedTotal).toLocaleString() + '원 (이번 달 남은 ' + prorated.remainDays + '일분, VAT 포함)\n' +
          '· 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일, 공휴일 시 다음 평일)\n' +
          '· 차월부터 정액 결제될 금액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n\n' +
          '지금 바로 업그레이드된 요금제가 적용되었으며, 차월부터는 업그레이드된 요금제로 정액 결제됩니다.');
  } else {
    // [C] 차월 사용분 정기결제 등록 / 신청 (매월 25일 자동결제)
    var hadSubBefore = hasActiveSubscription();
    var actionWord = hadSubBefore ? '등록' : '신청';
    var newPayment = {
      id: newId,
      planType: tier.code + '_monthly',
      planName: '[' + tier.name + '] 차월 사용분(' + billingInfo.nextMonthLabel + ') 정기결제 ' + actionWord,
      supply: regularSupply,
      vat: regularVat,
      total: regularTotal,
      method: currentSelectedPayMethod + ' (매월 25일 정기결제)',
      date: dateStr,
      startDate: billingInfo.nextMonthUsageStart,
      endDate: billingInfo.nextMonthUsageEnd,
      status: 'paid'
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    if (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo) {
      currentAcademyInfo.hasSubscription = true;
      currentAcademyInfo.subscriptionStatus = 'active';
    }
    isAutoRenewActive = true;
    updateAutoRenewUI();
    selectPlanTier(currentSelectedTier);

    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('✅ [' + tier.name + '] 차월 사용분 정기결제 ' + actionWord + '이 완료되었습니다.');
    alert('✅ 차월 사용분 정기결제 ' + actionWord + ' 완료!\n\n' +
          '· ' + actionWord + ' 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
          '· 적용 대상: 차월 사용분 (' + billingInfo.nextMonthUsageStart + ' ~ ' + billingInfo.nextMonthUsageEnd + ')\n' +
          '· 정기 결제 금액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n' +
          '· 정기 결제일: 매월 25일 (공휴일 시 다음 평일, 예정일: ' + billingInfo.billingDateStr + ')');
  }

  // 결제 내역으로 스크롤 이동
  setTimeout(function() {
    scrollToPaymentHistory();
  }, 300);
}

// 영수증 모의 팝업
function viewPaymentReceipt(payId) {
  var item = academyPaymentList.find(function(p) { return p.id === payId; });
  if (!item) return;

  var acadDisplay = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name + (currentAcademyInfo.director ? ' (대표: ' + String(currentAcademyInfo.director).replace(/\s*원장님?$/, '') + ')' : '')
    : '나노 독서아카데미 본원';

  alert('🧾 [전자 결제 영수증 / 매출전표]\n\n' +
        '· 승인번호: ' + item.id + '\n' +
        '· 학원명: ' + acadDisplay + '\n' +
        '· 결제일시: ' + item.date + '\n' +
        '· 상품명: ' + item.planName + '\n' +
        '· 공급가액: ' + Number(item.supply).toLocaleString() + '원\n' +
        '· 부가가치세: ' + Number(item.vat).toLocaleString() + '원\n' +
        '· 합계금액: ' + Number(item.total).toLocaleString() + '원\n' +
        '· 결제수단: ' + item.method + '\n' +
        '· 결제상태: 정상 승인 (VAT 매입세액공제 가능)');
}

// 이용약관(환불·취소 규정 포함) · 개인정보처리방침 모달 열기 및 탭 전환
function switchAdminLegalTab(tabKey) {
  var validKey = (tabKey === 'privacy') ? 'privacy' : 'terms';
  ['terms', 'privacy'].forEach(function(k) {
    var btn = document.getElementById('btnAdminLegalTab_' + k);
    var sec = document.getElementById('adminLegalSection_' + k);
    if (btn) {
      if (k === validKey) {
        btn.style.background = 'var(--btn-primary)';
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid var(--btn-primary)';
      } else {
        btn.style.background = '#ffffff';
        btn.style.color = 'var(--text-main)';
        btn.style.border = '1px solid var(--border-medium)';
      }
    }
    if (sec) {
      sec.style.display = (k === validKey) ? 'block' : 'none';
    }
  });
}

function openNanoLegalModal(tabKey) {
  switchAdminLegalTab(tabKey || 'terms');
  if (typeof $ !== 'undefined' && $('#adminLegalPolicyModal').length) {
    $('#adminLegalPolicyModal').modal('show');
  }
}
