<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1 class="float-left">{title}</h1>

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
              <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                  <button type="button" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn" onclick="search(this)">검색</button>
                  <input type="text" class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="<?php echo $this->input->get('srcN'); ?>"/>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcStatus" id="srcStatus">
                    <option value="all" <?php echo ($srcStatus=="all") ? "selected": ""; ?>>전체</option>
                    <option value="C" <?php echo ($srcStatus=="C") ? "selected": ""; ?>>승인</option>
                    <option value="L" <?php echo ($srcStatus=="L") ? "selected": ""; ?>>탈퇴</option>
                    <option value="D" <?php echo ($srcStatus=="D") ? "selected": ""; ?>>삭제</option>
                  </select>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcLevel" id="srcLevel">
                    <option value="all" <?php echo ($srcLevel=="all") ? "selected": ""; ?>>전체</option>
                    <?php if($this->session->userdata("admin_level")<=1){ ?>
                    <option value="0" <?php echo ($srcLevel=="0") ? "selected": ""; ?>>본사관리자</option>
                    <option value="1" <?php echo ($srcLevel=="1") ? "selected": ""; ?>>기관관리자</option>
                    <?php } ?>
                    <option value="2" <?php echo ($srcLevel=="2") ? "selected": ""; ?>>학급관리자</option>
                    <option value="6" <?php echo ($srcLevel=="6") ? "selected": ""; ?>>학생회원</option>
                    <option value="7" <?php echo ($srcLevel=="7") ? "selected": ""; ?>>일반회원</option>
                  </select>
                  <?php if($this->session->userdata("admin_level")<=1){ ?>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcClass" id="srcClass">
                    <option value="all" <?php echo ($srcClass=="all") ? "selected": ""; ?>>전체</option>
                    <?php for($i=0; $i<count($classList); $i++){ ?>
                    <option value="<?php echo $classList[$i]['school_class']; ?>" <?php echo ($classList[$i]['school_class']==$srcClass) ? "selected": ""; ?>><?php echo $classList[$i]['school_class']; ?></option>
                    <?php } ?>
                  </select>
                  <?php }else{ ?>
                    <input type="hidden" name="srcClass" id="srcClass" value="<?php echo $this->session->userdata("school_class"); ?>"/>
                  <?php } ?>
                  <?php if($this->session->userdata("admin_level")<=1){ ?>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcYear" id="srcYear">
                    <option value="all" <?php echo ($srcLevel=="all") ? "selected": ""; ?>>전체</option>
                    <?php for($i=0; $i<6; $i++){ ?>
                    <option value="<?php echo ($i+1); ?>" <?php echo ($srcYear==($i+1)) ? "selected": ""; ?>><?php echo ($i+1)."학년" ?></option>
                    <?php } ?>
                    <option value="None" <?php echo ($srcYear=="None") ? "selected": ""; ?>>None</option>
                  </select>
                <?php }else{ ?>
                  <input type="hidden" name="srcYear" id="srcYear" value="<?php echo $this->session->userdata("school_year"); ?>"/>
                <?php } ?>
                <?php if($this->session->userdata("admin_level")<=0){ ?>
                  <select class="form-control col-2 float-right select2" style="margin:5px 5px 5px 5px;" name="srcSchool" id="srcSchool">
                    <option value="all" <?php echo ($srcSchool=="all") ? "selected": ""; ?>>전체</option>
                    <?php for($i=0; $i<count($schoolList); $i++){ ?>
                    <option value="<?php echo $schoolList[$i]['school_seq']; ?>" <?php echo ($schoolList[$i]['school_seq']==$srcSchool) ? "selected": ""; ?>><?php echo $schoolList[$i]['school_name']; ?></option>
                    <?php } ?>
                    <option value="None" <?php echo ($srcSchool=="None") ? "selected": ""; ?>>None</option>
                  </select>
                <?php }else{ ?>
                  <input type="hidden" name="srcSchool" id="srcSchool" value="<?php echo $this->session->userdata("school_seq"); ?>"/>
                <?php } ?>
                  <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                <div class="card-body table-responsive p-0">
                  <div class="form-group">
                      <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="page_size" id="page_size" onchange="this.form.submit();">
                      <option value="20" <?php echo ($page_size=="20") ? "selected": ""; ?>>20개</option>
                      <option value="50" <?php echo ($page_size=="50") ? "selected": ""; ?>>50개</option>
                      <option value="100" <?php echo ($page_size=="100") ? "selected": ""; ?>>100개</option>
                    </select>
                  </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center"><input type="checkbox" id="allCheck"></th>
                        <th class="text-center">#</th>
                        <th class="text-center">기관명</th>
                        <th class="text-center">등급</th>
                        <th class="text-center">학년</th>
                        <th class="text-center">반</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">가입일</th>
                        <th class="text-center">최종접속</th>
                        <th class="text-center">상태</th>
                        <th class="text-center">수정</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($memberList) > 0 ){ ?>
                      {memberList}
                      <tr>
                        <td class="text-center align-middle"><input type="checkbox" name="chk[]" value="{user_seq}"></td>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle">{school_name_org}</td>
                        <td class="text-center align-middle">{user_level}</td>
                        <td class="text-center align-middle">{school_year}</td>
                        <td class="text-center align-middle">{school_class}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle">{last_login_time}</td>
                        <td class="text-center align-middle">{user_status}</td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-warning" onclick="goModify('{user_seq}')">수정</button></td>
                      </tr>
                      {/memberList}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="12">회원이 없습니다.</td>
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
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-default" onclick="memberExcelDown()">엑셀다운로드</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-default" onclick="deleteUser()">선택삭제</button>
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
<form id="excel_down_form" method="POST" action="/admin/memberAdm/memberDownLoad">
  <input type="hidden" name="srcN_excel" id="srcN_excel"/>
  <input type="hidden" name="srcLevel_excel" id="srcLevel_excel"/>
  <input type="hidden" name="srcClass_excel" id="srcClass_excel"/>
  <input type="hidden" name="srcSchool_excel" id="srcSchool_excel"/>
  <input type="hidden" name="srcYear_excel" id="srcYear_excel"/>
  <input type="hidden" name="srcStatus_excel" id="srcStatus_excel"/>
  <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
</form>
<script>
$(function(){
    $('.select2').select2();
    $('.select2').css("float","right");

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

function deleteUser()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("선택삭제 회원을 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();


  data[csrf_name] = csrf_val;


  if(confirm("선택한회원을 삭제하시겠습니까?")){
    $.ajax({
      type: "POST",
      url : "/admin/memberAdm/deleteUsers",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {

        if(data.result=="success"){
          alert("회원이 삭제 되었습니다.");
          location.reload();
        }



      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }


}

  function goModify($seq)
  {
      location.href="/admin/memberAdm/memberModify/"+$seq+"{param}";
  }

  function memberExcelDown()
  {
    $('#srcN_excel').val($('#srcN').val());
    $('#srcLevel_excel').val($('#srcLevel').val());
    $('#srcClass_excel').val($('#srcClass').val());
    $('#srcSchool_excel').val($('#srcSchool').val());
    $('#srcYear_excel').val($('#srcYear').val());
    $('#srcStatus_excel').val($('#srcStatus').val());

    $('#excel_down_form').submit();
  }
</script>
