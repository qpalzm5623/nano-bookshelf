<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="#">Home</a></li>
            <li class="breadcrumb-item">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <form method="get" id="searchForm">
    <div class="card mb-12">
        <div class="card-body">
            <!--begin::Compact form-->
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    등록일
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                    <div class="col-sm-1 align-middle col-form-label">
                        <input type="radio" id="searchTermTypeAll" name="searchTermType" value=""  <?php echo @$_REQUEST['searchTermType']==''?"checked":"";?>>
                        전체
                    </div>
                    <div class="col-sm-1 col-form-label">
                        <input type="radio" id="searchTermTypeDate" name="searchTermType" value="term"  <?php echo @$_REQUEST['searchTermType']!=''?"checked":"";?>>
                        설정
                    </div>                    
                    <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="startDate" id="startDate" value="<?php echo @$_REQUEST['startDate'];?>">
                    <span class="float-right mr-1 ml-1 mt-2">~</span>
                    <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="endDate" id="endDate" value="<?php echo @$_REQUEST['endDate'];?>">
                </div>
                <!--end::Compact form-->
            </div>
            <?php if($this->session->userdata("admin_level")=="0"){ ?>
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    소속
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                       <select name="searchGroupName" id="searchGroupName" class="form-control col-3">
                            <option value="">전체</option>
                            <?php for($i=0;$i<count($groupList);$i++) {?>
                                <?php if($groupList[$i]['group_name'] != "") {?>
                                <option value="<?php echo $groupList[$i]['group_name'];?>" <?php echo @$_REQUEST['searchGroupName']== $groupList[$i]['group_name']?"selected":"";?>><?php echo $groupList[$i]['group_name'];?></option>
                                <?php }?>
                            <?php }?>                            
                       </select>
                </div>
                <!--end::Compact form-->
            </div>            
            <?php }?>
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    검색어
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="<?php if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){ echo "이름, 아이디을 입력해 주세요.";}else{echo "이름, 아이디, 소속을 입력해 주세요.";}?>">
                    <button type="button" class="btn  btn-primary" id="searchBtn" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>
        </div>
    </div> 
    </form>
                
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                    <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="12%"/>
                      <col width="14%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">순위</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">소속</th>
                        <th class="text-center">학년</th>
                        <th class="text-center">포인트</th>
                        <th class="text-center">포인트 관리</th>
                        <th class="text-center">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr>
                        <td class="text-center align-middle">{ranking}</td>
                        <td class="text-center align-middle font-weight-bold">{user_name}</td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{group_name}</td>
                        <td class="text-center align-middle">{grade}</td>
                        <td class="text-center align-middle" id="point_display_{user_seq}"><strong class="text-primary">{point}</strong> P</td>
                        <td class="text-center align-middle">
                          <button type="button" class="btn btn-sm btn-outline-success font-weight-bold" onclick="openCiManualPointModal('{user_seq}', '{user_name}', '{user_id}', '{point}')">
                            <i class="fa fa-coins"></i> 포인트 부여
                          </button>
                        </td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success btn-sm" onclick="viewDetail('{user_seq}')">상세</button></td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">조회된 학생이 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>


              <span class="float-right" style="margin-right:5px;">
                <?php if($this->session->userdata("admin_type") == "A" ){?>
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">전체 랭킹 TOP 100 엑셀 다운로드</button>
                <?php }?>
              </span>
            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<!-- 포인트 수동 부여/차감 모달 (-100pt ~ +100pt) -->
<div class="modal fade" id="ciManualPointModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 480px;">
    <div class="modal-content shadow">
      <div class="modal-header bg-warning py-3">
        <h5 class="modal-title font-weight-bold text-dark" style="font-size: 16px;">
          <i class="fa fa-coins mr-1"></i> 원생 독서 포인트 수동 관리 (-100 ~ +100pt)
        </h5>
        <button type="button" class="close text-dark" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-4">
        <!-- 대상 학생 정보 -->
        <div class="p-3 mb-3 rounded" style="background: #f8f9fa; border: 1px solid #e9ecef;">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong id="ciModalStudentName" style="font-size: 16px; color: #333;">-</strong>
              <span class="text-muted ml-2" id="ciModalStudentId" style="font-size: 13px;">(-)</span>
            </div>
            <div class="text-right">
              <span class="text-muted" style="font-size: 11px;">현재 포인트</span>
              <div class="font-weight-bold text-primary" id="ciModalStudentPoints" style="font-size: 16px;">0 P</div>
            </div>
          </div>
        </div>

        <input type="hidden" id="ciModalUserSeq" value="">
        <input type="hidden" id="ciModalCurrentPointVal" value="0">

        <!-- 포인트 수치 선택/입력 -->
        <div class="form-group mb-3">
          <label class="font-weight-bold" style="font-size: 13px;">
            포인트 부여/차감 수치 (-100pt ~ +100pt)
          </label>
          <div class="mb-2 d-flex flex-wrap" style="gap: 4px;">
            <span class="badge badge-success align-self-center mr-1">부여:</span>
            <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="setCiPointDelta(10)">+10</button>
            <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="setCiPointDelta(30)">+30</button>
            <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="setCiPointDelta(50)">+50</button>
            <button type="button" class="btn btn-xs btn-success font-weight-bold text-white" onclick="setCiPointDelta(100)">+100</button>
            
            <span class="badge badge-danger align-self-center ml-2 mr-1">차감:</span>
            <button type="button" class="btn btn-xs btn-outline-danger font-weight-bold" onclick="setCiPointDelta(-10)">-10</button>
            <button type="button" class="btn btn-xs btn-outline-danger font-weight-bold" onclick="setCiPointDelta(-30)">-30</button>
            <button type="button" class="btn btn-xs btn-outline-danger font-weight-bold" onclick="setCiPointDelta(-50)">-50</button>
            <button type="button" class="btn btn-xs btn-danger font-weight-bold text-white" onclick="setCiPointDelta(-100)">-100</button>
          </div>
          <div class="input-group">
            <input type="number" class="form-control font-weight-bold text-center" id="ciModalPointInput" min="-100" max="100" step="1" value="10" oninput="updateCiPointPreview(this.value)">
            <div class="input-group-append">
              <span class="input-group-text font-weight-bold">pt</span>
            </div>
          </div>
        </div>

        <!-- 실시간 계산 결과 프리뷰 -->
        <div class="p-2 mb-3 rounded text-center" style="background: #e8f5e9; border: 1px solid #c8e6c9;">
          <span style="font-size: 12px; color: #2e7d32;">조정 후 예상 포인트: </span>
          <strong id="ciModalPreviewFinalPoints" style="font-size: 15px; color: #1b5e20;">-</strong>
        </div>

        <!-- 사유 입력 -->
        <div class="form-group mb-0">
          <label class="font-weight-bold" style="font-size: 13px;">부여 / 차감 사유</label>
          <div class="mb-2" style="font-size: 11px;">
            <a href="javascript:void(0)" class="badge badge-light border mr-1" onclick="$('#ciModalReasonInput').val('독서 퀴즈 챌린지 칭찬 보너스')">독서 챌린지 칭찬</a>
            <a href="javascript:void(0)" class="badge badge-light border mr-1" onclick="$('#ciModalReasonInput').val('독후활동(생각담기) 우수 보너스')">생각담기 우수</a>
            <a href="javascript:void(0)" class="badge badge-light border mr-1" onclick="$('#ciModalReasonInput').val('학원 독서 행사 참여 리워드')">행사 리워드</a>
            <a href="javascript:void(0)" class="badge badge-light border" onclick="$('#ciModalReasonInput').val('과제 미제출 감점')">과제 미제출 감점</a>
          </div>
          <input type="text" class="form-control" id="ciModalReasonInput" placeholder="사유를 입력하세요 (예: 9월 독서 퀴즈 챌린지 성실 참여)">
        </div>
      </div>
      <div class="modal-footer py-2 d-flex justify-content-between">
        <button type="button" class="btn btn-secondary btn-sm" data-dismiss="modal">취소</button>
        <button type="button" class="btn btn-success btn-sm font-weight-bold px-3" onclick="submitCiManualPoint()">
          <i class="fa fa-check mr-1"></i> 포인트 적용하기
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  $(function(){
      $('#searchBtn').on("click",function(){
          if($('#keyword').val() == "" && $('#searchGroupName :selected').val() == "") {
              alert('검색어 입력을 위해서 소속 입력이 필요합니다.');
              return;
          }
          $('#searchForm').submit();
      });
  });
      
  function viewDetail($seq) {
      window.open("/admin/manage/point_popup/"+$seq+"?keyword=<?php echo @$_REQUEST['keyword'];?>&searchTermType=<?php echo @$_REQUEST['keyword'];?>&startDate=<?php echo @$_REQUEST['startDate'];?>&endDate=<?php echo @$_REQUEST['endDate'];?>&searchGroupName=<?php echo @$_REQUEST['searchGroupName'];?>", "_point_pop", "width=1000, height=800, left=0, top=50"); 
  }    
  
  function excelDownload()
  {
      $('#searchForm').attr("action","/admin/manage/rankingDownload");
      $('#searchForm').submit();
      $('#searchForm').attr("action","");
  }

  function openCiManualPointModal(seq, name, id, curPoint) {
      $('#ciModalUserSeq').val(seq);
      $('#ciModalStudentName').text(name);
      $('#ciModalStudentId').text('(' + id + ')');
      var p = parseInt(curPoint, 10) || 0;
      $('#ciModalCurrentPointVal').val(p);
      $('#ciModalStudentPoints').text(p.toLocaleString() + ' P');
      $('#ciModalReasonInput').val('');
      setCiPointDelta(10);
      $('#ciManualPointModal').modal('show');
  }

  function setCiPointDelta(val) {
      $('#ciModalPointInput').val(val);
      updateCiPointPreview(val);
  }

  function updateCiPointPreview(val) {
      var delta = parseInt(val, 10);
      if (isNaN(delta)) delta = 0;
      if (delta > 100) delta = 100;
      if (delta < -100) delta = -100;
      var cur = parseInt($('#ciModalCurrentPointVal').val(), 10) || 0;
      var finalP = Math.max(0, cur + delta);
      $('#ciModalPreviewFinalPoints').text(finalP.toLocaleString() + ' P (' + (delta >= 0 ? '+' : '') + delta + ' pt)');
  }

  function submitCiManualPoint() {
      var seq = $('#ciModalUserSeq').val();
      var point = parseInt($('#ciModalPointInput').val(), 10);
      var reason = $.trim($('#ciModalReasonInput').val());

      if (isNaN(point) || point === 0) {
          alert('포인트는 -100 ~ +100 사이의 0이 아닌 값을 입력해주세요.');
          return;
      }
      if (point < -100 || point > 100) {
          alert('포인트는 한 번에 -100 ~ +100pt까지 부여할 수 있습니다.');
          return;
      }
      if (!reason) {
          reason = point > 0 ? '독서 활동 칭찬 수동 포인트 부여' : '수동 포인트 차감';
      }

      $.ajax({
          url: '/admin/manage/special_point_proc',
          type: 'POST',
          dataType: 'json',
          data: {
              user_seq: seq,
              point: point,
              reason: reason
          },
          success: function(res) {
              if (res.result === 'success') {
                  alert('포인트가 성공적으로 ' + (point > 0 ? '부여' : '차감') + '되었습니다.');
                  $('#ciManualPointModal').modal('hide');
                  location.reload();
              } else {
                  alert(res.msg || '포인트 처리에 실패했습니다.');
              }
          },
          error: function() {
              alert('서버 통신 중 오류가 발생했습니다.');
          }
      });
  }
</script>
