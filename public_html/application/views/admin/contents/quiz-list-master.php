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
      <ul class="nav nav-tabs" id="custom-content-below-tab" role="tablist">
          <li class="nav-item">
              <a href="?confirm_yn=N" class="nav-link <?php if(@$confirm_yn == "N") echo "active";?>"    aria-selected="true">심사 대기중</a>
          </li>
          <li class="nav-item">
              <a href="?confirm_yn=Y" class="nav-link <?php if(@$confirm_yn == "Y") echo "active";?>"    aria-selected="true">승인 완료</a>
          </li>
          <li class="nav-item">
              <a href="?confirm_yn=X"  class="nav-link  <?php if(@$confirm_yn == "X") echo "active";?>" aria-selected="false">승인 거부</a>
          </li>
      </ul>
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <?php if(@$confirm_yn == "X") {?>
                      <col width="15%"/>
                      <?php } ?>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">주제</th>
                        <th class="text-center">권장학년</th>
                        <th class="text-center">문항수</th>
                        <?php if(@$confirm_yn == "N") {?>
                        <th class="text-center">등록일</th>
                        <?php } else if(@$confirm_yn == "Y") {?>
                        <th class="text-center">심사일</th>
                        <?php } else if(@$confirm_yn == "X") {?>
                        <th class="text-center">심사일</th>
                        <th class="text-center">재승인 요청</th>
                        <?php } ?>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr>
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle" onclick="viewDetail('{book_no}','{quiz_seq}')">{book_name}</td>
                        <td class="text-center align-middle">{subject}</td>
                        <td class="text-center align-middle">{recommend_class}</td>
                        <td class="text-center align-middle">{quiz_cnt}</td>
                        
                        <?php if(@$confirm_yn == "N") {?>
                            <td class="text-center align-middle">{reg_date}</td>
                        <?php } else if(@$confirm_yn == "Y") {?>
                            <td class="text-center align-middle">{confirm_date}</td>
                        <?php } else if(@$confirm_yn == "X") {?>
                            <td class="text-center align-middle" data-toggle="modal" data-target="#modal-pop1" onclick="showPopup('message_{quiz_seq}')">{confirm_date} 거부<textarea id="message_{quiz_seq}" style="display:none">{confirm_message}</textarea></td>
                            <td class="text-center align-middle"><button type="button" class="btn  btn-primary" id="searchBtn"  onclick="viewModify('{quiz_seq}')">수정하기</button></td>
                        <?php } ?>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="6">북퀴즈가 없습니다.</td>
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
<!-- /.content-wrapper -->
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
</div>

<script>
  function showPopup(obj) {
    $('#message').html($('#'+obj).val());
  }
  function viewModify($seq)
  {
      location.href="quiz_write/"+$seq+"{param}?edit=Y";
  }

  
  function viewDetail($book_no, $seq)
  {
      //location.href="quiz_write/"+$seq+"{param}";
      window.open("/admin/content/quiz_popup/"+$book_no+"/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50");
  }  
  
  function excelWrite()
  {
      window.open("/admin/content/quizExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
</script>
