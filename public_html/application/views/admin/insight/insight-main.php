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
        <div class="col-md-4">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-info">
              <h1 class="widget-user-desc mt-3">회원현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightMember'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $member_total ?></h5>
                    <span class="description-text">총 회원</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $search_member_total ?></h5>
                    <span class="description-text">검색회원</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo $search_leave_member_total ?></h5>
                    <span class="description-text">탈퇴회원</span>
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

        <!-- 활동현황 -->
        <div class="col-md-4">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-success">
              <h1 class="widget-user-desc mt-3">활동현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightPlay'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo number_format($board_view_count_total['news_total']); ?></h5>
                    <span class="description-text">뉴스기사 조회</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo number_format($board_view_count_total['webtoon_total']); ?></h5>
                    <span class="description-text">웹툰조회</span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <div class="col-sm-4">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo number_format($board_view_count_total['movie_total']); ?></h5>
                    <span class="description-text">영상조회</span>
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

        <!-- 챌린지현황 -->
        <div class="col-md-4">
          <!-- Widget: user widget style 1 -->
          <div class="card card-widget widget-user">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-warning">
              <h1 class="widget-user-desc mt-3">챌린지현황</h1>
            </div>
            <div class="widget-user-image">
              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/insight/insightChallenge'">자세히 보기</button>
            </div>
            <div class="card-footer pt-4">
              <div class="row">
                <?php for($i=0; $i<count($challenge_total); $i++){ ?>
                <div class="col-sm-4 border-right">
                  <div class="description-block">
                    <h5 class="description-header" style="font-size:24px;"><?php echo number_format($challenge_total[$i]['challenge_total']); ?></h5>
                    <span class="description-text"><?php echo $challenge_total[$i]['challenge_title']; ?></span>
                  </div>
                  <!-- /.description-block -->
                </div>
                <!-- /.col -->
                <?php } ?>
              </div>
              <!-- /.row -->
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->

        <div class="col-4">
          <!-- small card -->
          <div class="small-box bg-success">
            <div class="inner" style="height:204px;">
              <h3><?php echo number_format($carbon_total,2); ?><sup style="font-size: 20px">kg</sup></h3>
              <p>총 탄소 절감량</p>
            </div>
            <div class="icon">
              <i class="ion ion-stats-bars"></i>
            </div>
            <a href="/admin/insight/insightCarbon" class="small-box-footer">
              자세히 보기 <i class="fas fa-arrow-circle-right"></i>
            </a>
          </div>
        </div>
        <!-- ./col -->

        <div class="col-md-4">
          <!-- Widget: user widget style 2 -->
          <div class="card card-widget widget-user-2">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-warning">
              <!-- /.widget-user-image -->
              <h1 class="widget-user-username" style="margin-left:0">탄소절감 서약서</h1>
              <button type="button" class="btn btn-default float-right" onclick="location.href='/admin/insight/insightOauth'">자세히 보기</button>
            </div>
            <div class="card-footer p-0">
              <ul class="nav flex-column">
                <li class="nav-item">
                  <a href="#" class="nav-link">
                    전체 <span class="float-right badge bg-primary"><?php echo number_format($oauth_total['location_total']); ?></span>
                  </a>
                </li>
                <?php for($i=0; $i<count($oauth_total['locationArr']); $i++){ ?>
                <li class="nav-item">
                  <a href="#" class="nav-link">
                    <?php echo $oauth_total['locationArr'][$i]['location']; ?> <span class="float-right badge bg-info"><?php echo number_format($oauth_total['locationArr'][$i]['total']); ?></span>
                  </a>
                </li>
                <?php } ?>
              </ul>
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
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
