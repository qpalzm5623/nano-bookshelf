<?php
/**
 * 학원 원장(director) - 본인 결제 내역 조회 페이지
 * URL: /admin/partner/payment_history
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

      <!-- 상단 버튼 -->
      <div class="row mb-3">
        <div class="col-12">
          <a href="/admin/partner/payment" class="btn btn-primary">
            <i class="fas fa-credit-card mr-1"></i> 요금제 신청하기
          </a>
        </div>
      </div>

      <!-- 결제 내역 테이블 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-list mr-1"></i>
            결제 내역
            <span class="badge badge-secondary ml-2">총 <?php echo (int)($list_total ?? 0); ?>건</span>
          </h3>
        </div>
        <div class="card-body p-0">
          <table class="table table-bordered table-hover table-striped mb-0">
            <thead class="thead-dark">
              <tr>
                <th class="text-center" style="width:50px;">No</th>
                <th class="text-center" style="width:120px;">요금제</th>
                <th class="text-center" style="width:120px;">결제 금액 (VAT별도)</th>
                <th class="text-center" style="width:100px;">VAT</th>
                <th class="text-center" style="width:130px;">합계 (VAT포함)</th>
                <th class="text-center" style="width:110px;">상태</th>
                <th class="text-center" style="width:110px;">서비스 시작일</th>
                <th class="text-center" style="width:110px;">서비스 만료일</th>
                <th class="text-center" style="width:100px;">신청일</th>
              </tr>
            </thead>
            <tbody>
              <?php if (!empty($list)): ?>
                <?php foreach ($list as $i => $row): ?>
                <tr>
                  <td class="text-center"><?php echo ($list_total - ($num ?? 0) - $i); ?></td>
                  <td class="text-center"><?php echo htmlspecialchars($row['plan_type_label'] ?? '-'); ?></td>
                  <td class="text-right"><?php echo number_format($row['plan_amount'] ?? 0); ?>원</td>
                  <td class="text-right"><?php echo number_format($row['vat_amount'] ?? 0); ?>원</td>
                  <td class="text-right"><strong><?php echo number_format($row['total_amount'] ?? 0); ?>원</strong></td>
                  <td class="text-center">
                    <?php
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
                    <span class="badge <?php echo $cls; ?> p-2">
                      <?php echo htmlspecialchars($row['payment_status_label'] ?? '-'); ?>
                    </span>
                  </td>
                  <td class="text-center"><?php echo $row['start_date'] ? htmlspecialchars($row['start_date']) : '-'; ?></td>
                  <td class="text-center"><?php echo $row['end_date']   ? htmlspecialchars($row['end_date'])   : '-'; ?></td>
                  <td class="text-center"><?php echo htmlspecialchars($row['reg_date'] ?? '-'); ?></td>
                </tr>
                <?php endforeach; ?>
              <?php else: ?>
              <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                  <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                  결제 내역이 없습니다.
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

      </div><!-- /.card -->

    </div><!-- /.container-fluid -->
  </section>
</div><!-- /.content-wrapper -->
