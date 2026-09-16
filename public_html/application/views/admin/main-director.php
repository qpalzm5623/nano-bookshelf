<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1 class="float-left">{title}</h1>
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="year" id="year" onchange="changeYearMonth()">
            <option value="">년</option>
            <?php for($i=2023; $i <= date("Y");$i++) {?>
                <option value="<?php echo $i;?>" <?php echo ($year==$i) ? "selected": ""; ?>><?php echo $i;?>년</option>    
            <?php }?>
          </select>
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="month" id="month" onchange="changeYearMonth()">
            <option value="">전체</option>
            <?php for($i=0; $i<12; $i++){ ?>
            <option value="<?php echo sprintf('%02d',($i+1)); ?>" <?php echo ($month==($i+1)) ? "selected": ""; ?>><?php echo ($i+1)."월" ?></option>
            <?php } ?>
          </select>
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
    <div class="container-fluid">
      <div class="row">
        <!-- 회원현황 -->
        <div class="col-md-3">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">학생 회원 현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightMemberUser'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['member_total']?></h5>
                    <span class="description-text">총 회원</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['search_member_total']?></h5>
                    <span class="description-text">신규 회원</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['search_leave_member_total']?></h5>
                    <span class="description-text">탈퇴 회원</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
              </div>
              <!-- /.row -->
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->

        <!-- 회원현황 -->
        <div class="col-md-3">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">우리원 북퀴즈 등록 현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightQuiz'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz['total']?></h5>
                    <span class="description-text">TOTAL</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz['new']?></h5>
                    <span class="description-text">신규</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz['confirm']?></h5>
                    <span class="description-text">승인 요청</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
              </div>
              <!-- /.row -->
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->
        <!-- 회원현황 -->
        <div class="col-md-3">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">우리원  북퀴즈 인증 현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightQuizConfirm'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <div class="col-sm-6 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz_confirm['total'] ?></h5>
                    <span class="description-text">TOTAL</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-6">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz_confirm['confirm'] ?></h5>
                    <span class="description-text">이번 달 인증</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
 
                <!-- /.col -->
              </div>
              <!-- /.row -->
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->

        <!-- 회원현황 -->
        <div class="col-md-3">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">선호도현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightBook'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div >
                <?php for($i=0;$i<count($book_list);$i++){
                    $row = $book_list[$i];
                ?>
                <div class="col-12 row">
                  <div class="col-6">
                    <span class="description-text"><?php echo $row['book_name'];?></span>
                  </div>
                  <div class="col-6">
                    <span class="description-text"><?php echo number_format($row['quiz_use_cnt']);?></span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <?php }?>           
              </div>
              <!-- /.row -->
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->        
        <!-- 회원현황 -->
        <div class="col-md-3">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">랭킹 현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/manage/ranking'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div >
                <?php for($i=0;$i<count($user_list);$i++){
                    $row = $user_list[$i];
                ?>
                <div class="col-12 row">
                  <div class="col-6">
                    <span class="description-text"><?php echo $row['user_name'];?></span>
                  </div>
                  <div class="col-6">
                    <span class="description-text"><?php echo number_format($row['point']);?></span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <?php }?>                     
              </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
  function search()
  {
    var srcN = $('#srcN').val();
    var type = $('#srcType').val();

    location.href = "{base_url}admin/adminList?srcType="+type+"&srcN="+srcN;
  }

  function changeYearMonth()
  {
    var year = $('#year').val();
    var month = $('#month').val();

    location.href = "/admin/insight/insightMain?year="+year+"&month="+month;
  }

  function goModify($seq)
  {
      location.href="{base_url}admin/adminModify/"+$seq;
  }

  function writeAdmin()
  {
    location.href="{base_url}admin/adminWrite";
  }
</script>
