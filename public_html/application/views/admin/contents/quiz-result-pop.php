<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
.bg-lightgray{background:#efefef}
.mt-3 {font-size:25pt}
.widget-user .widget-user-header {
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    height: auto; 
    padding: 1rem;
    text-align: center;
}
.answer_area {display:inline;}
.answer_box {display:flex;}
</style>
<div class="content">

  <!-- Main content -->
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <input type="hidden" id="user_seq" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
  <section class="content">
    <div class="row">
      <span class="btn float-right" style="margin-right:5px;">
        <button type="button" class="btn btn-block btn-primary" onclick="window.print()">인쇄</button>
      </span>
      <span class="btn float-right" style="margin-right:5px;">
        <button type="button" class="btn btn-block btn-primary" onclick="kakaotalk()">카톡 발송</button>
      </span>    
    </div>
    <div class="container-fluid">
        
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <tbody>
                            <tr>
                              <th class="bg-">이름</th>
                              <td >
                                <?php echo $data['user_name'];?>
                              </td>
                              <th>성별</th>
                              <td >
                                <?php echo $data['gender']=="M"?"남":"여";?>
                              </td>
                            </tr>  
                            <tr>
                              <th>학년</th>
                              <td >
                                <?php echo $data['grade'];?>
                              </td>
                              <th>소속</th>
                              <td >
                                <?php echo $data['group_name'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th>반/선생님</th>
                              <td >
                                <?php echo $data['class_name'];?> / 
                                <?php echo $data['teacher_name'];?>
                              </td>
                              <th>응시일</th>
                              <td >
                                <?php echo $info['reg_date'];?>
                              </td>
                            </tr>                              
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div class="card card-primary">
                      <div class="card-body">
                        
                        <table class="table ">
                          <colgroup width="20%" />
                          <colgroup width="20%" />
                          <colgroup width="20%" />
                          <colgroup width="20%" />
                          <colgroup width="20%" />
                          <tbody>
                            <tr>
                              <td class="text-center" rowspan="3"><img src="/upload/book/<?php echo $info['book_cover'];?>"  style="width:120px;" alt="" onError="this.src='/resources/images/common/no_image.png'"></td>
                              <th class="bg-gray-light">도서명</th>
                              <td >
                                  <?php echo $info['book_name'];?>
                              </td>
                              <th class="bg-gray-light">시리즈</th>
                              <td >
                                  <?php echo $info['serise'];?>
                              </td>
                            </tr>
                            <tr>
                              <th class="bg-gray-light">추천 학년</th>
                              <td >
                                  <?php echo $info['recommend_class'];?>
                              </td>
                              <th class="bg-gray-light">주제</th>
                              <td >
                                  <?php echo $info['subject'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th class="bg-gray-light">작가</th>
                              <td >
                                  <?php echo $info['author'];?>
                              </td>
                              <th class="bg-gray-light">출판사</th>
                              <td >
                                  <?php echo $info['publisher'];?>
                              </td>
                            </tr>                              
                          </tbody>                      
                        </table>
                      </div>
                  </div>
                  <p class="bg-gray-light" style="height:30px;line-height:30px">오답리스트
                    <span class="float-right"><input type="checkbox" name="hide" id="hide">정답 숨기기</span>
                    </p>
                  <div class="card card-primary">
                      <div class="card-body">
                                <?php 
                                $class = "";
                                $ar = unserialize($info['quiz_answer_result']);
                                $a = unserialize($info['quiz_result']);
                                $quizData = unserialize($info['quiz_contents']);
                                for($i=1;$i<=$info['quiz_cnt'];$i++) {
                                    $type = $quizData['type'];
                                    $ext = $quizData['ext'];
                                    $q = $quizData['q'][$i];
                                    $file = @$quizData['img'];
                                    $answer_cnt = 0;
                                    if($type[$i] == "C") {
                                        $c1 = $quizData['c1'][$i];
                                        $c2 = $quizData['c2'][$i];
                                        $c3 = $quizData['c3'][$i];
                                        $c4 = $quizData['c4'][$i];
                                        $c5 = $quizData['c5'][$i];
                                        if($ar[$i] == $a['a'][$i]) 
                                            $class = "correct";
                                        else
                                            $class = "wrong";
                                        if($class == "wrong") {
                                    ?>
                                    <div style="border:1px solid #ddd">
                                        <div class="question"><?php echo $i;?>. <?php echo $q;?></div>
                                        <div class="answer_area">
                                                <?php if($c1 != "") {?>
                                                <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c1?"checked":"";?>> <?php echo $c1;?></div>
                                                <?php }?>
                                                <?php if($c2 != "") {?>
                                                <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c2?"checked":"";?>> <?php echo $c2;?></div>
                                                <?php }?>
                                                <?php if($c3 != "") {?>
                                                <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c3?"checked":"";?>> <?php echo $c3;?></div>
                                                <?php }?>
                                                <?php if($c4 != "") {?>
                                                <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c4?"checked":"";?>> <?php echo $c4;?></div>
                                                <?php }?>
                                                <?php if($c5 != "") {?>
                                                <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c5?"checked":"";?>> <?php echo $c5;?></div>
                                                <?php }?>
                                            <?php if($class == "wrong"){ ?>
                                            <div class="answer_box  correct" >
                                                <span class="answer_title bg_blue_green">정답 : </span>
                                                <div class="answer_content"><?php echo $a['a'][$i];?></div>
                                            </div>
                                            <?php }?>
                                        </div>
                                    </div>
                                    <?php 
                                        }
                                    } else {
                            	        $quiz_result_data = explode(",", $a['a'][$i]);
                            	        $class = "wrong";
                            	        foreach($quiz_result_data as $value) {
                                	        if(trim($value) == $ar[$i]) {
                                	            $class = "correct";
                                	        }    	        
                                	    }
                                            
                                        if($class == "wrong") {
                                    ?>
                                    <div style="border:1px solid #ddd">
                                        <div class="question"><?php echo $i;?>. <?php echo $q;?></div>
                                        <div class="answer_area">
                                            <?php if($class == "wrong"){ ?>
                                            <div class="answer_box  correct" >
                                                <span class="answer_title bg_blue_green">정답 : </span>
                                                <div class="answer_content"><?php echo $a['a'][$i];?></div>
                                            </div>
                                            <?php }?>
                                        </div>
                                    </div>
                                    <?php 
                                        }                                            
                                    }
                                } ?>
                      </div>
                  </div>
                  <p class="bg-gray-light" style="height:30px;line-height:30px;">생각 담기</p>
                  <div class="card card-primary">
                      <div class="card-body">
                          <div>
                              도서명 : <?php echo $info['book_name'];?>
                          </div>
                          <div style="margin-top:10px;">
                              Q : <?php
                                    if($info['think_quiz_seq'] > 0) {
                                        echo @$questionList[$info['think_quiz_seq']];
                                    } else {
                                        echo $info['think_quiz'];
                                    }
                                    
                                ?>
                          </div>
                          <div style="margin-top:10px;">
                            <?php echo nl2br($info['think_reply']);?>
                            <?php if($info['think_reply_file']){?>
                            <img src="/upload/user_quiz/<?php echo $info['think_reply_file'];?>"  style="width:600px;" alt="">
                            <?php }?>
                          </div>
                          
                      </div>
                  </div>

      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
  <form method="post" id="kakaoForm">
    <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
    <input type="hidden" name="mode" value="quiz"/>
    <input type="hidden" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
    <input type="hidden" name="qh_seq" value="<?php echo $qh_seq;?>"/>
    <input type="hidden" name="user_id" value="<?php echo $data['user_id'];?>"/>
    
  </form>
<script>
  var csrf_name = '<?=$this->security->get_csrf_token_name();?>';
  var csrf_val = '<?=$this->security->get_csrf_hash();?>';    
    $(function(){
        $('#hide').on("change",function(){
            if($('#hide').is(":checked") == true)
                $('.correct').hide();
            else
                $('.correct').show();
        });
    });
    
    function kakaotalk() {
        if(confirm('카톡을 발송하시겠습니까?')) {
            var data = $('#kakaoForm').serialize();
            
            data[csrf_name] = csrf_val;
            
            $.ajax({
                type: "POST",
                url : "/admin/content/kakao",
                data: data,
                dataType:"json",
                success : function(data, status, xhr) {
                    alert('발송되었습니다.');
                    //location.reload();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.responseText);
                }
            });        
        } else {
            alert('발송이 취소되었습니다.');
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
  function goModify($seq)
  {
      location.href="book_modify/"+$seq+"{param}";
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
