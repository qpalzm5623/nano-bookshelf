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
    <div class="card mb-12" style="display:none">
        <div class="card-body">
            <!--begin::Compact form-->
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    등록일
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
                    소속
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                       <select name="searchGroupName" class="form-control col-3">
                            <option value="">전체</option>
                            <?php for($i=0;$i<count($groupList);$i++) {?>
                                <?php if($groupList[$i]['group_name'] == "") {?>
                                <option value="<?php echo $groupList[$i]['group_name'];?>" <?php echo @$_REQUEST['searchGroupName']== $groupList[$i]['group_name']?"selected":"";?>><?php echo $groupList[$i]['group_name'];?></option>
                                <?php }?>
                            <?php }?>                            
                       </select>
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
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="검색어, 아이디, 이름, 휴대폰번호, 소속명을 입력해 주세요.">
                    <button type="button" class="btn  btn-primary" id="searchBtn" >검색</button>
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
                      <col width="20%"/>
                      <col width="20%"/>
                      <col width="20%"/>
                      <col width="10%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">순위</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">소속</th>
                        <th class="text-center">학년</th>
                        <th class="text-center">포인트</th>
                        <th class="text-center">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      <?php for($i=0;$i<count($list);$i++){
                          $row = $list[$i];
                      ?>
                      <tr style="cursor:pointer">
                        <td class="text-center align-middle"><?php echo $row['count'];?></td>
                        <td class="text-center align-middle"><?php echo $row['user_name'];?></td>
                        <td class="text-center align-middle"><?php echo $row['user_id'];?></td>
                        <td class="text-center align-middle"><?php echo $row['group_name'];?></td>
                        <td class="text-center align-middle"><?php echo $row['grade'];?></td>
                        <td class="text-center align-middle"><?php echo number_format($row['point']);?></td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success" onclick="viewDetail('<?php echo $row['user_seq'];?>')">상세</button></td>
                      </tr>
                      <?php }?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="7">조회된 학생이 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
 

              <span class="float-right" style="margin-right:5px;">
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
  
  function viewDetail($seq) {
      window.open("/admin/manage/point_popup/"+$seq+"?keyword=<?php echo @$_REQUEST['keyword'];?>&searchTermType=<?php echo @$_REQUEST['keyword'];?>&startDate=<?php echo @$_REQUEST['startDate'];?>&endDate=<?php echo @$_REQUEST['endDate'];?>&searchGroupName=<?php echo @$_REQUEST['searchGroupName'];?>", "_point_pop", "width=1000, height=800, left=0, top=50"); 
  }      
</script>
