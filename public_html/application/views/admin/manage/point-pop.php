<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
.bg-lightgray{background:#efefef}
.mt-3 {font-size:25pt}
.widget-user .widget-user-header {
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    height: auto; 
    padding: 1rem;
    text-align: center;
}
</style>
<div class="content">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          {title}
        </div>
        <div class="col-sm-6">
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <input type="hidden" id="user_seq" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
  <section class="content">
      <div class="container-fluid">
          <p>* <?php echo $data['user_name'];?>(<?php echo $data['group_name'];?>)</p>

          <!-- ─── 특별 포인트 수동 적립 ─── -->
          <!-- 정책: 관리자가 -100 ~ +100pt 범위에서 수동 적립/차감 가능 -->
          <div class="card card-warning mb-3">
              <div class="card-header">
                  <h3 class="card-title">
                      <i class="fas fa-star mr-1"></i> 특별 포인트 수동 적립
                  </h3>
              </div>
              <div class="card-body">
                  <div class="form-row align-items-center">
                      <div class="col-auto">
                          <label class="mb-0">포인트</label>
                          <input type="number" id="special_point" class="form-control"
                                 placeholder="-100 ~ +100" min="-100" max="100" style="width:120px;">
                          <small class="text-muted">음수 입력 시 차감</small>
                      </div>
                      <div class="col">
                          <label class="mb-0">사유</label>
                          <input type="text" id="special_point_reason" class="form-control"
                                 placeholder="적립/차감 사유를 입력해 주세요" maxlength="100">
                      </div>
                      <div class="col-auto mt-4">
                          <button type="button" id="btnSpecialPoint" class="btn btn-warning">
                              <i class="fas fa-plus mr-1"></i> 적립하기
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <div class="card card-primary">
              <div class="card-body">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="35%"/>
                      <col width="35%"/>
                      <col width="30%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center bg-lightgray">날짜</th>
                        <th class="text-center bg-lightgray">내역</th>
                        <th class="text-center bg-lightgray">포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list}
                      <tr  style="cursor:pointer">
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle">{content}</td>
                        <td class="text-center align-middle">{point}</td>
                      </tr>
                      {/list}                                
                    </tbody>
                  </table>
                </table>
              </div>
          </div>
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
      <span class="float-right" style="margin-right:5px;">
        <button type="button" class="btn btn-block btn-primary" onclick="window.close()">닫기</button>
      </span>
            </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->

  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
$(function() {
    // 특별 포인트 수동 적립 처리
    $('#btnSpecialPoint').on('click', function() {
        var point  = parseInt($('#special_point').val());
        var reason = $.trim($('#special_point_reason').val());

        // 입력 검증: -100 ~ +100 범위, 0 불가
        if(isNaN(point) || point === 0 || point < -100 || point > 100) {
            alert('-100 ~ +100 사이의 값을 입력해 주세요. (0 제외)');
            return;
        }
        if(reason === '') {
            alert('적립/차감 사유를 입력해 주세요.');
            return;
        }

        var confirmMsg = point > 0
            ? point + 'pt 를 적립하시겠습니까?\n사유: ' + reason
            : Math.abs(point) + 'pt 를 차감하시겠습니까?\n사유: ' + reason;
        if(!confirm(confirmMsg)) return;

        var $btn = $(this);
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> 처리 중...');

        $.ajax({
            type: 'POST',
            url : '/admin/manage/special_point_proc',
            data: {
                user_seq : $('#user_seq').val(),
                point    : point,
                reason   : reason,
                [$('#csrf').attr('name')]: $('#csrf').val()
            },
            dataType: 'json',
            success: function(res) {
                if(res.result === 'success') {
                    alert('처리가 완료되었습니다.');
                    location.reload();
                } else {
                    alert(res.msg || '오류가 발생했습니다.');
                }
            },
            error: function() {
                alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            },
            complete: function() {
                $btn.prop('disabled', false).html('<i class="fas fa-plus mr-1"></i> 적립하기');
            }
        });
    });
});
</script>