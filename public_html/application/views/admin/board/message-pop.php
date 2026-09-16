<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
</style>
<div class="content">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          {title}
        </div>
        <div class="col-sm-6">
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
        <form role="form" id="mainForm" name="mainForm" enctype="multipart/form-data" action="/admin/etc/messageProc" method="post">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <div class="card card-primary">
              <div class="card-body">
                  <table class="table table-bordered">
                      <colgroup width="15%" />
                      <colgroup width="85%" />
                      <tbody>
                      <tr>
                          <th class="bg-">받는사람</th>
                          <td>
                              <input type="text" class="form-control float-left" id="receive_id" name="receive_id"  value="<?php echo @$data['receive_id'];?>"/>
                          </td>
                      </tr>  
                      <tr>
                          <th class="bg-">제목</th>
                          <td>
                              <input type="text" class="form-control float-left" id="subject" name="subject"  value="<?php echo @$data['subject'];?>"/>
                          </td>
                      </tr>  
                      <tr>
                          <td colspan="2">
                              <textarea class="form-control" id="contents" name="contents" rows="10" onKeyUp="javascript:fnChkByte(this,'1000')"/><?php echo @$data['contents'];?></textarea>
                              <div class="text-right">
                                  <span id="text-size">0</span>
                                  /
                                  <span>1000</span>
                              </div>
                          </td>
                      </tr>                        
                      </tbody>
                  </table>
              </div>
              
          </div>   
          <div class="row">
              <span class="text-center mx-auto">
                <?php if(@$data['subject'] == ""){?>
                <button type="button" class="btn btn-primary float-left mr-3" onclick="writeProc()">보내기</button>
                <?php }?>
                <button type="button" class="btn btn-default float-left" onclick="window.close()">취소</button>
              </span>
          </div>          
      <!-- /.row -->
      </form>
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
function fnChkByte(obj, maxByte)
{
    var str = obj.value;
    var str_len = str.length;

    var rbyte = 0;
    var rlen = 0;
    var one_char = "";
    var str2 = "";


    for(var i=0; i<str_len; i++)
    {
        one_char = str.charAt(i);
        if(escape(one_char).length > 4) {
            rbyte += 2;                                         //한글2Byte
        }else{
            rbyte++;                                            //영문 등 나머지 1Byte
        }
        if(rbyte <= maxByte){
            rlen = i+1;                                          //return할 문자열 갯수
        }
     }
     if(rbyte > maxByte)
     {
        // alert("한글 "+(maxByte/2)+"자 / 영문 "+maxByte+"자를 초과 입력할 수 없습니다.");
        alert("메세지는 최대 " + maxByte + "byte를 초과할 수 없습니다.")
        str2 = str.substr(0,rlen);                                  //문자열 자르기
        obj.value = str2;
        fnChkByte(obj, maxByte);
     }
     else
     {
        document.getElementById('text-size').innerText = rbyte;
     }
}
    
  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var formData = $('#mainForm').serialize();
      $.ajax({
        type: "POST",
        url : "/admin/etc/messageProc",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
              alert("쪽지가 발송되었습니다.");
              window.close();
          } else {
              alert(data.msg);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });   
      //$('#mainForm').submit();
  }
  
  
  fnChkByte(document.getElementById('contents'),'1000') ;
</script>
