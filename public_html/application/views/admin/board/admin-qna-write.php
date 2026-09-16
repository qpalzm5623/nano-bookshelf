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
            <li class="breadcrumb-item"><a href="#">Home</a></li>
            <li class="breadcrumb-item">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
    <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
    <ul class="nav nav-tabs" id="custom-content-below-tab" role="tablist">
        <li class="nav-item">
            <a href="adminQnaWrite" class="nav-link active"    aria-selected="true">1:1 문의</a>
        </li>
        <li class="nav-item">
            <a href="adminQnaList"  class="nav-link  " aria-selected="false">내 문의 내역</a>
        </li>
    </ul>        
    <?php } ?>
    <div class="card mb-12">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form role="form" id="mainForm" enctype="multipart/form-data">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                
                  <table class="table table-bordered">
                    <colgroup>
                      <col width="15%"/>
                      <col width="85%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <td class="text-center">구분</td>
                        <td class="text-left align-middle">
                            <input type="radio" name="qna_category" id="qna_category1" value="일반" <?php echo @$data['qna_category']=="일반"||@$data['qna_category']=="일반"?"checked":""?>> 일반
                            <input type="radio" name="qna_category" id="qna_category2" value="북퀴즈 관련"  <?php echo @$data['qna_category']=="북퀴즈 관련"||@$data['qna_category']==""?"checked":""?>> 북퀴즈 관련          
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center">제목</td>
                        <td class="text-left align-middle">
                            <input type="text" name="title" id="title" class="form-control" value="<?php echo @$qnaData['title']; ?>" >
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center">내용</td>
                        <td class="text-left align-middle">
                            <textarea class="form-control" id="contents" name="contents" rows="10" /><?php echo @$data['contents'];?></textarea>
                        </td>
                      </tr>                      
                    </tbody>
                  </table>
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" onclick="writeProc()">등록</button>
              </div>
          </form>            
          </div>
          <!-- /.card -->
        </div>
      </div>

      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
function writeProc()
{

  if($('#title').val() == ""){
    alert("제목을 입력해 주세요.");
    return;
  }
  
  if($('#contents').val() == ""){
    alert("내용을 입력해 주세요.");
    return;
  }  

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#mainForm').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etc/adminQnaWriteProc",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      alert("등록되었습니다.");
      location.reload();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}
 
</script>
