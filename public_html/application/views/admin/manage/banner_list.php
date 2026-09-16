<!-- Content Wrapper. Contains page content -->
<link href="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/css/bootstrap4-toggle.min.css" rel="stylesheet">
<style>
  .toggle.ios, .toggle-on.ios, .toggle-off.ios { border-radius: 20rem; }
  .toggle.ios .toggle-handle { border-radius: 20rem; }
</style>
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
  <form method="get" id="searchForm">
  <section class="content">
    <div class="card mb-12">
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

                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="4%"/>
                      <col width="20%"/>
                      <col width="10%"/>
                      <col width="9%"/>
                      <col width="12%"/>
                      <col width="9%"/>
                      <col width="12%"/>
                      <col width="9%"/>
                      <col width="9%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">제목</th>
                        <th class="text-center">배너이미지</th>
                        <th class="text-center">콘텐츠</th>
                        <th class="text-center">상태</th>
                        <th class="text-center">클릭수</th>
                        <th class="text-center">등록일</th>
                        <th class="text-center">수정</th>
                        <th class="text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      <?php for($i=0; $i<count($list); $i++){ ?>
                      <tr>
                        <td class="text-center align-middle"><?php echo $list[$i]['count'];?></td>
                        <td class="text-center align-middle"><?php echo $list[$i]['title'];?></td>
                        <td class="text-center align-middle"><img src="/upload/banner/<?php echo $list[$i]['banner_image'];?>" style="width:150px;"></td>
                        <td class="text-center align-middle"><a href="javascript:void(viewBook('banner_<?php echo $list[$i]['banner_seq']; ?>'))">상세보기</a></td>
                        <td class="text-center align-middle">
                            <input type="checkbox" class="status" name="status<?php echo $list[$i]['count'];?>" data-banner_seq="<?php echo $list[$i]['banner_seq']; ?>" data-style="ios" data-toggle="toggle" data-onstyle="danger" data-offstyle="warning" value="Y" <?php echo $list[$i]['status']=="Y"?"checked":""; ?>>
                        </td>
                        <td class="text-center align-middle"><?php echo $list[$i]['click_cnt'];?></td>
                        <td class="text-center align-middle"><?php echo $list[$i]['reg_date'];?></td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success" onclick="viewDetail('<?php echo $list[$i]['banner_seq'];?>')">수정</button></td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success" onclick="deleteBtn('<?php echo $list[$i]['banner_seq'];?>')">삭제</button></td>
                      </tr>
                      <tr class="d-hide dh" id="banner_<?php echo $list[$i]['banner_seq'];?>" style="display:none">
                          <td colspan="9">
                          <table class="table table-hover">
                            <colgroup>
                              <col width="25%"/>
                              <col width="10%"/>
                              <col width="10%"/>
                              <col width="15%"/>
                              <col width="15%"/>
                              <col width="10%"/>
                            </colgroup>
                            <thead>
                              <tr>
                                <th class="text-center">도서명</th>
                                <th class="text-center">시리즈명(or 단권)</th>
                                <th class="text-center">지은이</th>
                                <th class="text-center">출판사</th>
                                <th class="text-center">주제</th>
                                <th class="text-center">권장 학년</th>
                                <th class="text-center">출제자 아이디</th>
                              </tr>
                            </thead>
                            <tbody id="book_list">                            
                              <?php
                              $list_data = json_decode(@$list[$i]['banner_contents']);
                              ?>
                                  <?php for($j = 0; $j < count($list_data);$j++){
                                      if(@$list_data[$j]->book_name != "") {
                                  ?>
                                  <tr style="cursor:pointer">
                                    <td class="text-center align-middle"><?php echo @$list_data[$j]->book_name;?></td>
                                    <td class="text-center"><?php echo @$list_data[$j]->serise;?></td>
                                    <td class="text-center"><?php echo @$list_data[$j]->author;?></td>
                                    <td class="text-center"><?php echo $list_data[$j]->publisher;?></td>
                                    <td class="text-center"><?php echo $list_data[$j]->subject;?></td>
                                    <td class="text-center"><?php echo $list_data[$j]->recommend_class;?></td>
                                    <td class="text-center"><?php echo $list_data[$j]->user_id;?></td>
                                  </tr>
                                  <?php }?>
                                <?php  }?>                        
                            </tbody>
                            </table>
                            </td>
                      </tr>
                      <?php } ?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">등록된 배너가 없습니다.</td>
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
                <button type="button" class="btn btn-block btn-warning" onclick="writeBoard()">배너등록</button>
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
      location.href="banner_write/"+$seq;
  }

  function writeBoard()
  {
    location.href="banner_write";
  }

  function academiExcelWrite()
  {
    window.open("banner_excel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
</script>
<script src="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/js/bootstrap4-toggle.min.js"></script>
<script>
  function viewBook($seq) {
      if($('#'+$seq).hasClass("d-hide")) {
          $('#'+$seq).show();
          $('#'+$seq).removeClass("d-hide");
      } else {
          $('#'+$seq).hide();
          $('#'+$seq).addClass("d-hide");        
      }
  }
  $(function(){
      $('#allCheck').on("click",function(){
        allCheckClick();
      });

      $('.status').bootstrapToggle();

      $('.status').on('change', function (event, state) {
        var confirm_txt = "ON 상태로 변경하시겠습니까?";

        if($(this).is(":checked")){
          confirm_txt = "ON 상태로 변경하시겠습니까?";
        }else{
          confirm_txt = "OFF 상태로 변경하시겠습니까?";
        }
        if(confirm(confirm_txt)){
          var banner_seq = $(this).data("banner_seq");
          var status = "";

          var _this = $(this);

          if($(this).is(":checked")){
            status = "Y";
            $('input[name="status"]').bootstrapToggle('off',true);
            $(this).bootstrapToggle('on',true);
          }else{
            status = "N";
          }

          var csrf_name = $('#csrf').attr("name");
          var csrf_val = $('#csrf').val();

          var data = {
            "status"  : status,
            "banner_seq"  : banner_seq
          };

          data[csrf_name] = csrf_val;

          $.ajax({
            type: "POST",
            url : "/admin/manage/bannerChangeStatus",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              console.log(data);
              if(data.result=="success"){

              }else{
                alert(data.msg);
                _this.bootstrapToggle('on',true);
              }
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
          });

        }else{
          if($(this).is(":checked")){
            $(this).bootstrapToggle('off',true);
          }else{
            $(this).bootstrapToggle('on',true);
          }
        }


      });
  });

  function changeStatus($obj)
  {
    console.log($($obj).data("banner_seq"));
  }

  function allCheckClick()
  {
    if($('#allCheck').is(":checked") == true ){
      $('input[name="chk[]"]').prop("checked",true);
    }else{
      $('input[name="chk[]"]').prop("checked",false);
    }
  }
  
  function deleteBtn($seq) {
      if(confirm('삭제하시겠습니까?')) {
          var csrf_name = '<?=$this->security->get_csrf_token_name();?>';
          var csrf_val = '<?=$this->security->get_csrf_hash();?>';

          var data = {"ci_csrf_token":csrf_val, "banner_seq":$seq }

          $.ajax({
            type: "POST",
            url : "/admin/manage/deleteBanner",
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
  }      
</script>