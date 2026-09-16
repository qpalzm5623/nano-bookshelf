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
            <form role="form" id="mainForm" name="mainForm" enctype="multipart/form-data" action="/admin/content/bookWriteProc" method="post">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" id="mode" name="mode" value="<?php echo @$data['book_no']==""?"INSERT":"UPDATE";?>"/>
              <input type="hidden" id="book_no_org" name="book_no_org" value="<?php echo @$data['book_no_org'];?>"/>
              <input type="hidden" id="copy" name="copy" value=""/>
              <input type="hidden" name="params" value="<?php echo urlencode($_SERVER['QUERY_STRING']);?>"/>
              
              <div class="card-body">
                <h4 style="color:#007bff;">도서 등록/수정</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr  style="display:none">
                      <th>공개 여부 *</th>
                      <td colspan="3">
                        <input type="radio" name="status" id="status_Y" value="Y" <?php echo @$data['status']=="Y"||@$data['status']==""?"checked":""?>>공개
                        <input type="radio" name="status" id="status_N" value="N" <?php echo @$data['status']=="N"?"checked":""?>>비공개
                      </td>
                    </tr>                     
                    <tr>
                      <th>북넘버 *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="book_no" name="book_no" placeholder="북넘버" value="<?php echo @$data['book_no'];?>" required maxlength="10" readonly/>
                        <div style="clear:both;">*책번호는 카테고리1 / 카테고리2 / 권장학년을 선택해야 자동부여됩니다.</div>
                        <!--
Book No	"Type1
(국내/국외/구분없음)"	"Type2 
(카테고리)"	권장학년 	번호 
KC300001	K	C	3	00001
FA200001	F	A	2	00001
-->                        
                      </td>
                    </tr>                    
                    <tr>
                      <th>도서명 *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="book_name" name="book_name" placeholder="도서명을 입력해 주세요." value="<?php echo @$data['book_name'];?>" required />
                        <button type="button" class="btn btn-default float-left" style="margin-right:10px;" onclick="searchBookPop()">검색</button>
                      </td>
                    </tr>                      
                    <tr>
                      <th>시리즈명 *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="serise" name="serise" placeholder="시리즈명" value="<?php echo @$data['serise'];?>" required />
                        <div class="align-middle" style="line-height:33px;"><input type="checkbox" value="Y" name="serise_one" id="serise_one" > 단권</div>
                      </td>
                    </tr>
                    <tr>
                      <th>지은이 *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="author" name="author" placeholder="지은이를 입력해 주세요." value="<?php echo @$data['author'];?>" required />
                      </td>
                    </tr>
                    <tr>
                      <th>출판사 *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="publisher" name="publisher" placeholder="출판사를 입력해 주세요." value="<?php echo @$data['publisher'];?>" required />
                      </td>
                    </tr>
                    <tr>
                      <th>ISBN *</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="isbn" name="isbn" placeholder="(-)를 제외하고 입력해 주세요." value="<?php echo @$data['isbn'];?>" required />
                        <button type="button" class="btn btn-info float-left" style="margin-left:10px;" onclick="searchIsbnAladin()"><i class="fa fa-search"></i> ISBN 조회 (자동입력)</button>
                        <span id="isbn_loading" style="display:none; margin-left:10px; line-height:35px; color:#007bff;"><i class="fa fa-spinner fa-spin"></i> 도서 정보 검색 중...</span>
                      </td>
                    </tr>
                    <tr>
                      <th>카테고리1 *</th>
                      <td colspan="3">
                        <select name="category" id="category" class="form-control col-sm-3" required>
                            <option value="">카테고리1 선택</option>
                            <option value="K" <?php echo @$data['category']=="K"?"selected":""?>>국내서</option>
                            <option value="F" <?php echo @$data['category']=="F"?"selected":""?>>외서</option>
                        </select>
                      </td>
                    </tr>                                                                           
                    <tr>
                      <th>카테고리2 *</th>
                      <td colspan="3">
                        <select name="sub_category" id="sub_category" class="form-control col-sm-3" required>
                            <option value="">카테고리2 선택</option>
                            <option value="A"  <?php echo @$data['sub_category']=="A"?"selected":""?>>소설</option>
                            <option value="B"  <?php echo @$data['sub_category']=="B"?"selected":""?>>인물 이야기 (위인)</option>                            
                            <option value="C"  <?php echo @$data['sub_category']=="C"?"selected":""?>>비문학 / 정보글</option>
                        </select>
                      </td>
                    </tr>             
                    <tr>
                      <th>주제 *</th>
                      <td colspan="3">
                        <select name="subject" id="subject" class="form-control col-sm-3" required>
                            <option value="">주제 선택</option>
                            <?php if( count($topicList) > 0 ){ ?>
                            <?php for($i=0;$i < count($topicList);$i++){?>
                                <option value="<?php echo $topicList[$i]['code_type'];?>" data-tags="<?php echo $topicList[$i]['code_tags'];?>" <?php echo @$topicList[$i]['code_type']==@$data['subject']?"selected":""?>><?php echo $topicList[$i]['code_name'];?></option>
                            <?php }?>
                            <?php }?>
                        </select>
                      </td>
                    </tr>                                 
                    <tr>
                      <th>세부 태그 *</th>
                      <td colspan="3" style="line-height:30px">
                        <input type="text" class="form-control col-sm-6 float-left" id="tags" name="tags" placeholder="세부 태그" value="<?php echo @$data['tags'];?>" required />
                        #를 제외하고, 콤마로 태그를 구분해 넣어주세요.  
                      </td>
                    </tr>  
                    <?php if($this->session->userdata("admin_level") == "0" || $this->session->userdata("admin_level") == "admin") {?>                  
                    <tr>
                      <th>권장도서</th>
                      <td colspan="3">
                        <input type="checkbox" class="float-left" id="recommend_yn" name="recommend_yn" value="Y" <?php echo @$data['recommend_yn']=="Y"?"checked":"";?>/>
                        <div style="clear:both">* 권장도서만 메인에 노출됩니다.</div>
                      </td>
                    </tr>                      
                    <?php }?>
                    <tr>
                      <th>권장학년 *</th>
                      <td colspan="3">
                        <select name="recommend_class" id="recommend_class" class="form-control col-sm-3" required>
                            <option value="">선택</option>
                            <option value="0" <?php echo @$data['recommend_class']=="0"?"selected":""?>>미취학</option>
                            <option value="1" <?php echo @$data['recommend_class']=="1"?"selected":""?>>초1</option>
                            <option value="2" <?php echo @$data['recommend_class']=="2"?"selected":""?>>초2</option>
                            <option value="3" <?php echo @$data['recommend_class']=="3"?"selected":""?>>초3</option>
                            <option value="4" <?php echo @$data['recommend_class']=="4"?"selected":""?>>초4</option>
                            <option value="5" <?php echo @$data['recommend_class']=="5"?"selected":""?>>초5</option>
                            <option value="6" <?php echo @$data['recommend_class']=="6"?"selected":""?>>초6</option>
                            <option value="7" <?php echo @$data['recommend_class']=="7"?"selected":""?>>중1</option>
                            <option value="8" <?php echo @$data['recommend_class']=="8"?"selected":""?>>중2</option>
                            <option value="9" <?php echo @$data['recommend_class']=="9"?"selected":""?>>중3</option>
                            <!--
                            <option value="10" <?php echo @$data['recommend_class']=="10"?"selected":""?>>고1</option>
                            <option value="11" <?php echo @$data['recommend_class']=="11"?"selected":""?>>고2</option>
                            <option value="12" <?php echo @$data['recommend_class']=="12"?"selected":""?>>고3</option>
                            -->
                        </select>
                      </td>
                    </tr>                                                     
                    <tr>
                      <th>어워드 및 추천</th>
                      <td colspan="3" style="line-height:30px">
                        <input type="text" class="form-control col-sm-6 float-left" id="award" name="award" placeholder="도서의 어워드 이력을 입력해 주세요." value="<?php echo @$data['award'];?>"  />
                        도서 어워드 이력 및 교과 연계도서 여부를 입력해 주세요.  
                      </td>
                    </tr>                             
                    <tr>
                      <th>책표지 *</th>
                      <td colspan="3">
                        <input type="file" class="form-control col-sm-6" id="book_cover" name="book_cover" placeholder="책 표지" value=""  accept=".gif, .jpg, .png" /> <?php echo @$data['book_cover'];?>
                        <input type="hidden" name="book_cover_copy"  id="book_cover_copy" />
                        <div id="cover_preview_area">
                          <?php if(!empty(@$data['book_cover'])){?>
                          <div style="margin-top:5px;"><img src="/upload/book/<?php echo $data['book_cover'];?>" style="max-height:100px; border:1px solid #ddd; border-radius:4px;" /></div>
                          <?php }?>
                        </div>
                        <div style="color:red;">* 표지 이미지는 필수 항목입니다. (400KB 미만, 너비 720px, JPG, PNG 파일 등록 가능)</div>
                      </td>
                    </tr>                    
                    <tr>
                      <th>워크시트</th>
                      <td colspan="3">
                        <input type="file" class="form-control col-sm-6" id="worksheet" name="worksheet" placeholder="" value="" accept=".pdf"/> <?php echo @$data['worksheet'];?>
                        <div>* PDF 파일만 등록 가능</div>
                      </td>
                    </tr>                      
                    <tr>
                      <th>나노시트 1page 정답</th>
                      <td colspan="3">
                        <textarea class="form-control col-sm-8" id="memo" name="memo" rows="3" placeholder="나노시트 1페이지에 수록된 정답 및 해설을 입력해 주세요."><?php echo @$data['memo'];?></textarea>
                        <div style="color:#666; font-size:13px; margin-top:4px;">* 나노시트 1Page 정답을 전산 입력하여 수작업 관리 공수를 절감합니다.</div>
                      </td>
                    </tr>                      
                    <tr>
                      <th>생각꺼내기 *</th>
                      <td colspan="3" style="line-height:30px">
                        <input type="text" class="form-control col-sm-6 float-left" id="think_title" name="think_title" placeholder="도서의 발문을 입력해 주세요." value="<?php echo @$data['think_title'];?>" required />
                        이 책에 호기심을 갖게 만드는, 책 관련 질문 하나를 입력해 주세요. 
                      </td>
                    </tr>
                    <tr>
                      <th>생각담기 *</th>
                      <td colspan="3">
                        <div >
                        <select name="think_quiz_seq" id="think_quiz_seq" class="form-control col-sm-3 float-left">
                            <option value="">질문을 선택해 주세요.</option>
                            <?php for($i=0;$i < count($questionList);$i++){?>
                                <option value="<?php echo $questionList[$i]['code_type'];?>" data-tags="<?php echo $questionList[$i]['code_desc'];?>" <?php echo @$questionList[$i]['code_type']==@$data['think_quiz_seq']?"selected":""?>><?php echo $questionList[$i]['code_name'];?></option>
                            <?php }?>
                        </select>            
                        <input type="text" class="form-control col-sm-6 float-left <?php echo @$data['think_quiz_direct']=="Y"?"":"d-none"?>" id="think_quiz" name="think_quiz" placeholder="생각담기를 입력 해 주세요." value="<?php echo @$data['think_quiz'];?>"  />
                        </div>
                        <div class="align-middle" style="line-height:33px;"><input type="checkbox" value="Y" name="think_quiz_direct" id="think_quiz_direct" <?php echo @$data['think_quiz_direct']=="Y"?"checked":""?>> 직접 입력</div>
                        <div class="align-middle" style="clear:both;line-height:33px;"><input type="checkbox" value="Y" id="think_quiz_yn" name="think_quiz_yn"   <?php echo @$data['think_quiz_yn']=="Y"?"checked":""?>> 생각담기 문제가 없습니다.</div>
                        <div class="align-middle" style="clear:both;line-height:33px;color:red">* 본 책을 읽고 아이들이 생각해 보면 좋을 주관식 문항을 선택해 주세요.<BR>* 나노의책장 퀴즈 마지막에 주관식으로 본 문항이 제공됩니다.</div>
                        
                      </td>
                    </tr>                             


                     
                  </tbody>
                </table>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <?php if(@$data['book_no'] == "") {?>
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
    
  function bookNoGen(){
      if($('#category :selected').val() != "" && $('#sub_category :selected').val() !="" && $('#recommend_class :selected').val() !="") {
          var csrf_name = $('#csrf').attr("name");
          var csrf_val = $('#csrf').val();
          var formData = {"category":$('#category :selected').val(), "sub_category":$('#sub_category :selected').val(), "recommend_class":$('#recommend_class :selected').val(),"<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
          $.ajax({
              type: "POST",
              url : "/admin/content/bookNoGenProc",
              data: formData,
              dataType:"json",
              success : function(data, status, xhr) {
                  if( data.result == "success" ){
                      $('#book_no').val(data.book_no);
                  } else {
                      alert(data.msg);
                  }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
              }
          });
      }
  }    

  function showLoadingBar() {
      var maskHeight = $(document).height();
      var maskWidth = window.document.body.clientWidth;

      var mask = "<div id='mask' style='position:absolute; z-index:9000; background-color:#000000; display:none; left:0; top:0;'></div>";
      var loadingImg = '';

      loadingImg += "<div id='loadingImg' style='position:absolute; left:50%; top:40%; display:none; z-index:10000;'>";
      loadingImg += "    <img src='/assets/admin_resources/dist/img/loading.gif'/>";
      loadingImg += "</div>";

      $('body').append(mask).append(loadingImg);

      $('#mask').css({
          'width' : maskWidth
          , 'height': maskHeight
          , 'opacity' : '0.3'
      });

      $('#mask').show();
      $('#loadingImg').show();
  }

  function hideLoadingBar()
  {
    $('#mask, #loadingImg').hide();
    $('#mask, #loadingImg').remove();
  }
      
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();    
   $(function(){

      if($(this).val() == "C") {
          $('#think_quiz_seq option').each(function() {
              if ($(this).val() >7) {
                  $(this).show();
              } else 
                  $(this).hide();
          });             
      } else {
          $('#think_quiz_seq option').each(function() {
              if ($(this).val() <=7) {
                  $(this).show();
              } else 
                  $(this).hide();
          });                         
      }      
      
      $('#category').on("change",function(){
          bookNoGen();
      });
      $('#sub_category').on("change",function(){
          bookNoGen();
      });
      $('#recommend_class').on("change",function(){
          bookNoGen();
      });            
      
      $('#think_quiz_direct').on("change",function(){
          if($(this).is(":checked") == true) {
              $('#think_quiz').show();
              $('#think_quiz').removeClass('d-none');
          } else {
              $('#think_quiz').hide();
              $('#think_quiz').addClass('d-none');
          }
      });
      $('#subject').on("change",function(){
          $('#tags').attr("placeholder", $('#subject :selected').data("tags"));
      });
      $('#serise_one').on("change",function(){
          if($('#serise_one').is(":checked") == true)
              $('#serise').val('단권');
          else
              $('#serise').val('');
      });
      
      $('#sub_category').on("change",function(){
          if($(this).val() == "C") {
              $('#think_quiz_seq option').each(function() {
                  if ($(this).val() >7) {
                      $(this).show();
                  } else 
                      $(this).hide();
              });             
          } else {
              $('#think_quiz_seq option').each(function() {
                  if ($(this).val() <=7) {
                      $(this).show();
                  } else 
                      $(this).hide();
              });                         
          }
      });
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
             //console.log(error);
             error.insertBefore(element);
             //error.addClass("error-validation");
             $(element).addClass("error-validation");
        }        
      });
  });
      
  function goList(){
    location.href="/admin/content/book_list?<?php echo @$_SERVER['QUERY_STRING'];?>";
  }

  function writeProc(){
      // 표지 필수 검증: 신규 및 수정 시 표지가 없으면 차단
      var mode = $('#mode').val();
      var book_cover = $('#book_cover').val();
      var book_cover_copy = $('#book_cover_copy').val();
      var existing_cover = "<?php echo @$data['book_cover'];?>";
      
      if(mode === "INSERT" && !book_cover && !book_cover_copy) {
          alert("책 표지 이미지는 필수입니다. 표지 이미지를 등록해 주세요.");
          $('#book_cover').focus();
          return false;
      }
      if(mode === "UPDATE" && !book_cover && !book_cover_copy && !existing_cover) {
          alert("책 표지 이미지는 필수입니다. 표지 이미지를 등록해 주세요.");
          $('#book_cover').focus();
          return false;
      }
      
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      $('#mainForm').submit();
  }

  function searchIsbnAladin(){
      var isbn = $.trim($('#isbn').val()).replace(/[^0-9]/g, '');
      if(isbn.length < 10) {
          alert("올바른 10자리 또는 13자리 ISBN 번호를 입력해 주세요.");
          $('#isbn').focus();
          return;
      }
      
      $('#isbn_loading').show();
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var postData = { "isbn": isbn };
      postData[csrf_name] = csrf_val;
      
      $.ajax({
          type: "POST",
          url: "/admin/content/searchIsbnAladin",
          data: postData,
          dataType: "json",
          success: function(res) {
              $('#isbn_loading').hide();
              if(res.result === "success") {
                  if(res.book_name) $('#book_name').val(res.book_name);
                  if(res.author) $('#author').val(res.author);
                  if(res.publisher) $('#publisher').val(res.publisher);
                  if(res.serise) {
                      $('#serise').val(res.serise);
                      $('#serise_one').prop('checked', false);
                  } else {
                      $('#serise').val('단권');
                      $('#serise_one').prop('checked', true);
                  }
                  if(res.book_cover) {
                      $('#book_cover_copy').val(res.book_cover);
                      $('#cover_preview_area').html('<div style="margin-top:8px;"><img src="/upload/book/' + res.book_cover + '" style="max-height:120px; border:1px solid #007bff; border-radius:4px;" /> <span class="badge badge-success" style="vertical-align:bottom;">알라딘 표지 자동등록</span></div>');
                  }
                  alert("도서 기본 정보(제목, 지은이, 출판사, 시리즈, 표지)가 자동으로 입력되었습니다.");
              } else {
                  alert(res.msg || "해당 ISBN의 도서 정보를 찾을 수 없습니다.");
              }
          },
          error: function(xhr, status, error) {
              $('#isbn_loading').hide();
              alert("ISBN 조회 중 통신 오류가 발생했습니다.");
          }
      });
  }
  
  function searchBookPop() {
      window.open("/admin/content/book_list_popup", "_book_pop", "width=800, height=600, left=100, top=50"); 
  }
  
  function deleteProc(){
      if(confirm('정말로 삭제하시겠습니까?')){
          var csrf_name = $('#csrf').attr("name");
          var csrf_val = $('#csrf').val();
          var formData = {"book_no":$('#book_no').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
          $.ajax({
              type: "POST",
              url : "/admin/content/deleteBookProc",
              data: formData,
              dataType:"json",
              success : function(data, status, xhr) {
                if( data.result == "success" ){
                  alert("삭제 되었습니다.");
                  location.href = "/admin/content/book_list";
                } else {
                    alert(data.msg);
                }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.responseText);
              }
          });
      }
  }    
</script>
