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
    <div class="card mb-12"  style="display:none">
        <div class="form-group row">
            <div>
            <button type="button" id="popup1" data-toggle="modal" data-target="#modal-pop1">팝업1</button>
            </div>
            <div>
            <button type="button" id="popup1"  data-toggle="modal" data-target="#modal-pop2">팝업2</button>
            </div>
            <div>
            <button type="button" id="popup1" data-toggle="modal" data-target="#modal-pop3">팝업3</button>
            </div>
            <div>
            <button type="button" id="popup1" data-toggle="modal" data-target="#modal-pop4">팝업4</button>
            </div>
        </div>
    </div> 
                
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
                      <col width="5%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">등록요청 일시</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">문제수</th>
                        <th class="text-center">처리내역</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      <?php for($i=0;$i < count($list);$i++) {
                          $row = $list[$i];
                      ?>
                          <tr style="cursor:pointer">
                            <td class="text-center align-middle"><?php echo $row['count'];?></td>
                            <td class="text-center align-middle"><?php echo $row['reg_date'];?></td>
                            <td class="text-center align-middle" onclick="bookPopup('<?php echo $row['book_no'];?>','<?php echo $row['quiz_seq'];?>')"><?php echo $row['book_name'];?></td>
                            <td class="text-center align-middle"><?php echo $row['user_name'];?></td>
                            <td class="text-center align-middle" onclick="userPopup('<?php echo $row['user_id'];?>')"><?php echo $row['user_id'];?></td>
                            <td class="text-center align-middle"><?php echo $row['quiz_cnt'];?></td>
                            <td class="text-center align-middle">
                                <?php if($row['confirm_yn'] == "Y") {?>
                                    <?php echo substr($row['confirm_date'],0,10);?> 승인
                                <?php } else if($row['confirm_yn'] == "X") {?>
                                    <?php echo substr($row['confirm_date'],0,10);?> <a href="#" data-toggle="modal" data-target="#modal-pop1" onclick="showPopup('message_<?php echo $row['quiz_seq'];?>');">거부</a>
                                    <textarea id="message_<?php echo $row['quiz_seq'];?>" style="display:none"><?php echo $row['confirm_message'];?></textarea>
                                <?php } else {?> 
                                <div class="row">
                                    <div class="mr-3">
                                    <button class="btn btn-primary " type="button" data-toggle="modal" data-target="#modal-agree" onclick="quiz_seq='<?php echo $row['quiz_seq'];?>'">승인</button>
                                    </div>
                                    <div>
                                    <button class="btn btn-primary" type="button" data-toggle="modal" data-target="#modal-deny" onclick="quiz_seq='<?php echo $row['quiz_seq'];?>'">거부</button>      
          
                                    </div>
                                </div>
                                <?php } ?>
                            </td>
                          </tr>
                          <?php }?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">조회된 마스터 퀴즈 승인 요청 내역이 없습니다.</td>
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
    <div class="modal fade" id="modal-agree" style="display: none;" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body text-center">
                    해당 문제풀이 등록 요청을 승인하시겠습니까?
                    <div class="row text-center">
                        <div class="col-3"></div>
                        <div class="col-3">
                        <button id="saveBtn" class="btn btn-primary " type="button">승인</button>
                        </div>
                        <div class="col-3">
                        <button class="btn btn-secondary" type="button" data-dismiss="modal" aria-label="Close">닫기</button>                
                        </div>                        
                        <div class="col-3"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>  
    
    <div class="modal fade" id="modal-deny" style="display: none;" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body text-center">
                    거부 사유를 입력한 후 저장을 눌러 주세요.
                    <div>
                    <textarea name="confirm_message" id="confirm_message" class="form-control "></textarea>
                    </div>
                </div>
                <div class="modal-footer justify-content-between">
                    <button type="button" class="btn btn-primary" id="denySaveBtn">저장</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
      </div>
    </div>      
  </div>
  
    <div class="modal fade" id="modal-pop1" style="display: none;" aria-hidden="true">
        <div class="modal-dialog modal-md">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                  <div class="card card-primary">
                      <div class="card-body" id="message">
                       
                      </div>
                  </div>
                </div> 
            </div>
        </div>
      </div>
    </div>    
<!-- /.content-wrapper -->
<script>
    function showPopup(obj) {
        $('#message').html($('#'+obj).val());
    }    
    var quiz_seq = 0;
    function userPopup($seq) {
        window.open("/admin/master/master_user_popup/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50"); 
    }        
    function bookPopup($book_no, $seq) {
        window.open("/admin/content/quiz_popup/"+$book_no+"/"+$seq+"?no=Y", "_user_pop", "width=1000, height=800, left=0, top=50"); 
    }        
    $(function(){
        $('#saveBtn').on("click",function(){
            var formData = {"quiz_seq":quiz_seq, "mode":"accept", "confirm_yn":"Y","<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
            $.ajax({
                type: "POST",
                url : "/admin/master/quizSaveProc",
                data: formData,
                dataType:"json",
                success : function(data, status, xhr) {
                  if( data.result == "success" ){
                      location.reload();
                  } else {
                      alert(data.msg);
                  }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });
        });
        $('#denySaveBtn').on("click",function(){
              if($('#confirm_message').val() == "") {
                  alert('거부 사유를 입력해 주세요.');
                  return;
              }
              var formData = {"quiz_seq":quiz_seq,"mode":"deny", "confirm_yn":"X","confirm_message":$('#confirm_message').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
              $.ajax({
                  type: "POST",
                  url : "/admin/master/quizSaveProc",
                  data: formData,
                  dataType:"json",
                  success : function(data, status, xhr) {
                    if( data.result == "success" ){
                        location.reload();
                    } else {
                        alert(data.msg);
                    }
                  },
                  error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.responseText);
                  }
              });
        });
    });
  function goModify($seq)
  {
      location.href="modify/"+$seq;
  }

  function writeBoard()
  {
    location.href="write";
  }

  function academiExcelWrite()
  {
    window.open("/admin/parnter/partnerExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
  function masterPopup($seq) {
      window.open("/admin/master/master_popup/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50"); 
  }    
</script>
