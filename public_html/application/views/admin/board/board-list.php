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
            <form id="search_form">
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                  <button type="button" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn" onclick="search(this)">검색</button>
                  <input type="text" class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="<?php echo $this->input->get('srcN'); ?>"/>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcType" id="srcType">
                    <option value="all" <?php echo ($srcType=="all") ? "selected": ""; ?>>전체</option>
                    <option value="title" <?php echo ($srcType=="title") ? "selected": ""; ?>>제목</option>
                    <option value="content" <?php echo ($srcType=="content") ? "selected": ""; ?>>내용</option>
                  </select>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <?php if(!empty($thumb)){ ?>
                      <col width="20%"/>
                      <?php } ?>
                      <col/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">#</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">노출</th>
                        <th class="text-center">작성자</th>
                        <th class="text-center">작성일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                      <tr onclick="goModify('{board_seq}')" style="cursor:pointer">
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{board_title}</td>
                        <td class="text-center">{board_display_yn}</td>
                        <td class="text-center">{board_writer_name}</td>
                        <td class="text-center">{board_reg_datetime}</td>
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
      location.href="/admin/{boardType}NoticeView/"+$seq;
  }

  function writeBoard()
  {
    location.href="/admin/{boardType}NoticeWrite?boardType={boardType}";
  }
</script>
