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
            <form role="form" id="admInfoForm">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="info_seq" value="<?php echo $infoData['info_seq'] ?>"/>
              <input type="hidden" name="info_type" value="A"/>
              <div class="card-body">
                <h4 style="color:#007bff;">소리박스 매뉴얼</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup />
                  <tbody>
                    <tr>
                      <th>링크 URL</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" id="info_manual" name="info_manual" placeholder="소리박스메뉴얼(PDF)" value="<?php echo $infoData['info_manual']; ?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>타겟</th>
                      <td colspan="3">
                        <select class="form-control col-sm-3 float-left" name="manual_target" id="manual_target">
                            <option value="_self" <?php echo $infoData['manual_target']=="_self" ? "selected" : "" ?>>현재창</option>
                            <option value="_blank" <?php echo $infoData['manual_target']=="_blank" ? "selected" : "" ?>>새창</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-body">
                <h4 style="color:#007bff;">영상보고 따라해보기</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup />
                  <tbody>
                    <tr>
                      <th>링크 URL</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" id="info_movie" name="info_movie" placeholder="YOUTUBE 주소" value="<?php echo $infoData['info_movie']; ?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>타겟</th>
                      <td colspan="3">
                        <select class="form-control col-sm-3 float-left" name="movie_target" id="movie_target">
                          <option value="_self" <?php echo $infoData['movie_target']=="_self" ? "selected" : "" ?>>현재창</option>
                          <option value="_blank" <?php echo $infoData['movie_target']=="_blank" ? "selected" : "" ?>>새창</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-body">
                <h4 style="color:#007bff;">내 학원 연계 링크</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup />
                  <tbody>
                    <tr>
                      <th>링크 URL</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" id="info_blog" name="info_blog" placeholder="블로그,인스타그램 등 학원 URL 입력" value="<?php echo $infoData['info_blog']; ?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>타겟</th>
                      <td colspan="3">
                        <select class="form-control col-sm-3 float-left" name="blog_target" id="blog_target">
                          <option value="_self" <?php echo $infoData['blog_target']=="_self" ? "selected" : "" ?>>현재창</option>
                          <option value="_blank" <?php echo $infoData['blog_target']=="_blank" ? "selected" : "" ?>>새창</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeInfo()">저장</button>
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


  function writeInfo(){

    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var form = $('#admInfoForm')[0];
    var formData = new FormData($('#admInfoForm')[0]);

    formData.append(csrf_name,csrf_val);


    $.ajax({
      type: "POST",
      url : "/admin/home/infoWriteProc",
      data: formData,
      dataType:"json",
      processData: false,
      contentType: false,
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("저장 되었습니다.");
          location.href = "/admin/admInfo";
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
