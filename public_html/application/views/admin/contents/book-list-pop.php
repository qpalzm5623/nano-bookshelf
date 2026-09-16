<!-- Content Wrapper. Contains page content -->
<style></style>
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
        <input type="hidden" name="book_no" id="book_no" value="<?php echo @$_GET['book_no'];?>">
    <div class="container-fluid">
        <div class="card mb-12">
            <div class="card-body">
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    검색어
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                        <input type="text" class="form-control col-8 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_GET['keyword'];?>" placeholder="도서명을 입력해주세요.">
                        <button type="submit" class="btn  btn-primary" >검색</button>
                        
                </div>
                <!--end::Compact form-->
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
                      <col width="10%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="15%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">등록일</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">지은이</th>
                        <th class="text-center">출판사</th>
                        <th class="text-center">BOOK NO</th>
                        <th class="text-center">등록 아이디</th>
                        <th class="text-center">퀴즈 등록여부</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <?php /*  이미 등록된 도서의 경우 해당 도서의 기본 정보(시리즈명/지은이/출판사/ISBN/카테고리1/카테고리2/주제/세부태그/권장학년/책표지) */?>
                      <tr onclick="scopy('{count}');">
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center">{reg_date}</td>
                        <td class="text-center">{book_name}</td>
                        <td class="text-center">{author}</td>
                        <td class="text-center">{publisher}</td>
                        <td class="text-center">{book_no}
                        <input type="hidden" id="book_no{count}" value="{book_no}" />
                        <input type="hidden" id="book_name{count}" value="{book_name}" />
                        <input type="hidden" id="serise{count}" value="{serise}" />
                        <input type="hidden" id="author{count}" value="{author}" />
                        <input type="hidden" id="publisher{count}" value="{publisher}" />
                        <input type="hidden" id="isbn{count}" value="{isbn}" />
                        <input type="hidden" id="category{count}" value="{category}" />
                        <input type="hidden" id="sub_category{count}" value="{sub_category}" />
                        <input type="hidden" id="subject{count}" value="{subject}" />
                        <input type="hidden" id="tags{count}" value="{tags}" />
                        <input type="hidden" id="recommend_class{count}" value="{recommend_class}" />
                        <input type="hidden" id="book_cover{count}" value="{book_cover}" />
                        <input type="hidden" id="quiz_seq{count}" value="{quiz_seq}" />
                        </td>
                        <td class="text-center">{user_id}</td>
                        <td class="text-center">{quiz_yn}</td>
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
            
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="window.close();">닫기</button>
              </span>
            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      <!-- /.row -->
      </form>
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
function scopy(seq) {
    <?php if(@$_GET['book_no'] == 'Y') {?>
    if($('#quiz_seq'+seq).val() != "") {
        alert('이미 퀴즈 등록된 도서입니다.');
        return;
    }
    try {
        opener.$('#book_no').val($('#book_no'+seq).val());
    } catch(e) {
        
    }
    <?php }?>
    opener.$('#book_name').val($('#book_name'+seq).val());
    opener.$('#serise').val($('#serise'+seq).val());
    opener.$('#author').val($('#author'+seq).val());
    opener.$('#publisher').val($('#publisher'+seq).val());
    opener.$('#isbn').val($('#isbn'+seq).val());
    opener.$('#category').val($('#category'+seq).val());
    opener.$('#sub_category').val($('#sub_category'+seq).val());
    opener.$('#subject').val($('#subject'+seq).val());
    opener.$('#tags').val($('#tags'+seq).val());
    //console.log($('#recommend_class'+seq).val());
    opener.$('#recommend_class').val($('#recommend_class'+seq).val());
    opener.$('#book_cover_copy').val($('#book_cover'+seq).val());
    opener.$('#copy').val("Y");
    window.opener.focus();
    window.opener.book_name.focus();
    try {
        opener.bookNoGen();
    } catch(e) {
        
    }
    window.close();

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
