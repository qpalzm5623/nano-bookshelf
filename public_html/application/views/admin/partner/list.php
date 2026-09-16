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
                            정상
                        </div>                    
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="N" <?php echo @$_REQUEST['searchUserStatus']=='N'?"checked":"";?>>
                            정지
                        </div>                    
                </div>
                <!--end::Compact form-->
            </div>            
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    이용상품명
                    </div>
                </div>
                <div class="col-sm-8 row">
                        <div class="col-sm-3 align-middle ">
                            <select name="searchRatePlan" id="searchRatePlan" class="form-control">
                                <option value="">전체</option>
                                <?php for($i=0;$i<count($planList);$i++) {?>
                                    <option value="<?php echo $planList[$i]['code_type'];?>" <?php echo @$_REQUEST['searchRatePlan']== $planList[$i]['code_type']?"selected":"";?>><?php echo $planList[$i]['code_name'];?></option>
                                <?php }?>
                            </select>
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
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="ID, 이름, 휴대폰번호, 소속명을 입력해 주세요.">
                    <button type="button" id="searchBtn" class="btn  btn-primary" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>
        </div>
    </div> 
    </form>
                
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->

            <form id="search_form">
              <input type="hidden" name="status" id="status" />
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">

                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="4%"/>
                      <col width="4%"/>
                      <col width="10%"/>
                      <col width="9%"/>
                      <col width="12%"/>
                      <col width="9%"/>
                      <col width="12%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">번호</th>
                        <th class="text-center">ID</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">휴대폰번호</th>
                        <th class="text-center">가입일</th>
                        <th class="text-center">계정 상태</th>
                        <th class="text-center">계정 구분</th>
                        <th class="text-center">소속명</th>
                        <th class="text-center">이용 상품명</th>
                        <th class="text-center">수정</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr style="cursor:pointer">
                        <td class="text-center align-middle"><input type="checkbox" name="user_seq[]" value="{user_seq}" /></td>
                        <td class="text-center align-middle">{count}</td>
                        
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{cell_no}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle">{user_status}</td>
                        <td class="text-center align-middle">{user_type}</td>
                        <td class="text-center align-middle">{group_name}</td>
                        <td class="text-center align-middle">{pricing_plan}</td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success" onclick="viewDetail('{user_seq}')">수정</button></td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">조회된 가맹점이 없습니다.</td>
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
                <button type="button" class="btn btn-block btn-warning" onclick="writeBtn()">직접등록</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelWrite()">엑셀 등록</button>
              </span>                                          
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀 다운로드</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="changeInfo('N')">선택정지</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="changeInfo('Y')">선택승인</button>
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
      $('#searchBtn').on("click",function(){
          $('#searchForm').submit();
      });
  });
  function viewDetail($seq)
  {
      location.href="write/"+$seq;
  }
  
  function excelDownload()
  {
      $('#searchForm').attr("action","userDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }

  function writeBtn()
  {
    location.href="/admin/partner/write";
  }

  function excelWrite()
  {
    window.open("/admin/partner/partnerExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
function allCheckClick()
{
    if($('#allCheck').is(":checked") == true ){
        $('input[name="user_seq[]"]').prop("checked",true);
    }else{
        $('input[name="user_seq[]"]').prop("checked",false);
    }
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
    
    var data = $('#search_form').serialize();
    
    //data[csrf_name] = csrf_val;
    
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