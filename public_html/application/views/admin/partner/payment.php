<?php
/**
 * 학원 원장(director) - 요금제 선택 및 결제 신청 페이지
 * URL: /admin/partner/payment
 *
 * [표시 정보]
 * - 현재 구독 상태 카드
 * - 만료 D-7, D-3 경고 배너 (조건부)
 * - 3가지 요금제 선택 카드
 * - PG사 연동 준비 중 안내 모달
 */
?>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header -->
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

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">

      <?php
        // ─── 만료 임박 경고 배너 ───
        $days_left = isset($days_left) ? (int)$days_left : 0;
        $current_subscription = isset($current_subscription) ? $current_subscription : array();
      ?>

      <?php if (!empty($current_subscription) && $days_left >= 0 && $days_left <= 7): ?>
      <div class="alert <?php echo $days_left <= 3 ? 'alert-danger' : 'alert-warning'; ?> alert-dismissible">
        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
        <h5>
          <i class="icon fas <?php echo $days_left <= 3 ? 'fa-ban' : 'fa-exclamation-triangle'; ?>"></i>
          구독 만료 <?php echo $days_left <= 3 ? '긴급' : ''; ?> 안내
        </h5>
        <?php if ($days_left === 0): ?>
          <strong>오늘</strong>이 구독 만료일입니다. 지금 바로 갱신해 주세요!
        <?php else: ?>
          구독이 <strong><?php echo $days_left; ?>일 후</strong> 만료됩니다.
          서비스 중단을 방지하려면 만료 전에 갱신해 주세요.
        <?php endif; ?>
      </div>
      <?php endif; ?>

      <?php if (!empty($current_subscription) && $days_left < 0): ?>
      <div class="alert alert-danger alert-dismissible">
        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
        <h5><i class="icon fas fa-ban"></i> 구독이 만료되었습니다.</h5>
        서비스를 계속 이용하시려면 아래에서 요금제를 선택하여 결제해 주세요.
      </div>
      <?php endif; ?>

      <!-- ─── 현재 구독 상태 카드 ─── -->
      <div class="row mb-3">
        <div class="col-12">
          <div class="card card-outline <?php echo !empty($current_subscription) && $days_left >= 0 ? 'card-success' : 'card-secondary'; ?>">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-id-card mr-1"></i> 현재 구독 현황
              </h3>
            </div>
            <div class="card-body">
              <?php if (!empty($current_subscription) && $days_left >= 0): ?>
                <?php
                  $plan_labels = array('monthly'=>'월 구독 (정기결제)', '6month'=>'6개월', '12month'=>'12개월');
                  $plan_label  = $plan_labels[$current_subscription['plan_type']] ?? '-';
                ?>
                <div class="row text-center">
                  <div class="col-md-3">
                    <div class="info-box">
                      <span class="info-box-icon bg-success"><i class="fas fa-check-circle"></i></span>
                      <div class="info-box-content">
                        <span class="info-box-text">구독 상태</span>
                        <span class="info-box-number text-success"><strong>이용 중</strong></span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="info-box">
                      <span class="info-box-icon bg-info"><i class="fas fa-tag"></i></span>
                      <div class="info-box-content">
                        <span class="info-box-text">요금제</span>
                        <span class="info-box-number"><?php echo htmlspecialchars($plan_label); ?></span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="info-box">
                      <span class="info-box-icon bg-warning"><i class="fas fa-calendar-alt"></i></span>
                      <div class="info-box-content">
                        <span class="info-box-text">만료일</span>
                        <span class="info-box-number"><?php echo htmlspecialchars($current_subscription['end_date']); ?></span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="info-box">
                      <span class="info-box-icon <?php echo $days_left <= 7 ? 'bg-danger' : 'bg-primary'; ?>"><i class="fas fa-hourglass-half"></i></span>
                      <div class="info-box-content">
                        <span class="info-box-text">남은 기간</span>
                        <span class="info-box-number"><?php echo $days_left; ?>일</span>
                      </div>
                    </div>
                  </div>
                </div>
              <?php else: ?>
                <p class="text-center text-muted py-3">
                  <i class="fas fa-info-circle fa-2x mb-2 d-block"></i>
                  현재 활성화된 구독이 없습니다.<br>
                  아래에서 요금제를 선택하여 서비스를 신청해 주세요.
                </p>
              <?php endif; ?>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── 요금제 선택 카드 ─── -->
      <div class="row mb-4">
        <div class="col-12">
          <h4 class="mb-3"><i class="fas fa-list-alt mr-1"></i> 요금제 선택</h4>
          <p class="text-muted mb-3">
            <i class="fas fa-info-circle"></i>
            아래 금액은 모두 <strong>VAT(부가세 10%) 별도</strong> 금액입니다.
          </p>
        </div>

        <!-- 월 구독 -->
        <div class="col-md-4">
          <div class="card card-outline card-primary h-100 payment-plan-card" data-plan="monthly" style="cursor:pointer;">
            <div class="card-header text-center bg-primary text-white">
              <h4 class="mb-0"><i class="fas fa-sync-alt mr-1"></i> 월 구독</h4>
              <small>정기 결제</small>
            </div>
            <div class="card-body text-center">
              <div class="my-3">
                <span style="font-size:2.2rem; font-weight:bold; color:#007bff;">100,000원</span>
                <span class="text-muted"> / 월</span>
              </div>
              <hr>
              <ul class="list-unstyled text-left">
                <li><i class="fas fa-check text-success mr-1"></i> 매달 자동 결제</li>
                <li><i class="fas fa-check text-success mr-1"></i> 언제든지 해지 가능</li>
                <li><i class="fas fa-check text-success mr-1"></i> 만료 7일·3일 전 안내 발송</li>
                <li class="text-muted small mt-2">
                  VAT 포함: <strong>110,000원</strong>
                </li>
              </ul>
            </div>
            <div class="card-footer text-center">
              <button type="button" class="btn btn-primary btn-block btn-select-plan"
                      data-plan="monthly" data-amount="100000" data-label="월 구독">
                선택하기
              </button>
            </div>
          </div>
        </div>

        <!-- 6개월 -->
        <div class="col-md-4">
          <div class="card card-outline card-warning h-100 payment-plan-card" data-plan="6month" style="cursor:pointer;">
            <div class="card-header text-center bg-warning">
              <h4 class="mb-0"><i class="fas fa-star mr-1"></i> 6개월</h4>
              <small class="badge badge-danger">10% 할인</small>
            </div>
            <div class="card-body text-center">
              <div class="my-3">
                <del class="text-muted small">600,000원</del><br>
                <span style="font-size:2.2rem; font-weight:bold; color:#d39e00;">540,000원</span>
                <span class="text-muted"> / 6개월</span>
              </div>
              <hr>
              <ul class="list-unstyled text-left">
                <li><i class="fas fa-check text-success mr-1"></i> 6개월 일시납</li>
                <li><i class="fas fa-check text-success mr-1"></i> 월 90,000원 (10% 절약)</li>
                <li><i class="fas fa-check text-success mr-1"></i> 만료 7일·3일 전 안내 발송</li>
                <li class="text-muted small mt-2">
                  VAT 포함: <strong>594,000원</strong>
                </li>
              </ul>
            </div>
            <div class="card-footer text-center">
              <button type="button" class="btn btn-warning btn-block btn-select-plan"
                      data-plan="6month" data-amount="540000" data-label="6개월">
                선택하기
              </button>
            </div>
          </div>
        </div>

        <!-- 12개월 -->
        <div class="col-md-4">
          <div class="card card-outline card-danger h-100 payment-plan-card" data-plan="12month" style="cursor:pointer;">
            <div class="card-header text-center bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-gem mr-1"></i> 12개월</h4>
              <small class="badge badge-warning text-dark">20% 할인 (최대 혜택)</small>
            </div>
            <div class="card-body text-center">
              <div class="my-3">
                <del class="text-muted small">1,200,000원</del><br>
                <span style="font-size:2.2rem; font-weight:bold; color:#c82333;">960,000원</span>
                <span class="text-muted"> / 12개월</span>
              </div>
              <hr>
              <ul class="list-unstyled text-left">
                <li><i class="fas fa-check text-success mr-1"></i> 12개월 일시납</li>
                <li><i class="fas fa-check text-success mr-1"></i> 월 80,000원 (20% 절약)</li>
                <li><i class="fas fa-check text-success mr-1"></i> 만료 7일·3일 전 안내 발송</li>
                <li class="text-muted small mt-2">
                  VAT 포함: <strong>1,056,000원</strong>
                </li>
              </ul>
            </div>
            <div class="card-footer text-center">
              <button type="button" class="btn btn-danger btn-block btn-select-plan"
                      data-plan="12month" data-amount="960000" data-label="12개월">
                선택하기
              </button>
            </div>
          </div>
        </div>
      </div><!-- /.row -->

      <!-- 결제 내역 바로가기 -->
      <div class="row mb-3">
        <div class="col-12">
          <a href="/admin/partner/payment_history" class="btn btn-outline-secondary">
            <i class="fas fa-history mr-1"></i> 결제 내역 조회
          </a>
        </div>
      </div>

    </div><!-- /.container-fluid -->
  </section>
</div><!-- /.content-wrapper -->

<!-- ─── PG사 연동 준비 중 모달 ─── -->
<div class="modal fade" id="pgPendingModal" tabindex="-1" role="dialog" aria-labelledby="pgPendingModalLabel">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title" id="pgPendingModalLabel">
          <i class="fas fa-credit-card mr-1"></i> 결제 신청 확인
        </h5>
        <button type="button" class="close text-white" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="text-center mb-3">
          <i class="fas fa-clock fa-3x text-warning mb-3 d-block"></i>
          <h5>PG사 연동 준비 중입니다.</h5>
        </div>
        <div class="alert alert-info">
          <strong>선택하신 요금제:</strong> <span id="modalPlanLabel"></span><br>
          <strong>금액:</strong> <span id="modalPlanAmount"></span>원 (VAT 별도)
        </div>
        <p>
          현재 결제 시스템 구축 중으로, 실제 결제는 PG사 연동 완료 후 가능합니다.<br>
          결제 신청 내역은 <strong>대기 상태</strong>로 접수되며, 관리자 확인 후 안내드립니다.
        </p>
        <p class="text-muted small">
          ※ 문의: 관리자에게 연락해 주세요.
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
        <button type="button" class="btn btn-primary" id="btnConfirmPayment">
          <i class="fas fa-paper-plane mr-1"></i> 신청 접수하기
        </button>
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  var selectedPlan   = '';
  var selectedAmount = 0;
  var selectedLabel  = '';

  // 요금제 선택 버튼 클릭
  $(document).on('click', '.btn-select-plan', function(e) {
    e.stopPropagation();
    selectedPlan   = $(this).data('plan');
    selectedAmount = $(this).data('amount');
    selectedLabel  = $(this).data('label');

    // 모달에 요금제 정보 표시
    $('#modalPlanLabel').text(selectedLabel);
    $('#modalPlanAmount').text(Number(selectedAmount).toLocaleString('ko-KR'));
    $('#pgPendingModal').modal('show');
  });

  // 카드 클릭 시에도 해당 카드의 버튼 클릭과 동일하게 처리
  $(document).on('click', '.payment-plan-card', function() {
    $(this).find('.btn-select-plan').trigger('click');
  });

  // "신청 접수하기" 버튼 클릭
  $('#btnConfirmPayment').on('click', function() {
    if (!selectedPlan) {
      alert('요금제를 선택해 주세요.');
      return;
    }

    var $btn = $(this);
    $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> 처리 중...');

    $.ajax({
      url: '/admin/partner/payment_proc',
      method: 'POST',
      data: {
        plan_type: selectedPlan,
        '<?php echo $this->security->get_csrf_token_name(); ?>': '<?php echo $this->security->get_csrf_hash(); ?>'
      },
      dataType: 'json',
      success: function(res) {
        $('#pgPendingModal').modal('hide');
        if (res.result === 'ok') {
          alert('결제 신청이 접수되었습니다.\n관리자 확인 후 안내드립니다.');
          location.reload();
        } else {
          alert(res.msg || '오류가 발생했습니다. 다시 시도해 주세요.');
        }
      },
      error: function() {
        $('#pgPendingModal').modal('hide');
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      },
      complete: function() {
        $btn.prop('disabled', false).html('<i class="fas fa-paper-plane mr-1"></i> 신청 접수하기');
      }
    });
  });
})();
</script>
