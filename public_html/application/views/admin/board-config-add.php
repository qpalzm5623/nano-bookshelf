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
            <li class="breadcrumb-item"><a href="{base_url}admin/main">Home</a></li>
            <li class="breadcrumb-item active">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <!-- left column -->
        <div class="col-md-12">
          <!-- general form elements -->
          <div class="card card-primary">
            <div class="card-header">
              <h3 class="card-title">게시판 추가</h3>
            </div>
            <!-- /.card-header -->
            <!-- form start -->
            <form role="form" id="boardAddform">
              <div class="card-body">
                <div class="form-group">
                  <label for="board_name">게시판 이름(code)</label> <code>* 영문만 가능</code>
                  <input type="text" class="form-control" name="board_name" id="board_name" placeholder="Enter Board Name">
                </div>
                <div class="form-group">
                  <label for="board_title">게시판 제목</label> <code>* 한글명 또는 제목</code>
                  <input type="text" class="form-control" name="board_title" id="board_title" placeholder="Enter Board Title">
                </div>
                <div class="form-group">
                  <label for="board_skin">게시판 스킨</label>
                  <select class="form-control" name="board_skin" id="board_skin">
                    {skins}
                    <option value="{name}">{name}</option>
                    {/skins}
                  </select>
                </div>
                <div class="form-group">
                  <label for="board_read_level">게시판 읽기 권한</label> <code>* 0=전체,1=관리자</code>
                  <input type="number" class="form-control col-1" name="board_read_level" id="board_read_level" placeholder="" value="0">
                </div>
                <div class="form-group">
                  <label for="board_write_level">게시판 쓰기 권한</label> <code>* 0=전체,1=관리자</code>
                  <input type="number" class="form-control col-1" name="board_write_level" id="board_write_level" placeholder="" value="0">
                </div>
                <div class="form-group">
                  <label for="board_delete_level">게시판 지우기 권한</label> <code>* 0=전체,1=관리자</code>
                  <input type="number" class="form-control col-1" name="board_delete_level" id="board_delete_level" placeholder="" value="0">
                </div>
                <div class="form-group">
                  <label for="board_state">게시판 상태</label>
                  <select class="form-control" name="board_state" id="board_state">
                    <option value="1">사용</option>
                    <option value="2">사용안함</option>
                  </select>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="addBoard()">게시판 추가</button>
              </div>
            </form>
          </div>
          <!-- /.card -->

        </div>
        <!--/.col (right) -->
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
  function goList(){
    location.href="{base_url}admin/boardConfig";
  }

  function addBoard(){
    var board_name = $('#board_name').val();
    var board_title = $('#board_title').val();
    var board_skin = $('#board_skin').val();

    if( board_name == "" ){
      alert("게시판 이름을 작성 해 주세요.");
      return;
    }
    if( board_title == "" ){
      alert("게시판 제목을 작성 해 주세요.");
      return;
    }

    var korChk = /[\ㄱ-ㅎㅏ-ㅣ가-힣\s]/g;
    console.log(korChk.test($('#board_name').val()));
    if( korChk.test($('#board_name').val()) ){
      alert("게시판 이름은 한글 또는 공백을 입력할 수 없습니다.");
      return;
    }

    var formData = $('#boardAddform').serialize();

    $.ajax({
      type: "POST",
      url : "{base_url}admin/boardAdd",
      data: formData,
      dataType:"json",
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("추가 되었습니다.");
          location.href = "{base_url}admin/boardConfig";
        } else {
          alert("오류발생!!");
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

  }
</script>
