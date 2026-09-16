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
            <input type="hidden" name="type" value="<?php echo @$_REQUEST['type'];?>"/>
        <ul class="nav nav-tabs" id="custom-content-below-tab" role="tablist">
            <li class="nav-item">
                <a href="?type=receive" class="nav-link <?php if($_REQUEST['type'] == "receive") echo "active";?>"    aria-selected="true">받은 쪽지함</a>
            </li>
            <li class="nav-item">
                <a href="?type=send"  class="nav-link  <?php if($_REQUEST['type'] == "send") echo "active";?>" aria-selected="false">보낸 쪽지함</a>
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
                            <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="아이디를 입력해 주세요.">
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
                  <?php if($_REQUEST['type'] == "receive") {?>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="60%"/>
                      <col width="20%"/>
                      <col width="15%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">보낸 사람</th>
                        <th class="text-center">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr>
                        <td class="text-center align-middle"><input type="checkbox" name="chk[]" value="{message_seq}"></td>
                        <td class="text-center align-middle"  onclick="viewDetail('{message_seq}')">{subject}</td>
                        <td class="text-center align-middle" >{user_name}({sender_id})</td>
                        <td class="text-center align-middle">{reg_date}</td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="4">메세지가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
                  <?php } else if($_REQUEST['type'] == "send") {?>
                  <table class="table table-hover">
                    <colgroup>
                        <col width="5%"/>
                      <col width="20%"/>
                      <col width="60%"/>
                      <col width="15%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">받는 사람</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr>
                        <td class="text-center align-middle"><input type="checkbox" name="chk[]" value="{message_seq}"></td>
                        <td class="text-center align-middle">{receive_id}</td>
                        <td class="text-center align-middle" onclick="viewDetail('{message_seq}')">{subject}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="4">메세지가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
                  <?php } ?>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
              
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="deleteMessage()">선택 삭제</button>
              </span>                   
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="messageBtn()">쪽지쓰기</button>
              </span>              
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

 
  function allCheckClick()
  {
    if($('#allCheck').is(":checked") == true ){
      $('input[name="chk[]"]').prop("checked",true);
    }else{
      $('input[name="chk[]"]').prop("checked",false);
    }
  }
   

function deleteMessage()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("삭제할 쪽지를 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etc/deleteMessage",
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
      window.open("/admin/etc/message_popup/"+$seq, "_message_pop", "width=1000, height=800, left=100, top=50"); 
  }

  function messageBtn()
  {
    window.open("/admin/etc/message_popup", "_quiz_share_pop", "width=1000, height=800, left=100, top=50"); 
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
