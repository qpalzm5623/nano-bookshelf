<!-- Content Wrapper. Contains page content -->
<div class="wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-8">
          <h1><i class="fas fa-cloud-upload-alt text-primary mr-2"></i>대량 파일 일괄 업로드 <small class="text-muted">(FTP 대체 웹 업로더)</small></h1>
        </div>
        <div class="col-sm-4 text-right">
          <button type="button" class="btn btn-default btn-sm" onclick="window.close();"><i class="fas fa-times mr-1"></i>닫기</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="card card-primary card-outline">
        <div class="card-body">

          <!-- 1. 업로드 설정 옵션 -->
          <div class="row mb-3 p-3" style="background:#f8f9fa; border-radius:8px; border:1px solid #e9ecef;">
            <div class="col-md-4">
              <label class="font-weight-bold"><i class="fas fa-folder-open text-info mr-1"></i>1. 파일 종류 선택</label>
              <div>
                <div class="custom-control custom-radio custom-control-inline">
                  <input type="radio" id="type_cover" name="upload_type" class="custom-control-input" value="cover" checked onchange="changeUploadType()">
                  <label class="custom-control-label" for="type_cover">도서 표지 이미지 <span class="badge badge-info">jpg, png, webp</span></label>
                </div>
                <div class="custom-control custom-radio custom-control-inline">
                  <input type="radio" id="type_sheet" name="upload_type" class="custom-control-input" value="sheet" onchange="changeUploadType()">
                  <label class="custom-control-label" for="type_sheet">나노시트 활동지 <span class="badge badge-warning">pdf, pptx</span></label>
                </div>
              </div>
            </div>

            <div class="col-md-4">
              <label class="font-weight-bold"><i class="fas fa-link text-success mr-1"></i>2. 도서 매칭 기준</label>
              <select id="match_type" class="form-control form-control-sm">
                <option value="book_no" selected>도서 번호 (Book No) - 예: 1001.jpg, 1001_cover.jpg [권장]</option>
                <option value="isbn">ISBN 코드 - 예: 9791190000000.jpg</option>
                <option value="name">도서명 (정확한 제목) - 예: 어린왕자.jpg</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="font-weight-bold"><i class="fas fa-cog text-secondary mr-1"></i>3. 옵션</label>
              <div class="custom-control custom-checkbox mt-1">
                <input type="checkbox" class="custom-control-input" id="auto_open" checked value="Y">
                <label class="custom-control-label text-primary" for="auto_open">
                  표지 등록 시 자동으로 도서 '공개(Y)' 전환
                </label>
              </div>
            </div>
          </div>

          <!-- 2. 드래그앤드롭 영역 -->
          <div id="dropZone" style="border: 2px dashed #007bff; border-radius: 12px; padding: 35px 20px; text-align: center; background: #fdfefe; cursor: pointer; transition: all 0.2s ease;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #007bff; margin-bottom: 10px;"></i>
            <h5 class="font-weight-bold text-dark mb-1">여기로 파일들을 드래그하여 끌어다 놓으세요</h5>
            <p class="text-muted mb-2">또는 여기를 클릭하여 컴퓨터에서 파일을 복수 선택(다중 선택)할 수 있습니다.</p>
            <span class="badge badge-light border text-secondary" id="acceptNotice">허용 확장자: jpg, jpeg, png, gif, webp</span>
            <input type="file" id="fileInput" multiple style="display: none;" accept=".jpg,.jpeg,.png,.gif,.webp">
          </div>

          <!-- 3. 진행 상황 및 프로그레스 바 -->
          <div id="progressArea" class="mt-3" style="display: none;">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="font-weight-bold" id="progressStatusText">업로드 준비 중...</span>
              <span class="font-weight-bold text-primary" id="progressPercent">0%</span>
            </div>
            <div class="progress" style="height: 18px; border-radius: 9px;">
              <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%;">0%</div>
            </div>
          </div>

          <!-- 4. 업로드 목록 및 실시간 처리 결과 테이블 -->
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="font-weight-bold text-dark mb-0">
                <i class="fas fa-list-ul mr-1"></i>파일 목록 (<span id="totalCount">0</span>개 대기 중)
              </h6>
              <div>
                <button type="button" class="btn btn-sm btn-outline-danger" id="btnClear" onclick="clearList()" style="display:none;">
                  <i class="fas fa-trash-alt mr-1"></i>목록 비우기
                </button>
                <button type="button" class="btn btn-sm btn-primary px-3 ml-1" id="btnStart" onclick="startBatchUpload()" disabled>
                  <i class="fas fa-play mr-1"></i>업로드 시작
                </button>
              </div>
            </div>

            <div style="max-height: 280px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 6px;">
              <table class="table table-sm table-hover mb-0" id="fileTable">
                <thead class="thead-light" style="position: sticky; top: 0; z-index: 1;">
                  <tr>
                    <th style="width: 50px;" class="text-center">#</th>
                    <th>파일명</th>
                    <th style="width: 100px;">크기</th>
                    <th style="width: 120px;" class="text-center">상태</th>
                    <th>매칭 도서</th>
                    <th style="width: 70px;" class="text-center">삭제</th>
                  </tr>
                </thead>
                <tbody id="fileListBody">
                  <tr id="emptyRow">
                    <td colspan="6" class="text-center py-4 text-muted">선택된 파일이 없습니다. 상단 영역에 파일을 끌어다 놓으세요.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 5. 결과 통계 요약 -->
          <div id="summaryCard" class="mt-3 p-3 bg-light border rounded" style="display:none;">
            <div class="row text-center">
              <div class="col-4">
                <small class="text-muted">전체 파일</small>
                <h5 class="font-weight-bold text-dark" id="statTotal">0</h5>
              </div>
              <div class="col-4">
                <small class="text-success font-weight-bold">정상 매칭/등록</small>
                <h5 class="font-weight-bold text-success" id="statSuccess">0</h5>
              </div>
              <div class="col-4">
                <small class="text-danger font-weight-bold">매칭 실패/오류</small>
                <h5 class="font-weight-bold text-danger" id="statFail">0</h5>
              </div>
            </div>
          </div>

        </div>

        <div class="card-footer text-right">
          <button type="button" class="btn btn-default" onclick="closeAndRefresh()"><i class="fas fa-check mr-1"></i>작업 완료 (목록 새로고침)</button>
        </div>
      </div>
    </div>
  </section>
</div>

<script>
// 파일 큐 관리
var fileQueue = [];
var isUploading = false;
var uploadedCount = 0;
var successCount = 0;
var failCount = 0;

var dropZone = document.getElementById('dropZone');
var fileInput = document.getElementById('fileInput');

// 파일 종류 변경 시 허용 확장자 변경
function changeUploadType() {
  var type = $('input[name="upload_type"]:checked').val();
  if (type === 'cover') {
    fileInput.accept = '.jpg,.jpeg,.png,.gif,.webp';
    $('#acceptNotice').text('허용 확장자: jpg, jpeg, png, gif, webp');
  } else {
    fileInput.accept = '.pdf,.pptx,.ppt,.doc,.docx,.hwp,.hwpx,.zip';
    $('#acceptNotice').text('허용 확장자: pdf, pptx, docx, hwp, zip');
  }
}

// 드래그 앤 드롭 이벤트
dropZone.addEventListener('click', function() {
  if (!isUploading) fileInput.click();
});

dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.background = '#e8f4fd';
  dropZone.style.borderColor = '#0056b3';
});

dropZone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.background = '#fdfefe';
  dropZone.style.borderColor = '#007bff';
});

dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.background = '#fdfefe';
  dropZone.style.borderColor = '#007bff';
  if (isUploading) return;
  var files = e.dataTransfer.files;
  handleFiles(files);
});

fileInput.addEventListener('change', function(e) {
  handleFiles(e.target.files);
  fileInput.value = ''; // 초기화
});

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function handleFiles(files) {
  if (!files || files.length === 0) return;

  $('#emptyRow').hide();
  $('#btnClear').show();

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var fileId = 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    fileQueue.push({
      id: fileId,
      file: f,
      status: 'ready', // ready, uploading, success, partial, fail
      matchedBook: '-'
    });
  }

  renderQueue();
  updateButtonState();
}

function renderQueue() {
  var tbody = $('#fileListBody');
  tbody.find('.file-row').remove();

  if (fileQueue.length === 0) {
    $('#emptyRow').show();
    $('#btnClear').hide();
    $('#totalCount').text('0');
    return;
  }

  fileQueue.forEach(function(item, index) {
    var badge = '<span class="badge badge-secondary">대기중</span>';
    if (item.status === 'uploading') badge = '<span class="badge badge-primary"><i class="fas fa-spinner fa-spin mr-1"></i>업로드중</span>';
    else if (item.status === 'success') badge = '<span class="badge badge-success"><i class="fas fa-check mr-1"></i>성공</span>';
    else if (item.status === 'partial') badge = '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle mr-1"></i>도서미매칭</span>';
    else if (item.status === 'fail') badge = '<span class="badge badge-danger"><i class="fas fa-times mr-1"></i>실패</span>';

    var row = '<tr id="' + item.id + '" class="file-row">' +
      '<td class="text-center align-middle">' + (index + 1) + '</td>' +
      '<td class="align-middle font-weight-bold text-truncate" style="max-width: 250px;" title="' + item.file.name + '">' + item.file.name + '</td>' +
      '<td class="align-middle text-muted">' + formatBytes(item.file.size) + '</td>' +
      '<td class="align-middle text-center status-cell">' + badge + '</td>' +
      '<td class="align-middle matched-cell text-muted">' + item.matchedBook + '</td>' +
      '<td class="align-middle text-center">' +
        (item.status === 'ready' ? '<button type="button" class="btn btn-xs btn-outline-danger" onclick="removeFile(\'' + item.id + '\')"><i class="fas fa-times"></i></button>' : '-') +
      '</td>' +
      '</tr>';
    tbody.append(row);
  });

  $('#totalCount').text(fileQueue.length);
}

function removeFile(id) {
  if (isUploading) return;
  fileQueue = fileQueue.filter(function(item) { return item.id !== id; });
  renderQueue();
  updateButtonState();
}

function clearList() {
  if (isUploading) return;
  fileQueue = [];
  renderQueue();
  updateButtonState();
  $('#summaryCard').hide();
  $('#progressArea').hide();
}

function updateButtonState() {
  var readyCount = fileQueue.filter(function(i) { return i.status === 'ready'; }).length;
  $('#btnStart').prop('disabled', readyCount === 0 || isUploading);
}

// 업로드 시작
function startBatchUpload() {
  var readyFiles = fileQueue.filter(function(i) { return i.status === 'ready'; });
  if (readyFiles.length === 0) return;

  isUploading = true;
  uploadedCount = 0;
  successCount = 0;
  failCount = 0;

  $('#btnStart').prop('disabled', true);
  $('#btnClear').prop('disabled', true);
  $('#progressArea').show();
  $('#summaryCard').show();
  updateProgress(0, readyFiles.length);

  uploadSequential(readyFiles, 0);
}

function uploadSequential(list, index) {
  if (index >= list.length) {
    // 모든 파일 처리 완료
    isUploading = false;
    $('#progressBar').removeClass('progress-bar-animated');
    $('#progressStatusText').html('<span class="text-success font-weight-bold"><i class="fas fa-check-circle mr-1"></i>전체 업로드 완료!</span>');
    $('#btnStart').prop('disabled', true);
    $('#btnClear').prop('disabled', false);
    return;
  }

  var item = list[index];
  item.status = 'uploading';
  updateItemRow(item);

  var formData = new FormData();
  formData.append('file', item.file);
  formData.append('upload_type', $('input[name="upload_type"]:checked').val());
  formData.append('match_type', $('#match_type').val());
  formData.append('auto_open', $('#auto_open').is(':checked') ? 'Y' : 'N');
  formData.append('<?=$this->security->get_csrf_token_name();?>', '<?=$this->security->get_csrf_hash();?>');

  $.ajax({
    url: '/admin/content/batchUploadProc',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    dataType: 'json',
    success: function(res) {
      if (res.result === 'success') {
        item.status = 'success';
        item.matchedBook = '<span class="text-success font-weight-bold">[' + res.bookNo + '] ' + res.bookName + '</span>';
        successCount++;
      } else if (res.result === 'partial') {
        item.status = 'partial';
        item.matchedBook = '<span class="text-warning">파일저장됨 (도서 미매칭)</span>';
        failCount++;
      } else {
        item.status = 'fail';
        item.matchedBook = '<span class="text-danger">' + (res.msg || '실패') + '</span>';
        failCount++;
      }
    },
    error: function() {
      item.status = 'fail';
      item.matchedBook = '<span class="text-danger">통신/서버 오류</span>';
      failCount++;
    },
    complete: function() {
      uploadedCount++;
      updateItemRow(item);
      updateProgress(uploadedCount, list.length);
      uploadSequential(list, index + 1);
    }
  });
}

function updateItemRow(item) {
  var row = $('#' + item.id);
  var badge = '';
  if (item.status === 'uploading') badge = '<span class="badge badge-primary"><i class="fas fa-spinner fa-spin mr-1"></i>업로드중</span>';
  else if (item.status === 'success') badge = '<span class="badge badge-success"><i class="fas fa-check mr-1"></i>성공</span>';
  else if (item.status === 'partial') badge = '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle mr-1"></i>도서미매칭</span>';
  else if (item.status === 'fail') badge = '<span class="badge badge-danger"><i class="fas fa-times mr-1"></i>실패</span>';

  row.find('.status-cell').html(badge);
  row.find('.matched-cell').html(item.matchedBook);
}

function updateProgress(curr, total) {
  var percent = total === 0 ? 0 : Math.round((curr / total) * 100);
  $('#progressBar').css('width', percent + '%').text(percent + '%');
  $('#progressPercent').text(percent + '%');
  $('#progressStatusText').text('처리 중: ' + curr + ' / ' + total + '개 완료');

  $('#statTotal').text(total);
  $('#statSuccess').text(successCount);
  $('#statFail').text(failCount);
}

function closeAndRefresh() {
  if (window.opener && !window.opener.closed) {
    window.opener.location.reload();
  }
  window.close();
}
</script>
