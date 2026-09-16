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
    <form id="search_form">
    <div class="container-fluid">
        <div class="card mb-12">
            <div class="card-body">
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        아이디
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                            <input type="text" class="form-control col-8 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="아이디를 입력하세요.">
                            <button type="submit" class="btn  btn-primary" >검색</button>
                            
                    </div>
                </div>  
            </div>
        </div>                
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="10%"/>
                      <col width="45%"/>
                      <col width="45%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">이름</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <?php /*  이미 등록된 도서의 경우 해당 도서의 기본 정보(시리즈명/지은이/출판사/ISBN/카테고리1/카테고리2/주제/세부태그/권장학년/책표지) */?>
                      <tr >
                        <td class="text-center align-middle"><input type="checkbox" name="check[]" value="{count}" /></td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center">{user_name}
                        <input type="hidden" id="user_id{count}" value="{user_id}" />
                        <input type="hidden" id="user_seq{count}" value="{user_seq}" />
                        <input type="hidden" id="user_name{count}" value="{user_name}" />
                        <input type="hidden" id="group_name{count}" value="{group_name}" />
                        <input type="hidden" id="cell_no{count}" value="{cell_no}" />
                        </td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">등록된 회원이 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
              <span class="float-right" style="margin-right:5px">
                <button type="button" class="btn btn-block btn-warning" onclick="window.close();">닫기</button>
              </span>
              <span class="float-right" style="margin-right:5px">
                <button type="button" class="btn btn-block btn-success" onclick="choice();">선택</button>
              </span>              
            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      </form>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
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
           "user_id" : $('#user_id'+seq).val(),
           "user_seq" : $('#user_seq'+seq).val(),
           "user_name" : $('#user_name'+seq).val(),
           "cell_no" : $('#cell_no'+seq).val(),
           "group_name" : $('#group_name'+seq).val(),
       }
       //console.log(opener.isFind($('#book_no'+seq).val()));
       if(opener.isFindUser($('#user_seq'+seq).val()) == false) {
           opener.user_info_list.push(data);
           
           opener.user_info.push($('#user_seq'+seq).val());
           var html = '<tr style="cursor:pointer;height:20px" class="user_'+$('#user_seq'+seq).val()+'">';
           html += '  <td class="text-center align-middle" style="height:20px">'+$('#user_id'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#user_name'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle" style="height:20px"><input type="hidden" name="user_id[]" value="'+$('#user_id'+seq).val()+'"><input type="hidden" name="group_name[]" value="'+$('#group_name'+seq).val()+'">'+$('#group_name'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle"><button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteUser(\''+$('#user_seq'+seq).val()+'\')">삭제</button></td>';
           html += '</tr>';
           opener.$('#user_list').append(html);
           
       }
       
    });
    alert('선택되었습니다.');
    return;


}
$(function(){
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
