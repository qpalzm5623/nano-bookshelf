<?php
/**
 * 슈퍼어드민 - 결제 상세 팝업
 * URL: /admin/master/payment_detail/{payment_seq}
 * 팝업창으로 열림 (pop-header/pop-footer 사용)
 */
?>
<style>
  body { background-color: #f4f6f9; }
  .detail-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    width: 140px;
    vertical-align: middle;
  }
  .detail-table td {
    vertical-align: middle;
  }
  .badge-status { font-size: 0.9rem; padding: 0.4em 0.7em; }
</style>

<div class="container py-4" style="max-width:680px;">
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="fas fa-credit-card mr-1"></i>
        결제 상세 정보
        <span class="float-right small">결제번호 #<?php echo htmlspecialchars($data['payment_seq'] ?? '-'); ?></span>
      </h5>
    </div>
    <div class="card-body">

      <!-- 학원 정보 -->
      <h6 class="text-primary border-bottom pb-2 mb-3">
        <i class="fas fa-school mr-1"></i> 학원 정보
      </h6>
      <table class="table table-bordered detail-table mb-4">
        <tr>
          <th>학원명</th>
          <td><?php echo htmlspecialchars($data['group_name'] ?? '-'); ?></td>
          <th>아이디</th>
          <td><?php echo htmlspecialchars($data['user_id'] ?? '-'); ?></td>
        </tr>
        <tr>
          <th>원장 이름</th>
          <td><?php echo htmlspecialchars($data['user_name'] ?? '-'); ?></td>
          <th>연락처</th>
          <td><?php echo htmlspecialchars($data['cell_no'] ?? '-'); ?></td>
        </tr>
      </table>

      <!-- 결제 정보 -->
      <h6 class="text-primary border-bottom pb-2 mb-3">
        <i class="fas fa-receipt mr-1"></i> 결제 정보
      </h6>
      <table class="table table-bordered detail-table mb-4">
        <tr>
          <th>요금제</th>
          <td colspan="3">
            <strong><?php echo htmlspecialchars($data['plan_type_label'] ?? '-'); ?></strong>
          </td>
        </tr>
        <tr>
          <th>금액 (VAT별도)</th>
          <td><?php echo number_format($data['plan_amount'] ?? 0); ?>원</td>
          <th>VAT (10%)</th>
          <td><?php echo number_format($data['vat_amount'] ?? 0); ?>원</td>
        </tr>
        <tr>
          <th>합계 (VAT포함)</th>
          <td colspan="3">
            <strong class="text-primary" style="font-size:1.1rem;">
              <?php echo number_format($data['total_amount'] ?? 0); ?>원
            </strong>
          </td>
        </tr>
        <tr>
          <th>결제 수단</th>
          <td><?php echo htmlspecialchars($data['payment_method'] ?? '미지정'); ?></td>
          <th>PG 거래번호</th>
          <td><?php echo htmlspecialchars($data['pg_transaction_id'] ?? '-'); ?></td>
        </tr>
        <tr>
          <th>결제 상태</th>
          <td colspan="3">
            <?php
              $status_cls = array(
                'pending'   => 'badge-secondary',
                'paid'      => 'badge-success',
                'failed'    => 'badge-danger',
                'cancelled' => 'badge-warning',
                'refunded'  => 'badge-info',
              );
              $cls = $status_cls[$data['payment_status'] ?? ''] ?? 'badge-secondary';
            ?>
            <span class="badge badge-status <?php echo $cls; ?>">
              <?php echo htmlspecialchars($data['payment_status_label'] ?? '-'); ?>
            </span>
          </td>
        </tr>
        <tr>
          <th>서비스 시작일</th>
          <td><?php echo $data['start_date'] ? htmlspecialchars($data['start_date']) : '-'; ?></td>
          <th>서비스 만료일</th>
          <td><?php echo $data['end_date'] ? htmlspecialchars($data['end_date']) : '-'; ?></td>
        </tr>
        <tr>
          <th>자동 갱신</th>
          <td><?php echo ($data['auto_renew'] ?? 0) ? '<span class="badge badge-info">사용</span>' : '<span class="badge badge-secondary">미사용</span>'; ?></td>
          <th>결제 신청일</th>
          <td><?php echo htmlspecialchars($data['reg_date'] ?? '-'); ?></td>
        </tr>
      </table>

      <!-- 상태 변경 + 메모 -->
      <h6 class="text-primary border-bottom pb-2 mb-3">
        <i class="fas fa-edit mr-1"></i> 상태 변경 / 메모
      </h6>
      <div class="form-group">
        <label for="popStatusSelect">결제 상태 변경</label>
        <select class="form-control" id="popStatusSelect">
          <option value="pending"   <?php echo ($data['payment_status']==='pending'   ? 'selected' : ''); ?>>결제대기</option>
          <option value="paid"      <?php echo ($data['payment_status']==='paid'      ? 'selected' : ''); ?>>결제완료</option>
          <option value="failed"    <?php echo ($data['payment_status']==='failed'    ? 'selected' : ''); ?>>결제실패</option>
          <option value="cancelled" <?php echo ($data['payment_status']==='cancelled' ? 'selected' : ''); ?>>취소</option>
          <option value="refunded"  <?php echo ($data['payment_status']==='refunded'  ? 'selected' : ''); ?>>환불</option>
        </select>
      </div>
      <div class="form-group">
        <label for="popMemo">관리자 메모</label>
        <textarea class="form-control" id="popMemo" rows="3"
                  placeholder="메모를 입력하세요."><?php echo htmlspecialchars($data['memo'] ?? ''); ?></textarea>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="btnSaveStatus">
        <i class="fas fa-save mr-1"></i> 저장
      </button>

    </div><!-- /.card-body -->
    <div class="card-footer text-right">
      <button type="button" class="btn btn-secondary" onclick="window.close();">
        <i class="fas fa-times mr-1"></i> 닫기
      </button>
    </div>
  </div><!-- /.card -->
</div>

<script>
(function() {
  var payment_seq = <?php echo (int)($data['payment_seq'] ?? 0); ?>;
  var csrfName    = '<?php echo $this->security->get_csrf_token_name(); ?>';
  var csrfHash    = '<?php echo $this->security->get_csrf_hash(); ?>';

  $('#btnSaveStatus').on('click', function() {
    var new_status = $('#popStatusSelect').val();
    var memo       = $('#popMemo').val();

    var postData = {};
    postData[csrfName]      = csrfHash;
    postData.payment_seq    = payment_seq;
    postData.payment_status = new_status;
    postData.memo           = memo;

    $.ajax({
      url: '/admin/master/payment_status_update',
      method: 'POST',
      data: postData,
      dataType: 'json',
      success: function(res) {
        if (res.result === 'ok') {
          alert('저장되었습니다.');
          // 부모창 새로고침 후 팝업 닫기
          if (window.opener && !window.opener.closed) {
            window.opener.location.reload();
          }
          window.close();
        } else {
          alert(res.msg || '저장에 실패했습니다.');
        }
      },
      error: function() {
        alert('서버 오류가 발생했습니다.');
      }
    });
  });
})();
</script>
