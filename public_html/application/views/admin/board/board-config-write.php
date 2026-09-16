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
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="seq" value="<?php echo $data['seq'];?>" />
              <div class="card-body">
                <div class="form-group">
                  <label for="title">게시판 코드(영어만 사용)</label>
                  <input type="text" class="form-control" name="board_name" id="board_name" placeholder="게시판 코드" value="<?php echo $data['board_name'];?>">
                </div>
                <div class="form-group">
                  <label for="title">게시판 제목</label>
                  <input type="text" class="form-control" name="board_title" id="board_title" placeholder="게시판 제목" value="<?php echo $data['board_title'];?>">
                </div>
                <div class="form-group">
                  <label for="title">게시판 TYPE</label>
                  <select name="board_type" id="board_type" class="form-control col-sm-12 float-left" >
                      <option value="">===선택해주세요===</option>
                      <option <?php echo $data['board_type']=="notice"?"selected":"";?> value="notice">일반게시판</option>
                      <option <?php echo $data['board_type']=="gallery"?"selected":"";?> value="gallery">갤러리</option>
                      <option <?php echo $data['board_type']=="faq"?"selected":"";?> value="faq">FAQ</option>
                      <option <?php echo $data['board_type']=="comment"?"selected":"";?> value="comment">답변형</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">읽기 LEVEL</label>
                  <select name="board_read_level" id="board_read_level" class="form-control col-sm-12 float-left" >
                      <option value="">===선택해주세요===</option>
                      <option <?php echo $data['board_read_level']=="1"?"selected":"";?> value="1">1 LEVEL(관리자)</option>
                      <option <?php echo $data['board_read_level']=="2"?"selected":"";?> value="2">2 LEVEL(학원관리자)</option>
                      <option <?php echo $data['board_read_level']=="3"?"selected":"";?> value="3">3 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="4"?"selected":"";?> value="4">4 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="5"?"selected":"";?> value="5">5 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="6"?"selected":"";?> value="6">6 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="7"?"selected":"";?> value="7">7 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="8"?"selected":"";?> value="8">8 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="9"?"selected":"";?> value="9">9 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="10"?"selected":"";?> value="10">10 LEVEL(학생)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">쓰기 LEVEL</label>
                  <select name="board_write_level" id="board_write_level" class="form-control col-sm-12 float-left" >
                      <option value="">===선택해주세요===</option>
                      <option <?php echo $data['board_read_level']=="1"?"selected":"";?> value="1">1 LEVEL(관리자)</option>
                      <option <?php echo $data['board_read_level']=="2"?"selected":"";?> value="2">2 LEVEL(학원관리자)</option>
                      <option <?php echo $data['board_read_level']=="3"?"selected":"";?> value="3">3 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="4"?"selected":"";?> value="4">4 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="5"?"selected":"";?> value="5">5 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="6"?"selected":"";?> value="6">6 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="7"?"selected":"";?> value="7">7 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="8"?"selected":"";?> value="8">8 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="9"?"selected":"";?> value="9">9 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="10"?"selected":"";?> value="10">10 LEVEL(학생)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">댓글 LEVEL</label>
                  <select name="board_reply_level" id="board_reply_level" class="form-control col-sm-12 float-left" >
                      <option value="">===선택해주세요===</option>
                      <option <?php echo $data['board_read_level']=="1"?"selected":"";?> value="1">1 LEVEL(관리자)</option>
                      <option <?php echo $data['board_read_level']=="2"?"selected":"";?> value="2">2 LEVEL(학원관리자)</option>
                      <option <?php echo $data['board_read_level']=="3"?"selected":"";?> value="3">3 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="4"?"selected":"";?> value="4">4 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="5"?"selected":"";?> value="5">5 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="6"?"selected":"";?> value="6">6 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="7"?"selected":"";?> value="7">7 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="8"?"selected":"";?> value="8">8 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="9"?"selected":"";?> value="9">9 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="10"?"selected":"";?> value="10">10 LEVEL(학생)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">삭제 LEVEL</label>
                  <select name="board_delete_level" id="board_delete_level" class="form-control col-sm-12 float-left" >
                      <option value="">===선택해주세요===</option>
                      <option <?php echo $data['board_read_level']=="1"?"selected":"";?> value="1">1 LEVEL(관리자)</option>
                      <option <?php echo $data['board_read_level']=="2"?"selected":"";?> value="2">2 LEVEL(학원관리자)</option>
                      <option <?php echo $data['board_read_level']=="3"?"selected":"";?> value="3">3 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="4"?"selected":"";?> value="4">4 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="5"?"selected":"";?> value="5">5 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="6"?"selected":"";?> value="6">6 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="7"?"selected":"";?> value="7">7 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="8"?"selected":"";?> value="8">8 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="9"?"selected":"";?> value="9">9 LEVEL</option>
                      <option <?php echo $data['board_read_level']=="10"?"selected":"";?> value="10">10 LEVEL(학생)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="title">게시판 카테고리(구분자 || ex) 고객문의||FAQ||Q&A)</label>
                  <input type="text" class="form-control" name="board_category" id="board_category" placeholder="게시판 카테고리" value="<?php echo $data['board_category'];?>">
                </div>
                <div class="form-group">
                  <label for="title">사용 유무</label>
                  <input type="checkbox"  name="board_state" id="board_state" value="Y" <?php echo $data['board_state']!="N"?"checked":"";?>>
                </div>
                <div class="form-group">
                  <label for="title">우선순위</label>
                  <input type="text" class="form-control" name="sort_order" id="sort_order" placeholder="노출 우선 순위"  value="<?php echo $data['sort_order'];?>">
                </div>
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
    location.href="{base_url}admin/boardAdm/boardConfigList";
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
    formData.append("title",title);
    formData.append("ir1",contents);
    try{
      formData.append("thumb",$("#thumb")[0].files[0]);
    }catch(e){
      console.log(e);
    }




    $.ajax({
      type: "POST",
      url : "{base_url}admin/boardAdm/boardConfigWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("작성 되었습니다.");
          location.href = "{base_url}admin/boardAdm/boardConfigList";
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
