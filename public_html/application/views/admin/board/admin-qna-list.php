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
            <a href="adminQnaWrite" class="nav-link "    aria-selected="true">1:1 문의</a>
        </li>
        <li class="nav-item">
            <a href="adminQnaList"  class="nav-link  active" aria-selected="false">내 문의 내역</a>
        </li>
    </ul>        
    <?php } ?>
    <div class="card mb-12">
        <form id="searchForm">
        <div class="card-body">
            <!--begin::Compact form-->
            
            <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    게시일
                    </div>
                </div>
                <div class="col-sm-11 row align-middle">
                    <div class="col-sm-1 align-middle col-form-label">
                        <input type="radio" id="searchTermTypeAll" name="searchTermType" value=""  <?php echo @$_REQUEST['searchTermType']==''?"checked":"";?>>
                        전체
                    </div>
                    <div class="col-sm-1 col-form-label">
                        <input type="radio" id="searchTermTypeDate" name="searchTermType" value="term"  <?php echo @$_REQUEST['searchTermType']!=''?"checked":"";?>>
                        설정
                    </div>                    
                    <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="startDate" id="startDate" value="<?php echo @$_REQUEST['startDate'];?>">
                    <span class="float-right mr-1 ml-1 mt-2">~</span>
                    <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="endDate" id="endDate" value="<?php echo @$_REQUEST['endDate'];?>">
                </div>
                <!--end::Compact form-->
            </div>
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    상태
                    </div>
                </div>
                <div class="col-sm-11 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" id="status" name="status" value=""  <?php echo @$_REQUEST['status']==''?"checked":"";?>>
                            전체
                        </div>
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="status1" name="status" value="Y"  <?php echo @$_REQUEST['status']=='Y'?"checked":"";?>>
                            답변 완료
                        </div>                    
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="status2" name="status" value="N"  <?php echo @$_REQUEST['status']=='N'?"checked":"";?>>
                            답변 대기
                        </div>                       
                        <button type="submit" id="searchBtn" class="btn  btn-primary" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>             

        </div>
    </div>         
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
              
              <div class="card-body table-responsive p-0">
                
                  <table class="table table-hover">
                    <colgroup>
                      <?php if($this->session->userdata("admin_level") == "0"){ ?>
                      <col width="5%"/>
                      <?php }?>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="30%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="15%"/>
                      <col width="15%"/>

                    </colgroup>
                    <thead>
                      <tr>
                        <?php if($this->session->userdata("admin_level") == "0"){ ?>
                        <th class="text-center"><input type="checkbox" id="allCheck"></th>
                        <?php }?>
                        <th class="text-center">번호</th>
                        <th class="text-center">구분</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">등록일</th>
                        <th class="text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($qnaList) > 0 ){ ?>
                      {qnaList}
                      <tr>
                        <?php if($this->session->userdata("admin_level") == "0"){ ?>
                        <td class="text-center align-middle"><input type="checkbox" name="chk[]" value="{qna_seq}"></td>
                        <?php }?>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{qna_category}</td>
                        <td class="text-center">{title}</td>
                        <td class="text-center">{user_name}</td>
                        <td class="text-center">{user_id}</td>
                        <td class="text-center">{reg_date}</td>
                        <td class="text-center"><a href="javascript:goView('{qna_seq}')">{comment_yn}</a></td>
                      </tr>
                      {/qnaList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="11">게시글이 없습니다.</td>
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
              <?php if($this->session->userdata("admin_level") == "0"){ ?>
              <span class="float-right">
                <button type="button" class="btn btn-block btn-default" onclick="deleteQna()">선택삭제</button>
              </span>
              <?php }?>
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
$(function(){
  $('#searchBtn').on("click",function(){
      $('#searchForm').submit();
  });
});
$(function(){
  $('.select2').select2();
  $('.select2').css("float","right");
    $('#allCheck').on("click",function(){
      allCheckClick();
    });
});

function goView($qna_seq)
{
  location.href = "/admin/etc/adminQnaView/"+$qna_seq+"?{param}";
}

function allCheckClick()
{
  if($('#allCheck').is(":checked") == true ){
    $('input[name="chk[]"]').prop("checked",true);
  }else{
    $('input[name="chk[]"]').prop("checked",false);
  }
}

function deleteQna()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("삭제할 문의를 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#searchForm').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etc/deleteQna",
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
    url : "/admin/etc/deleteNotice",
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
      location.href="/admin/etc/noticeModify/"+$seq+"{param}";
  }

  function writeNotice()
  {
    location.href="/admin/etc/noticeWrite/{param}";
  }
</script>
