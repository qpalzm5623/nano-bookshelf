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
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                      <col width="12%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">시리즈</th>
                        <th class="text-center">지은이</th>
                        <th class="text-center">출판사</th>
                        <th class="text-center">권장 학년</th>
                        <th class="text-center">출제자 아이디</th>
                        <th class="text-center">북퀴즈 인증일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <?php /*  이미 등록된 도서의 경우 해당 도서의 기본 정보(시리즈명/지은이/출판사/ISBN/카테고리1/카테고리2/주제/세부태그/권장학년/책표지) */?>
                      <tr >
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{book_name}</td>
                        <td class="text-center">{serise}</td>
                        <td class="text-center">{author}</td>
                        <td class="text-center">{publisher}</td>
                        <td class="text-center">{recommend_class}</td>
                        <td class="text-center">{setter}</td>
                        <td class="text-center">{history_date}</td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">등록된 도서가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
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
              <!--
              <span class="float-right" style="margin-right:5px">
                <button type="button" class="btn btn-block btn-success" onclick="choice();">선택 삭제</button>
              </span>              
              -->
            </div>
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
function deleteData(quiz_seq, book_no, share_user_id){
    if(confirm('확인을 누르면 공유가 중지됩니다.계속 하시겠습니까?')) {
          var csrf_name = $('#csrf').attr("name");
          var csrf_val = $('#csrf').val();
          data = {"quiz_seq":quiz_seq, "book_no":book_no, "share_user_id":share_user_id, csrf_name: csrf_val};
            
          data[csrf_name] = csrf_val;
          
          $.ajax({
              type: "POST",
              url : "/admin/content/deleteQuizShareProc",
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
function choice() {
  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();    
    var total_cnt = 0;    
    $("input[name='check[]']:checked").each(function(){
        var seq = $(this).val();
        total_cnt++;
    });
    if(total_cnt == 0) {
        alert('공유를 중단할 퀴즈를 선택하세요.');
        return false;
    }
    var cnt = 0;    
    if(confirm('확인을 누르면 공유가 중지됩니다.계속 하시겠습니까?')) {
        $("input[name='check[]']:checked").each(function(){
            var seq = $(this).val();
            
              data = {"quiz_seq":$('#quiz_seq'+seq).val(), "book_no":$('#book_no'+seq).val(), "share_user_id":$('#share_user_id'+seq).val(), csrf_name: csrf_val};
                
              data[csrf_name] = csrf_val;
              
              $.ajax({
                  type: "POST",
                  url : "/admin/content/deleteQuizShareProc",
                  data: data,
                  dataType:"json",
                  success : function(data, status, xhr) {
                    cnt++;
                    console.log(cnt);
                    if(cnt == total_cnt) {
                        alert('공유가 중지되었습니다.');
                    }
                  },
                  error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.responseText);
                  }
              });        
        });
      return;    
    }

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
