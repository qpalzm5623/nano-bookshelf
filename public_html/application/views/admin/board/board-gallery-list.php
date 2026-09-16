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

                <div class="card-body">
                <div>

                </div>
                <div>
                  <div class="filter-container p-0 row">
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                            <div class="filtr-item col-sm-2" data-category="1" data-sort="white sample" onclick="goModify('{board_seq}')">
                                <img src="<?php echo $this->BASE_URL; ?>upload/thumb/{board_thumb}"   class="img-fluid mb-2" alt="white sample"/>
                            </div>
                      {/boardList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="9">게시글이 없습니다.</td>
                      </tr>
                      <?php } ?>
                  </div>
                </div>

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
      location.href="{base_url}admin/boardAdm/boardWrite/{board_name}/"+$seq;
  }

  function writeBoard()
  {
    location.href="{base_url}admin/boardAdm/boardWrite/{board_name}";
  }
</script>
