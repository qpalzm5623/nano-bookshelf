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
            <form role="form" id="boardWriteForm" enctype="multipart/form-data">
              <input type="hidden" name="board_seq" value="{board_seq}"/>
              <input type="hidden" name="board_title" value="{board_name}"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">제목</label>
                  <input type="text" class="form-control" name="title" id="title" placeholder="Enter Title">
                </div>
                <div class="form-group">
                  <label for="board_title">내용</label>
                  <textarea class="form-control" name="ir1" id="ir1" style="display:none;"></textarea>
                  <script type="text/javascript" src="{base_url}assets/admin_resources/editor/js/HuskyEZCreator.js" charset="utf-8"></script>
                  <script type="text/javascript">
					        var oEditors = [];
					        nhn.husky.EZCreator.createInIFrame({
					            oAppRef: oEditors,
					            elPlaceHolder: "ir1",
					            sSkinURI: "{base_url}assets/admin_resources/editor/SmartEditor2Skin.html",
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
                {type}
                <?php if( $type == "global" ){ ?>
                <div class="form-group">
                  <label for="title">썸네일</label>
                  <div class="input-group">
                      <input type="file" class="form-control" id="thumb" name="thumb">
                  </div>
                </div>
              <?php } ?>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="submitContents()">글쓰기</button>
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
    location.href="{base_url}admin/board/{board_name}";
  }

  function writeProc(){

    var title = $('#title').val();
    var contents = $('#ir1').val();

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
    console.log("======");
    formData.append("title",title);
    formData.append("ir1",contents);
    try{
      formData.append("thumb",$("#thumb")[0].files[0]);
    }catch(e){
      console.log(e);
    }




    $.ajax({
      type: "POST",
      url : "{base_url}admin/boardWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("작성 되었습니다.");
          location.href = "{base_url}admin/board/{board_name}";
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
