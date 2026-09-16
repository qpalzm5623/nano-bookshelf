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
            <form role="form" id="boardWriteForm">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
                <div class="form-group">
                  <label for="title">이용약관</label>
                  <textarea class="form-control" rows="30" name="terms" id="terms"><?php echo $termsData['terms']; ?></textarea>
                </div>
                <div class="form-group">
                  <label for="title">개인정보 수집 및 이용 동의</label>
                  <textarea class="form-control" rows="30" name="privacy" id="privacy"><?php echo $termsData['privacy']; ?></textarea>
                </div>
                <div class="form-group">
                  <label for="title">제 3자 정보 이용 동의서</label>
                  <textarea class="form-control" rows="30" name="privacy2" id="privacy2"><?php echo $termsData['privacy2']; ?></textarea>
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">등록</button>
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

  function writeProc(){
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = $('#boardWriteForm').serialize();

    data[csrf_name] = csrf_val;


    $.ajax({
      type: "POST",
      url : "/admin/etc/termsWriteProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {

        if( data.result == "success" ){
          alert("저장 되었습니다.");
          location.reload();
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
