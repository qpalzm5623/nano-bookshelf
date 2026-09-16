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
    <div class="card mb-12">
        <div class="card-body">
            <!--begin::Compact form-->
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    응시일
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
                    검색어
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="<?php if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){ echo "이름, 아이디, 도서명을 입력해 주세요.";}else{echo "소속, 이름, 아이디, 도서명을 입력해 주세요.";}?>">
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
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                    <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">소속</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">출판사</th>
                        <th class="text-center">지은이</th>
                        <th class="text-center">출제자</th>
                        <th class="text-center">북퀴즈 응시일</th>
                        <th class="text-center">북퀴즈 결과</th>
                        <th class="text-center">퀴즈 이력 삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr >
                        <td class="text-center align-middle">{group_name}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{book_name}</td>
                        <td class="text-center align-middle">{publisher}</td>
                        <td class="text-center align-middle">{author}</td>
                        <td class="text-center align-middle">{setter}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-warning" onclick="viewQuiz('{qh_seq}')">결과 보기</button></td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-warning" onclick="deleteQuiz('{qh_seq}')">삭제</button></td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">조회된 퀴즈 이력이 없습니다.</td>
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
      <form method="post" id="deleteForm" name="deleteForm">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <input type="hidden" name="qh_seq" id="qh_seq">
      </form>
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
  function goModify($seq)
  {
      location.href="modify/"+$seq;
  }

  function writeBoard()
  {
      location.href="banner_write";
  }

  function academiExcelWrite()
  {
    window.open("banner_excel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
  function deleteQuiz($seq)
  {
     if(confirm('삭제 하시겠습니까?')) {
        $('#deleteForm').attr("action", "/admin/content/deleteQuizHistroy");
        $('#qh_seq').val($seq);
        $('#deleteForm').submit();
     }
  }
  
  function viewQuiz($seq)
  {
      window.open("quiz_result_pop/"+$seq,"popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto"); 
  }  
</script>
