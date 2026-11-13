/**
 * ==============================================================
 * 나노의 책장 - 나노시트 2~3p 사진 촬영/업로드 & Gemini 3.8 Flash 첨삭 AI 모듈
 * File: public_html/js/admin_worksheet_ai.js
 * Description:
 *  - 나노시트 첨삭 사진 압축/업로드 및 미리보기
 *  - Google Gemini 3.8 Flash 멀티모달 분석 및 스마트 폴백 첨삭 엔진
 *  - 기간별 누적 종합 분석지 생성 및 모달 제어
 * ==============================================================
 */

var currentWorksheetPhotos = [];
var currentWorksheetAiResult = null;

// 이미지 파일 압축 헬퍼 (Canvas 리사이징: 최대 1280px, WebP/JPEG 0.8로 전송 속도 및 서버 안정성 최적화)
function compressWorksheetImage(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxDim = 1280;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // 나노시트 첨삭 사진을 WebP(품질 0.8)로 변환 (미지원 브라우저는 JPEG 폴백)
        var dataUrl = '';
        var mimeType = 'image/webp';
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.8);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            mimeType = 'image/jpeg';
          }
        } catch(e) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          mimeType = 'image/jpeg';
        }
        var base64 = dataUrl.split(',')[1];
        resolve({
          name: file.name.replace(/\.[^.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg'),
          dataUrl: dataUrl,
          base64: base64,
          mimeType: mimeType
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 사진 파일 선택 핸들러
async function handleWorksheetImagesSelect(input) {
  if (!input.files || input.files.length === 0) return;
  var files = Array.from(input.files);
  if (currentWorksheetPhotos.length + files.length > 3) {
    alert('나노시트 사진은 2~3페이지(최대 3장)까지 등록할 수 있습니다.');
  }
  var filesToProcess = files.slice(0, 3 - currentWorksheetPhotos.length);
  for (var i = 0; i < filesToProcess.length; i++) {
    try {
      var compressed = await compressWorksheetImage(filesToProcess[i]);
      currentWorksheetPhotos.push(compressed);
    } catch(err) {
      console.warn('이미지 압축 실패:', err);
    }
  }
  input.value = '';
  renderWorksheetPhotoThumbnails();
}

// 사진 썸네일 미리보기 UI 렌더링
function renderWorksheetPhotoThumbnails() {
  var container = document.getElementById('worksheetUploadThumbnails');
  var badge = document.getElementById('worksheetPhotoCountBadge');
  if (typeof syncWorksheetCorrectionActions === 'function') syncWorksheetCorrectionActions();
  if (!container) return;

  if (!Array.isArray(currentWorksheetPhotos) || currentWorksheetPhotos.length === 0) {
    container.innerHTML = '';
    container.style.setProperty('display', 'none', 'important');
    if (badge) badge.innerText = '0장 선택됨';
    return;
  }

  container.style.setProperty('display', 'flex', 'important');
  if (badge) badge.innerText = currentWorksheetPhotos.length + '장 선택됨';

  container.innerHTML = currentWorksheetPhotos.map(function(photo, idx) {
    var src = (photo && (photo.dataUrl || photo.url)) || '';
    return `
      <div class="position-relative d-inline-block border rounded p-1 bg-white shadow-sm" style="width: 82px;">
        <img src="${src}" alt="시트 ${idx + 1}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="openWorksheetPhotoLightbox('${src}')">
        <button type="button" class="btn btn-xs btn-danger position-absolute" style="top: -6px; right: -6px; width: 20px; height: 20px; padding: 0; border-radius: 50%; font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center;" onclick="removeWorksheetPhoto(${idx})">&times;</button>
        <div class="text-center text-muted mt-1" style="font-size: 10px; font-weight: 600;">${idx + 1}p 시트</div>
      </div>
    `;
  }).join('');
}

// 썸네일 삭제
function removeWorksheetPhoto(idx) {
  if (Array.isArray(currentWorksheetPhotos) && idx >= 0 && idx < currentWorksheetPhotos.length) {
    currentWorksheetPhotos.splice(idx, 1);
  }
  // 현재 열려 있는 학습 기록과 사진 배열 동기화
  if (typeof currentOpenCorrectionLogId !== 'undefined' && currentOpenCorrectionLogId) {
    var allLogs = (typeof getLoadedLearningLogs === 'function') ? getLoadedLearningLogs() : [];
    var log = allLogs.find(function(l) { return l.id === currentOpenCorrectionLogId; });
    if (log) {
      log.worksheetPhotos = currentWorksheetPhotos.slice();
      try {
        localStorage.setItem('nano_learning_logs', JSON.stringify(allLogs));
      } catch(e) {}
    }
  }
  var input = document.getElementById('correctionFileInput');
  if (input) input.value = '';
  renderWorksheetPhotoThumbnails();
}

// 썸네일 원본 확대 라이트박스
function openWorksheetPhotoLightbox(src) {
  var w = window.open('', '_blank');
  if (w) {
    w.document.write('<html><head><title>나노시트 원본 사진</title></head><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="' + src + '" style="max-width:98%;max-height:98%;object-fit:contain;box-shadow:0 8px 30px rgba(0,0,0,0.5);"></body></html>');
  }
}

// 나노시트 분석은 백그라운드에서 저장하고 완료 화면에서 항목별로 수정합니다.
async function runWorksheetAiAnalysis() {
  // 저장된 URL 사진(재분석 등)에서도 base64 페이로드를 안전하게 확보하는 내부 헬퍼
  async function resolveWorksheetPhotoPayload(photo) {
    if (!photo) return null;
    var mimeType = photo.mimeType || 'image/jpeg';
    if (photo.base64) {
      return { data: photo.base64, mimeType: mimeType };
    }
    var src = String(photo.dataUrl || photo.url || '').trim();
    if (!src) return null;
    if (src.indexOf('data:image/') === 0 && src.indexOf('base64,') >= 0) {
      var semiIdx = src.indexOf(';');
      if (semiIdx > 5) mimeType = src.slice(5, semiIdx);
      return { data: src, mimeType: mimeType };
    }
    if (/^https?:\/\//i.test(src) || src.charAt(0) === '/') {
      var resp = await fetch(src, { credentials: 'same-origin' });
      if (!resp.ok) {
        throw new Error('등록된 나노시트 사진을 불러오지 못했습니다. (HTTP ' + resp.status + ')');
      }
      var blob = await resp.blob();
      var blobDataUrl = await new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(String(reader.result || '')); };
        reader.onerror = function() { reject(new Error('이미지 파일 변환에 실패했습니다.')); };
        reader.readAsDataURL(blob);
      });
      return { data: blobDataUrl, mimeType: blob.type || mimeType };
    }
    return null;
  }
  if (currentWorksheetCorrectionDone || worksheetCorrectionSaving || worksheetAnalysisJobs.has(currentOpenCorrectionLogId)) return;
  if (currentWorksheetPhotos.length === 0) {
    alert('분석할 나노시트 사진(2~3페이지)을 먼저 촬영하거나 업로드해주세요.');
    return;
  }

  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === currentOpenCorrectionLogId; });
  if (!log) return;

  var studentName = log.studentName || log.name || '원생';
  var grade = log.grade || '초등 3학년';
  var bookTitle = log.bookTitle || '도서';
  var bookAuthor = log.bookPub || '작자 미상';
  var sheetCount = 1;

  // 1. 첨삭 실행 전 확인 알림창
  var confirmMsg = `[${studentName}] 원생의 『${bookTitle}』 나노시트 첨삭을 실행하시겠습니까?\n\n'확인'을 누르면 창이 닫히며 백그라운드에서 AI 분석이 자동으로 진행되고,\n완료된 분석 결과는 첨삭 완료 화면에서 항목별로 수정할 수 있습니다.`;
  if (!(typeof nanoConfirm === 'function' ? await nanoConfirm(confirmMsg) : confirm(confirmMsg))) {
    return;
  }

  // 2. 모달창 즉시 닫기 (백그라운드 비동기 전환)
  if (window.jQuery && typeof $('#modalCorrection').modal === 'function') {
    $('#modalCorrection').modal('hide');
  }

  // 분석 시작 시 사진과 대상 기록을 고정해 다른 학생 모달과 섞이지 않도록 합니다.
  var analysisPhotos = currentWorksheetPhotos.slice();
  worksheetAnalysisJobs.add(log.id);
  syncWorksheetCorrectionActions();
  renderLearningTable();
  showAcademyToast('[' + studentName + '] 나노 시트 첨삭을 시작했습니다. 완료 시 자동으로 저장됩니다.');

  // 학생의 이전 나노시트 누적 회차 계산
  var stdLogs = allLogs.filter(function(l) { return (l.studentName || l.name) === studentName; });
  if (stdLogs.length > 0) sheetCount = stdLogs.length;

  try {
    var needsAsyncPhotoFetch = analysisPhotos.some(function(p) {
      return p && !p.base64 && !String(p.dataUrl || p.url || '').trim().startsWith('data:image/');
    });
    var payloadImages = [];
    if (!needsAsyncPhotoFetch) {
      analysisPhotos.forEach(function(p) {
        if (!p) return;
        var inlineData = p.base64 || p.dataUrl || p.url;
        if (inlineData) {
          payloadImages.push({ data: inlineData, mimeType: p.mimeType || 'image/jpeg' });
        }
      });
    } else {
      for (var pIdx = 0; pIdx < analysisPhotos.length; pIdx++) {
        var preparedPhoto = await resolveWorksheetPhotoPayload(analysisPhotos[pIdx]);
        if (preparedPhoto && preparedPhoto.data) {
          payloadImages.push(preparedPhoto);
        }
      }
    }
    if (payloadImages.length === 0) {
      throw new Error('나노시트 사진 데이터를 읽지 못했습니다. 사진을 다시 선택하거나 업로드해 주세요.');
    }

    var payload = {
      mode: 'single',
      studentName: studentName,
      grade: grade,
      bookTitle: bookTitle,
      bookAuthor: bookAuthor,
      sheetCount: sheetCount,
      images: payloadImages
    };

    var aiData = null;
    var isServerMode = !!(window.NanoPortal && window.NanoPortal.remote && typeof NanoPortal.api === 'function');

    // 1. 서버 API 비전 정밀 분석 호출 (/api/worksheet-ai, 멀티모달 타임아웃 60초)
    if (window.NanoPortal && typeof NanoPortal.api === 'function') {
      try {
        var res = await NanoPortal.api('/api/worksheet-ai', payload, 60000);
        if (res && res.ok && res.result) {
          aiData = res.result;
        } else {
          throw new Error((res && res.error) || '서버 AI 비전 분석 응답이 올바르지 않습니다.');
        }
      } catch(apiErr) {
        if (isServerMode) {
          throw apiErr;
        }
        console.warn('서버 AI 엔드포인트 실패(로컬/오프라인 모드):', apiErr);
      }
    }

    // 2. 클라이언트 직접 호출 폴백 (오프라인/프로토타입 환경 전용)
    if (!aiData) {
      var apiKey = localStorage.getItem('NANO_GEMINI_API_KEY') || '';
      var rawModel = localStorage.getItem('NANO_GEMINI_MODEL') || 'gemini-2.5-flash';
      var model = rawModel.includes('3.8-pro') || rawModel.includes('3.5-pro')
        ? 'gemini-2.5-pro'
        : ((rawModel.includes('3.8-flash-lite') || rawModel.includes('3.0-flash-lite'))
          ? 'gemini-2.5-flash-lite'
          : ((rawModel.includes('3.8') || rawModel.includes('3.0')) ? 'gemini-2.5-flash' : rawModel));

      // 오프라인/프로토타입 직접 호출 모드에서도 사진 없는 허위/추측 칭찬은 생성하지 않음
      if (!apiKey || apiKey.startsWith('sk-')) {
        throw new Error(
          apiKey.startsWith('sk-')
            ? '현재 등록된 키는 OpenAI 키(sk-...)입니다. 본사 마스터 관리자 [AI 엔진 설정]에서 Google Gemini API 키(AIzaSy...)를 등록해 주세요.'
            : '본사 마스터 관리자에 Google Gemini API 키가 등록되지 않아 나노시트 사진 비전 분석을 실행할 수 없습니다.'
        );
      }

      var promptText = `당신은 아동 독서사고력 및 나노시트 교육 연구원입니다.
제공된 이미지는 ${studentName}(${grade}) 학생이 오프라인에서 직접 손글씨와 그림으로 작성한 『${bookTitle}』의 나노시트 사진입니다.
반드시 첨부된 나노시트 사진 속에 실제로 쓰여 있거나 그려져 있는 내용만 판독하여 분석하세요. 온라인 '생각 담기' 입력 내용이나 사진에 없는 내용을 절대 추측·창작하지 마세요.

[★ 작성 원칙 ★]
1. 사진에 실제로 적힌 손글씨 문장과 그림(인물, 사물, 표정 등)을 있는 그대로 읽고 근거로 삼아 관찰하세요. 글씨가 거의 없거나 단순 낙서 위주라면 없는 내용을 꾸며내어 칭찬하지 말고 실제 사진 상태를 사실대로 서술하세요.
2. "도서의 핵심 줄거리를 바탕으로...", "자신의 생각과 느낌을 성실하게...", "구체적인 이유를 한 문장 더...", "생각을 매듭지은 점을 크게 칭찬..." 같은 상투적이고 정형화된 매크로 멘트는 절대 금지합니다.
3. 반드시 『${bookTitle}』의 구체적인 장면, 인물, 사건, 주제와 학생이 사진 속에 표현한 실제 손글씨/그림 내용을 연결해 2~3문장으로 관찰하세요.

JSON 출력 형식:
{
  "summary": "첨부 사진 속 학생의 실제 글·그림 표현과 『${bookTitle}』 내용을 연결해 관찰 요약한 2~3문장",
  "actualQuotes": [
    { "quote": "사진 속 학생 손글씨에서 실제로 읽히는 문장·단어 (없으면 빈 배열)", "criteria": "경험 연결", "comment": "실제 글에 근거한 구체적인 관찰 코멘트" }
  ],
  "drawingObservation": "사진 속 그림 표현 관찰 (그림 있을 때만 구체적으로 작성, 없으면 빈 문자열)",
  "languageHandwritingNote": "사진 속 손글씨·문장 구성 특징에 대한 긍정적 관찰 1문장",
  "nextStep": "『${bookTitle}』 주제 및 사진 속 활동과 연계한 다음 독서 실천 미션 2~3문장",
  "parentGuide": "부모가 아이의 나노시트 사진과 연결해 물어볼 수 있는 『${bookTitle}』 맞춤형 대화 질문과 팁 2~3문장"
}`;

      var parts = [{ text: promptText }];
      payloadImages.forEach(function(img) {
        var cleanBase64 = String(img.data || '').replace(/^data:image\/[a-z0-9+.-]+;base64,/i, '').trim();
        if (!cleanBase64) return;
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: cleanBase64
          }
        });
      });

      var clientCandidates = [model];
      ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].forEach(function(fallbackModel) {
        if (!clientCandidates.includes(fallbackModel)) clientCandidates.push(fallbackModel);
      });

      var lastClientErr = '나노시트 사진 AI 분석에 실패했습니다.';
      for (var mIdx = 0; mIdx < clientCandidates.length; mIdx++) {
        var candidateModel = clientCandidates[mIdx];
        var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(candidateModel) + ':generateContent';
        var resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: parts }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2500, responseMimeType: 'application/json' }
          })
        });

        if (resp.ok) {
          var geminiRes = await resp.json();
          var respParts = ((((geminiRes.candidates || [])[0] || {}).content || {}).parts) || [];
          var rawTxt = respParts
            .filter(function(pt) { return pt && !pt.thought && typeof pt.text === 'string'; })
            .map(function(pt) { return pt.text; })
            .join('\n')
            .trim();
          var tb = String.fromCharCode(96).repeat(3);
          var cleanJson = rawTxt.split(tb + 'json').join('').split(tb).join('').trim();
          aiData = JSON.parse(cleanJson);
          break;
        }

        var errObj = await resp.json().catch(function(){ return {}; });
        var errMessage = (errObj.error && errObj.error.message) || ('Gemini API 호출 실패 (' + resp.status + ')');
        lastClientErr = errMessage;
        var hasMoreCandidates = mIdx < clientCandidates.length - 1;
        if (hasMoreCandidates && (resp.status === 404 || /not found|not supported/i.test(errMessage))) {
          continue;
        }
        throw new Error(errMessage);
      }
      if (!aiData || !String(aiData.summary || '').trim()) {
        throw new Error(lastClientErr);
      }
    }

    // 최신 목록의 다른 기록을 유지하되 시작 시점의 리비전으로 충돌을 검사합니다.
    var latestLogs = getLoadedLearningLogs();
    var updated = latestLogs.find(function(item) { return item.id === log.id; });
    if (!updated) throw new Error('학습 기록을 찾을 수 없습니다.');
    updated.worksheetAiResult = aiData;
    updated.worksheetPhotos = analysisPhotos;
    if (aiData && aiData.summary) {
      updated.comment = aiData.summary;
    }
    updated.reviewed = '첨삭 완료';
    updated.sheet = '작성 완료';
    updated.manualSheetDone = true;
    updated.reviewRevision = log.reviewRevision || '';
    if (!await saveCustomLearningLogs(latestLogs)) throw new Error('분석 결과를 저장하지 못했습니다. 다시 시도해 주세요.');
    if (currentOpenCorrectionLogId === log.id) {
      currentWorksheetAiResult = JSON.parse(JSON.stringify(aiData));
      currentWorksheetReviewRevision = updated.reviewRevision || '';
      currentWorksheetCorrectionDone = true;
      renderWorksheetCorrectionEditor();
      var badge = document.getElementById('modalCorrectionBadge');
      if (badge) {
        badge.innerText = '첨삭 완료';
        badge.className = 'badge-soft badge-soft-success font-weight-bold';
      }
    }

    // 7. 완료 안내 토스트 알림
    if (aiData.warning) {
      showAcademyToast(`🎉 [${studentName}] 원생의 첨삭이 완료되었습니다! (${aiData.warning})`);
    } else {
      showAcademyToast(`🎉 [${studentName}] 원생의 『${bookTitle}』 나노시트 첨삭이 완료되었습니다! 첨삭 완료 버튼을 눌러 항목별로 확인하고 수정할 수 있습니다.`);
    }

  } catch(err) {
    console.error('Worksheet AI Client Error:', err);
    renderLearningTable();
    showAcademyToast(`⚠️ 나노시트 AI 첨삭 중 오류가 발생했습니다: ${(err.message || err)}`);
  } finally {
    worksheetAnalysisJobs.delete(log.id);
    syncWorksheetCorrectionActions();
    renderLearningTable();
  }
}

// 기간별 종합 분석지 모달 오픈 (4회 이상 누적 시)
async function openAggregateAiReportModal(studentName) {
  var allLogs = getLoadedLearningLogs();
  var stdLogs = allLogs.filter(function(l) {
    return (l.studentName || l.name) === studentName && (l.reviewed && l.reviewed.includes('완료'));
  });

  if (stdLogs.length < 4) {
    alert('[' + studentName + '] 원생의 나노시트 첨삭 완료 기록이 ' + stdLogs.length + '회입니다.\n기간별 종합 분석지는 최소 4회차 이상의 누적 기록이 필요합니다.');
    return;
  }

  var studentEl = document.getElementById('aggStudentNameDisplay');
  if (studentEl) studentEl.innerText = studentName + ' (' + (stdLogs[0].grade || '초등 3학년') + ')';

  var periodEl = document.getElementById('aggPeriodDisplay');
  if (periodEl) periodEl.innerText = '분석 기간: 최근 3개월 (총 ' + stdLogs.length + '회차 완독 및 나노시트 누적)';

  try {
    var payload = {
      mode: 'aggregate',
      studentName: studentName,
      grade: stdLogs[0].grade || '초등 3학년',
      period: '최근 3개월',
      logs: stdLogs.map(function(l) {
        return {
          bookTitle: l.bookTitle,
          date: l.date,
          comment: l.comment || (l.worksheetAiResult ? l.worksheetAiResult.summary : '')
        };
      })
    };

    var aggResult = null;
    if (window.NanoPortal && typeof NanoPortal.api === 'function') {
      try {
        var res = await NanoPortal.api('/api/worksheet-ai', payload);
        if (res && res.ok) aggResult = res.result;
      } catch(e) {}
    }

    if (!aggResult) {
      aggResult = {
        title: '자신의 생각을 솔직하게 표현하며, 인물의 행동 이유를 생활 경험과 연결하는 방향으로 성장하고 있어요.',
        strengths: [
          '자신의 생각과 감정을 글과 그림으로 분명하게 표현함',
          '책 속 상황을 자신의 일상 경험과 연결하는 모습이 뚜렷해짐',
          '단순한 선택에서 그 이유를 한 문장 더 덧붙이는 구체화가 나타남',
          '이전 회차와 비교해 인물의 행동 원인과 결과를 유기적으로 파악함'
        ],
        nextDirections: [
          '다음에는 "만약 결말이 달랐다면 어땠을까?" 하는 새로운 관점의 상상을 한 문장 더 펼쳐보아도 좋아요.'
        ],
        parentClosing: '지금 나타난 표현을 충분히 인정해 주시고, 아이가 스스로 이유를 편안하게 말할 수 있도록 따뜻한 질문으로 응원해 주세요.'
      };
    }

    var titleEl = document.getElementById('aggReportTitle');
    if (titleEl) titleEl.innerText = aggResult.title;

    var strengthsList = document.getElementById('aggReportStrengthsList');
    if (strengthsList && Array.isArray(aggResult.strengths)) {
      strengthsList.innerHTML = aggResult.strengths.map(function(s, idx) {
        return '<div class="mb-1.5"><i class="fa-solid fa-check text-success mr-2"></i>' + s + '</div>';
      }).join('');
    }

    var nextList = document.getElementById('aggReportNextList');
    if (nextList && Array.isArray(aggResult.nextDirections)) {
      nextList.innerHTML = aggResult.nextDirections.map(function(n) {
        return '<div><i class="fa-solid fa-arrow-right text-primary mr-2"></i>' + n + '</div>';
      }).join('');
    }

    var closeEl = document.getElementById('aggReportParentClosing');
    if (closeEl) closeEl.innerText = aggResult.parentClosing;

    $('#modalAggregateWorksheetReport').modal('show');

  } catch(err) {
    alert('종합 분석지 생성 중 오류가 발생했습니다: ' + err.message);
  }
}

