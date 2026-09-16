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
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="30%"/>
                      <col width="10%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">#</th>
                        <th class="text-center">게시판 이름</th>
                        <th class="text-center">게시판 제목</th>
                        <th class="text-center">게시판 스킨</th>
                        <th class="text-center">읽기</th>
                        <th class="text-center">쓰기</th>
                        <th class="text-center">삭제</th>
                        <th class="text-center">상태</th>
                        <th class="text-center">적용/삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($boardList) > 0 ){ ?>
                      {boardList}
                      <tr>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{board_name}</td>
                        <td class="text-center"><input id="board_title_{seq}" type="text" name="board_title" class="text-center form-control" value="{board_title}"/></td>
                        <td class="text-center">
                          <select class="form-control" id="board_skin_{seq}" name="board_skin">
                            {skins}
                          </select>
                        </td>
                        <td class="text-center"><input type="text" id="board_read_level_{seq}" name="board_read_level" class="text-center form-control" value="{board_read_level}"/></td>
                        <td class="text-center"><input type="text" id="board_write_level_{seq}" name="board_write_level" class="text-center form-control" value="{board_write_level}"/></td>
                        <td class="text-center"><input type="text" id="board_delete_level_{seq}" name="board_delete_level" class="text-center form-control" value="{board_delete_level}"/></td>
                        <td class="text-center">
                          <select class="form-control" id="board_state_{seq}" name="board_state">
                            {state}
                          </select>
                        </td>
                        <td class="text-center align-middle">
                          <div class="btn-group">
                            <button type="button" class="btn btn-info btn-sm" data-boardseq="{seq}" onclick="board_modify(this)">적용</button>
                            <button type="button" class="btn btn-danger btn-sm" data-boardseq="{seq}" onclick="board_delete(this)">삭제</button>
                          </div>
                        </td>
                      </tr>
                      {/boardList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="9">게시판이 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <!-- page
              <ul class="pagination pagination-sm m-0 float-left">
                <li class="page-item"><a class="page-link" href="#">&laquo;</a></li>
                <li class="page-item"><a class="page-link" href="#">1</a></li>
                <li class="page-item"><a class="page-link" href="#">2</a></li>
                <li class="page-item"><a class="page-link" href="#">3</a></li>
                <li class="page-item"><a class="page-link" href="#">&raquo;</a></li>
              </ul>
            -->
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="addBoard()">게시판 추가</button>
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
  function addBoard(){
    location.href="{base_url}admin/boardConfgAdd";
  }

  function board_modify($obj){
    var seq = $($obj).data("boardseq");
    //값 세팅
    var board_title = $('#board_title_'+seq).val();
    var board_skin = $('#board_skin_'+seq).val();
    var board_read_level = $('#board_read_level_'+seq).val();
    var board_write_level = $('#board_write_level_'+seq).val();
    var board_delete_level = $('#board_delete_level_'+seq).val();
    var board_state = $('#board_state_'+seq).val();

    var formdata = {
      "seq"                 : seq,
      "board_title"         : board_title,
      "board_skin"          : board_skin,
      "board_read_level"    : board_read_level,
      "board_write_level"   : board_write_level,
      "board_delete_level"  : board_delete_level,
      "board_state"         : board_state
    };

    if(confirm("수정 하시겠습니까?")){
      $.ajax({
        type: "POST",
        url : "{base_url}admin/boardConfigModify",
        data: formdata,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("수정 되었습니다.");
            location.reload();
          } else {
            alert(data.message);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
    }
  }

  function board_delete($obj){
    var seq = $($obj).data("boardseq");

    var formdata = {
      "seq" :  seq,
    };

    if( confirm("삭제 하시겟습니까?") ){
      $.ajax({
        type: "POST",
        url : "{base_url}admin/boardConfigDelete",
        data: formdata,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("삭제 되었습니다.");
            location.reload();
          } else {
            alert("작성된 게시글이 있습니다.\n게시글 삭제 후 게시판 삭제 가능합니다.");
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
    }
  }
</script>
