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
                            <input type="text" class="form-control col-8 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="아이디, 이름을 입력해 주세요.">
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
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">휴대폰</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <?php /*  이미 등록된 도서의 경우 해당 도서의 기본 정보(시리즈명/지은이/출판사/ISBN/카테고리1/카테고리2/주제/세부태그/권장학년/책표지) */?>
                      <tr >
                        <td class="text-center align-middle"><input type="radio" name="check[]" value="{count}" onclick="choice()" /></td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center">{user_name}</td>
                        <td class="text-center">{cell_no}</td>
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
        opener.$('#user_id').val($('#user_id'+seq).val());
        opener.$('#user_name').val($('#user_name'+seq).val());
        opener.$('#group_name').val($('#group_name'+seq).val());
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
 
 
</script>
