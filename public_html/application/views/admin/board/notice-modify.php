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
              <input type="hidden" name="notice_seq" value="{notice_seq}"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">공개</label>
                  <select type="text" class="form-control col-sm-2" name="notice_read_type" id="notice_read_type">
                    <option value="">선택</option>
                    <option value="0" <?php echo $noticeData['notice_read_type']=="0"?"selected":""; ?>>전체공개</option>
                    <option value="1" <?php echo $noticeData['notice_read_type']=="1"?"selected":""; ?>>기관관리자이상</option>
                    <option value="2" <?php echo $noticeData['notice_read_type']=="2"?"selected":""; ?>>학급관리자이상</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">제목</label>
                  <input type="text" class="form-control" name="notice_title" id="notice_title" placeholder="제목을 작성해주세요" value="<?php echo $noticeData['notice_title'] ?>">
                </div>
                <div class="form-group">
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="notice_display_yn" value="Y" <?php echo $noticeData['notice_display_yn']=="Y"?"checked":""; ?>/> 노출
                  </label>
                  <label style="margin-left:5px; margin-top:5px;">
                    <input type="radio" name="notice_display_yn" value="N" <?php echo $noticeData['notice_display_yn']=="N"?"checked":""; ?>/> 비노출
                  </label>
                </div>
                <div class="form-group">
                  <label for="board_title">내용</label>
                  <textarea class="form-control" name="notice_contents" id="ir1" style="display:none;"><?php echo $noticeData['notice_contents']; ?></textarea>
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
					                modifyProc();
					            } catch(e) {
                        console.log(e);
                      }
					         }
					        </script>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <?php if($this->session->userdata("admin_level")=="0"){ ?>
                <button type="button" class="btn btn-default float-right mr-2" onclick="goDelete()">삭제</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="submitContents()">저장</button>
                <?php }?>
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
    location.href="/admin/etc/noticeList{param}";
  }

  function goDelete(){
    if(confirm("삭제하시겠습니까?")){
      location.href="/admin/etc/deleteNotice/{notice_seq}{param}";
    }

  }

  function modifyProc(){

    var read_type = $('#notice_read_type').val();
    var notice_title = $('#notice_title').val();
    var notice_contents = $('#ir1').val();
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    if( read_type == "" ){
        alert("공개를 선택해주세요.");
        return;
    }

    if( notice_title == "" ){
        alert("제목을 작성 해 주세요.");
        return;
    }


    if( notice_contents == "" ){
        alert("내용을 작성 해 주세요.");
        return;
    }

    var data = $('#boardWriteForm').serialize();

    data[csrf_name] = csrf_val;


    $.ajax({
      type: "POST",
      url : "/admin/etc/noticeModifyProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("수정 되었습니다.");
          location.href = "/admin/etc/noticeList{param}";
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
