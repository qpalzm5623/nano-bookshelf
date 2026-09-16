<script>
   var book_list = [];    
   var book_info_list = [];    
   var user_info = [];    
   var user_info_list = [];       
</script>
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
            <li class="breadcrumb-item"><a href="/admin/main">Home</a></li>
            <li class="breadcrumb-item active">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <!-- left column -->
        <div class="col-md-12">
          <!-- general form elements -->
          <div class="card card-primary">
            <!-- form start -->
            <form role="form" name="mainForm" id="mainForm" method="post" action="/admin/content/bookAssignProc" enctype="multipart/form-data">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>

              <div class="card-body" style="width:100%;">
                <table class="table table-bordered" style="width:100%;">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>원생명</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-3 float-left" id="group_name" name="group_name"  />
                        <input type="text" class="form-control col-sm-1 float-left" id="user_id" name="user_id" placeholder="선택된 아이디" readonly/>
                        <input type="text" class="form-control col-sm-1 float-left" id="user_name" name="user_name" placeholder="선택된 이름" readonly/>
                        <input type="text" class="form-control col-sm-3 float-left" id="keyword" name="keyword" placeholder="이름, 아이디를 입력해 주세요." />
                        <button type="button" class="btn btn-default float-left" style="margin-right:10px;" onclick="searchUserPop()">검색</button>
                      </td>
                    </tr>
                  </table>
                  <p>공유 퀴즈</p>
                  <textarea name="banner_contnets" id="banner_contnets" style="display:none"></textarea>
                  <button type="button" class="btn btn-default float-left" style="margin-right:10px;" onclick="searchBookPop()">도서검색</button>
                  <div >
                      <table class="table table-bordered">
                        <colgroup>
                          <col width="25%"/>
                          <col width="10%"/>
                          <col width="10%"/>
                          <col width="15%"/>
                          <col width="15%"/>
                          <col width="10%"/>
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
                            <th class="text-center">삭제</th>
                          </tr>
                        </thead>
                        <tbody id="book_list">

                        </tbody>
                      </table>
                  </div>
                     
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">등록</button>
              </div>
            </form>
          </div>
          </div>
          <!-- /.card -->

        </div>
        <!--/.col (right) -->
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
    function isFind(find_book)  {
        for (const book of book_info_list) {
          if (book.quiz_seq == find_book) {
             return true;
          } else {
            //console.log("book_no 값이 존재하지 않습니다.");
          }
        }
        return false;
    }   
     
    
    function deleteBook($seq) {
        book_info_list = book_info_list.filter(book => book.quiz_seq !== $seq);
        
        $('.book_'+$seq).remove();
    }
     

   $(function(){
      const myForm = $('#mainForm');
      myForm.validate({
        rules: {
            // Define rules for specific fields if needed
        },
        messages: {
        },
        submitHandler: function() {
           
            return true;
        },        
        errorPlacement: function (error, element) {
             console.log(error);
             error.insertBefore(element);
             $(element).addClass("error-validation");
        }        
      });
          
  });
 

  function checkInput()
  {
     
    return true;
  }

  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      if($('#user_id').val() == "") {
          alert('선택된 원생이 없습니다.');
          return;
      }
          //$('#banner_contents').val(JSON.stringify(book_info_list));
          $('#mainForm').submit();
  }
  function searchBookPop() {
      window.open("/admin/manage/quiz_list_popup", "_book_pop", "width=1000, height=800, left=100, top=50"); 
  }
  
  
  function searchUserPop() {
      window.open("/admin/member/inuser_list_popup?keyword="+$('#keyword').val(), "_book_pop", "width=1000, height=800, left=100, top=50"); 
  }    
  
</script>

