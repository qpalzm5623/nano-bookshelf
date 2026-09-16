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
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">

          <div class="card">
            <!-- /.card-header -->
            <form id="board_form">
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                  <div class="btn-group float-right" style="margin:5px 5px 5px 0px;" role="group">
                    <button type="button" class='btn btn-outline-primary <?php echo ($srcType=="" || $srcType == "all") ? "active" : "" ?>' onclick="tabClick('all')">전체</button>
                    <button type="button" class='btn btn-outline-primary <?php echo ($srcType=="kor") ? "active" : "" ?>' onclick="tabClick('kor')">한국어</button>
                    <button type="button" class='btn btn-outline-primary <?php echo ($srcType=="eng") ? "active" : "" ?>' onclick="tabClick('eng')">영어</button>
                    <button type="button" class='btn btn-outline-primary <?php echo ($srcType=="chn") ? "active" : "" ?>' onclick="tabClick('chn')">중국어</button>
                  </div>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="15%"/>
                      <col/>
                      <col/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">위치</th>
                        <th class="text-center">타이틀</th>
                        <th class="text-center">이미지</th>
                        <th class="text-center">언어</th>
                        <th class="text-center">등록일</th>
                        <th class="text-center">노출여부</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                      <tr onclick="goModify('{seq}')" style="cursor:pointer">
                        <td class="text-center" style="vertical-align:middle;">{count}</td>
                        <td class="text-center" style="vertical-align:middle;">{view_location}</td>
                        <td class="text-center" style="vertical-align:middle;">{b_title}</td>
                        <td class="text-center">
                            <img src="/upload/banner/{b_image}" width="80" height="100" onError="this.remove();"/>
                        </td>
                        <td class="text-center" style="vertical-align:middle;">{language}</td>
                        <td class="text-center" style="vertical-align:middle;">{w_date}</td>
                        <td class="text-center" style="vertical-align:middle;">{view_yn}</td>
                      </tr>
                      {/boardList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">게시글이 없습니다.</td>
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
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="writeMainBanner()">배너등록</button>
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
<script>
  function tabClick($str)
  {
    location.href="{base_url}admin/mainBannerList?srcType="+$str;
  }
  function search()
  {
    var srcN = $('#srcN').val();
    var type = $('#srcType').val();

    location.href = "{base_url}admin/productList?srcType="+type+"&srcN="+srcN;
  }


  function goModify($seq)
  {
      location.href="{base_url}admin/mainBannerModify/"+$seq;
  }

  function writeMainBanner()
  {
    location.href="{base_url}admin/mainBannerWrite";
  }
</script>
