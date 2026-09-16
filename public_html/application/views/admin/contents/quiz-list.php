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
        <input type="hidden" name="status" id="status">
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
                    </div>
                    <!--end::Compact form-->
                </div>
                <!--begin::Compact form-->
                <div class="row row-search" style="display:none">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        퀴즈 등록 여부
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="quizYn" id=""  <?php echo @$_REQUEST['quizYn']==''?"checked":"";?> value=""> 전체
                        </div>
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="quizYn" id="" value="Y"   <?php echo @$_REQUEST['quizYn']=='Y'?"checked":"";?>> 등록
                        </div>
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="quizYn" id="" value="N"   <?php echo @$_REQUEST['quizYn']=='N'?"checked":"";?>> 미등록
                        </div>
                    </div>
                    <!--end::Compact form-->
                </div>                
                <!--begin::Compact form-->
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        공개 여부
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="openYn" id=""  <?php echo @$_REQUEST['openYn']==''?"checked":"";?> value=""> 전체
                        </div>
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="openYn" id=""  value="Y" <?php echo @$_REQUEST['openYn']=='Y'?"checked":"";?>> 공개
                        </div>
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="openYn" id=""  value="N" <?php echo @$_REQUEST['openYn']=='N'?"checked":"";?>> 비공개
                        </div>
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
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="도서명, 소속명, 이름, 출제자 아이디를 입력해 주세요.">
                    <button type="button" class="btn  btn-primary" id="searchBtn" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>  
            </div>
        </div>               
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                    <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">{list_total}건의 게시물이 검색되었습니다. </span>
                        
                    <span style="float:right">
                        <?php if($this->session->userdata("admin_level") != "0" && ($this->session->userdata("admin_level") == "director" || ($this->session->userdata("admin_level") == "master"))) {?>
                        <input type="checkbox" name="view_type" id="view_type" value="Y" <?php echo @$_GET['view_type']=="Y"?"checked":"";?>>내가 등록한 북퀴즈만 보기
                        <?php }?>
                    </span>
                </div>                                
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="7%"/>
                      <col width="7%"/>
                      <col width="5%"/>
                      <col width="10%"/>
                      <?php if($this->session->userdata("admin_type") == "A") {?>
                      <col width="10%"/>
                      <?php }?>
                      <col width="8%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">주제</th>
                        <th class="text-center">권장학년</th>
                        <th class="text-center">공개여부</th>
                        <th class="text-center">문항수</th>
                        <th class="text-center">워크시트</th>
                        <th class="text-center">북퀴즈 인증 수</th>
                        <th class="text-center">등록구분</th>
                        <th class="text-center">소속명</th>
                        <?php if($this->session->userdata("admin_type") == "A") {?>
                        <th class="text-center">이름</th>
                        <?php }?>
                        <th class="text-center">출제자 아이디</th>
                        <th class="text-center">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      <?php
                          for($i=0;$i < count($list);$i++){
                              $row = $list[$i];
                      ?>
                      <tr>
                        <td class="text-center align-middle">
                            <?php if($this->session->userdata("admin_type") == "A" || $this->session->userdata("admin_id") == $row['user_id']) {?>
                                <input type="checkbox" name="chk[]" value="<?php echo $row['quiz_seq'];?>">
                            <?php }?>
                        </td>
                        <td class="text-center align-middle"  onclick="viewDetail('<?php echo $row['book_no'];?>','<?php echo $row['quiz_seq'];?>')"><?php echo $row['book_name'];?></td>
                        <td class="text-center align-middle"><?php echo $row['subject'];?></td>
                        <td class="text-center align-middle"><?php echo $row['recommend_class'];?></td>
                        <td class="text-center align-middle"><?php echo $row['status'];?></td>
                        <td class="text-center align-middle"><?php echo $row['quiz_cnt'];?></td>
                        <td class="text-center align-middle">
                            <?php if($row['worksheet'] != "X"){?>
                                <button type="button" class="btn btn-block btn-warning" onclick="download('<?php echo $row['book_no'];?>')">다운로드</button>
                            <?php }else{?>
                            
                            <?php }?>                            
                        </td>
                        <td class="text-center align-middle" onclick="historyDetail('<?php echo $row['book_no'];?>','<?php echo $row['quiz_seq'];?>')"><?php echo $row['quiz_use_cnt'];?></td>
                        <td class="text-center align-middle"><?php echo $row['user_type'];?></td>
                        <td class="text-center align-middle"><?php echo $row['group_name'];?></td>
                        <?php if($this->session->userdata("admin_type") == "A") {?>
                        <td class="text-center align-middle"><?php echo $row['user_name'];?></td>
                        <?php }?>
                        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_type")=="director" && $row['user_id'] == $this->session->userdata("admin_id")) {?>
                        <td class="text-center align-middle">
                            내 퀴즈
                        </td>
                        <?php }else {?>
                        <td class="text-center align-middle" 
                            <?php if($this->session->userdata("admin_type") == "A") {?>
                            onclick="viewUser('<?php echo $row['user_id'];?>')"
                            <?php }?>
                            
                            ><?php echo $row['user_id'];?>
                            <?php if($this->session->userdata("admin_type") != "A") {?>
                                <?php if($this->session->userdata("admin_id") != $row['user_id']) {?>
                                    <i class="fa-regular fa-message message" data-id="<?php echo $row['user_id'];?>"></i>
                                <?php }?>
                            <?php }?>
                        </td>
                        <?php }?>
                        <td class="text-center align-middle"><?php echo $row['reg_date'];?></td>
                      </tr>
                      <?php }?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">등록된 퀴즈가 없습니다.</td>
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
              <?php if($this->session->userdata("admin_level")==0){ ?>
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="writeBtn()">퀴즈 등록</button>
              </span>
              <?php if($this->session->userdata("admin_level")=="0"){ ?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelWrite()">엑셀 등록</button>
              </span>
              <?php }?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀 다운로드</button>
              </span>              
              <?php if($this->session->userdata("admin_level")=="0"){ ?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success"  onclick="changeInfo('N')">선택 비공개</button>
              </span>                            
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success"  onclick="changeInfo('Y')">선택 공개</button>
              </span>                            
              <?php }?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success"  onclick="deleteQuiz()">선택 삭제</button>
              </span>                            
              <?php } ?>
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
      $('#allCheck').on("click",function(){
        allCheckClick();
      });
      $('.message').on("click",function(){
          window.open("/admin/etc/message_popup?receive_id="+$(this).data("id"),"popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
      });
      $('#view_type').on("change",function() {
          $('#searchForm').submit();
      });
  });

  function excelWrite()
  {
      window.open("/admin/content/quizExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }

  function allCheckClick()
  {
      if($('#allCheck').is(":checked") == true ){
          $('input[name="chk[]"]').prop("checked",true);
      }else{
          $('input[name="chk[]"]').prop("checked",false);
      }
  }

 
    function deleteQuiz()
    {
        var chkBool = false;
        $('input[name="chk[]"]').each(function(){
          if($(this).is(":checked")){
            chkBool = true;
            return;
          }
        });
        
        
        if(chkBool == false){
          alert("삭제할 퀴즈를 선택해주세요.");
          return;
        }
        
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        $('#status').val(status);
        
        var data = $('#searchForm').serialize();
        
        data[csrf_name] = csrf_val;
        
        $.ajax({
            type: "POST",
            url : "/admin/content/deleteQuizListProc",
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
    
    function viewUser($seq)
    {
        window.open("/admin/content/user_popup/"+$seq, "_user_pop", "width=1000, height=500, left=0, top=50");
    }
    
    function historyDetail($book_no, $seq)
    {
        window.open("/admin/content/history_popup/"+$book_no+"/"+$seq, "_user_pop", "width=1000, height=500, left=0, top=50");
    }    

    function viewDetail($book_no, $seq)
    {
        //location.href="quiz_write/"+$seq+"{param}";
        window.open("/admin/content/quiz_popup/"+$book_no+"/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50");
    }
    
    function writeBtn()
    {
      location.href="quiz_write?{param}";
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
            alert("변경할 퀴즈를 선택해 주세요.");
            return;
        }
     
        
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        $('#status').val(status);
        
        var data = $('#searchForm').serialize();
        
        data[csrf_name] = csrf_val;
        data["status"] = status;
        
        $.ajax({
            type: "POST",
            url : "/admin/content/quizChangeStatus",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
                alert("수정되었습니다.");
                location.reload();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.responseText);
            }
        });
    }    
    
    function download($book_no)
    {
        location = "fileDownload/"+$book_no;    
    }
    
</script>
