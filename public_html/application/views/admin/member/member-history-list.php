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
    <form method="get" id="searchForm">
    <?php if($this->session->userdata("admin_type") != "A"){?>
    
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>        
    <div class="card mb-12">
        <div class="card-body">
            <!--begin::Compact form-->
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    가입일
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
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
                    계정 상태
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value=""  <?php echo @$_REQUEST['searchUserStatus']==''?"checked":"";?>>
                            전체
                        </div>
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="Y" <?php echo @$_REQUEST['searchUserStatus']=='Y'?"checked":"";?>> 
                            재원
                        </div>                    
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="S" <?php echo @$_REQUEST['searchUserStatus']=='S'?"checked":"";?>>
                            휴원
                        </div>
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="N" <?php echo @$_REQUEST['searchUserStatus']=='N'?"checked":"";?>> 
                            비원
                        </div>                    
                </div>
                <!--end::Compact form-->
            </div>            
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    검색어
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="<?php if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){ echo "회원명, 회원아이디, 학생연락처를 입력해주세요.";}else{echo "소속명, 회원명, 회원아이디, 학생연락처를 입력해주세요";}?>">
                    <button type="button" id="searchBtn" class="btn  btn-primary" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>
        </div>
    </div> 
    <?php  } ?>
                
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="excelType" value="user" >
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                <div class="form-group">
                  <?php if($this->session->userdata("admin_type") == "A"){?>
                  <button type="submit" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn">검색</button>
                  <input type="text" class="form-control col-4 float-right" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo $this->input->get('keyword'); ?>" placeholder="이름, 아이디를 입력해주세요"/>
                  <?php }else{?>
                  <input type="hidden" name="status" id="status" />
                  <?php }?>
                <?php if($this->session->userdata("admin_level")<=0){ ?>
 
                <?php }else{ ?>
                  <input type="hidden" name="srcSchool" id="srcSchool" value="<?php echo @$this->session->userdata("school_seq"); ?>"/>
                <?php } ?>
                  <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <?php if($this->session->userdata("admin_type") == "A"){?>
                      <col width="10%"/>
                      <?php }?>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
 
                    </colgroup>
                    <thead>
                      <tr>
                        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
                        <th class="text-center">선택</th>
                        <?php }?>
                        <th class="text-center">번호</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">유형</th>
                        <th class="text-center">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr   style="cursor:pointer">
                        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
                        <td class="text-center align-middle"><input type="checkbox" name="user_seq[]" value="{user_seq}" /></td>
                        <?php }?>
                        <td class="text-center align-middle">{count}</td>

                        <td class="text-center align-middle" onclick="userPopup('{user_seq}')">{user_name}</td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{user_type}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="6">조회된 정보가 없습니다.</td>
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
    </div>      
</div>
<!-- /.content-wrapper -->
<script>
  function viewDetail($seq)
  {
      location.href="write/"+$seq;
  }
      
  $(function(){
      $('#searchBtn').on("click",function(){
          $('#searchForm').submit();
      });
  });    
  function excelDownload()
  {
      $('#searchForm').attr("action","/admin/partner/userDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }
      
  function goModify($seq)
  {
      location.href="write/"+$seq;
  }

  function writeBtn()
  {
    location.href="write";
  }

  function writeExcel()
  {
    window.open("/admin/member/memberExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
  function userPopup($seq) {
      window.open("/admin/member/user_popup/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50"); 
  }    
  

function changeInfo(status)
{
    var chkBool = false;
    $('input[name="user_seq[]"]').each(function(){
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
    
    var data = $('#searchForm').serialize();
    
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