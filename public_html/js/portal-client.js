(function (global) {
  'use strict';
  // 로컬 체험 화면과 운영 서버의 인증 경로를 구분합니다. 운영 환경에서는 체험 비밀번호로 우회하지 않습니다.
  var remote = location.protocol !== 'file:' && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  var memoryLogs = null;
  var learningRefresh = null, learningOverlay = new Map();
  var activity = null, activitySequence = 0;
  var isRedirectingToLogin = false;
  function handleConcurrentLogout(errorMsg) {
    if (isRedirectingToLogin) return;
    isRedirectingToLogin = true;
    var msg = errorMsg || '다른 기기에서 로그인하여 현재 접속이 종료되었습니다. 다시 로그인해 주세요.';
    try {
      sessionStorage.clear();
      sessionStorage.setItem('nano_login_notice', msg);
      localStorage.removeItem('nano_auth_user');
      localStorage.removeItem('nano_user');
    } catch (e) {}
    try {
      alert(msg);
    } catch (e) {}
    try {
      location.replace('index.html');
    } catch (e) {
      location.href = 'index.html';
    }
  }

  async function api(path, body, timeout) {
    var response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeout || 20000) });
    var data; try { data = await response.json(); } catch(e) { throw new Error('서버 응답을 확인하지 못했습니다.'); }
    if (!response.ok) {
      if (response.status === 401 && data && (data.concurrentLoggedOut || (typeof data.error === 'string' && data.error.indexOf('다른 기기에서 로그인하여') !== -1))) {
        handleConcurrentLogout(data.error);
        var concurrentErr = new Error(data.error);
        concurrentErr.status = 401;
        concurrentErr.concurrentLoggedOut = true;
        throw concurrentErr;
      }
      var err = new Error(data.error || '서버 요청에 실패했습니다.');
      err.status = response.status;
      err.conflict = data.conflict;
      err.concurrentLogin = data.concurrentLogin;
      throw err;
    }
    return data;
  }
  function academy() { return typeof currentAcademyInfo !== 'undefined' ? currentAcademyInfo.id : (user() || {}).academyId; }
  function manageUrl(entity, academyCode, params) {
    var query = new URLSearchParams({ entity: entity });
    var scope = academyCode === undefined ? academy() : academyCode;
    if (scope) query.set('academy', scope);
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') query.set(key, String(params[key]));
    });
    return '/api/manage?' + query.toString();
  }
  async function manage(entity, operation, data, options) {
    options = options || {};
    return api(manageUrl(entity, options.academy, options.params), { operation: operation, data: data || {}, rows: options.rows });
  }
  async function manageList(entity, options) {
    options = options || {};
    return api(manageUrl(entity, options.academy, options.params));
  }
  function enumStatus(value) {
    return ({ '승인': 'APPROVED', '정상': 'APPROVED', '정상 승인': 'APPROVED', '미승인': 'PENDING', '승인대기': 'PENDING', '정지': 'SUSPENDED', '일시정지': 'SUSPENDED', '퇴원': 'WITHDRAWN', '탈퇴': 'WITHDRAWN', NORMAL: 'APPROVED', PAUSED: 'SUSPENDED' })[value] || value || 'PENDING';
  }
  function classIdFor(item, academyCode) {
    if (item.classGroupId) return item.classGroupId;
    var name = item.classGroup || item.className;
    var match = (global.NANO_SERVER_CLASSES || []).find(function (entry) { return entry.academyId === academyCode && entry.name === name; });
    return match ? (match.serverId || match.id) : null;
  }
  function memberPayload(item, academyCode, opts) {
    var role = item.role === '학원 원장' ? 'DIRECTOR' : item.role === '지도교사' ? 'TEACHER' : (item.role || 'STUDENT');
    var isStudent = role === 'STUDENT';
    var academyStudentShape = isStudent && Object.prototype.hasOwnProperty.call(item, 'stdPhone');
    var safeUpdatedAt = undefined;
    if (item.updatedAt) {
      var d = new Date(item.updatedAt);
      safeUpdatedAt = (!isNaN(d.getTime())) ? d.toISOString() : String(item.updatedAt);
    }
    // 학생의 경우 학원 UI의 phone/stdPhone/parentPhone 필드 혼용을 안전하게 정규화
    var finalPhone = isStudent ? (item.stdPhone || '') : (item.phone || '');
    var finalParentPhone = isStudent ? (item.parentPhone || item.phone || '') : (item.parentPhone || '');
    var payload = {
      id: item.serverId || undefined, updatedAt: safeUpdatedAt, username: item.username || item.id, name: item.name, role: role,
      status: enumStatus(item.status || 'APPROVED'), grade: item.grade || '', school: item.school || '', gender: item.gender || '',
      phone: finalPhone, parentName: item.parentName || '', parentPhone: finalParentPhone,
      parentEmail: item.parentEmail || '', reportYn: item.reportYn !== false, classGroupId: classIdFor(item, academyCode),
      force: (opts && opts.force === true) ? true : undefined
    };
    if (item.password && typeof item.password === 'string') {
      var pwTrim = item.password.trim();
      var isMasked = !pwTrim || /^[•·*]+$/.test(pwTrim);
      if (!isMasked) payload.password = pwTrim;
    }
    return payload;
  }
  async function saveMember(item, academyCode, opts) {
    var result;
    try {
      result = await manage('members', 'save', memberPayload(item, academyCode, opts), { academy: academyCode });
    } catch (err) {
      if (err && (err.status === 409 || (err.message && err.message.indexOf('다른 관리자가 수정한 회원') !== -1))) {
        result = await manage('members', 'save', memberPayload(item, academyCode, Object.assign({}, opts, { force: true })), { academy: academyCode });
      } else {
        throw err;
      }
    }
    var saved = result && result.items && result.items[0];
    if (saved) { item.serverId = saved.id; item.updatedAt = saved.updatedAt; item.classGroupId = saved.classGroupId; }
    return saved;
  }
  async function deleteMember(item, academyCode) {
    var result = await manage('members', 'delete', { id: item.serverId }, { academy: academyCode });
    var saved = result.items && result.items[0];
    if (saved) item.updatedAt = saved.updatedAt;
    return saved;
  }
  function plan(value) { return String(value || 'STANDARD').toUpperCase(); }
  function money(value) { var parsed = Number(String(value == null ? '' : value).replace(/[^0-9]/g, '')); return Number.isSafeInteger(parsed) ? parsed : 0; }
  function academyPayload(item) {
    return { id: item.serverId || undefined, code: item.id, name: item.name, bizNo: item.bizNumber || '', directorName: item.director || '', phone: item.phone || '', email: item.email || '',
      address: item.address || item.region || '', memo: item.memo || '', maxStudents: Number(item.maxStudents) || 50, monthlyFee: money(item.monthlyFee), plan: plan(item.plan), status: item.status || 'ACTIVE',
      autoUnapprove: item.autoUnapprove === true,
      joinDate: item.joinDate || item.startDate, startDate: item.startDate, endDate: item.endDate,
      adminId: item.adminId || item.username || '', adminPw: item.adminPw || item.password || '' };
  }
  async function saveAcademy(item) {
    var result = await manage('academies', 'save', academyPayload(item), { academy: item.id });
    if (result.item) item.serverId = result.item.id;
    return result.item;
  }
  async function deleteAcademy(item) { return manage('academies', 'delete', { id: item.serverId }, { academy: item.id }); }
  async function restoreAcademy(item) { return manage('academies', 'restore', { id: item.serverId }, { academy: item.id }); }
  async function saveClass(item, academyCode) {
    var result = await manage('classes', 'save', { id: item.serverId || undefined, name: item.name, targetGrade: item.grade || item.targetGrade || '', teacher: item.teacher || '' }, { academy: academyCode });
    if (result.item) {
      item.serverId = result.item.id;
      item.id = result.item.id;
      if (result.item.teacher) item.teacher = result.item.teacher;
    }
    return result.item;
  }
  async function deleteClass(item, academyCode) { return manage('classes', 'delete', { id: item.serverId || item.id }, { academy: academyCode }); }
  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || '').split(',');
    if (parts.length < 2) return null;
    var mimeMatch = parts[0].match(/data:([^;]+);base64/i);
    var mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    var binary = atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var res = String(reader.result || '');
        resolve(res.replace(/^data:[^;]+;base64,/, ''));
      };
      reader.onerror = function () { reject(new Error('파일을 읽지 못했습니다.')); };
      reader.readAsDataURL(blob);
    });
  }

  // 브라우저 캔버스를 이용해 이미지 Blob/DataURL을 WebP(품질 85%, 최대 폭 1200px)로 즉시 자동 변환
  async function convertImageToWebP(source) {
    if (!source) return source;
    // PDF나 이미 WebP인 경우 변환 없이 그대로 반환
    if (typeof Blob !== 'undefined' && source instanceof Blob) {
      if (source.type === 'application/pdf' || source.type === 'image/webp') return source;
      if (!source.type.startsWith('image/')) return source;
    } else if (typeof source === 'string') {
      if (/^data:application\/pdf/i.test(source) || /^data:image\/webp/i.test(source)) return source;
      if (!/^data:image\//i.test(source)) return source;
    }

    return new Promise(function(resolve) {
      var img = new Image();
      img.onload = function() {
        try {
          var maxW = 1200;
          var w = img.width || 0;
          var h = img.height || 0;
          if (w > maxW && w > 0) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          var canvas = document.createElement('canvas');
          canvas.width = w || 400;
          canvas.height = h || 600;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          if (typeof canvas.toBlob === 'function') {
            canvas.toBlob(function(webpBlob) {
              if (webpBlob && webpBlob.size > 0) {
                resolve(webpBlob);
              } else {
                resolve(source); // 브라우저가 webp 미지원 시 원본 폴백
              }
            }, 'image/webp', 0.85);
          } else {
            resolve(canvas.toDataURL('image/webp', 0.85));
          }
        } catch (e) {
          resolve(source);
        }
      };
      img.onerror = function() { resolve(source); };
      if (typeof Blob !== 'undefined' && source instanceof Blob) {
        img.src = URL.createObjectURL(source);
      } else {
        img.src = source;
      }
    });
  }

  // 도서 표지·나노시트(PDF)·배너·테마 이미지를 Cloudflare R2(또는 DB 안전 폴백)로 업로드 후 영구 URL 반환
  async function uploadMedia(source, options) {
    if (!source) return '';
    var opts = options || {};
    var processedSource = source;

    // 이미지는 업로드 전 클라이언트 브라우저에서 100% WebP로 자동 압축 변환
    var isPdf = (opts.contentType === 'application/pdf') ||
                (typeof Blob !== 'undefined' && source instanceof Blob && source.type === 'application/pdf') ||
                (typeof source === 'string' && (/^data:application\/pdf/i.test(source) || /\.pdf$/i.test(opts.fileName || '')));
    if (!isPdf) {
      try {
        processedSource = await convertImageToWebP(source);
      } catch (convErr) {}
    }

    var blob = null;
    var fileName = opts.fileName || 'upload';

    if (typeof Blob !== 'undefined' && processedSource instanceof Blob) {
      blob = processedSource;
      if (processedSource.name && !opts.fileName) fileName = processedSource.name;
    } else if (typeof processedSource === 'string' && /^data:(image\/|application\/pdf)/i.test(processedSource)) {
      blob = dataUrlToBlob(processedSource);
    } else if (typeof processedSource === 'string') {
      return processedSource;
    }
    if (!blob || !blob.size) return '';

    var contentType = (blob.type || opts.contentType || '').toLowerCase();
    if (!contentType) {
      contentType = isPdf ? 'application/pdf' : 'image/webp';
    }

    if (!isPdf && !/\.webp$/i.test(fileName)) {
      fileName = fileName.replace(/\.[^.]+$/, '') + '.webp';
    }

    // 1차 시도: Cloudflare R2 서명 PUT URL 발급 -> 브라우저에서 직접 R2 업로드 (대용량 PDF 25MB 지원)
    try {
      var presigned = await api('/api/files', {
        scope: 'media',
        operation: 'presign',
        category: opts.category || 'book-cover',
        keyHint: opts.keyHint || '',
        fileName: fileName,
        contentType: contentType,
        fileSize: blob.size
      }, 20000);

      if (presigned && presigned.configured && presigned.uploadUrl) {
        try {
          var putRes = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': presigned.contentType || contentType },
            body: blob
          });
          if (putRes.ok && presigned.publicUrl) {
            return presigned.publicUrl;
          }
        } catch (corsOrNetErr) {
          // R2 버킷에 아직 CORS가 열려 있지 않고 3MB 이하인 경우 아래 서버 경유 모드로 자동 전환
        }
      }
    } catch (presignErr) {
      if (blob.size > 3 * 1024 * 1024) throw presignErr;
    }

    // 2차 시도 (서버 경유 R2 업로드 또는 R2 미설정 시 DB 안전 저장, 최대 3MB)
    if (blob.size > 3 * 1024 * 1024) {
      throw new Error('3MB 초과 대용량 파일은 Cloudflare R2 환경변수 연결 후 업로드할 수 있습니다.');
    }
    var base64 = await blobToBase64(blob);
    var uploaded = await api('/api/files', {
      scope: 'media',
      operation: 'upload',
      category: opts.category || 'book-cover',
      keyHint: opts.keyHint || '',
      fileName: fileName,
      base64: base64
    }, 45000);
    return (uploaded && uploaded.publicUrl) || '';
  }

  async function saveBanner(item) {
    var imgCandidate = item.imageUrl || item.image || '';
    if (/^data:image\//i.test(imgCandidate)) {
      imgCandidate = await uploadMedia(imgCandidate, { category: 'banner', fileName: (item.title || 'banner') + '.jpg' });
      item.imageUrl = imgCandidate;
    }
    var bookIds = Array.isArray(item.bookIds) ? item.bookIds.map(function(id) { return String(id).trim(); }).filter(Boolean) : [];
    var rawLink = item.linkUrl || item.link || '';
    var encodedLink = /^https?:\/\//i.test(rawLink)
      ? rawLink
      : ('#books=' + encodeURIComponent(bookIds.join(',')) + (item.sub ? '&sub=' + encodeURIComponent(item.sub) : ''));
    var result = await manage('banners', 'save', { id: typeof item.id === 'string' && !/^\d+$/.test(item.id) ? item.id : undefined, title: item.title,
      imageUrl: imgCandidate, linkUrl: encodedLink, isActive: item.active === 'Y' || item.isActive === true, orderNo: Number(item.order || item.orderNo) || 0,
      sub: item.sub || '', bookIds: bookIds, clicks: Number(item.clicks) || 0, createdAt: item.createdAt || '' });
    if (result.item) {
      item.id = result.item.id;
      item.bookIds = Array.isArray(result.item.bookIds) && result.item.bookIds.length > 0 ? result.item.bookIds : bookIds;
      item.linkUrl = encodedLink;
      item.link = encodedLink;
    }
    return result.item;
  }
  async function deleteBanner(item) { return manage('banners', 'delete', { id: item.id }); }
  async function saveTheme(item) {
    var name = item.name || item.title || String(item.tag || '').replace(/^#/, '');
    var themeImg = item.image || '';
    if (/^data:image\//i.test(themeImg)) {
      themeImg = await uploadMedia(themeImg, { category: 'theme', fileName: (name || 'theme') + '.png' });
      item.image = themeImg;
    }
    var result = await manage('themes', 'save', { id: typeof item.id === 'string' && !/^\d+$/.test(item.id) ? item.id : undefined,
      code: item.code || ('THEME-' + String(item.id || Date.now())), name: name, description: item.description || item.desc || item.subTag || '',
      subTag: item.subTag || '', desc: item.desc || item.description || '', image: themeImg, order: typeof item.order === 'number' ? item.order : (parseInt(item.order, 10) || null), active: item.active === 'N' ? 'N' : 'Y',
      bookIds: Array.isArray(item.bookIds) ? item.bookIds : [] });
    if (result.item) { item.id = result.item.id; item.code = result.item.code; }
    return result.item;
  }
  async function deleteTheme(item) { return manage('themes', 'delete', { id: item.id }); }
  async function reorderThemes(items) {
    var orders = (items || []).filter(function (t) { return t && typeof t.id === 'string' && !/^\d+$/.test(t.id); }).map(function (t, idx) {
      return { id: t.id, order: typeof t.order === 'number' && !isNaN(t.order) ? t.order : (idx + 1) };
    });
    if (!orders.length) return { ok: true };
    return manage('themes', 'reorder', { orders: orders });
  }
  async function fetchThemes(since) {
    var qs = since && Number(since) > 0 ? '&since=' + encodeURIComponent(String(since)) : '';
    return api('/api/activity?action=themes' + qs);
  }
  function noticeTarget(value) { return ({ 학생: 'STUDENT', 선생님: 'TEACHER', 원장: 'DIRECTOR', 본사: 'MASTER', 학원: 'DIRECTOR', '가맹 학원': 'DIRECTOR' })[value] || null; }
  async function saveNotice(item) {
    var result = await manage('notices', 'save', { id: typeof item.id === 'string' && !/^NOT-/.test(item.id) ? item.id : undefined,
      title: item.title, content: item.content, isPinned: item.isPinned === true, isPopup: item.isPopup === true,
      popupStartDate: item.popupStartDate || '', popupEndDate: item.popupEndDate || '',
      category: item.category || '일반 공지', status: item.status || '게시중', link: item.link || '',
      target: item.target || '전체', targetRole: item.targetRole || noticeTarget(item.target) });
    if (result.item) item.id = result.item.id;
    return result.item;
  }
  async function deleteNotice(item) { return manage('notices', 'delete', { id: item.id }); }
  function themeIdFor(item) {
    var key = String(item.themeTag || item.tag || '').replace(/^#/, '');
    var found = (global.NANO_SERVER_THEMES || []).find(function (theme) { return theme.id === item.themeId || theme.name === key || theme.title === key; });
    return found ? found.id : (item.themeId || null);
  }
  async function saveBook(item) {
    var tags = Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || item.detailTag || '');
    var keyHint = String(item.isbn || item.bookNo || item.id || '').replace(/[^A-Za-z0-9_-]/g, '');

    // 1) 표지 이미지 파일 또는 DataURL이 첨부된 경우 클라우드(R2)/서버 업로드 후 URL 확보
    var coverUrl = item.coverUrl || item.cover || '';
    if (item.coverFile) {
      coverUrl = await uploadMedia(item.coverFile, { category: 'book-cover', keyHint: keyHint, fileName: item.coverFile.name || (keyHint + '.jpg') });
    } else if (/^data:image\//i.test(coverUrl)) {
      coverUrl = await uploadMedia(coverUrl, { category: 'book-cover', keyHint: keyHint, fileName: (keyHint || 'cover') + '.jpg' });
    }

    // 2) 나노시트 PDF 파일 또는 DataURL이 첨부된 경우 클라우드(R2)/서버 업로드 후 URL 확보
    var rawWs = (typeof item.worksheetUrl === 'string' ? item.worksheetUrl : '') || (typeof item.worksheet === 'string' ? item.worksheet : '') || (typeof item.pdfUrl === 'string' ? item.pdfUrl : '');
    var sheetBlob = item.pdfBlob || (item.sheetFile && (item.sheetFile.file || item.sheetFile.blob || item.sheetFile.pdfBlob)) || null;
    var sheetDataUrl = item.pdfDataUrl || (item.sheetFile && item.sheetFile.dataUrl) || '';
    var worksheetUrl = rawWs;
    var protectedSheet = global.ContentSharing && (sheetBlob || /^data:application\/pdf/i.test(sheetDataUrl || worksheetUrl));
    if (protectedSheet) {
      if (!sheetBlob) sheetBlob = await (await fetch(sheetDataUrl || worksheetUrl)).blob();
      if (sheetBlob.size > 25 * 1024 * 1024 || await sheetBlob.slice(0, 5).text() !== '%PDF-') throw new Error('25MB 이하의 유효한 PDF 파일을 선택해 주세요.');
      worksheetUrl = undefined;
    } else if (sheetBlob) {
      var sName = (item.sheetFile && item.sheetFile.name) || item.materialName || ((keyHint || 'sheet') + '.pdf');
      worksheetUrl = await uploadMedia(sheetBlob, { category: 'nano-sheet', keyHint: keyHint, fileName: sName, contentType: 'application/pdf' });
    } else if (/^data:application\/pdf/i.test(sheetDataUrl || worksheetUrl)) {
      worksheetUrl = await uploadMedia(sheetDataUrl || worksheetUrl, { category: 'nano-sheet', keyHint: keyHint, fileName: (keyHint || 'sheet') + '.pdf', contentType: 'application/pdf' });
    }

    if (coverUrl && (/^javascript:/i.test(coverUrl) || !/^(https?:\/\/|\/|\.\/|data:)/i.test(coverUrl))) coverUrl = '';
    if (worksheetUrl && (/^javascript:/i.test(worksheetUrl) || !/^(https?:\/\/|\/|\.\/|data:)/i.test(worksheetUrl))) worksheetUrl = '';
    var subCat = item.subCategory || (item.cat1 && item.cat1.includes('비문학') ? 'C' : (item.cat1 && item.cat1.includes('인물') ? 'B' : 'A'));
    var result = await manage('books', 'save', { id: item.serverId || undefined, bookNo: item.bookNo || item.id, title: item.title, author: item.author || '', publisher: item.publisher || item.pub || '',
      isbn: item.isbn || '', grade: item.grade || '', category: item.cat2 === '외서' ? 'F' : (item.cat2 === '국내서' ? 'K' : (item.category || '')), subCategory: subCat, description: item.description || item.synopsis || '',
      thinkTitle: item.thinkTitle || item.thinkExtract || item.thinkOpen || '', thinkQuiz: item.thinkQuiz || item.thinkInsert || '', coverUrl: coverUrl, worksheetUrl: (worksheetUrl && !/^\/api\/content\?/.test(worksheetUrl)) ? worksheetUrl : undefined, tags: tags, series: item.series || '',
      awards: item.awards || item.award || '', themeTag: item.themeTag || item.tag || '', themeId: themeIdFor(item), isRecommended: item.isRecommended === true });
    if (result.item) {
      item.serverId = result.item.id;
      if (result.item.coverUrl) { item.cover = result.item.coverUrl; item.coverUrl = result.item.coverUrl; }
      if (result.item.worksheetUrl) { item.worksheetUrl = result.item.worksheetUrl; item.pdfUrl = result.item.worksheetUrl; item.hasSheet = true; item.sheet = true; }
      delete item.coverFile;
    }
    if (protectedSheet) {
      await global.ContentSharing.saveSheet(item, sheetBlob, item.sheetIsPublic || 'Y');
      delete item.pdfBlob; delete item.pdfDataUrl; delete item.sheetFile;
    }
    return result.item;
  }
  async function deleteBook(item) { return manage('books', 'delete', { id: item.serverId }); }
  async function syncQuizzes(book, questions) {
    if (!book.serverId) throw new Error('도서 정보를 새로고침한 뒤 다시 시도해 주세요.');
    if ((questions || []).some(function(question) { return question.type && question.type !== 'CHOICE'; })) throw new Error('운영 북퀴즈는 현재 객관식 문항만 저장할 수 있습니다.');
    var result = await manage('quizzes', 'replace', { bookId: book.serverId, questions: questions.map(function(question) {
      return { question: question.question, options: question.choices || question.options || [question.opt1, question.opt2, question.opt3, question.opt4, question.opt5].filter(Boolean), correctAnswer: Number(question.ans || question.correctAnswer) };
    }) });
    (result.items || []).forEach(function(item, index) { questions[index].serverId = item.id; });
  }
  async function saveOwnedBook(item, academyCode) { return manage('owned', 'save', { bookId: item.serverId }, { academy: academyCode }); }
  async function deleteOwnedBook(ownedId, academyCode) { return manage('owned', 'delete', { id: ownedId }, { academy: academyCode }); }
  async function saveAssignment(book, member, classGroup, academyCode) {
    return manage('assignments', 'save', {
      bookId: book.serverId || book.id,
      memberId: member && (member.serverId || member.id),
      classGroupId: classGroup && (classGroup.serverId || classGroup.id)
    }, { academy: academyCode });
  }
  async function deleteAssignment(id, academyCode) { return manage('assignments', 'delete', { id: id }, { academy: academyCode }); }
  async function saveClassAssignments(books, classGroup, academyCode) {
    return api(manageUrl('assignments', academyCode), { operation: 'save', data: {
      bookIds: books.map(function(book) { return book.serverId || book.id; }),
      classGroupId: classGroup.serverId || classGroup.id
    } }, 45000);
  }
  async function generatePortfolioAI(portfolioId) {
    return api('/api/portfolio-ai', { portfolioId: portfolioId, academy: academy() }, 60000);
  }
  async function refreshPortfolios() {
    var result = await manageList('portfolios');
    if (typeof portfolioList === 'undefined' || typeof portfolioDataMap === 'undefined') return result;
    portfolioDataMap = {};
    portfolioList = (result.items || []).map(function (item) {
      var student = (global.studentDataList || []).find(function (entry) { return entry.serverId === item.memberId; });
      var studentId = student ? student.id : item.memberId;
      var books = Array.isArray(item.books) ? item.books.slice() : [];
      // 서버 포트폴리오에 도서 목록이 비어있을 경우 원생의 실제 인증 도서 이력으로 자동 보완
      if (books.length === 0 && typeof global.getStudentCertifiedBooksForWizard === 'function') {
        var fallbackCert = global.getStudentCertifiedBooksForWizard(studentId) || [];
        books = fallbackCert.map(function (fb) {
          return {
            title: fb.title,
            date: fb.date,
            score: parseFloat(String(fb.score || '0').replace(/[^0-9.]/g, '')) || 0,
            cover: fb.cover || '',
            pub: fb.pub || '',
            author: fb.author || '',
            thought: fb.comment || ''
          };
        });
      }
      var avgScore = books.length ? Math.round(books.reduce(function(sum, book) { return sum + (Number(book.score) || 0); }, 0) / books.length) : 0;
      var pfEntry = { name: item.name, school: student ? ((student.school || '') + ' ' + (student.grade || '')) : (item.school ? ((item.school || '') + ' ' + (item.grade || '')) : ''), classGroup: student ? student.classGroup : (item.classGroup || '미지정'),
        teacher: (student && student.teacher) || item.teacher || '', level: student ? student.level : '', bookCount: books.length,
        quizAvg: avgScore,
        books: books.map(function(book) {
          var bIdStr = String(book.bookId || book.bookNo || '').trim();
          var matchedBook = (global.academyBookList || []).find(function(ab) {
            if (!ab) return false;
            if (bIdStr && (String(ab.serverId || '') === bIdStr || String(ab.id || '') === bIdStr || String(ab.bookNo || '') === bIdStr)) return true;
            return ab.title && (ab.title === book.title || ab.title.replace(/\s+/g, '') === (book.title || '').replace(/\s+/g, ''));
          });
          var numScore = parseFloat(String(book.score || 0).replace(/[^0-9.]/g, '')) || 0;
          return {
            bookId: book.bookId,
            bookNo: book.bookNo || (matchedBook ? (matchedBook.bookNo || matchedBook.id) : ''),
            subCategory: book.subCategory || (matchedBook ? matchedBook.subCategory : ''),
            cat1: book.cat1 || (matchedBook ? matchedBook.cat1 : ''), category: book.category || (matchedBook ? matchedBook.category : ''), subject: book.subject || (matchedBook ? matchedBook.subject : ''), tags: Array.isArray(book.tags) && book.tags.length > 0 ? book.tags : (matchedBook && matchedBook.tags ? matchedBook.tags : []),
            title: book.title,
            date: book.date,
            score: Math.round(numScore) + '점',
            cover: book.cover || (matchedBook ? matchedBook.cover : 'resources/images/book_default.svg'),
            pub: book.pub || book.publisher || (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '나노출판'),
            author: book.author || (matchedBook ? matchedBook.author : ''),
            achievement: book.achievement || '', thoughtTeacherComment: book.thoughtTeacherComment || '', worksheetAiResult: book.worksheetAiResult || null,
            comment: book.thought || book.comment || ''
          };
        }), teacherNote: item.commentSource === 'teacher' ? (item.comment || item.aiTeacherNote || '') : (item.aiTeacherNote || item.comment || ''),
        commentSource: item.commentSource || '', comment: item.comment || '', aiTeacherNote: item.aiTeacherNote || '', aiComments: item.aiComments || [], aiVersion: item.aiVersion || 0 };
      // 포트폴리오 고유 ID별 저장 + 원생별 최신(도서 존재 우선) 포트폴리오 유지 (과거 0권 포트폴리오가 덮어쓰는 현상 방지)
      portfolioDataMap[item.id] = pfEntry;
      if (!portfolioDataMap[studentId] || (portfolioDataMap[studentId].bookCount === 0 && pfEntry.bookCount > 0)) {
        portfolioDataMap[studentId] = pfEntry;
      }
      return { id: item.id, revision: item.revision, memberId: item.memberId, studentId: studentId, studentName: item.name, school: student ? student.school : '', grade: student ? student.grade : '',
        classGroup: student ? student.classGroup : '미지정', title: item.title, period: item.from + ' ~ ' + item.to, from: item.from, to: item.to, comment: item.comment || '',
        bookCount: books.length, booksSummary: books.length ? books[0].title + (books.length > 1 ? ' 외 ' + (books.length - 1) + '권' : '') : '완독 도서 없음',
        quizAvg: avgScore + '점', issueDate: String(item.createdAt || '').replace('T', ' ').slice(0, 16), status: '발급 완료', kakaoSent: false };
    });
    if (typeof renderPortfolioTable === 'function') renderPortfolioTable(portfolioList);
    if (typeof initPortfolioOptions === 'function') initPortfolioOptions();
    return result;
  }
  async function savePortfolio(data, academyCode) { return manage('portfolios', 'save', data, { academy: academyCode }); }
  async function deletePortfolio(id, academyCode) { return manage('portfolios', 'delete', { id: id }, { academy: academyCode }); }
  async function saveManualPoint(data, academyCode) { return manage('points', 'save', data, { academy: academyCode }); }
  async function refreshActivity() { var sequence = ++activitySequence; var result = await api('/api/activity'); if (sequence === activitySequence) { activity = result; window.dispatchEvent(new Event('nano:activity')); } return activity; }
  async function refreshAssignments() {
    var result = await api('/api/activity?action=assignments&academy=' + encodeURIComponent(academy() || ''));
    if (typeof studentAssignmentList !== 'undefined') {
      studentAssignmentList = (result.students || []).map(function(s) {
        var total = (s.books || []).length;
        var completed = s.completedBooks || 0;
        if (!s.status) {
          s.status = total > 0 ? (completed >= total ? '완료' : '읽는 중 (' + completed + '/' + total + '권)') : '배정 없음';
        }
        return s;
      });
      classAssignmentList = result.classes || [];
      assignmentLoadError = false;
    }
    if (typeof renderStudentAssignmentTable === 'function') renderStudentAssignmentTable();
    if (typeof renderClassAssignmentTable === 'function') renderClassAssignmentTable();
    if (typeof renderIndivBookCatalog === 'function') renderIndivBookCatalog();
    if (typeof renderIndivStudentAssignedBooks === 'function') renderIndivStudentAssignedBooks(typeof currentIndivStudentId !== 'undefined' ? currentIndivStudentId : null);
    return result;
  }
  async function request(action, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch('/api/portal?action=' + encodeURIComponent(action), {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal
      });
      var data;
      try { data = await response.json(); } catch(e) { throw new Error('운영 서버에 연결할 수 없습니다.'); }
      if (!response.ok) {
        if (response.status === 401 && data && (data.concurrentLoggedOut || (typeof data.error === 'string' && data.error.indexOf('다른 기기에서 로그인하여') !== -1))) {
          handleConcurrentLogout(data.error);
          var concurrentErr = new Error(data.error);
          concurrentErr.status = 401;
          concurrentErr.concurrentLoggedOut = true;
          throw concurrentErr;
        }
        var err = new Error(data.error || '서버 요청에 실패했습니다.');
        err.status = response.status;
        err.conflict = data.conflict;
        err.concurrentLogin = data.concurrentLogin;
        throw err;
      }
      return data;
    } catch(e) { if (e.name === 'AbortError') throw new Error('서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.'); throw e; }
    finally { clearTimeout(timer); }
  }
  function user() { try { return JSON.parse(sessionStorage.getItem('nano_auth_user') || 'null'); } catch(e) { return null; } }
  function applyLearning(log) {
    if (!log) return;
    learningOverlay.set(log.id, log);
    memoryLogs = [log].concat((memoryLogs || []).filter(function(item) { return item.id !== log.id; }));
  }
  async function refreshLearning() {
    var scope = academy();
    if (learningRefresh && learningRefresh.scope === scope) return learningRefresh.promise;
    var task = { scope: scope };
    task.promise = (async function() {
      var collected = [], cursor = '', isFirstPage = true;
      do {
        var result = await api('/api/portal?action=learning&limit=500&academy=' + encodeURIComponent(scope || '') + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
        collected = collected.concat(result.logs); cursor = result.nextCursor;
        if (isFirstPage && cursor && scope === academy()) {
          isFirstPage = false;
          var firstById = new Map(collected.map(function(log) { return [log.id, log]; }));
          learningOverlay.forEach(function(log, id) { if (String(log.academyId) === String(scope) && !firstById.has(id)) firstById.set(id, log); });
          memoryLogs = Array.from(firstById.values()).sort(function(a,b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)) || b.id.localeCompare(a.id); });
          if (typeof renderLearningTable === 'function') renderLearningTable();
          if (typeof renderAdminRankingView === 'function') renderAdminRankingView(true);
          if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
        }
      } while (cursor);
      if (scope === academy()) {
        // 조회 중 완료된 제출이 오래된 응답으로 사라지지 않도록 합칩니다.
        var byId = new Map(collected.map(function(log) { return [log.id, log]; }));
        learningOverlay.forEach(function(log, id) { if (String(log.academyId) === String(scope)) { if (!byId.has(id)) byId.set(id, log); else learningOverlay.delete(id); } });
        memoryLogs = Array.from(byId.values()).sort(function(a,b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)) || b.id.localeCompare(a.id); });
      }
      return memoryLogs;
    })();
    learningRefresh = task;
    try { return await task.promise; } finally { if (learningRefresh === task) learningRefresh = null; }
  }
  async function logout() {
    if (remote) await request('logout', {});
    sessionStorage.removeItem('nano_auth_user');
    location.href = 'index.html';
  }
  global.NanoPortal = { remote: remote, request: request, api: api, manage: manage, manageList: manageList, academy: academy, uploadMedia: uploadMedia,
    saveMember: saveMember, deleteMember: deleteMember, saveAcademy: saveAcademy, deleteAcademy: deleteAcademy, restoreAcademy: restoreAcademy, saveClass: saveClass, deleteClass: deleteClass,
    saveBanner: saveBanner, deleteBanner: deleteBanner, saveTheme: saveTheme, deleteTheme: deleteTheme, reorderThemes: reorderThemes, fetchThemes: fetchThemes, saveNotice: saveNotice, deleteNotice: deleteNotice,
    saveBook: saveBook, deleteBook: deleteBook, syncQuizzes: syncQuizzes, saveOwnedBook: saveOwnedBook, deleteOwnedBook: deleteOwnedBook, saveAssignment: saveAssignment, deleteAssignment: deleteAssignment,
    refreshPortfolios: refreshPortfolios, savePortfolio: savePortfolio, deletePortfolio: deletePortfolio, saveManualPoint: saveManualPoint,
    saveClassAssignments: saveClassAssignments, generatePortfolioAI: generatePortfolioAI,
    refreshActivity: refreshActivity, refreshAssignments: refreshAssignments, activity: function() { return activity; }, applyLearning: applyLearning, user: user, refreshLearning: refreshLearning, logout: logout, handleConcurrentLogout: handleConcurrentLogout,
    applyReview: function (log) { if (memoryLogs) memoryLogs = memoryLogs.map(function (item) { return item.id === log.id ? log : item; }); },
    logs: function () { return memoryLogs; } };
  var page = location.pathname.split('/').pop().replace(/\.html$/, '');
  var roles = {
    student_preview: ['student'],
    admin_preview: ['admin', 'director', 'teacher', 'master'],
    master_preview: ['master']
  };
  function checkRole(pageRoles, userRole) {
    if (!userRole) return false;
    var r = String(userRole).toLowerCase();
    return (pageRoles || []).some(function(allowed) { return allowed.toLowerCase() === r; });
  }

  if (!roles[page]) {
    global.addEventListener('DOMContentLoaded', function() {
      if (remote) { var demo = document.querySelector('.quick-test-box'); if(demo) demo.hidden = true; }
      var notice = sessionStorage.getItem('nano_login_notice');
      if (notice) { var message = document.getElementById('errorMessage'); var alertBox = document.getElementById('errorAlert'); if(message && alertBox) { message.textContent = notice; alertBox.style.display = 'block'; } sessionStorage.removeItem('nano_login_notice'); }
    });
    return;
  }

  var sessionWatcherTimer = null;
  function startSessionWatcher() {
    if (sessionWatcherTimer) return;
    async function checkConcurrentSession() {
      try {
        var res = await fetch('/api/portal?action=session', { credentials: 'same-origin', cache: 'no-store' });
        if (res.status === 401) {
          var data = await res.json().catch(function() { return {}; });
          if (data && (data.concurrentLoggedOut || (typeof data.error === 'string' && data.error.indexOf('다른 기기에서 로그인하여') !== -1))) {
            if (sessionWatcherTimer) { clearInterval(sessionWatcherTimer); sessionWatcherTimer = null; }
            handleConcurrentLogout(data.error);
          }
        }
      } catch (e) {}
    }
    sessionWatcherTimer = setInterval(checkConcurrentSession, 5000);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') checkConcurrentSession();
    });
    window.addEventListener('focus', function() {
      checkConcurrentSession();
    });
  }

  async function verify() {
    try {
      if (remote && global.NANO_BOOTSTRAP_FAILED) throw new Error('회원 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
      // 보호된 초기 데이터가 이미 같은 세션을 검증하고 사용자 정보를 저장했습니다.
      // 초기 데이터가 없는 예외 상황에서만 세션 API를 한 번 더 확인합니다.
      var current = remote && global.NANO_SERVER_DATA ? user() : remote ? (await request('session')).user : user();
      if (!current || !checkRole(roles[page], current.role)) throw new Error('로그인 권한을 확인해 주세요.');
      sessionStorage.setItem('nano_auth_user', JSON.stringify(current));

      // master 계정이 아닌 경우 중복 로그인 감시 타이머 시작
      if (remote && current && current.role !== 'master') {
        startSessionWatcher();
      }

      // 세션 확인 즉시 화면 렌더링 활성화
      document.documentElement.style.visibility = '';
      if (typeof renderLearningTable === 'function') renderLearningTable();
      if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
      window.dispatchEvent(new Event('nano:ready'));

      // 백그라운드 데이터 비동기 동기화 (화면 블로킹 차단)
      if (remote && page !== 'master_preview') {
        refreshLearning().then(function() {
          if (typeof renderLearningTable === 'function') renderLearningTable();
          if (typeof renderAdminRankingView === 'function') renderAdminRankingView(true);
          if (typeof updateAcademyStats === 'function') updateAcademyStats();
          if (typeof renderStudentAssignmentTable === 'function') renderStudentAssignmentTable();
          if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
          if (page === 'admin_preview' && typeof portfolioList !== 'undefined') {
            refreshPortfolios().catch(function() {});
          }
        }).catch(function() {});

        if (page === 'student_preview') {
          refreshActivity().then(function() {
            if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
          }).catch(function() {});
        } else {
          Promise.all([refreshAssignments(), refreshPortfolios()]).catch(function() {});
        }
      }
    } catch(e) {
      document.documentElement.style.visibility = '';
      sessionStorage.removeItem('nano_auth_user');
      sessionStorage.setItem('nano_login_notice', e.message);
      location.replace('index.html');
    }
  }

  if (document.readyState === 'loading') {
    global.addEventListener('DOMContentLoaded', verify);
  } else {
    verify();
  }
  global.addEventListener('pageshow', function (event) { if (event.persisted) { verify(); } });
})(window);
