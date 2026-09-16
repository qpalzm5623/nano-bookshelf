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
            <li class="breadcrumb-item"><a href="/admin/main">Home</a></li>
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
            <form role="form" id="boardWriteForm" enctype="multipart/form-data">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">제목</label>
                  <input type="text" class="form-control" name="board_title" id="board_title" placeholder="Enter Title" value="">
                </div>
                <div class="form-group">
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="board_display_yn" value="Y" checked/> 노출
                  </label>
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="board_display_yn" value="N"/> 비노출
                  </label>
                </div>
                <div class="form-group">
                  <label for="board_title">내용</label>
                  <textarea class="form-control" name="board_contents" id="ir1" style="display:none;"></textarea>
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
					                writeProc();
					            } catch(e) {}
					            }
					        </script>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="submitContents()">올리기</button>
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

  function writeProc(){

    var title = $('#board_title').val();
    var contents = $('#ir1').val();
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    if( title == "" ){
        alert("제목을 작성 해 주세요.");
        return;
    }
    if( contents == "" ){
        alert("내용을 작성 해 주세요.");
        return;
    }

    var form = $('#boardWriteForm')[0];
    var formData = new FormData($('#boardWriteForm')[0]);
    try{
      formData.append("board_thumb",$("#board_thumb")[0].files[0]);
    }catch(e){
      console.log(e);
    }

    formData.append("ir1",contents);
    formData.append(csrf_name,csrf_val);


    $.ajax({
      type: "POST",
      url : "/admin/{boardType}NoticeWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("작성 되었습니다.");
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
