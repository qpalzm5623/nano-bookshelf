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
        <form method="get" id="searchForm">
        <ul class="nav nav-tabs" id="custom-content-below-tab" role="tablist">
            <li class="nav-item">
                <a href="quiz_share" class="nav-link"    aria-selected="true">내 북퀴즈 공유하기</a>
            </li>
            <li class="nav-item">
                <a href="quiz_share_list"  class="nav-link active" aria-selected="false">공유 현황</a>
            </li>
        </ul>
        <div class="card mb-12">
            <div class="card-body">
                <!--begin::Compact form-->
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        아이디
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                            <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="아이디, 이름, 휴대폰번호를 입력해 주세요.">
                            <button type="button" class="btn  btn-primary" id="searchBtn" >검색</button>
                    </div>
                    <!--end::Compact form-->
                </div>  
            </div>
        </div>               
      </form>             
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                  <table class="table table-hover">
                    <colgroup>
                        <col width="5%"/>
                      <col width="18%"/>
                      <col width="18%"/>
                      <col width="18%"/>
                      <col width="18%"/>
                      <col width="18%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">휴대폰번호</th>
                        <th class="text-center">최근 공유 날짜</th>
                        <th class="text-center">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{share_user_id}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{cell_no}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle" ><button type="button" class="btn  btn-primary" id="viewBtn" onclick="viewDetail('{share_user_id}')" >보기</button></td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">공유 내역이 없습니다.</td>
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
  function excelDownload()
  {
      $('#searchForm').attr("action","/admin/content/quizDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }    
  $(function(){
      $('#searchBtn').on("click",function(){
          $('#searchForm').submit();
      });
  });   
    $(function(){
        $('#allCheck').on("click",function(){
          allCheckClick();
        });
    });

  function excelWrite()
  {
    window.open("/admin/content/quizExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }

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

  function viewDetail($seq)
  {
      //location.href="quiz_write/"+$seq+"{param}";
      window.open("/admin/content/quiz_share_list_popup/"+$seq, "_quiz_share_pop", "width=1000, height=800, left=100, top=50"); 
  }

  function writeBtn()
  {
    location.href="quiz_write?{param}";
  }
  
  
  

function changeInfo(status)
{
    var chkBool = false;
    $('input[name="chk[]"]').each(function(){
        if($(this).is(":checked")){
          chkBool = true;
          return;
        }
    });
    
    
    if(chkBool == false){
        alert("변경할 정보를 선택해 주세요.");
        return;
    }
 
    
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    $('#status').val(status);
    
    var data = $('#search_form').serialize();
    
    data[csrf_name] = csrf_val;
    
    $.ajax({
        type: "POST",
        url : "/admin/partner/updateUserStatus",
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
</script>
