<!-- Content Wrapper. Contains page content -->
<div class="wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{sub_title}</h1>
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

              <div class="card-body">
                <h4 class="float-left" style="color:#007bff;">업로드 결과</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <tbody>
                    <tr>
                      <th>성공</th>
                      <td>
                        <?php echo number_format($success); ?>건
                      </td>
                      <th>실패</th>
                      <td>
                        <?php echo number_format($failed); ?>건
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- form start -->
              <?php if($failed > 0){ ?>
              <div class="card-body">
                <h4 class="float-left" style="color:#007bff;">업로드실패 리스트</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <tbody>
                    <tr>
                      <th>구분</th>
                      <th>실패 메세지</th>
                    </tr>
                    <?php for($i=0; $i<count($errorArr)-1; $i++){?>
                    <tr>
                      <th>
                        <?php echo $errorArr[$i]['user_id']; ?>
                      </th>
                      <th>
                        <?php echo $errorArr[$i]['error_msg']; ?>
                      </th>
                    </tr>
                    <?php } ?>
                  </tbody>
                </table>
              </div>
            <?php } ?>

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="closePop()">닫기</button>
              </div>
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

</script>
