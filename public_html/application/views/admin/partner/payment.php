<?php
/**
 * 학원 원장(director) - 요금제 선택 및 결제 신청 페이지
 * URL: /admin/partner/payment
 *
 * [표시 정보]
 * - 현재 구독 상태 카드
 * - 만료 D-7, D-3 경고 배너 (조건부)
 * - 이용 명수 기반 4가지 요금제 카드 (베이직/스탠다드/로얄/VIP)
 * - 각 요금제별 월/6개월/12개월 결제 옵션 선택
 * - PG사 연동 준비 중 안내 모달
 *
 * [요금 정책]
 * - 베이직  : ~25명   / 월 88,000원 / 6개월 10% 할인 / 12개월 15% 할인
 * - 스탠다드 : 26~50명 / 월 132,000원 / 6개월 10% 할인 / 12개월 15% 할인
 * - 로얄    : 51~100명 / 월 198,000원 / 6개월 10% 할인 / 12개월 15% 할인
 * - VIP     : 100명 이상 / 별도 협의
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

      <!-- ─── 요금제 안내 헤더 ─── -->
      <div class="row mb-3">
        <div class="col-12">
          <h4 class="mb-2"><i class="fas fa-list-alt mr-1"></i> 요금제 선택</h4>
          <p class="text-muted mb-1">
            <i class="fas fa-info-circle"></i>
            아래 금액은 모두 <strong>VAT(부가세 10%) 별도</strong> 금액입니다.
          </p>
          <p class="text-muted small">
            <i class="fas fa-users mr-1"></i>
            이용 인원에 맞는 구독 상품을 선택한 후, 결제 기간(월/6개월/12개월)을 선택해 주세요.
          </p>
        </div>
      </div>

      <!-- ─── 요금제 카드 (베이직 / 스탠다드 / 로얄) ─── -->
      <div class="row mb-3">

        <!-- ★ 베이직 (25명 이하) -->
        <div class="col-md-4 mb-3">
          <div class="card card-outline card-primary h-100">
            <div class="card-header text-center bg-primary text-white">
              <h4 class="mb-0"><i class="fas fa-seedling mr-1"></i> 베이직</h4>
              <small><i class="fas fa-users mr-1"></i> 이용 인원 25명 이하</small>
            </div>
            <div class="card-body">
              <!-- 기준 월 구독료 -->
              <div class="text-center mb-3">
                <span style="font-size:2rem; font-weight:bold; color:#007bff;">88,000원</span>
                <span class="text-muted"> / 월</span>
              </div>
              <hr>
              <!-- 결제 기간 선택 버튼 그룹 -->
              <div class="list-group">
                <!-- 월 구독 -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="basic" data-plan="monthly"
                        data-amount="88000" data-label="베이직 - 월 구독">
                  <div class="d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-sync-alt text-primary mr-1"></i> 월 구독</span>
                    <span class="font-weight-bold">88,000원</span>
                  </div>
                  <small class="text-muted">VAT 포함 96,800원</small>
                </button>
                <!-- 6개월 구독 (10% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="basic" data-plan="6month"
                        data-amount="475200" data-label="베이직 - 6개월 (10% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-star text-warning mr-1"></i> 6개월
                      <span class="badge badge-warning text-dark ml-1">10% 할인</span>
                    </span>
                    <span class="font-weight-bold">475,200원</span>
                  </div>
                  <small class="text-muted">월 79,200원 · VAT 포함 522,720원</small>
                </button>
                <!-- 12개월 구독 (15% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="basic" data-plan="12month"
                        data-amount="897600" data-label="베이직 - 12개월 (15% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-gem text-danger mr-1"></i> 12개월
                      <span class="badge badge-danger ml-1">15% 할인</span>
                    </span>
                    <span class="font-weight-bold">897,600원</span>
                  </div>
                  <small class="text-muted">월 74,800원 · VAT 포함 987,360원</small>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ★ 스탠다드 (26~50명) -->
        <div class="col-md-4 mb-3">
          <div class="card card-outline card-warning h-100">
            <div class="card-header text-center bg-warning">
              <h4 class="mb-0"><i class="fas fa-rocket mr-1"></i> 스탠다드</h4>
              <small><i class="fas fa-users mr-1"></i> 이용 인원 26~50명</small>
            </div>
            <div class="card-body">
              <!-- 기준 월 구독료 -->
              <div class="text-center mb-3">
                <span style="font-size:2rem; font-weight:bold; color:#d39e00;">132,000원</span>
                <span class="text-muted"> / 월</span>
              </div>
              <hr>
              <!-- 결제 기간 선택 버튼 그룹 -->
              <div class="list-group">
                <!-- 월 구독 -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="standard" data-plan="monthly"
                        data-amount="132000" data-label="스탠다드 - 월 구독">
                  <div class="d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-sync-alt text-primary mr-1"></i> 월 구독</span>
                    <span class="font-weight-bold">132,000원</span>
                  </div>
                  <small class="text-muted">VAT 포함 145,200원</small>
                </button>
                <!-- 6개월 구독 (10% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="standard" data-plan="6month"
                        data-amount="712800" data-label="스탠다드 - 6개월 (10% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-star text-warning mr-1"></i> 6개월
                      <span class="badge badge-warning text-dark ml-1">10% 할인</span>
                    </span>
                    <span class="font-weight-bold">712,800원</span>
                  </div>
                  <small class="text-muted">월 118,800원 · VAT 포함 784,080원</small>
                </button>
                <!-- 12개월 구독 (15% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="standard" data-plan="12month"
                        data-amount="1346400" data-label="스탠다드 - 12개월 (15% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-gem text-danger mr-1"></i> 12개월
                      <span class="badge badge-danger ml-1">15% 할인</span>
                    </span>
                    <span class="font-weight-bold">1,346,400원</span>
                  </div>
                  <small class="text-muted">월 112,200원 · VAT 포함 1,481,040원</small>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ★ 로얄 (51~100명) -->
        <div class="col-md-4 mb-3">
          <div class="card card-outline card-danger h-100">
            <div class="card-header text-center bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-crown mr-1"></i> 로얄</h4>
              <small><i class="fas fa-users mr-1"></i> 이용 인원 51~100명</small>
            </div>
            <div class="card-body">
              <!-- 기준 월 구독료 -->
              <div class="text-center mb-3">
                <span style="font-size:2rem; font-weight:bold; color:#c82333;">198,000원</span>
                <span class="text-muted"> / 월</span>
              </div>
              <hr>
              <!-- 결제 기간 선택 버튼 그룹 -->
              <div class="list-group">
                <!-- 월 구독 -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="royal" data-plan="monthly"
                        data-amount="198000" data-label="로얄 - 월 구독">
                  <div class="d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-sync-alt text-primary mr-1"></i> 월 구독</span>
                    <span class="font-weight-bold">198,000원</span>
                  </div>
                  <small class="text-muted">VAT 포함 217,800원</small>
                </button>
                <!-- 6개월 구독 (10% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="royal" data-plan="6month"
                        data-amount="1069200" data-label="로얄 - 6개월 (10% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-star text-warning mr-1"></i> 6개월
                      <span class="badge badge-warning text-dark ml-1">10% 할인</span>
                    </span>
                    <span class="font-weight-bold">1,069,200원</span>
                  </div>
                  <small class="text-muted">월 178,200원 · VAT 포함 1,176,120원</small>
                </button>
                <!-- 12개월 구독 (15% 할인) -->
                <button type="button"
                        class="list-group-item list-group-item-action btn-select-plan"
                        data-tier="royal" data-plan="12month"
                        data-amount="2019600" data-label="로얄 - 12개월 (15% 할인)">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>
                      <i class="fas fa-gem text-danger mr-1"></i> 12개월
                      <span class="badge badge-danger ml-1">15% 할인</span>
                    </span>
                    <span class="font-weight-bold">2,019,600원</span>
                  </div>
                  <small class="text-muted">월 168,300원 · VAT 포함 2,221,560원</small>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /.row 베이직/스탠다드/로얄 -->

      <!-- ─── VIP 요금제 (100명 이상 / 별도 협의) ─── -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card card-outline" style="border-color:#6f42c1;">
            <div class="card-header text-white" style="background-color:#6f42c1;">
              <h4 class="mb-0 d-flex align-items-center">
                <i class="fas fa-star-of-life mr-2"></i>
                VIP
                <span class="badge badge-light text-dark ml-2" style="font-size:0.8rem;">100명 이상</span>
              </h4>
            </div>
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-8">
                  <h5 class="font-weight-bold mb-1" style="color:#6f42c1;">
                    <i class="fas fa-handshake mr-1"></i> 별도 협의 요금제
                  </h5>
                  <p class="text-muted mb-2">
                    이용 인원이 <strong>100명 이상</strong>인 기관을 위한 맞춤형 요금제입니다.<br>
                    규모에 따른 최적의 가격을 제안해 드립니다. 아래 문의하기를 통해 연락해 주세요.
                  </p>
                  <ul class="list-unstyled text-muted small mb-0">
                    <li><i class="fas fa-check text-success mr-1"></i> 기관 규모별 맞춤 가격 협의</li>
                    <li><i class="fas fa-check text-success mr-1"></i> 전담 담당자 배정</li>
                    <li><i class="fas fa-check text-success mr-1"></i> 도입 지원 및 온보딩 서비스</li>
                  </ul>
                </div>
                <div class="col-md-4 text-center mt-3 mt-md-0">
                  <p class="font-weight-bold mb-2" style="font-size:1.3rem; color:#6f42c1;">
                    <i class="fas fa-comments mr-1"></i> 요금 별도 협의
                  </p>
                  <a href="mailto:help@nanobookshelf.com"
                     class="btn btn-outline-secondary">
                    <i class="fas fa-envelope mr-1"></i> 이메일 문의하기
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /.row VIP -->

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

<!-- ─── 결제 신청 확인 모달 ─── -->
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
  var selectedPlan   = '';  // 결제 기간 (monthly / 6month / 12month)
  var selectedTier   = '';  // 구독 상품 (basic / standard / royal)
  var selectedAmount = 0;
  var selectedLabel  = '';

  // 요금제 선택 버튼 클릭
  $(document).on('click', '.btn-select-plan', function(e) {
    e.stopPropagation();

    // 이전 선택 초기화 후 현재 항목 활성화
    $('.btn-select-plan').removeClass('active list-group-item-primary');
    $(this).addClass('active list-group-item-primary');

    selectedTier   = $(this).data('tier');
    selectedPlan   = $(this).data('plan');
    selectedAmount = $(this).data('amount');
    selectedLabel  = $(this).data('label');

    // 모달에 요금제 정보 표시
    $('#modalPlanLabel').text(selectedLabel);
    $('#modalPlanAmount').text(Number(selectedAmount).toLocaleString('ko-KR'));
    $('#pgPendingModal').modal('show');
  });

  // "신청 접수하기" 버튼 클릭
  $('#btnConfirmPayment').on('click', function() {
    if (!selectedPlan || !selectedTier) {
      alert('요금제를 선택해 주세요.');
      return;
    }

    var $btn = $(this);
    $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> 처리 중...');

    $.ajax({
      url: '/admin/partner/payment_proc',
      method: 'POST',
      data: {
        plan_type  : selectedPlan,   // 결제 기간
        plan_tier  : selectedTier,   // 구독 상품 (basic/standard/royal)
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
