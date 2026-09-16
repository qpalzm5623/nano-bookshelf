<style>
.keyword {padding:5px;border:1px solid #ddd;}
.keywords {padding-left:20px;padding-top:20px;float:left;}
</style>
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
            <li class="breadcrumb-item"><a href="/admin">Home</a></li>
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
                  <button type="button" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn" onclick="searchCourse()">검색</button>
                  <input type="text" class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="<?php echo $this->input->get('srcN'); ?>"/>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcType" id="srcType">
                    <option value="all" <?php echo ($srcType=="all") ? "selected": ""; ?>>전체</option>
                    <option value="name" <?php echo ($srcType=="name") ? "selected": ""; ?>>과정명</option>
                    <option value="code" <?php echo ($srcType=="code") ? "selected": ""; ?>>과정코드</option>
                  </select>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="10%"/>
                      <col/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">작성자</th>
                        <th class="text-center">시작일시</th>
                        <th class="text-center">종료일시</th>
                        <th class="text-center">사용여부</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($dataList) > 0 ){ ?>
                      {dataList}
                      <tr onclick="goView('{banner_id}')" style="cursor:pointer">
                        <td class="text-center">{count}</td>
                        <td class="text-center">{banner_title}</td>
                        <td class="text-center">{admin_id}</td>
                        <td class="text-center">{start_date}</td>
                        <td class="text-center">{end_date}</td>
                        <td class="text-center">{display_yn}</td>
                      </tr>
                      {/dataList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="6">데이터가 없습니다.</td>
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
            </div>
          </div>
            <div class="card-footer clearfix">
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="writeBtn()">등록</button>
              </span>
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

  function goView($seq)
  {
      location.href="/admin/configAdm/bannerWrite/"+$seq;
  }

  function writeBtn()
  {
    location.href="bannerWrite";
  }

  function searchCourse()
  {
    var srcN = $('#srcN').val();
    var srcType = $('#srcType').val();

    if(srcN == ""){
      alert("검색어를 입력해 주세요.");
      return;
    }

    location.href = "/admin/configAdm/bannerList?srcN="+srcN+"&srcType="+srcType;
  }
</script>
