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
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <?php if(!empty($thumb)){ ?>
                      <col width="20%"/>
                      <?php } ?>
                      <col/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">#</th>
                        <?php if(!empty($thumb)){ ?>
                        <th class="text-center align-middle">썸네일</th>
                        <?php } ?>
                        <th class="text-center">제목</th>
                        <th class="text-center">작성자</th>
                        <th class="text-center">작성일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                      <tr onclick="goModify('{seq}')" style="cursor:pointer">
                        <td class="text-center align-middle">{count}</td>
                        <?php if(!empty($thumb)){ ?>
                        <td class="text-center align-middle"><img src="<?php echo $this->BASE_URL; ?>upload/{board_title}/{thumb}" style="width:100px; height:100px;"/></td>
                        <?php } ?>
                        <td class="text-center align-middle">{title}</td>
                        <td class="text-center">{writer_name}</td>
                        <td class="text-center">{wdate}</td>
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
                <button type="button" class="btn btn-block btn-success" onclick="writeBoard()">글쓰기</button>
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
  function goModify($seq)
  {
      location.href="{base_url}admin/board/{board_name}?mod=modify&mod_num="+$seq;
  }

  function writeBoard()
  {
    location.href="{base_url}admin/board/{board_name}?mod=write";
  }
</script>
