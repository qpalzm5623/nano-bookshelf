<?php
/**
 * 슈퍼어드민(admin_level=0) - 전체 결제 내역 조회 및 관리
 * URL: /admin/master/payment_list
 *
 * [기능]
 * - 기간/상태/요금제/학원명 검색 필터
 * - 결제 내역 테이블 (학원명, 아이디, 요금제, 금액, 상태, 기간)
 * - 상태 수동 변경 드롭다운 (인라인)
 * - 상세보기 팝업 링크
 */
?>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="/admin/main">Home</a></li>
            <li class="breadcrumb-item active">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <section class="content">
    <div class="container-fluid">

      <!-- ─── 검색 폼 ─── -->
      <div class="card mb-3">
        <form id="searchForm" method="get" action="/admin/master/payment_list">
          <div class="card-body">

            <!-- 기간 검색 -->
            <div class="row row-search mb-2">
              <div class="col-sm-1 col-form-label font-weight-bold">결제일</div>
              <div class="col-sm-9 d-flex align-items-center flex-wrap">
                <div class="mr-3">
                  <input type="radio" name="searchTermType" value=""
                         <?php echo (empty($_GET['searchTermType']) ? 'checked' : ''); ?>> 전체
                </div>
                <div class="mr-3">
                  <input type="radio" name="searchTermType" value="term"
                         <?php echo (isset($_GET['searchTermType']) && $_GET['searchTermType']==='term' ? 'checked' : ''); ?>> 설정
                </div>
                <input type="date" class="form-control" style="width:150px; margin:4px 4px;"
                       name="startDate" value="<?php echo htmlspecialchars($_GET['startDate'] ?? ''); ?>">
                <span class="mx-2">~</span>
                <input type="date" class="form-control" style="width:150px; margin:4px 4px;"
                       name="endDate" value="<?php echo htmlspecialchars($_GET['endDate'] ?? ''); ?>">
              </div>
            </div>

            <!-- 결제 상태 -->
            <div class="row row-search mb-2">
              <div class="col-sm-1 col-form-label font-weight-bold">결제 상태</div>
              <div class="col-sm-9 d-flex align-items-center flex-wrap">
                <?php
                  $status_opts = array('' => '전체', 'pending' => '결제대기', 'paid' => '결제완료', 'failed' => '결제실패', 'cancelled' => '취소', 'refunded' => '환불');
                  foreach ($status_opts as $val => $label):
                    $checked = (isset($_GET['searchStatus']) && $_GET['searchStatus'] === $val) ? 'checked' : '';
                    if ($val === '' && !isset($_GET['searchStatus'])) $checked = 'checked';
                ?>
                <div class="mr-3">
                  <input type="radio" name="searchStatus" value="<?php echo $val; ?>" <?php echo $checked; ?>>
                  <?php echo $label; ?>
                </div>
                <?php endforeach; ?>
              </div>
            </div>

            <!-- 요금제 -->
            <div class="row row-search mb-2">
              <div class="col-sm-1 col-form-label font-weight-bold">요금제</div>
              <div class="col-sm-9 d-flex align-items-center flex-wrap">
                <?php
                  $plan_opts = array('' => '전체', 'monthly' => '월 구독', '6month' => '6개월', '12month' => '12개월');
                  foreach ($plan_opts as $val => $label):
                    $checked = (isset($_GET['searchPlanType']) && $_GET['searchPlanType'] === $val) ? 'checked' : '';
                    if ($val === '' && !isset($_GET['searchPlanType'])) $checked = 'checked';
                ?>
                <div class="mr-3">
                  <input type="radio" name="searchPlanType" value="<?php echo $val; ?>" <?php echo $checked; ?>>
                  <?php echo $label; ?>
                </div>
                <?php endforeach; ?>
              </div>
            </div>

            <!-- 키워드 -->
            <div class="row row-search mb-2">
              <div class="col-sm-1 col-form-label font-weight-bold">검색어</div>
              <div class="col-sm-6">
                <input type="text" class="form-control" name="keyword"
                       placeholder="학원명 또는 아이디를 입력해 주세요."
                       value="<?php echo htmlspecialchars($_GET['keyword'] ?? ''); ?>">
              </div>
            </div>

          </div><!-- /.card-body -->
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-search mr-1"></i> 검색
            </button>
            <a href="/admin/master/payment_list" class="btn btn-secondary ml-2">
              <i class="fas fa-undo mr-1"></i> 초기화
            </a>
          </div>
        </form>
      </div><!-- /.card (검색폼) -->

      <!-- ─── 결제 내역 테이블 ─── -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-credit-card mr-1"></i>
            결제 내역
            <span class="badge badge-secondary ml-2">총 <?php echo (int)($list_total ?? 0); ?>건</span>
          </h3>
        </div>
        <div class="card-body p-0">
          <table class="table table-bordered table-hover table-striped mb-0">
            <thead class="thead-dark">
              <tr>
                <th class="text-center" style="width:50px;">No</th>
                <th class="text-center">학원명</th>
                <th class="text-center" style="width:120px;">아이디</th>
                <th class="text-center" style="width:100px;">요금제</th>
                <th class="text-center" style="width:120px;">금액 (VAT별도)</th>
                <th class="text-center" style="width:110px;">합계 (VAT포함)</th>
                <th class="text-center" style="width:130px;">상태</th>
                <th class="text-center" style="width:110px;">만료일</th>
                <th class="text-center" style="width:100px;">결제일</th>
                <th class="text-center" style="width:70px;">상세</th>
              </tr>
            </thead>
            <tbody>
              <?php if (!empty($list)): ?>
                <?php
                  $row_num_start = ($list_total ?? 0) - ($num ?? 0);
                  foreach ($list as $i => $row):
                    $status     = $row['payment_status'] ?? '';
                    $status_cls = array(
                      'pending'   => 'badge-secondary',
                      'paid'      => 'badge-success',
                      'failed'    => 'badge-danger',
                      'cancelled' => 'badge-warning',
                      'refunded'  => 'badge-info',
                    );
                    $cls = $status_cls[$status] ?? 'badge-secondary';
                ?>
                <tr>
                  <td class="text-center"><?php echo $row_num_start - $i; ?></td>
                  <td><?php echo htmlspecialchars($row['group_name'] ?? '-'); ?></td>
                  <td class="text-center"><?php echo htmlspecialchars($row['user_id'] ?? '-'); ?></td>
                  <td class="text-center"><?php echo htmlspecialchars($row['plan_type_label'] ?? '-'); ?></td>
                  <td class="text-right"><?php echo number_format($row['plan_amount'] ?? 0); ?>원</td>
                  <td class="text-right"><strong><?php echo number_format($row['total_amount'] ?? 0); ?>원</strong></td>
                  <td class="text-center">
                    <!-- 상태 수동 변경 드롭다운 -->
                    <select class="form-control form-control-sm status-changer"
                            data-seq="<?php echo $row['payment_seq']; ?>"
                            style="min-width:90px;">
                      <option value="pending"   <?php echo $status==='pending'   ? 'selected' : ''; ?>>결제대기</option>
                      <option value="paid"      <?php echo $status==='paid'      ? 'selected' : ''; ?>>결제완료</option>
                      <option value="failed"    <?php echo $status==='failed'    ? 'selected' : ''; ?>>결제실패</option>
                      <option value="cancelled" <?php echo $status==='cancelled' ? 'selected' : ''; ?>>취소</option>
                      <option value="refunded"  <?php echo $status==='refunded'  ? 'selected' : ''; ?>>환불</option>
                    </select>
                  </td>
                  <td class="text-center"><?php echo $row['end_date'] ? htmlspecialchars($row['end_date']) : '-'; ?></td>
                  <td class="text-center"><?php echo htmlspecialchars($row['reg_date'] ?? '-'); ?></td>
                  <td class="text-center">
                    <button type="button" class="btn btn-xs btn-outline-info btn-detail"
                            data-seq="<?php echo $row['payment_seq']; ?>">
                      <i class="fas fa-search"></i>
                    </button>
                  </td>
                </tr>
                <?php endforeach; ?>
              <?php else: ?>
              <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                  <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                  검색 결과가 없습니다.
                </td>
              </tr>
              <?php endif; ?>
            </tbody>
          </table>
        </div><!-- /.card-body -->

        <!-- 페이징 -->
        <?php if (!empty($paging)): ?>
        <div class="card-footer clearfix">
          <ul class="pagination pagination-sm m-0 float-right">
            <?php foreach ($paging as $page): ?>
              <?php echo $page['no']; ?>
            <?php endforeach; ?>
          </ul>
        </div>
        <?php endif; ?>

      </div><!-- /.card (테이블) -->

    </div><!-- /.container-fluid -->
  </section>
</div><!-- /.content-wrapper -->

<!-- ─── 상세 팝업 iframe 컨테이너 ─── -->
<script>
(function() {
  var csrfName  = '<?php echo $this->security->get_csrf_token_name(); ?>';
  var csrfHash  = '<?php echo $this->security->get_csrf_hash(); ?>';

  // ─── 상태 수동 변경 ───
  $(document).on('change', '.status-changer', function() {
    var $sel         = $(this);
    var payment_seq  = $sel.data('seq');
    var new_status   = $sel.val();
    var confirm_msg  = '결제 상태를 변경하시겠습니까?';

    if (!confirm(confirm_msg)) {
      // 취소 시 원래 값으로 되돌리기 위해 페이지 새로고침
      location.reload();
      return;
    }

    var data = {};
    data[csrfName]      = csrfHash;
    data.payment_seq    = payment_seq;
    data.payment_status = new_status;

    $.ajax({
      url: '/admin/master/payment_status_update',
      method: 'POST',
      data: data,
      dataType: 'json',
      success: function(res) {
        if (res.result === 'ok') {
          // 성공 토스트 대신 간단한 배경색 변경으로 피드백
          $sel.closest('tr').effect('highlight', {color: '#d4edda'}, 1000);
        } else {
          alert(res.msg || '상태 변경에 실패했습니다.');
          location.reload();
        }
      },
      error: function() {
        alert('서버 오류가 발생했습니다.');
        location.reload();
      }
    });
  });

  // ─── 상세보기 팝업 ───
  $(document).on('click', '.btn-detail', function() {
    var seq    = $(this).data('seq');
    var width  = 700;
    var height = 600;
    var left   = (screen.width  - width)  / 2;
    var top    = (screen.height - height) / 2;
    window.open(
      '/admin/master/payment_detail/' + seq,
      'paymentDetail',
      'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes'
    );
  });
})();
</script>
