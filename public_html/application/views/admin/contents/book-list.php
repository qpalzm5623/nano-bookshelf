<style>
.table-responsive table {
    width: 100%; /* 테이블의 너비를 div에 맞춤 */
    border-collapse: collapse; /* 테이블 셀 사이의 간격을 없앰 */
    /* 여기에 추가적인 스타일을 정의할 수 있습니다. */
}
</style>
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
        <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
        <input type="hidden" name="view_type" id="view_type" value="<?php echo $view_type;?>" >
        <input type="hidden" name="sort" id="sort" value="<?php echo @$_GET['sort'];?>" >
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
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        퀴즈 등록 여부
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="quizYn" id="" value="" <?php echo @$_REQUEST['quizYn']==''?"checked":"";?>> 전체
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
                <div class="row row-search" style="display:none">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        공개 여부
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" name="openYn" id="" value=""  <?php echo @$_REQUEST['openYn']==''?"checked":"";?>> 전체
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
                            <option value="">전체</option>
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
                <div class="col-sm-11 row align-middle">
                        <input type="text" class="form-control col-4 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="Book NO, 도서명, 지은이, 출판사, 등록 아이디, 세부태그, 어워드명을 입력해주세요.">
                        <button type="button" class="btn  btn-primary" id="searchBtn" >검색</button>
                        <small>
                        내가 등록한 책 리스트만 보입니다. 타인이 등록한 책은 우측 하단의 "직접등록" 눌러, 도서명 검색에서 확인이 가능합니다.
                        </small>
                </div>
                <!--end::Compact form-->
            </div>  
            </div>
        </div>               
      </form> 
      <div class="row" >
        <div class="col-12">
          <div class="card" >
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                    <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">{list_total}건의 게시물이 검색되었습니다. 
                        <span style="margin-left:20px"></span>
                        <input type="radio" name="view_type" value="list" <?php echo $view_type=="list"?"checked":"";?>>리스트로 보기
                        <input type="radio" name="view_type" value="image" <?php echo $view_type=="image"?"checked":"";?>>이미지로 보기
                    </span>
                </div>                
                <div style="min-width:2320px;overflow-x:auto;display:inline-block">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="6%"/>
                      <col width="10.5%"/>
                      <col width="10.5%"/>
                      <col width="6.5%"/>
                      <col width="5.5%"/>
                      <col width="5.5%"/>
                      <col width="5.5%"/>
                      <col width="6.5%"/>
                      <col width="6.5%"/>
                      <col width="5.5%"/>
                      <col width="6.5%"/>
                      <col width="6.5%"/>
                      <col width="6.5%"/>
                      <col width="6.5%"/>
                      <col width="6.5%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">BOOK NO</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">시리즈명(or 단권)</th>
                        <th class="text-center">지은이</th>
                        <th class="text-center">출판사</th>
                        <th class="text-center">주제</th>
                        <th class="text-center">권장 학년</th>
                        <th class="text-center">워크시트</th>
                        <th class="text-center">퀴즈등록여부</th>
                        <th class="text-center"  style="display:none">공개여부</th>
                        <th class="text-center">찜한 수 <span id="favoriteAsc" class="sort">▲</span><span id="favoriteDesc" class="sort">▼</span></th>
                        <th class="text-center">추천 수  <span id="likeAsc" class="sort">▲</span><span id="likeDesc" class="sort">▼</span></th>
                        <th class="text-center">북퀴즈 인증 수  <span id="bookAsc" class="sort">▲</span><span id="bookDesc" class="sort">▼</span></th>
                        <th class="text-center">등록 아이디</th>
                        <th class="text-center">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ 
                          for($i=0;$i < count($list);$i++){
                              $row = $list[$i];
                              if($view_type == "list"){
                      ?>
                              <tr>
                                <td class="text-center align-middle"><?php echo $row['book_no'];?></td>
                                <td class="text-center align-middle"  onclick="view('<?php echo $row['book_no'];?>')"><?php echo $row['book_name'];?></td>
                                <td class="text-center align-middle"><?php echo $row['serise'];?></td>
                                <td class="text-center"><?php echo $row['author'];?></td>
                                <td class="text-center"><?php echo $row['publisher'];?></td>
                                <td class="text-center"><?php echo $row['subject'];?></td>
                                <td class="text-center"><?php echo $row['recommend_class'];?></td>
                                <td class="text-center">
                                    <?php if($row['worksheet'] != ""){?>
                                        <button type="button" class="btn btn-xs btn-block btn-warning" onclick="download('<?php echo $row['book_no'];?>')">활동지 다운</button>
                                    <?php }?>
                                    <?php if(!empty($row['memo'])){ ?>
                                        <button type="button" class="btn btn-xs btn-block btn-info mt-1" onclick="viewAnswerModal('<?php echo $row['book_no'];?>', '<?php echo htmlspecialchars(addslashes($row['book_name']));?>')"><i class="fas fa-file-alt mr-1"></i>1p 정답</button>
                                        <div id="memo_data_<?php echo $row['book_no'];?>" style="display:none;"><?php echo htmlspecialchars($row['memo']);?></div>
                                    <?php } else { ?>
                                        <span class="badge badge-light text-muted d-block mt-1">정답미등록</span>
                                    <?php } ?>
                                </td>
                                <td class="text-center"><?php echo $row['quiz_cnt']>0?"O":"X";?></td>
                                <!--
                                <td class="text-center"><?php echo $row['status'];?></td>
                                -->
                                <td class="text-center" onclick="viewPopup('favorite', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['favorite_cnt']);?></td>
                                <td class="text-center" onclick="viewPopup('like', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['like_cnt']);?></td>
                                <td class="text-center" onclick="viewPopup('quiz_use', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['quiz_use_cnt']);?></td>
                                <td class="text-center"><?php echo $row['user_id'];?></td>
                                <td class="text-center"><?php echo $row['reg_date'];?></td>
                              </tr>
                              <?php } else {?>
                              <tr>
                                <td class="text-center align-middle"><?php echo $row['book_no'];?></td>
                                <td class="text-center align-middle"  onclick="view('<?php echo $row['book_no'];?>')"><?php echo $row['book_name'];?>
                                    <div><img src="/upload/book/<?php echo $row['book_cover'];?>"  style="width:120px;" alt="" onError="this.src='/resources/images/common/no_image.png'"></div>
                                </td>
                                <td class="text-center align-middle"><?php echo $row['serise'];?></td>
                                <td class="text-center"><?php echo $row['author'];?></td>
                                <td class="text-center"><?php echo $row['publisher'];?></td>
                                <td class="text-center"><?php echo $row['subject'];?></td>
                                <td class="text-center"><?php echo $row['recommend_class'];?></td>
                                <td class="text-center">
                                    <?php if($row['worksheet'] != ""){?>
                                        <button type="button" class="btn btn-xs btn-block btn-warning" onclick="download('<?php echo $row['book_no'];?>')">활동지 다운</button>
                                    <?php }?>
                                    <?php if(!empty($row['memo'])){ ?>
                                        <button type="button" class="btn btn-xs btn-block btn-info mt-1" onclick="viewAnswerModal('<?php echo $row['book_no'];?>', '<?php echo htmlspecialchars(addslashes($row['book_name']));?>')"><i class="fas fa-file-alt mr-1"></i>1p 정답</button>
                                        <div id="memo_data_<?php echo $row['book_no'];?>" style="display:none;"><?php echo htmlspecialchars($row['memo']);?></div>
                                    <?php } else { ?>
                                        <span class="badge badge-light text-muted d-block mt-1">정답미등록</span>
                                    <?php } ?>
                                </td>
                                <td class="text-center"><?php echo $row['quiz_cnt']>0?"O":"X";?></td>
                                <td class="text-center"  style="display:none"><?php echo $row['status'];?></td>
                                <td class="text-center" onclick="viewPopup('favorite', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['favorite_cnt']);?></td>
                                <td class="text-center" onclick="viewPopup('like', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['like_cnt']);?></td>
                                <td class="text-center" onclick="viewPopup('quiz_use', '<?php echo $row['book_no'];?>');"><?php echo number_format($row['quiz_use_cnt']);?></td>
                                <td class="text-center"><?php echo $row['user_id'];?></td>
                                <td class="text-center"><?php echo $row['reg_date'];?></td>
                              </tr>                   
                              <?php }  ?>
                          <?php }  ?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="15">등록된 도서가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
                  </div>
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
                <button type="button" class="btn btn-block btn-success" onclick="writeNotice()">직접 등록</button>
              </span>
              <?php if($this->session->userdata("admin_level")=="0"){ ?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-info" onclick="batchFileUpload()"><i class="fas fa-cloud-upload-alt mr-1"></i>대량 파일 업로드(FTP대체)</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelWrite()">엑셀 등록</button>
              </span>
              <?php }?>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀 다운로드</button>
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

<!-- 나노시트 1page 정답 확인 모달 -->
<div class="modal fade" id="answerModal" tabindex="-1" role="dialog" aria-labelledby="answerModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header bg-info text-white">
        <h5 class="modal-title" id="answerModalLabel"><i class="fas fa-file-alt mr-2"></i>나노시트 1page 정답 확인</h5>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="mb-2">
          <span class="badge badge-secondary mr-2" id="modalBookNo"></span>
          <strong id="modalBookName" class="text-dark" style="font-size: 1.1rem;"></strong>
        </div>
        <div class="form-group mb-0">
          <label class="text-muted"><i class="fas fa-key mr-1"></i>정답 및 해설 내용</label>
          <pre id="modalAnswerContent" class="p-3 bg-light border rounded" style="white-space: pre-wrap; word-break: break-all; min-height: 180px; max-height: 400px; overflow-y: auto; font-family: inherit; font-size: 14px; line-height: 1.6;"></pre>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-info" onclick="copyModalAnswer()"><i class="fas fa-copy mr-1"></i>정답 복사하기</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
      </div>
    </div>
  </div>
</div>

<script>
  function viewAnswerModal(bookNo, bookName) {
    var content = $('#memo_data_' + bookNo).text();
    $('#modalBookNo').text('Book No: ' + bookNo);
    $('#modalBookName').text(bookName);
    $('#modalAnswerContent').text(content || '등록된 나노시트 정답이 없습니다.');
    $('#answerModal').modal('show');
  }

  function copyModalAnswer() {
    var text = $('#modalAnswerContent').text();
    if (!text || text === '등록된 나노시트 정답이 없습니다.') {
      alert('복사할 내용이 없습니다.');
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      alert('나노시트 정답이 클립보드에 복사되었습니다.');
    }).catch(function() {
      // fallback
      var temp = $('<textarea>');
      $('body').append(temp);
      temp.val(text).select();
      document.execCommand('copy');
      temp.remove();
      alert('나노시트 정답이 클립보드에 복사되었습니다.');
    });
  }

  function batchFileUpload()
  {
    window.open("/admin/content/batchUploadPop","batch_upload_pop","left=100, top=100, width=950, height=750, scrollbars=yes");
  }

  function excelWrite()
  {
    window.open("/admin/content/bookExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
      
  function excelDownload()
  {
      $('#searchForm').attr("action","/admin/content/bookDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }
  function viewPopup(page, $seq) {
      window.open("/admin/content/"+page+"_popup/"+$seq+"?page="+page.replace("_","-")+"&seq="+$seq, "_user_pop", "width=1000, height=800, left=0, top=50"); 
  }     
      
  $(function(){
      $('#searchBtn').on("click",function(){
          $('#searchForm').submit();
      });
      $('#allCheck').on("click",function(){
        allCheckClick();
      });
      $('input[name="view_type"]').on("change",function() {
          $('#view_type').val($('input[name="view_type"]:checked').val());
          $('#searchForm').submit();
      });
      
      $('.sort').on("click",function(){
          $('#sort').val($(this).attr("id"));
          $('#searchForm').submit();
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

    function download($book_no)
    {
        location = "fileDownload/"+$book_no;    
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
  function view($seq)
  {
      location.href="book_write/"+$seq+"{param}";
  }

  function goView($seq)
  {
      location.href="book_write/"+$seq+"{param}";
  }

  function writeNotice()
  {
    location.href="book_write/{param}";
  }
</script>
