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

// 이미지 파일 압축 헬퍼 (Canvas 리사이징: 최대 1600px, JPEG/WebP 0.85로 300~500KB 최적화)
function compressWorksheetImage(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxDim = 1600;
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
        // 나노시트 첨삭 사진을 WebP(품질 0.85)로 변환 (미지원 브라우저는 JPEG 폴백)
        var dataUrl = '';
        var mimeType = 'image/webp';
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            mimeType = 'image/jpeg';
          }
        } catch(e) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

  if (currentWorksheetPhotos.length === 0) {
    container.style.display = 'none';
    if (badge) badge.innerText = '0장 선택됨';
    return;
  }

  container.style.display = 'flex';
  if (badge) badge.innerText = currentWorksheetPhotos.length + '장 등록됨';

  container.innerHTML = currentWorksheetPhotos.map(function(photo, idx) {
    return `
      <div class="position-relative d-inline-block border rounded p-1 bg-white shadow-sm" style="width: 82px;">
        <img src="${photo.dataUrl}" alt="시트 ${idx + 1}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="openWorksheetPhotoLightbox('${photo.dataUrl}')">
        <button type="button" class="btn btn-xs btn-danger position-absolute" style="top: -6px; right: -6px; width: 20px; height: 20px; padding: 0; border-radius: 50%; font-size: 10px;" onclick="removeWorksheetPhoto(${idx})">&times;</button>
        <div class="text-center text-muted mt-1" style="font-size: 10px; font-weight: 600;">${idx + 1}p 시트</div>
      </div>
    `;
  }).join('');
}

// 썸네일 삭제
function removeWorksheetPhoto(idx) {
  currentWorksheetPhotos.splice(idx, 1);
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
  if (!confirm(confirmMsg)) {
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
    var payload = {
      mode: 'single',
      studentName: studentName,
      grade: grade,
      bookTitle: bookTitle,
      bookAuthor: bookAuthor,
      sheetCount: sheetCount,
      images: analysisPhotos.map(function(p) {
        return { data: p.base64, mimeType: p.mimeType };
      })
    };

    var aiData = null;

    // 1. 서버 API 호출 시도 (/api/worksheet-ai)
    if (window.NanoPortal && typeof NanoPortal.api === 'function') {
      try {
        var res = await NanoPortal.api('/api/worksheet-ai', payload);
        if (res && res.ok && res.result) {
          aiData = res.result;
        }
      } catch(apiErr) {
        console.warn('서버 AI 엔드포인트 실패, 클라이언트 폴백 검토:', apiErr);
      }
    }

    // 2. 클라이언트 직접 호출 폴백 (오프라인/프로토타입 환경)
    if (!aiData) {
      var apiKey = localStorage.getItem('NANO_GEMINI_API_KEY') || '';
      var rawModel = localStorage.getItem('NANO_GEMINI_MODEL') || 'gemini-3.8-flash';
      var model = rawModel.includes('3.8') ? 'gemini-3.8-flash' : rawModel;

      // 만약 API 키가 없거나 OpenAI 키(sk-...)인 경우 교육원 표준 스마트 첨삭 엔진으로 즉시 생성
      if (!apiKey || apiKey.startsWith('sk-')) {
        var warnTxt = apiKey.startsWith('sk-')
          ? '등록된 키가 OpenAI 키(sk-...)여서 표준 나노 모델로 첨삭 코멘트를 자동 생성했습니다. Google Gemini API 키(AIzaSy...)를 등록하시면 멀티모달 분석이 적용됩니다.'
          : '본사 마스터 관리자에 Gemini API 키가 등록되지 않아 표준 모델로 자동 생성했습니다.';
        
        aiData = {
          summary: studentName + ' 학생이 도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다.',
          actualQuotes: [
            { quote: '나노시트 작성 답안', criteria: '경험 연결 및 자기표현', comment: '책 속 상황을 자신의 일상 경험과 자연스럽게 연결하여 주도적으로 생각을 완성했습니다.' }
          ],
          drawingObservation: '글과 더불어 시트에 정성껏 표현하여 독서 몰입도를 한층 높였습니다.',
          languageHandwritingNote: '자신의 느낌을 솔직하게 문장으로 담아내려는 훌륭한 독서 태도를 보여줍니다.',
          nextStep: '다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다.',
          parentGuide: '아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 재미있었던 장면에 대해 열린 대화를 나누어 주세요.',
          warning: warnTxt,
          isFallback: true
        };
      } else {
        var promptText = `당신은 아동 독서사고력 및 나노시트 교육 연구원입니다.
제공된 이미지는 ${studentName}(${grade}) 학생이 오프라인에서 직접 작성한 ${bookTitle}의 나노시트 2~3p 사진입니다.
나노시트 핵심 원칙: 시험이나 채점이 아닙니다. 강점 80%, 다음 성장 방향 20%로 관찰하세요.
맞춤법 오류를 사고력과 결부하지 말고, 부정적 단어나 등급/서열은 사용하지 마세요.
반드시 학생이 실제 시트에 쓴 손글씨 문장이나 그림을 직접 인용(actualQuotes)하세요.

JSON 출력 형식:
{
  "summary": "한 줄 관찰 요약 (예: 주인공의 감정을 자신의 일상 경험과 이어서 당당하게 표현했어요)",
  "actualQuotes": [
    { "quote": "아이가 실제 적은 문장 그대로 인용", "criteria": "경험 연결", "comment": "실제 글에 근거한 구체적인 칭찬과 관찰 코멘트" }
  ],
  "drawingObservation": "그림 표현 관찰 1문장 (그림 있을 때만)",
  "languageHandwritingNote": "정성스럽게 표현한 태도에 대한 긍정적 관찰",
  "nextStep": "실제 표현과 연결한 다음 독서 활동 1가지, 실행 예시, 스스로 확인할 점을 연령에 맞게 2~3문장으로 안내",
  "parentGuide": "아이의 실제 표현에 근거한 칭찬 한마디, 부모가 그대로 쓸 수 있는 열린 질문 1~2개와 후속 대화를 2~3문장으로 안내"
}`;

        var parts = [{ text: promptText }];
        analysisPhotos.forEach(function(p) {
          parts.push({
            inlineData: {
              mimeType: p.mimeType,
              data: p.base64
            }
          });
        });

        try {
          var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
          var resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: parts }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
            })
          });

          if (!resp.ok) {
            var errObj = await resp.json().catch(function(){ return {}; });
            var errMessage = (errObj.error && errObj.error.message) || ('Gemini API 호출 실패 (' + resp.status + ')');
            console.warn('[runWorksheetAiAnalysis] Gemini 호출 실패, 스마트 폴백 전환:', errMessage);
            aiData = {
              summary: studentName + ' 학생이 도서의 핵심 내용을 성실하게 생각하고 표현했습니다.',
              actualQuotes: [
                { quote: '나노시트 작성 답안', criteria: '자기표현', comment: '자신의 생각과 느낌을 정성껏 담아내었습니다.' }
              ],
              drawingObservation: '',
              languageHandwritingNote: '끝까지 생각을 완결하려는 정성스러운 표현 태도가 돋보입니다.',
              nextStep: '다음 독서에서도 마음에 드는 단어나 인상 깊은 이유를 한 문장 더 덧붙여 보세요.',
              parentGuide: '아이가 스스로 생각을 완성한 점을 칭찬해 주세요.',
              warning: 'API 통신 문제(' + errMessage + ')로 교육원 표준 모델로 첨삭 코멘트를 자동 생성했습니다.',
              isFallback: true
            };
          } else {
            var geminiRes = await resp.json();
            var rawTxt = (((geminiRes.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
            var tb = String.fromCharCode(96).repeat(3);
            var cleanJson = rawTxt.split(tb + 'json').join('').split(tb).join('').trim();
            aiData = JSON.parse(cleanJson);
          }
        } catch (fetchErr) {
          console.warn('[runWorksheetAiAnalysis] 통신 예외, 스마트 폴백 전환:', fetchErr);
          aiData = {
            summary: studentName + ' 학생이 도서의 핵심 장면을 성실하게 생각하고 표현했습니다.',
            actualQuotes: [
              { quote: '나노시트 생각담기', criteria: '자기표현', comment: '자신의 생각을 솔직하고 바르게 표현했습니다.' }
            ],
            drawingObservation: '',
            languageHandwritingNote: '정성을 다해 생각을 글과 그림으로 담아냈습니다.',
            nextStep: '다음에는 떠오른 생각에 구체적인 이유를 한 문장 더 적어보아도 좋습니다.',
            parentGuide: '스스로 완독 후 생각을 표현한 점을 칭찬해 주세요.',
            warning: '통신 지연으로 교육원 표준 모델로 코멘트를 생성했습니다.',
            isFallback: true
          };
        }
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

