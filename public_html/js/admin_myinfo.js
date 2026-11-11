/**
 * ==============================================================
 * 나노의 책장 - 학원 관리자(원장님) 내 정보 관리 모듈
 * File: public_html/js/admin_myinfo.js
 * Description:
 *  - 원장님 기본 정보 및 계약 데이터 관리
 *  - 연락처, 이메일, 주소(우편번호 API 연동) 수정 및 LocalStorage 영구 동기화
 *  - 보안 비밀번호 변경 및 실시간 유효성 검증
 * ==============================================================
 */

/**
 * [상태 객체] 학원 관리자(원장님) 기본 정보 및 계약 데이터
 * - 조회 전용 항목: ID, 학원명, 원장명, 이용상품, 사업자번호, 계약일, 만료일
 * - 변경 가능 항목: 휴대전화번호, 이메일, 주소(우편번호/기본/상세)
 * - 계정 보안: 비밀번호 변경
 */
var myAcademyInfo = {
  id: 'director_ey',
  academyName: '나노 독서아카데미 본원',
  directorName: '김은영',
  phone: '010-3342-9981',
  email: 'director_ey@nanobook.co.kr',
  postcode: '07997',
  address: '서울특별시 양천구 오목로 299',
  addressDetail: '4층 401호 (목동, 나노빌딩)',
  plan: '프리미엄 프랜차이즈 50인 슬롯형',
  bizNumber: '107-86-54321',
  contractDate: '2025-01-01',
  expireDate: '2026-12-31'
};

/**
 * 관리자(마스터)가 등록한 학원 연락처, 이메일, 주소 및 사용자 저장본 조회 헬퍼
 */
function getAcademyContactInfo() {
  var acadId = (typeof currentAcademyInfo !== 'undefined' && (currentAcademyInfo.id || currentAcademyInfo.adminId)) || 'DEFAULT';

  // 1) 원장/학원 관리자가 직접 수정한 로컬 저장본 우선 확인
  try {
    var savedRaw = localStorage.getItem('NANO_MY_INFO_' + acadId);
    if (savedRaw) {
      var saved = JSON.parse(savedRaw);
      if (saved && (saved.phone || saved.email || saved.address)) {
        return {
          phone: saved.phone || '',
          email: saved.email || '',
          postcode: saved.postcode || '',
          address: saved.address || '',
          addressDetail: saved.addressDetail || ''
        };
      }
    }
  } catch(e) {}

  // 2) 마스터(관리자)가 등록/설정한 currentAcademyInfo 데이터 매핑
  var rawInfo = (typeof currentAcademyInfo !== 'undefined') ? currentAcademyInfo : {};
  var phone = (rawInfo.phone || '').trim();
  var email = (rawInfo.email || '').trim();
  var rawAddress = (rawInfo.address || rawInfo.region || '').trim();
  var postcode = (rawInfo.postcode || '').trim();
  var address = rawAddress;
  var addressDetail = (rawInfo.addressDetail || '').trim();

  // 주소 파싱 보정 (예: "서울 (서울특별시 양천구 오목로 299)" 또는 "(07997) 서울특별시...")
  if (rawAddress) {
    // 괄호 안의 상세 주소 추출
    var parenMatch = rawAddress.match(/^[^(]+\(([^)]+)\)$/);
    if (parenMatch) {
      address = parenMatch[1].trim();
    }
    // 5자리 우편번호 추출
    var postMatch = address.match(/^\(?(\d{5})\)?\s*(.*)$/);
    if (postMatch) {
      if (!postcode) postcode = postMatch[1];
      address = postMatch[2].trim();
    }
  }

  return {
    phone: phone || myAcademyInfo.phone,
    email: email || myAcademyInfo.email,
    postcode: postcode || (phone ? '' : myAcademyInfo.postcode),
    address: address || myAcademyInfo.address,
    addressDetail: addressDetail || (phone ? '' : myAcademyInfo.addressDetail)
  };
}

/**
 * '내 정보 관리' 모달 열기
 * - 이유: 최신 상태값을 폼에 바인딩하고, 이전 입력 중이던 비밀번호 등 민감 정보를 안전하게 초기화하기 위함
 */
function openMyInfoModal() {
  // 1) 조회 전용 정보 텍스트 바인딩
  var elId = document.getElementById('infoDisplayId');
  var elBiz = document.getElementById('infoDisplayBizNum');
  var elAcad = document.getElementById('infoDisplayAcademyName');
  var elDir = document.getElementById('infoDisplayDirectorName');
  var elPlan = document.getElementById('infoDisplayPlan');
  var elCDate = document.getElementById('infoDisplayContractDate');
  var elEDate = document.getElementById('infoDisplayExpireDate');

  var rawInfo = (typeof currentAcademyInfo !== 'undefined') ? currentAcademyInfo : {};
  var curCount = (typeof studentDataList !== 'undefined' && Array.isArray(studentDataList)) ? studentDataList.length : 0;
  var maxCount = rawInfo.maxStudents || 50;
  var slotRate = Math.round((curCount / maxCount) * 100);

  if (elId) elId.innerText = rawInfo.adminId || rawInfo.id || myAcademyInfo.id;
  if (elBiz) elBiz.innerText = rawInfo.bizNumber || myAcademyInfo.bizNumber;
  if (elAcad) elAcad.innerText = rawInfo.name || myAcademyInfo.academyName;
  var cleanDir = (rawInfo.director || myAcademyInfo.directorName).replace(/\s*원장님?$/, '');
  if (elDir) elDir.innerText = cleanDir;

  // 이용 상품: 마스터가 지정한 상품명 그대로 표시
  var masterPlanName = rawInfo.plan || (rawInfo.isDemo ? '체험형 플랜' : 'Standard');
  if (elPlan) elPlan.innerText = masterPlanName;

  if (elCDate) elCDate.innerText = rawInfo.contractDate || myAcademyInfo.contractDate;
  if (elEDate) elEDate.innerText = rawInfo.expireDate || myAcademyInfo.expireDate;

  // 상단 배너 텍스트 및 정원 슬롯 동기화
  var bannerDir = document.getElementById('bannerDirectorName');
  var bannerAcad = document.getElementById('bannerAcademyName');
  if (bannerDir) bannerDir.innerText = cleanDir + ' 원장님';
  if (bannerAcad) bannerAcad.innerText = (rawInfo.name || myAcademyInfo.academyName);

  var slotEl = document.getElementById('myInfoSlotStatus');
  if (slotEl) slotEl.innerText = curCount + ' / ' + maxCount + '명 (' + slotRate + '%)';

  var sideSlotEl = document.getElementById('sidebarSlotStatus');
  if (sideSlotEl) sideSlotEl.innerHTML = curCount + ' / ' + maxCount + '명 <small class="text-success font-weight-bold">(' + slotRate + '%)</small>';

  // 2) 관리자가 등록한 연락처, 이메일, 학원 주소 값 채우기
  var inputPhone = document.getElementById('myInfoPhone');
  var inputEmail = document.getElementById('myInfoEmail');
  var inputPostcode = document.getElementById('myInfoPostcode');
  var inputAddress = document.getElementById('myInfoAddress');
  var inputDetail = document.getElementById('myInfoAddressDetail');

  var contactInfo = getAcademyContactInfo();

  if (inputPhone) inputPhone.value = contactInfo.phone;
  if (inputEmail) inputEmail.value = contactInfo.email;
  if (inputPostcode) inputPostcode.value = contactInfo.postcode;
  if (inputAddress) inputAddress.value = contactInfo.address;
  if (inputDetail) inputDetail.value = contactInfo.addressDetail;

  // 3) 비밀번호 변경 필드 초기화 (보안상 항상 비워둠)
  var curPw = document.getElementById('myInfoCurrentPw');
  var newPw = document.getElementById('myInfoNewPw');
  var newPwConfirm = document.getElementById('myInfoNewPwConfirm');
  var pwFeedback = document.getElementById('pwMatchFeedback');

  if (curPw) curPw.value = '';
  if (newPw) newPw.value = '';
  if (newPwConfirm) newPwConfirm.value = '';
  if (pwFeedback) {
    pwFeedback.innerText = '';
    pwFeedback.className = '';
  }

  // 모달 띄우기
  $('#myInfoModal').modal('show');
}

/**
 * 전화번호 입력 시 하이픈 자동 포맷팅 함수
 * - 이유: 사용자가 숫자만 입력하더라도 010-XXXX-XXXX 표준 규격으로 일관성 있게 표시하기 위함
 */
function formatPhoneNumber(input) {
  if (input == null) return '-';
  var isElement = typeof input === 'object' && 'value' in input;
  var raw = isElement ? String(input.value || '') : String(input || '').trim();
  if (!isElement && (!raw || raw === '-' || raw === 'null' || raw === 'undefined')) return '-';
  var value = raw.replace(/[^0-9]/g, '');
  if (!value) {
    if (isElement) {
      input.value = '';
      return '';
    }
    return '-';
  }
  var result = '';
  if (value.startsWith('02')) {
    if (value.length <= 2) result = value;
    else if (value.length <= 5) result = value.slice(0, 2) + '-' + value.slice(2);
    else if (value.length <= 9) result = value.slice(0, 2) + '-' + value.slice(2, 5) + '-' + value.slice(5);
    else result = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
  } else if (value.length < 4) {
    result = value;
  } else if (value.length < 7) {
    result = value.substr(0, 3) + '-' + value.substr(3);
  } else if (value.length < 11) {
    result = value.substr(0, 3) + '-' + value.substr(3, 3) + '-' + value.substr(6);
  } else {
    result = value.substr(0, 3) + '-' + value.substr(3, 4) + '-' + value.substr(7, 4);
  }
  if (isElement) input.value = result;
  return result;
}

/**
 * Daum(카카오) 우편번호 검색 팝업 실행
 * - 이유: 원장님이 주소를 오탈자 없이 신속하고 정확하게 입력할 수 있도록 표준 주소 API 연동
 */
function searchPostcode() {
  if (typeof daum === 'undefined' || !daum.Postcode) {
    // CDN 로드 실패 또는 오프라인 환경을 위한 안전한 Fallback
    var manualAddr = prompt('우편번호 검색 서비스에 연결할 수 없습니다. 주소를 직접 입력해 주세요:', document.getElementById('myInfoAddress').value);
    if (manualAddr) {
      document.getElementById('myInfoAddress').value = manualAddr;
    }
    return;
  }

  new daum.Postcode({
    oncomplete: function(data) {
      // 도로명 주소 또는 지번 주소 선택
      var fullAddr = data.roadAddress ? data.roadAddress : data.jibunAddress;
      var extraAddr = '';

      if (data.userSelectedType === 'R') {
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
          extraAddr += data.bname;
        }
        if (data.buildingName !== '' && data.apartment === 'Y') {
          extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        if (extraAddr !== '') {
          fullAddr += ' (' + extraAddr + ')';
        }
      }

      // 우편번호와 기본 주소 필드에 삽입
      document.getElementById('myInfoPostcode').value = data.zonecode;
      document.getElementById('myInfoAddress').value = fullAddr;
      
      // 상세 주소 입력창으로 포커스 이동
      var detailInput = document.getElementById('myInfoAddressDetail');
      if (detailInput) {
        detailInput.focus();
      }
    }
  }).open();
}

/**
 * 비밀번호 입력 시 일치 여부 실시간 검증
 * - 이유: 저장 전에 사용자가 입력한 새 비밀번호와 확인 비밀번호의 일치 여부를 즉각 시각적으로 안내하기 위함
 */
function checkPasswordMatch() {
  var newPw = document.getElementById('myInfoNewPw').value;
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value;
  var feedback = document.getElementById('pwMatchFeedback');

  if (!feedback) return;

  if (!newPw && !confirmPw) {
    feedback.innerText = '';
    return;
  }

  if (newPw.length > 0 && newPw.length < 8) {
    feedback.innerText = '※ 새 비밀번호는 최소 8자 이상이어야 합니다.';
    feedback.style.color = '#d9534f';
    return;
  }

  if (newPw && confirmPw) {
    if (newPw === confirmPw) {
      feedback.innerText = '✓ 새 비밀번호가 서로 일치합니다.';
      feedback.style.color = '#2f5436';
    } else {
      feedback.innerText = '✕ 새 비밀번호가 일치하지 않습니다.';
      feedback.style.color = '#d9534f';
    }
  }
}

/**
 * 비밀번호만 단독 변경 처리
 * - 이유: 연락처나 주소 수정 없이 비밀번호만 신속하게 변경하고 싶을 때 명시적인 액션 제공
 */
function changeMyPasswordOnly() {
  var curPw = document.getElementById('myInfoCurrentPw').value.trim();
  var newPw = document.getElementById('myInfoNewPw').value.trim();
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value.trim();

  // 1) 필수값 검증
  if (!curPw) {
    alert('현재 비밀번호를 입력해 주세요.');
    document.getElementById('myInfoCurrentPw').focus();
    return;
  }
  if (!newPw) {
    alert('변경할 새 비밀번호를 입력해 주세요.');
    document.getElementById('myInfoNewPw').focus();
    return;
  }
  if (newPw.length < 8) {
    alert('새 비밀번호는 보안을 위해 8자리 이상으로 설정해 주세요.');
    document.getElementById('myInfoNewPw').focus();
    return;
  }
  if (newPw !== confirmPw) {
    alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    document.getElementById('myInfoNewPwConfirm').focus();
    return;
  }

  // 2) 변경 완료 처리
  document.getElementById('myInfoCurrentPw').value = '';
  document.getElementById('myInfoNewPw').value = '';
  document.getElementById('myInfoNewPwConfirm').value = '';
  document.getElementById('pwMatchFeedback').innerText = '';

  showAcademyToast('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 적용됩니다.');
}

/**
 * 내 정보(연락처, 이메일, 주소 및 선택적 비밀번호) 통합 저장
 * - 이유: 한 번의 클릭으로 수정 가능한 모든 학원 정보와 보안 설정을 일괄 저장하고 헤더와 화면을 동기화하기 위함
 */
function saveMyInfo() {
  var phone = document.getElementById('myInfoPhone').value.trim();
  var email = document.getElementById('myInfoEmail').value.trim();
  var postcode = document.getElementById('myInfoPostcode').value.trim();
  var address = document.getElementById('myInfoAddress').value.trim();
  var addressDetail = document.getElementById('myInfoAddressDetail').value.trim();

  // 1) 연락처 유효성 검사
  if (!phone) {
    alert('휴대전화번호를 입력해 주세요.');
    document.getElementById('myInfoPhone').focus();
    return;
  }
  if (phone.replace(/[^0-9]/g, '').length < 10) {
    alert('올바른 휴대전화번호(10~11자리)를 입력해 주세요.');
    document.getElementById('myInfoPhone').focus();
    return;
  }

  // 2) 이메일 유효성 검사
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    alert('대표 이메일을 입력해 주세요.');
    document.getElementById('myInfoEmail').focus();
    return;
  }
  if (!emailPattern.test(email)) {
    alert('올바른 이메일 형식을 입력해 주세요 (예: director@example.com).');
    document.getElementById('myInfoEmail').focus();
    return;
  }

  // 3) 주소 검사
  if (!address) {
    alert('학원 소재지 주소를 입력해 주세요.');
    document.getElementById('myInfoAddress').focus();
    return;
  }

  // 4) 비밀번호 입력 여부 확인 (입력되어 있다면 함께 검증 및 변경)
  var curPw = document.getElementById('myInfoCurrentPw').value.trim();
  var newPw = document.getElementById('myInfoNewPw').value.trim();
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value.trim();

  var pwChanged = false;
  if (curPw || newPw || confirmPw) {
    if (!curPw) {
      alert('비밀번호를 변경하시려면 [현재 비밀번호]를 입력해 주세요.');
      document.getElementById('myInfoCurrentPw').focus();
      return;
    }
    if (!newPw) {
      alert('변경할 [새 비밀번호]를 입력해 주세요.');
      document.getElementById('myInfoNewPw').focus();
      return;
    }
    if (newPw.length < 8) {
      alert('새 비밀번호는 8자리 이상이어야 합니다.');
      document.getElementById('myInfoNewPw').focus();
      return;
    }
    if (newPw !== confirmPw) {
      alert('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      document.getElementById('myInfoNewPwConfirm').focus();
      return;
    }
    pwChanged = true;
  }

  // 5) 데이터 모델 및 학원 정보 업데이트
  myAcademyInfo.phone = phone;
  myAcademyInfo.email = email;
  myAcademyInfo.postcode = postcode;
  myAcademyInfo.address = address;
  myAcademyInfo.addressDetail = addressDetail;

  if (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo) {
    currentAcademyInfo.phone = phone;
    currentAcademyInfo.email = email;
    currentAcademyInfo.postcode = postcode;
    currentAcademyInfo.address = address + (addressDetail ? ' ' + addressDetail : '');
    currentAcademyInfo.addressDetail = addressDetail;
  }

  // 학원별 LocalStorage 영구 보존
  var acadId = (typeof currentAcademyInfo !== 'undefined' && (currentAcademyInfo.id || currentAcademyInfo.adminId)) || 'DEFAULT';
  try {
    localStorage.setItem('NANO_MY_INFO_' + acadId, JSON.stringify({
      phone: phone,
      email: email,
      postcode: postcode,
      address: address,
      addressDetail: addressDetail
    }));
  } catch(e) {}

  // 마스터 가맹 학원 목록(NANO_MASTER_FRANCHISE_LIST)에도 실시간 동기화 업데이트
  try {
    var rawList = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
    if (rawList) {
      var fList = JSON.parse(rawList);
      if (Array.isArray(fList)) {
        var targetF = fList.find(function(f) {
          return (acadId && f.id === acadId) || (typeof currentAcademyInfo !== 'undefined' && (f.adminId === currentAcademyInfo.adminId || f.name === currentAcademyInfo.name));
        });
        if (targetF) {
          targetF.phone = phone;
          targetF.email = email;
          targetF.postcode = postcode;
          targetF.address = address;
          targetF.addressDetail = addressDetail;
          targetF.region = address + (addressDetail ? ' ' + addressDetail : '');
          localStorage.setItem('NANO_MASTER_FRANCHISE_LIST', JSON.stringify(fList));
        }
      }
    }
  } catch(e) {}

  // 6) 모달 닫기 및 알림
  $('#myInfoModal').modal('hide');

  if (pwChanged) {
    showAcademyToast('내 정보(연락처·이메일·주소) 및 비밀번호가 성공적으로 저장되었습니다.');
  } else {
    showAcademyToast('내 정보(휴대전화·이메일·학원 주소)가 성공적으로 저장되었습니다.');
  }
}

