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
                  <input type="text" class="form-control" name="book_title" id="book_title" placeholder="Enter Title" value="">
                </div>
                <div class="form-group">
                  <label for="title">PDF 등록</label>
                  <input type="file" class="form-control" name="book_file" id="book_file">
                </div>
                <div class="form-group">
                  <label for="title">썸네일</label>
                  <input type="file" class="form-control" name="book_thumb" id="book_thumb">
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">올리기</button>
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
    location.href="/admin/etcAdm/bookList";
  }

  function writeProc(){

    var title = $('#book_title').val();
    var book_file = $('#book_file').val();
    var book_thumb = $('#book_thumb').val();
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    if( title == "" ){
        alert("제목을 작성해 주세요.");
        return;
    }
    if( book_file == "" ){
        alert("파일을 등록해 주세요.");
        return;
    }
    if( book_thumb == "" ){
        alert("썸네일을 등록해 주세요.");
        return;
    }

    var form = $('#boardWriteForm')[0];
    var formData = new FormData($('#boardWriteForm')[0]);
    try{
      formData.append("book_file",$("#book_file")[0].files[0]);
      formData.append("book_thumb",$("#book_thumb")[0].files[0]);
    }catch(e){
      console.log(e);
    }
    formData.append(csrf_name,csrf_val);


    $.ajax({
      type: "POST",
      url : "/admin/etcAdm/bookWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("작성 되었습니다.");
          location.href = "/admin/etcAdm/bookList";
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
