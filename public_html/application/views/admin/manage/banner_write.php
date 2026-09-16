<script>
   var book_list = [];
   var book_info_list = [<?php echo @$data['banner_contents']?>];    
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
            <form role="form" name="mainForm" id="mainForm" method="post" action="/admin/manage/bannerWriteProc" enctype="multipart/form-data">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="banner_seq" value="<?php echo @$data['banner_seq'];?>" /> 
              <textarea name="banner_contents" id="banner_contents" style="display:none"><?php echo @$data['banner_contents'];?></textarea>

              <div class="card-body">
                <h4 style="color:#007bff;">배너 등록/수정</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
 
                    <tr>
                      <th>제목</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="title" name="title" placeholder="제목" value="<?php echo @$data['title'];?>" required />
                      </td>
                    </tr>                    
                    <tr>
                      <th>배너이미지</th>
                      <td colspan="3">
                        <input type="file" class="form-control col-sm-6 float-left" id="banner_image" name="banner_image" placeholder="배너 이미지" value="" <?php echo @$data['banner_image']==""?"required":""?>/>
                        <?php if(@$data['banner_image']!=""){ echo "<img src='/upload/banner/".@$data['banner_image']."' style='width:100px'>";}?>
                      </td>
                    </tr>                    
                    <tr>
                      <th>배너컨텐츠</th>
                      <td colspan="3" style="height:400px;">
                          <textarea name="banner_contnets" id="banner_contnets" style="display:none"></textarea>
                          <button type="button" class="btn btn-default float-left" style="margin-right:10px;" onclick="searchBookPop()">도서검색</button>
                          <table class="table table-hover">
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
                              <?php
                              $list = json_decode(@$data['banner_contents']);
                              ?>
                              <?php if( count(@$list) > 0 ){ ?>
                                  <?php for($i = 0; $i < count($list);$i++){
                                    if(is_object($list[$i]) !== false ) {
                                    ?>
                                  <script>
                                   data = {
                                       "book_no" : "<?php echo $list[$i]->book_no;?>",
                                       "book_name" : "<?php echo $list[$i]->book_name;?>",
                                       "serise" : "<?php echo $list[$i]->serise;?>",
                                       "author" : "<?php echo $list[$i]->author;?>",
                                       "publisher" : "<?php echo $list[$i]->publisher;?>",
                                       "subject" : "<?php echo $list[$i]->subject;?>",
                                       "recommend_class" : "<?php echo $list[$i]->recommend_class;?>",
                                       "user_id" : "<?php echo $list[$i]->user_id;?>",
                                   }
                                  book_info_list.push(data);                                    
                                  </script>
                                  <tr style="cursor:pointer" class="book_<?php echo $list[$i]->book_no;?>">
                                    <td class="text-center align-middle"><?php echo @$list[$i]->book_name;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->serise;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->author;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->publisher;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->subject;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->recommend_class;?></td>
                                    <td class="text-center"><?php echo @$list[$i]->user_id;?></td>
                                    <td class="text-center align-middle"><button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteBook('<?php echo $list[$i]->book_no;?>')">삭제</button></td>
                                  </tr>
                                <?php  
                                        }
                                    }?>
                              <?php } else { ?>

                              <?php } ?>
                            </tbody>
                          </table>
                      </td>
                    </tr>
                    <tr>
                      <th>노출설정</th>
                      <td colspan="3">
                        <input type="radio" name="status" id="status_Y" value="Y" <?php echo @$data['status']=="Y"||@$data['status']==""?"checked":""?>>노출
                        <input type="radio" name="status" id="status_N" value="N" <?php echo @$data['status']=="N"?"checked":""?>>비노출
                      </td>
                    </tr>
                     
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <?php if(@$data['user_seq'] == "") {?>
                <button type="button" class="btn btn-default float-right" style="margin-right:10px;" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">등록</button>
                <?php } else {?>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">수정</button>                
                <button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteProc()">삭제</button>                
                <button type="button" class="btn btn-default float-right" style="margin-right:10px;" onclick="goList()">목록</button>
                <?php } ?>
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
          if (book.book_no == find_book) {
             return true;
          } else {
            //console.log("book_no 값이 존재하지 않습니다.");
          }
        }
        return false;
    }   
    
    function deleteBook($seq) {
        book_info_list = book_info_list.filter(book => book.book_no !== $seq);
        
        $('.book_'+$seq).remove();
        alert('삭제되었습니다');
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
             //console.log(element);
             console.log(error);
             error.insertBefore(element);
             //error.addClass("error-validation");
             $(element).addClass("error-validation");
        }        
      });
          
  });
 
  function goList(){
    location.href="/admin/manage/banner_list";
  }

  function checkInput()
  {
     
    return true;
  }

  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      $('#banner_contents').val(JSON.stringify(book_info_list));
      $('#mainForm').submit();
  }
  
  function deleteProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var formData = {"user_seq":$('#user_seq').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
      $.ajax({
        type: "POST",
        url : "/admin/manage/deleteBanner",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("삭제 되었습니다.");
            location.href = "/admin/banner/list";
          } else {
              alert(data.msg);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
  }  
  
  function searchBookPop() {
      window.open("/admin/manage/book_list_popup?openYn=Y", "_book_pop", "width=1000, height=800, left=100, top=50"); 
  }
</script>

