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
        <div class="card mb-12">
            <div class="card-body">
                <!--begin::Compact form-->
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        기간
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
                <!--begin::Compact form-->
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        주제
                        </div>
                    </div>
                    <div class="col-sm-2 row align-middle">
                        <select name="subject" id="subject" class="form-control">
                            <option value="">주제 선택</option>
                            <?php if( count($topicList) > 0 ){ ?>
                            <?php for($i=0;$i < count($topicList);$i++){?>
                                <option value="<?php echo $topicList[$i]['code_type'];?>" data-tags="<?php echo $topicList[$i]['code_tags'];?>" <?php echo @$topicList[$i]['code_type']==@$_REQUEST['subject']?"selected":""?>><?php echo $topicList[$i]['code_name'];?></option>
                            <?php }?>
                            <?php }?>
                        </select>
                    </div>
                    <!--end::Compact form-->
                </div>                                                             
                <!--begin::Compact form-->
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        권장 학년
                        </div>
                    </div>
                    <div class="col-sm-2 row align-middle">
                        <select name="recommendClass" id="recommendClass" class="form-control">
                            <option value="">전체</option>
                            <option value="0" <?php echo @$_REQUEST['recommendClass']=="0"?"selected":""?>>미취학</option>
                            <option value="1" <?php echo @$_REQUEST['recommendClass']=="1"?"selected":""?>>초1</option>
                            <option value="2" <?php echo @$_REQUEST['recommendClass']=="2"?"selected":""?>>초2</option>
                            <option value="3" <?php echo @$_REQUEST['recommendClass']=="3"?"selected":""?>>초3</option>
                            <option value="4" <?php echo @$_REQUEST['recommendClass']=="4"?"selected":""?>>초4</option>
                            <option value="5" <?php echo @$_REQUEST['recommendClass']=="5"?"selected":""?>>초5</option>
                            <option value="6" <?php echo @$_REQUEST['recommendClass']=="6"?"selected":""?>>초6</option>
                            <option value="7" <?php echo @$_REQUEST['recommendClass']=="7"?"selected":""?>>중1</option>
                            <option value="8" <?php echo @$_REQUEST['recommendClass']=="8"?"selected":""?>>중2</option>
                            <option value="9" <?php echo @$_REQUEST['recommendClass']=="9"?"selected":""?>>중3</option>
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
                        <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="도서명, 출제자 아이디를 입력해 주세요.">
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
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">도서명</th>
                        <th class="text-center">주제</th>
                        <th class="text-center">권장학년</th>
                        <th class="text-center">문항수</th>
                        <th class="text-center">워크시트</th>
                        <th class="text-center">북퀴즈 인증 수</th>
                        <th class="text-center">출제자 아이디</th>
                        <th class="text-center">등록 날짜</th>
                        <th class="text-center">공유 받은 날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){
                          for($i=0;$i < count($list);$i++){
                              $row = $list[$i];
                      ?>
                      <tr>
                        <td class="text-center align-middle"   onclick="viewDetail('<?php echo $row['book_no'];?>','<?php echo $row['quiz_seq'];?>')"><?php echo $row['book_name'];?></td>
                        <td class="text-center align-middle"><?php echo $row['subject'];?></td>
                        <td class="text-center align-middle"><?php echo $row['recommend_class'];?></td>
                        <td class="text-center align-middle"><?php echo $row['quiz_cnt'];?></td>
                        <td class="text-center align-middle">
                            <?php if($row['worksheet'] == "O"){?>
                                <button type="button" class="btn btn-block btn-warning" onclick="download('<?php echo $row['book_no'];?>')">다운로드</button>
                            <?php }else{?>
                            
                            <?php }?>
                        </td>
                        <td class="text-center align-middle"><?php echo $row['quiz_use_cnt'];?></td>
                        <td class="text-center align-middle"><?php echo $row['user_id'];?> <i class="fa-regular fa-message  message" data-id="<?php echo $row['user_id'];?>"</i></td>
                        <td class="text-center"><?php echo $row['reg_date'];?></td>
                        <td class="text-center align-middle"><?php echo $row['share_date'];?></td>
                      </tr>
                      <?php }  ?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">게시글이 없습니다.</td>
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
    function download($book_no)
    {
        location = "fileDownload/"+$book_no;    
    }
        
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
        $('.message').on("click",function(){
            window.open("/admin/etc/message_popup?receive_id="+$(this).data("id"),"popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
        });
    });
    
  function message($user_id)
  {
    window.open("/admin/etc/message_popup/"+$user_id,"popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }


  function excelWrite()
  {
    window.open("/admin/content/quizExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
    function viewDetail($book_no, $seq)
    {
        //location.href="quiz_write/"+$seq+"{param}";
        window.open("/admin/content/quiz_popup/"+$book_no+"/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50");
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
  

/*
  function viewDetail($seq)
  {
      location.href="quiz_write/"+$seq+"{param}";
  }
*/
  
</script>
