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
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">

                  <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}개</span>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center"><input type="checkbox" id="allCheck"></th>
                        <th class="text-center">#</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">날짜</th>
                        <th class="text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($bookList) > 0 ){ ?>
                      {bookList}
                      <tr>
                        <td class="text-center align-middle"><input type="checkbox" name="chk[]" value="{book_seq}"></td>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center">{book_title}</td>
                        <td class="text-center">{book_reg_datetime}</td>
                        <td class="text-center"><button type="button" class="btn btn-block btn-warning" onclick="goModify('{book_seq}')">수정</button></td>
                      </tr>
                      {/bookList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="5">게시글이 없습니다.</td>
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
              <span class="float-right">
                <button type="button" class="btn btn-block btn-default" onclick="deleteFaq()">선택삭제</button>
              </span>
              <span class="float-right mr-3">
                <button type="button" class="btn btn-block btn-success" onclick="writeFaq()">등록하기</button>
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
$(function(){
    $('.select2').select2();
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

function deleteFaq()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("삭제할 게시물을 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etcAdm/deleteFaq",
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

  function goModify($seq)
  {
      location.href="/admin/etcAdm/bookModify/"+$seq+"{param}";
  }

  function writeFaq()
  {
    location.href="/admin/etcAdm/bookWrite/{param}";
  }
</script>
