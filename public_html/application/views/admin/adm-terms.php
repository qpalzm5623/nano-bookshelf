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
            <form role="form" id="admTermsForm">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <h4 style="color:#007bff;">소리박스 이용약관</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup />
                  <tbody>
                    <tr>
                      <th>이용약관</th>
                      <td>
                        <textarea rows="50" class="form-control col-sm-6 float-left" id="terms" name="terms" placeholder="이용약관"><?php echo $termsData['terms']; ?></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeTerms()">저장</button>
              </div>
            </form>
          </div>
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


  function writeTerms(){

    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var form = $('#admTermsForm')[0];
    var formData = new FormData($('#admTermsForm')[0]);

    formData.append(csrf_name,csrf_val);


    $.ajax({
      type: "POST",
      url : "/admin/home/termsWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("저장 되었습니다.");
          location.href = "/admin/terms";
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
