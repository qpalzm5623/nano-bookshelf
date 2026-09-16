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
                  <button type="button" class="form-control col-1 btn btn-block btn-success float-right" style="margin:5px 5px 5px 5px;" onclick="search()">검색</button>
                  <input type="text" class="form-control col-2 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="{srcN}" placeholder="검색">
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcType" id="srcType">
                    <option value="all" <?php echo ($srcType=="all") ? "selected": ""; ?>>전체</option>
                    <option value="id" <?php echo ($srcType=="id") ? "selected": ""; ?>>아이디</option>
                    <option value="name" <?php echo ($srcType=="name") ? "selected": ""; ?>>이름</option>
                  </select>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="academy_type" id="academy_type">
                    <option value="all" <?php echo ($srcType=="all") ? "selected": ""; ?>>전체</option>
                    <option value="laha" <?php echo ($srcType=="id") ? "selected": ""; ?>>라하잉글리시</option>
                    <option value="touch" <?php echo ($srcType=="id") ? "selected": ""; ?>>터치와</option>
                    <option value="etc" <?php echo ($srcType=="name") ? "selected": ""; ?>>외부가맹</option>
                  </select>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">권한</th>
                        <th class="text-center">소속</th>
                        <th class="text-center">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                      <tr onclick="goModify('{seq}')" style="cursor:pointer">
                        <td class="text-center">{count}</td>
                        <td class="text-center">{user_id}</td>
                        <td class="text-center">{user_name}</td>
                        <td class="text-center">{user_level}</td>
                        <td class="text-center">{affiliation}</td>
                        <td class="text-center">{reg_date}</td>
                      </tr>
                      {/boardList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="9">게시글이 없습니다.</td>
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
                <button type="button" class="btn btn-block btn-success" onclick="writeAdmin()">글쓰기</button>
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
  function search()
  {
    var srcN = $('#srcN').val();
    var type = $('#srcType').val();

    location.href = "{base_url}admin/adminList?srcType="+type+"&srcN="+srcN;
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
