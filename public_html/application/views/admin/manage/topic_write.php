<style>
.challenge_category {height:200px;}
.challenge_category li{display:inline;}
.challenge_category img {height:200px;}
</style>
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
            <form role="form" name="mainForm" id="mainForm" enctype="multipart/form-data" action="/admin/manage/topicWriteProc" method="post">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="code_seq" id="code_seq" value="<?php echo @$data['code_seq'];?>" /> 
              <input type="hidden" name="code_group" value="topic" /> 

              <div class="card-body">
                <h4 style="color:#007bff;">책 주제 등록</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
 
                    <tr>
                      <th>주제</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="code_name" name="code_name" placeholder="제목" value="<?php echo @$data['code_name'];?>" onkeyup="changeTitle()" required />
                      </td>
                    </tr>                    
                    <tr>
                      <th>간단 설명</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="code_desc" name="code_desc" placeholder="간단 설명" value="<?php echo @$data['code_desc'];?>" required />
                      </td>
                    </tr>        
                    <tr>
                      <th>세부태그</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="code_tags" name="code_tags" placeholder="세부태그" value="<?php echo @$data['code_tags'];?>" required />
                      </td>
                    </tr>                                                            
                    <tr>
                      <th>배너이미지</th>
                      <td colspan="3">
                        <div class="col-sm-12">
                            <input type="file" class="form-control col-sm-6" id="code_image" name="code_image" placeholder="배너 이미지" value="" <?php if(@$data['code_image'] =='') echo "required";?>/>
                        </div>
                        <div>*이미지는 400KB 미만, 너비 400px, JPG, PNG 파일만 등록 가능</div>
                      </td>
                    </tr>                    
                    <tr>
                      <th>노출설정</th>
                      <td colspan="3">
                        <input type="radio" name="code_status" id="status_Y" value="Y" <?php echo @$data['code_status']=="Y"||@$data['code_status']==""?"checked":""?>>노출
                        <input type="radio" name="code_status" id="status_N" value="N" <?php echo @$data['code_status']=="N"?"checked":""?>>비노출
                      </td>
                    </tr>
                    <tr>
                      <th class="text-left align-middle">미리보기</th>
                      <td class="text-left align-middle">
                        <div class="challenge_wrap">
	                       <div class="challenge_category" style="padding-left:0px;">
                            <ul style="padding-left:0px;">
            					<li>
            						<a href="#">
            							<img src="/upload/code/<?php echo @$data['code_image'];?>" class="thumb" id="preview_img" alt="">
            							<strong><span id="preview_text"><?php echo @$data['code_name'];?></span></strong>
            						</a>
            					</li>
            				</ul>
                          </div>
                        </div>
                      </td>
                    </tr>                     
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <?php if(@$data['code_seq'] == "") {?>
                <button type="button" class="btn btn-default float-right" style="margin-right:10px;" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">등록</button>
                <?php } else {?>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">수정</button>                
                <button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteProc()">삭제</button>                
                <button type="button" class="btn btn-default float-right" style="margin-right:10px;" onclick="goList()">목록</button>
                <?php } ?>
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
    var fileDOM = document.querySelector('#code_image');
    var preview = document.querySelector('#preview_img');
    function changeTitle()
    {
      var txt = $('#code_name').val();
      $('#preview_text').text(txt);
    }

   $(function(){
      const myForm = $('#mainForm');
      myForm.validate({
        rules: {
            // Define rules for specific fields if needed
        },
        messages: {
        },
        submitHandler: function() {
           
            return true;
        },        
        errorPlacement: function (error, element) {
             //console.log(element);
             console.log(error);
             error.insertBefore(element);
             //error.addClass("error-validation");
             $(element).addClass("error-validation");
        }        
      });
      
      fileDOM.addEventListener('change', () => {
        const imageSrc = URL.createObjectURL(fileDOM.files[0]);
        preview.src = imageSrc;
      });      
          
  });
 
  function goList(){
    location.href="/admin/manage/topic_list";
  }

  function checkInput()
  {
     
    return true;
  }

  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      
      $('#mainForm').submit();
  }
  
  function deleteProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var formData = {"code_seq":$('#code_seq').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
      $.ajax({
        type: "POST",
        url : "/admin/manage/deleteTopicProc",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("삭제 되었습니다.");
            location.href = "/admin/manage/topic_list";
          } else {
              alert(data.msg);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
    });
  }  
</script>
