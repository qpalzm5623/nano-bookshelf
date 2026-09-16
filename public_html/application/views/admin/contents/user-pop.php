<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
.bg-lightgray{background:#efefef}
.mt-3 {font-size:25pt}
.widget-user .widget-user-header {
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    height: auto; 
    padding: 1rem;
    text-align: center;
}
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
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <input type="hidden" id="user_seq" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
  <section class="content">
    <div class="container-fluid">
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="85%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속명</th>
                              <td >
                                  <?php echo @$data['group_name'];?>
                              </td>
                            </tr>
                            <tr>
                              <th>이름</th>
                              <td >
                                <?php echo $data['user_name'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th>ID</th>
                              <td >
                                <?php echo $data['user_id'];?>
                              </td>
                            </tr>
                            <tr>
                              <th>휴대폰번호</th>
                              <td >
                                <?php echo $data['cell_no'];?>
                              </td>
                            </tr>
                            <tr>
                              <th>계정 구분</th>
                              <td >
                                <?php if($data['user_type'] == "director") {?>
                                기관관리자
                                <?php } else if($data['user_type'] == "admin") {?>
                                관리자
                                <?php } else if($data['user_type'] == "teacher") {?>
                                선생님
                                <?php } else if($data['user_type'] == "master") {?>
                                마스터
                                <?php } ?>
                              </td>
                            </tr>  
                            <tr>
                              <th>이용 상태</th>
                              <td >
                                <?php if($data['user_status'] =="Y") echo "사용"; else if($data['user_status'] =="N") echo "미사용";?>
                              </td>
                            </tr>
                            <tr>
                              <th>이용 상품</th>
                              <td >
                                <?php echo $data['pricing_plan'];?>
                              </td>
                            </tr>  
                          </tbody>
                        </table>
                      </div>
                  </div>
                  </div>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-primary" onclick="window.close()">닫기</button>
              </span>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
  var csrf_name = '<?=$this->security->get_csrf_token_name();?>';
  var csrf_val = '<?=$this->security->get_csrf_hash();?>';    
  function deleteUser($seq) {
      if(confirm('삭제하시겠습니까?')) {
          var data = {"ci_csrf_token":csrf_val, "user_seq":$seq }

          $.ajax({
            type: "POST",
            url : "/admin/partner/deleteUser",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              alert("삭제되었습니다.");
              location.reload();
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
          });        
      }
  }    
    
  function passwordChange() {
      if(confirm('변경하시겠습니까?')) {
          var data = {"ci_csrf_token":csrf_val, "user_seq":$('#user_seq').val(), "password":$('#password').val()  };

          $.ajax({
            type: "POST",
            url : "/admin/partner/passwordChange",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              alert("수정되었습니다.");
              location.reload();
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
          });        
      }
  }    
  function cellNoChange() {
      if(confirm('변경하시겠습니까?')) {
          var data = {"ci_csrf_token":csrf_val, "user_seq":$('#user_seq').val(), "cell_no":$('#cell_no').val()  };

          $.ajax({
            type: "POST",
            url : "/admin/partner/cellNoChange",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              alert("수정되었습니다.");
              location.reload();
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
          });        
      }
  }    
      
function choice() {
    $("input[name='check[]']:checked").each(function(){
        var seq = $(this).val();
       //console.log($(this).val()) 
       //opener.$('#book_no').val($('#book_no'+seq).val());
       //opener.$('#book_name').val($('#book_name'+seq).val());
       //opener.$('#serise').val($('#serise'+seq).val());
       //opener.$('#author').val($('#author'+seq).val());
       //opener.$('#publisher').val($('#publisher'+seq).val());
       //opener.$('#isbn').val($('#isbn'+seq).val());
       //opener.$('#category').val($('#category'+seq).val());
       //opener.$('#sub_category').val($('#sub_category'+seq).val());
       //opener.$('#subject').val($('#subject'+seq).val());
       //opener.$('#tags').val($('#tags'+seq).val());
       //opener.$('#recommend_class').val($('#recommend_class'+seq).val());
       //opener.$('#book_cover').val($('#book_cover'+seq).val());       
       var data = {
           "book_no" : $('#book_no'+seq).val(),
           "book_name" : $('#book_name'+seq).val(),
           "serise" : $('#serise'+seq).val(),
           "author" : $('#author'+seq).val(),
           "publisher" : $('#publisher'+seq).val(),
           "subject" : $('#subject'+seq).val(),
           "recommend_class" : $('#recommend_class'+seq).val(),
           "user_id" : $('#user_id'+seq).val(),
       }
       if(opener.isFind($('#book_no'+seq).val()) == false) {
           opener.book_info_list.push(data);
           
           opener.book_list.push($('#book_no'+seq).val());
           var html = '<tr style="cursor:pointer" class="book_'+$('#book_no'+seq).val()+'">';
           html += '  <td class="text-center align-middle">'+$('#book_name'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#serise'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#author'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#publisher'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#subject'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#recommend_class'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#user_id'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle"><button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteBook(\''+$('#book_no'+seq).val()+'\')">삭제</button></td>';
           html += '</tr>';
           opener.$('#book_list').append(html);
       }
    });
    return;


}
$(function(){
    $('#cellNoBtn').on("click",function() {
        cellNoChange();
    });
    $('#passwordBtn').on("click",function() {
        passwordChange();
    });    
    $('#allCheck').on("click",function(){
      allCheckClick();
    });
});

function allCheckClick()
{
  if($('#allCheck').is(":checked") == true ){
    $('input[name="chk[]"]').prop("checked",true);
  }else{
    $('input[name="chk[]"]').prop("checked",false);
  }
}

function choiceReadChange()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("공개변경 교육정보를 선택해주세요.");
    return;
  }

  var notice_read_type = $('#notice_read_type').val();
  if(notice_read_type == ""){
    alert("변경할 공개상태를 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etcAdm/updateNoticeDisplay",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      alert("상태가 변경되었습니다.");
      location.reload();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}

function deleteNotice()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("삭제할 공지사항을 선택해주세요."); 
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etcAdm/deleteNotice",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      alert("삭제 되었습니다.");
      location.reload();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}
  function goModify($seq)
  {
      location.href="book_modify/"+$seq+"{param}";
  }

  function goView($seq)
  {
      location.href="book_write/"+$seq+"{param}";
  }

  function writeNotice()
  {
    location.href="book_write/{param}";
  }
</script>
