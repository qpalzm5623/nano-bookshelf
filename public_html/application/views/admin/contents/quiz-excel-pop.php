<!-- Content Wrapper. Contains page content -->
<div class="wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{sub_title}</h1>

        </div>
        <div class="col-sm-6">
          <button type="button" class="btn btn-success float-right" onclick="sampleDownload();">샘플다운로드</button>
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
            <form role="form" id="excelForm" enctype="multipart/form-data" action="/admin/content/quizExcelProc" method="POST">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <h4 class="float-left" style="color:#007bff;">엑셀 업로드</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <tbody>
                    <tr>
                      <th>엑셀 업로드</th>
                      <td>
                        <input type="file" class="form-control col-sm-6 float-left" id="excel" name="excel" accept=".xls, .xlsx" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="closePop()">닫기</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="uploadExcel()">등록</button>
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
function closePop(){
    window.close();
}

function sampleDownload()
{
    location.href="/assets/admin_resources/quiz_example.xls";
}

function uploadExcel(){
    $('#excelForm').submit();
}
</script>
