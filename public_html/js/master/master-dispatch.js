/**
 * [Nano BookShelf B2B Master] Book Dispatch & Aligo Dispatch Log Module
 * - Franchise Book Dispatch Table & Academy Filter
 * - Aligo Kakao Notification Talk Dispatch Logs & Statistics
 */

// 8. 카톡 발송 내역 모듈 (Aligo Dispatch)
// ==========================================
function renderDispatchTable(data = dispatchLogs) {
  const tbody = document.getElementById("dispatchTableBody");
  if (!tbody) return;

  document.getElementById("dispatchFilteredCount").innerText = data.length;

  // 상단 알리고 통계 카드 실시간 연동
  const baseLogs = Array.isArray(dispatchLogs) ? dispatchLogs : [];
  const kstYm = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
  const monthLogs = baseLogs.filter(l => String(l.datetime || l.date || '').slice(0, 7) === kstYm);
  const displaySentCount = monthLogs.length > 0 ? monthLogs.length : baseLogs.length;
  const successCount = baseLogs.filter(l => l.status === "SUCCESS").length;
  const failCount = baseLogs.length - successCount;
  const successRate = baseLogs.length > 0 ? ((successCount / baseLogs.length) * 100).toFixed(1) : "0.0";

  const sentEl = document.getElementById("statAligoTotalSent");
  const sentSubEl = document.getElementById("statAligoTotalSentSub");
  if (sentEl) sentEl.innerHTML = `${displaySentCount.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">건</span>`;
  if (sentSubEl) sentSubEl.innerText = `전체 누적 발송 ${baseLogs.length.toLocaleString()}건 (조회 ${data.length.toLocaleString()}건)`;

  const rateEl = document.getElementById("statAligoSuccessRate");
  const rateSubEl = document.getElementById("statAligoSuccessRateSub");
  if (rateEl) rateEl.innerHTML = `${successRate}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">%</span>`;
  if (rateSubEl) rateSubEl.innerText = `성공 ${successCount.toLocaleString()}건 / 실패 ${failCount.toLocaleString()}건`;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">발송 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((log, idx) => {
    let typeBadge = `<span class="badge-soft badge-soft-neutral">${log.typeName}</span>`;
    if (log.type === "PORTFOLIO") typeBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chart-pie mr-1"></i>포트폴리오</span>`;
    else if (log.type === "ASSIGN") typeBadge = `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-book-bookmark mr-1"></i>도서배정</span>`;

    const statusBadge = log.status === "SUCCESS"
      ? `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>성공</span>`
      : `<span class="badge-soft badge-soft-danger"><i class="fa-solid fa-xmark mr-1"></i>실패</span>`;

    return `
      <tr>
        <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
        <td class="text-center"><small class="text-muted">${log.datetime}</small></td>
        <td class="font-weight-bold">${log.academyName}</td>
        <td class="text-center">${typeBadge}</td>
        <td>
          <div class="font-weight-bold">${log.receiverName}</div>
        </td>
        <td class="text-center"><small>${log.receiverPhone}</small></td>
        <td style="max-width: 280px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          <small class="text-dark">${log.summary}</small>
        </td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openDispatchDetailModal('${log.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
            전문보기
          </button>
          ${log.status === "FAILED" ? `
            <button class="btn btn-xs btn-outline-danger" onclick="retryDispatch('${log.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
              재발송
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join("");
}

function populateDispatchAcademyFilter() {
  const select = document.getElementById("dispatchAcademyFilter");
  if (!select) return;

  const academies = Array.from(new Set(franchiseList.map(a => a.name)));
  select.innerHTML = `<option value="ALL">전체 발송 학원</option>` + academies.map(name => `<option value="${name}">${name}</option>`).join("");
}

function filterDispatchList() {
  const query = (document.getElementById("dispatchSearchInput")?.value || "").toLowerCase().trim();
  const acadFilter = document.getElementById("dispatchAcademyFilter")?.value || "ALL";
  const typeFilter = document.getElementById("dispatchTemplateFilter")?.value || "ALL";
  const statusFilter = document.getElementById("dispatchStatusFilter")?.value || "ALL";

  const filtered = dispatchLogs.filter(log => {
    const matchQuery = !query ||
      log.receiverName.toLowerCase().includes(query) ||
      log.receiverPhone.includes(query) ||
      log.academyName.toLowerCase().includes(query) ||
      log.summary.toLowerCase().includes(query);

    const matchAcad = acadFilter === "ALL" || log.academyName === acadFilter;
    const matchType = typeFilter === "ALL" || log.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchQuery && matchAcad && matchType && matchStatus;
  });

  renderDispatchTable(filtered);
}

function resetDispatchFilters() {
  document.getElementById("dispatchSearchInput").value = "";
  document.getElementById("dispatchAcademyFilter").value = "ALL";
  document.getElementById("dispatchTemplateFilter").value = "ALL";
  document.getElementById("dispatchStatusFilter").value = "ALL";
  renderDispatchTable();
}

function openDispatchDetailModal(id) {
  const log = dispatchLogs.find(l => l.id === id);
  if (!log) return;

  document.getElementById("dispatchModalTime").innerText = log.datetime;
  document.getElementById("dispatchModalTitle").innerText = `[나노의 책장] ${log.typeName}`;
  document.getElementById("dispatchModalBody").innerHTML = `
    <strong>수신: ${log.receiverName} 님</strong><br><br>
    ${log.summary}<br><br>
    ※ 본 메시지는 <strong>${log.academyName}</strong>에서 알리고(Aligo) 비즈메시지 공식 발신번호로 전송되었습니다.
  `;
  document.getElementById("dispatchModalAcademy").innerText = log.academyName;
  document.getElementById("dispatchModalReceiver").innerText = `${log.receiverName} (${log.receiverPhone})`;
  document.getElementById("dispatchModalCode").innerHTML = log.status === "SUCCESS"
    ? `<span class="badge-soft badge-soft-success">전송 성공 (결과코드: ${log.code})</span>`
    : `<span class="badge-soft badge-soft-danger">전송 실패 (${log.code})</span>`;

  $('#dispatchDetailModal').modal('show');
}

function previewDispatchLink() {
  showMasterToast("학부모 알림톡 내의 포트폴리오 리포트 모바일 링크가 정상 호출되었습니다.");
}

function retryDispatch() { showMasterToast('발송 서버가 연결되지 않아 재발송하지 않았습니다.'); }

async function testAligoConnection() { if (!NanoPortal.remote) { showMasterToast('운영 서버에서 설정을 확인해 주세요.'); return; } try { var config = await NanoPortal.api('/api/services'); showMasterToast(config.aligoReady ? '알림톡 설정이 준비되었습니다. 실제 발송은 리포트에서 수신자와 내용을 확인한 후 진행하세요.' : '알림톡 비활성: ' + (config.missing.join(', ') || 'ALIGO_ENABLED=true 설정 필요')); } catch(e) { showMasterToast(e.message); } }

function openAligoChargeModal() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('알리고 충전은 알리고 관리자에서 진행해 주세요.'); return; }
  $('#aligoChargeModal').modal('show');
}

function processAligoCharge() { showMasterToast('결제 서비스가 연결되지 않아 충전되지 않았습니다.'); }

// 학생 체험 뷰
function previewStudentPortal() {
  showMasterToast("학생 페이지(Student Portal)는 3단계에서 배정 도서 및 북퀴즈 풀이 화면으로 연결됩니다.");
}

function exportPlatformData() {
  var payload = { exportedAt: new Date().toISOString(), scope: '현재 브라우저의 회원·학원 목록',
    academies: franchiseList.map(function(item) { var copy = Object.assign({}, item); delete copy.password; delete copy.adminPassword; return copy; }),
    members: memberList.map(function(item) { var copy = Object.assign({}, item); delete copy.password; return copy; }) };
  var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  var link = document.createElement('a'); link.href = url; link.download = 'nano-local-export.json'; link.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  showMasterToast('현재 브라우저의 회원·학원 목록을 내보냈습니다. 서버 전체 백업은 포함되지 않습니다.');
}

// Non-blocking 토스트 알림
let toastTimer = null;
function showMasterToast(msg) {
  const toast = document.getElementById("masterToast");
  const text = document.getElementById("masterToastText");
  if (!toast || !text) return;

  text.innerText = msg;
  toast.style.display = "block";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

// ==========================================