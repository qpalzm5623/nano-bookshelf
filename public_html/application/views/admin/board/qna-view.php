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
              <input type="hidden" name="qna_seq" value="{qna_seq}"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">작성자</label>
                  <input type="text" class="form-control" value="<?php echo $qnaData['user_name']; ?>(<?php echo $qnaData['user_id']; ?>)" readonly>
                </div>
                <div class="form-group">
                  <label for="title">제목</label>
                  <input type="text" class="form-control" value="<?php echo $qnaData['title']; ?>" readonly>
                </div>
                <div class="form-group">
                  <label for="title">내용</label>
                  <textarea class="form-control" readonly><?php echo $qnaData['contents']; ?></textarea>
                </div>
                <div class="form-group">
                  <label for="title">답변</label>
                  <textarea class="form-control" name="reply_contents" id="reply_contents"><?php echo $qnaData['reply_contents']; ?></textarea>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-default float-right mr-2" onclick="goDelete()">삭제</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">답변등록</button>
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
    location.href="/admin/etc/qnaList{param}";
  }

  function goDelete()
  {
    if(confirm("삭제 하시겠습니까?")){
      location.href="/admin/etc/deleteQna/{qna_seq}{param}";
    }
  }

  function writeProc(){
    var reply_contents = $('#reply_contents').val();
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    if( reply_contents == "" ){
        alert("답변을 작성해주세요.");
        return;
    }

    var data = $('#boardWriteForm').serialize();

    data[csrf_name] = csrf_val;


    $.ajax({
      type: "POST",
      url : "/admin/etc/qnaCommentWriteProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {

        if( data.result == "success" ){
          alert("작성 되었습니다.");
          location.href = "/admin/etc/qnaList{param}";
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
