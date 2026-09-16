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

            <!-- form start -->
            <form role="form" id="boardModifyForm" enctype="multipart/form-data">
              <input type="hidden" id="board_seq" name="board_seq" value="{board_seq}"/>
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">제목</label>
                  <input type="text" class="form-control" name="board_title" id="board_title" value="<?php echo $boardData['board_title']; ?>" placeholder="Enter Title">
                </div>
                <div class="form-group">
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="board_display_yn" value="Y" <?php echo $boardData['board_display_yn']=="Y" ? "checked" : ""; ?>/> 노출
                  </label>
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="board_display_yn" value="N" <?php echo $boardData['board_display_yn']=="N" ? "checked" : ""; ?>/> 비노출
                  </label>
                </div>
                <div class="form-group">
                  <label for="board_title">내용</label>
                  <textarea class="form-control" name="ir1" id="ir1" style="display:none;"><?php echo $boardData['board_contents']; ?></textarea>
                  <script type="text/javascript" src="/assets/admin_resources/editor/js/HuskyEZCreator.js" charset="utf-8"></script>
                  <script type="text/javascript">
					        var oEditors = [];
					        nhn.husky.EZCreator.createInIFrame({
					            oAppRef: oEditors,
					            elPlaceHolder: "ir1",
					            sSkinURI: "/assets/admin_resources/editor/SmartEditor2Skin.html",
					            fCreator: "createSEditor2"
					        });
					        function submitContents(elClickedObj) {

					            // 에디터의 내용이 textarea에 적용됩니다.
					            oEditors.getById["ir1"].exec("UPDATE_CONTENTS_FIELD", []);
					            // 에디터의 내용에 대한 값 검증은 이곳에서 document.getElementById("ir1").value를 이용해서 처리하면 됩니다.

					            try {
					                modiProc();
					            } catch(e) {}
					            }
					        </script>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteBoard()">삭제</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="submitContents()">수정</button>
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
    location.href="/admin/{boardType}NoticeList";
  }

  function deleteBoard(){
    var seq = "{board_seq}";
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();


    var formdata = {
      "board_seq" :  seq,
      "boardType" : "{boardType}"
    };

    formdata[csrf_name] = csrf_val;

    if( confirm("삭제 하시겠습니까?") ){
      $.ajax({
        type: "POST",
        url : "/admin/noticeDelete",
        data: formdata,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("삭제 되었습니다.");
            location.href="/admin/{boardType}NoticeList";
          } else {
            alert("삭제되지 않았습니다.");
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
    }
  }

  function modiProc(){
    var board_title = $('#board_title').val();
    var board_contents = $('#ir1').val();
    var org_thumb = $('#org_thumb').val();
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    if( board_title == "" ){
      alert("제목을 작성 해 주세요.");
      return;
    }
    if( board_contents == "" ){
      alert("내용을 작성 해 주세요.");
      return;
    }

    var form = $('#boardModifyForm')[0];
    var formData = new FormData($('#boardModifyForm')[0]);

    formData.append("board_title",board_title);
    formData.append("board_contents",board_contents);
    formData.append("board_seq","{board_seq}");
    formData.append("boardType","{boardType}");
    formData.append(csrf_name,csrf_val);

    $.ajax({
      type: "POST",
      url : "/admin/noticeModifyProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("수정 되었습니다.");
          location.href = "/admin/{boardType}NoticeList";
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
