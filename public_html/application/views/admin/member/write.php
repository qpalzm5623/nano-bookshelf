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
            <form role="form" name="mainForm" id="mainForm" enctype="multipart/form-data">
              <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="user_seq" id="user_seq" value="<?php echo @$data['user_seq'];?>" /> 
              <input type="hidden" name="user_type" value="user" /> 
              <input type="hidden" name="userid_check" id="userid_check" value="<?php echo @$data['user_seq']!=""?"Y":"";?>" /> 

              <div class="card-body">
                <h4 style="color:#007bff;">가맹점 원생 등록</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <?php if($this->session->userdata("admin_type") == "A"){?>
                    <tr>
                      <th>계정구분</th>
                      <td colspan="3">
                        원생
                      </td>
                    </tr>
                    <?php }?>
                    <tr>
                      <th>* 아이디</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="user_id" name="user_id" onChange="this.value=this.value.toLowerCase();" placeholder="아이디" value="<?php echo @$data['user_id'];?>" required <?php echo @$data['user_id']!=""?"readonly":"";?> />
                        <?php if(@$data['user_id'] == ""){?>
                        <button type="button" class="btn btn-primary" style="margin-right:10px;" onclick="checkUserid()">중복조회</button>
                        <?php }?>                        
                      </td>
                    </tr>                    
                    <tr>
                      <th>* 비밀번호</th>
                      <td colspan="3">
                        <input type="password" class="form-control col-sm-6 float-left" id="user_password" name="user_password" placeholder="비밀번호" value=""  <?php if(@$data['user_seq'] =="") echo "required";?>/>
                      </td>
                    </tr>                    
                    <tr>
                      <th>* 소속명</th>
                      <td colspan="3">
                          <?php if($this->session->userdata("admin_level") == "0"){ ?>
                          <select class="form-control col-2 select2" style="margin:5px 5px 5px 5px;" name="group_name" id="group_name">
                            <?php for($i=0; $i<count($schoolList); $i++){ ?>
                            <option value="<?php echo $schoolList[$i]['group_name']; ?>" <?php echo ($schoolList[$i]['group_name']==@$data['group_name']) ? "selected": ""; ?>><?php echo $schoolList[$i]['group_name']; ?></option>
                            <?php } ?>
                          </select>
                          <?php } else {?>
                          <input type="text" class="form-control col-sm-6 float-left" id="group_name" name="group_name" placeholder="소속명" value="<?php echo @ $this->session->userdata("group_name");?>" readonly />
                          <?php } ?>
                      </td>
                    </tr>
                    <tr>
                      <th>* 이름</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="user_name" name="user_name" placeholder="이름" value="<?php echo @$data['user_name'];?>" required />
                      </td>
                    </tr>
                    <tr>
                      <th>* 성별</th>
                      <td colspan="3">
                        <input type="radio" name="gender" value="M"  <?php echo @$data['gender']==""||@$data['gender']=="M"?"checked":""?>>남자
                        <input type="radio" name="gender" value="F"  <?php echo @$data['gender']=="F"?"checked":""?>>여자
                      </td>
                    </tr>                                        
                    <tr>
                      <th>* 휴대폰번호</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="cell_no" name="cell_no" placeholder="휴대폰번호" value="<?php echo @$data['cell_no'];?>"  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');" required maxlength="13"/>
                      </td>
                    </tr>
                    <tr>
                      <th>* 학년</th>
                      <td colspan="3">
                        <select name="grade" id="grade" class="form-control col-sm-3" required>
                            <option value="">선택</option>
                            <option value="0" <?php echo @$data['grade']=="0"?"selected":""?>>미취학</option>
                            <option value="1" <?php echo @$data['grade']=="1"?"selected":""?>>초1</option>
                            <option value="2" <?php echo @$data['grade']=="2"?"selected":""?>>초2</option>
                            <option value="3" <?php echo @$data['grade']=="3"?"selected":""?>>초3</option>
                            <option value="4" <?php echo @$data['grade']=="4"?"selected":""?>>초4</option>
                            <option value="5" <?php echo @$data['grade']=="5"?"selected":""?>>초5</option>
                            <option value="6" <?php echo @$data['grade']=="6"?"selected":""?>>초6</option>
                            <option value="7" <?php echo @$data['grade']=="7"?"selected":""?>>중1</option>
                            <option value="8" <?php echo @$data['grade']=="8"?"selected":""?>>중2</option>
                            <option value="9" <?php echo @$data['grade']=="9"?"selected":""?>>중3</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>* 반</th>
                      <td colspan="3">
                        <!--<input type="text" class="form-control col-sm-6 float-left" id="class_name" name="class_name" placeholder="반" value="<?php echo @$data['class_name'];?>" required />-->
                        <select name="class_name" id="class_name" class="form-control col-sm-3" required>
                            <option value="">선택</option>
                            <?php for($i=0; $i<count($classList); $i++){ ?>
                                <option value="<?php echo $classList[$i]['class_name']; ?>" <?php echo ($classList[$i]['class_name']==@$data['class_name']) ? "selected": ""; ?>><?php echo $classList[$i]['class_name']; ?></option>
                            <?php } ?>                            
                        </select>
                      </td>
                    </tr>  
                    <tr>
                      <th>* 학부모이름</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="parent_name" name="parent_name" placeholder="학부모이름" value="<?php echo @$data['parent_name'];?>" required />
                      </td>
                    </tr>
                    <tr>
                      <th>* 학부모 연락처</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="parent_cell" name="parent_cell" placeholder="학부모 연락처" value="<?php echo @$data['parent_cell'];?>"  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');" required/>
                      </td>
                    </tr>                                                          
                    <tr>
                      <th>* 이메일</th>
                      <td colspan="3">
                        <input type="email" class="form-control col-sm-6 float-left" id="email" name="email" placeholder="이메일" value="<?php echo @$data['email'];?>" required />
                      </td>
                    </tr>
                    <tr>
                      <th>* 주소</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="address" name="address" placeholder="주소" value="<?php echo @$data['address'];?>" required />
                      </td>
                    </tr>                    
                    <tr>
                      <th>* 마케팅 수신동의</th>
                      <td colspan="3">
                        <input type="radio" name="sms_yn" id="sms_y" value="Y" <?php echo @$data['sms_yn']=="Y"||@$data['sms_yn']==""?"checked":""?>>동의
                        <input type="radio" name="sms_yn" id="sms_n" value="N"  <?php echo @$data['sms_yn']=="N"?"checked":""?>>동의하지 않음
                      </td>
                    </tr>
                    <tr>
                      <th>* 개인정보 이용동의</th>
                      <td colspan="3">
                        <input type="radio" name="marketing_yn" id="marketing_1" value="1"   <?php echo @$data['marketing_yn']=="1"||@$data['marketing_yn']==""?"checked":""?>>1년
                        <input type="radio" name="marketing_yn" id="marketing_3" value="3"   <?php echo @$data['marketing_yn']=="3"?"checked":""?>>3년
                        <input type="radio" name="marketing_yn" id="marketing_C" value="C"   <?php echo @$data['marketing_yn']=="C"?"checked":""?>>회원 탈퇴 시까지
                      </td>
                    </tr>
                    <tr>
                      <th>* 상태</th>
                      <td colspan="3">
                        <input type="radio" name="user_status" id="user_status_Y" value="Y" <?php echo @$data['user_status']=="Y"||@$data['user_status']==""?"checked":""?>>재원
                        <input type="radio" name="user_status" id="user_status_S" value="S" <?php echo @$data['user_status']=="S"?"checked":""?>>휴원
                        <input type="radio" name="user_status" id="user_status_N" value="N" <?php echo @$data['user_status']=="N"?"checked":""?>>비원
<!--                        <input type="radio" name="user_status" id="user_status_S" value="N" <?php echo @$data['user_status']=="N"?"checked":""?>>정지-->
                      </td>
                    </tr>
                    <tr>
                      <th>정지 기간</th>
                      <td colspan="3">
                        <input type="radio" name="stop_term" value=""  <?php echo @$data['stop_term']==""?"checked":""?>>정상
                        <input type="radio" name="stop_term" value="7"  <?php echo @$data['stop_term']=="7"?"checked":""?>>7일
                        <input type="radio" name="stop_term" value="30"  <?php echo @$data['stop_term']=="30"?"checked":""?>>30일
                        <input type="radio" name="stop_term" value="C"  <?php echo @$data['stop_term']=="C"?"checked":""?>>영구
                      </td>
                    </tr>                    
                    <tr>
                      <th>정지사유</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="stop_reason" name="stop_reason" placeholder="정지사유"  value="<?php echo @$data['stop_reason'];?>" />
                      </td>
                    </tr>                     
                    <tr>
                      <th>메모</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="memo" name="memo" placeholder="메모"  value="<?php echo @$data['memo'];?>" />
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
    function checkUserid(){
      //<?=$this->security->get_csrf_token_name();?> <?=$this->security->get_csrf_hash();?>
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      if($('#user_id').val() == "") {
        alert('아이디를 입력해주세요.');
        return;
      }
      
      if(($('#user_id').val()).length <6) {
        alert('6자 이상의 아이디를 입력해주세요.');
        return;
      }      
      var formData = {"user_id":$('#user_id').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
      $.ajax({
        type: "POST",
        url : "/admin/master/checkUserId",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
              $('#userid_check').val("Y");
              alert(data.msg);
          } else {
              alert(data.msg);
              $('#userid_check').val("");
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
    });    
  }

   $(function(){
      $('#group_name').on("change",function(){
              var formData = {"group_name":$('#group_name').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
              $.ajax({
                type: "POST",
                url : "/admin/member/classList",
                data: formData,
                dataType:"json",
                success : function(data, status, xhr) {
                    if( data.result == "success" ){
                        $('#class_name option').remove();
                        $('#class_name').append("<option value=''>선택</option>");
                        for(var i =0; i < data.data.length;i++) {
                            var row = data.data[i];
                            $('#class_name').append("<option value='"+row.class_name+"'>"+row.class_name+"</option>");
                        }
                        //$('#userid_check').val("Y");
                        //alert(data.msg);
                    } else {
                        //alert(data.msg);
                        //$('#userid_check').val("");
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });
      });
      $('input[name="user_status"]').on("change",function(){
          if($('input[name="user_status"]:checked').val() == "Y") {
              $('input[name="stop_term"]:eq(0)').prop("checked",true);
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
            var formData = myForm.serialize();
            $.ajax({
              type: "POST",
              url : "/admin/member/writeProc",
              data: formData,
              dataType:"json",
              success : function(data, status, xhr) {
                if( data.result == "success" ){
                    alert("등록 되었습니다.");
                    location.href = "/admin/member/list";
                } else {
                    if(data.msg == "duplicate id"){
                      alert(data.msg);
                      //alert("이미 등록된 아이디가 있습니다.");
                    } else {
                      alert(data.msg);
                    }
                }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.responseText);
              }
            });            
            return false;
        },        
        errorPlacement: function (error, element) {
             //console.log(element);
             console.log(error);
             error.insertBefore(element);
             //error.addClass("error-validation");
             $(element).addClass("error-validation");
        }        
      });
          
     $('#product').on("change",function(){
       var money = 0;
       var disk_size = "";
       switch($(this).val()){
         case "50":
         money = 39000;
         disk_size = "10";
         break;
         case "100":
         money = 49000;
         disk_size = "20";
         break;
         case "200":
         money = 59000;
         disk_size = "30";
         break;
       }
       $('#month_payment').val(money.toLocaleString('ko-KR'));
       $('#students_total').val($(this).val());
       $('#contract_disk').val(disk_size);
     });

     $('#product_opt').on("change",function(){
        var product_val = $('#product').val();
        var moeny = 0;
        var disk_size = 0;
        switch(product_val){
          case "50":
          money = 39000;
          disk_size = 10;
          break;
          case "100":
          money = 49000;
          disk_size = 20;
          break;
          case "200":
          money = 59000;
          disk_size = 30;
          break;
        }

        switch($(this).val()){
          case "10":
          money += 10000;
          disk_size += 10;
          break;
        }

        $('#month_payment').val(money.toLocaleString('ko-KR'));
        $('#contract_disk').val(disk_size);

     });

     $('#month_payment').on("keyup",function(){
       var money = Number($(this).val());
       $(this).val(money.toLocaleString('ko-KR'));
       console.log(money);
     })

     $('#product').trigger("change");

     $.datepicker.regional['ko'] = {
         closeText: '닫기',
         prevText: '이전달',
         nextText: '다음달',
         currentText: 'X',
         monthNames: ['1월(JAN)','2월(FEB)','3월(MAR)','4월(APR)','5월(MAY)','6월(JUN)',
         '7월(JUL)','8월(AUG)','9월(SEP)','10월(OCT)','11월(NOV)','12월(DEC)'],
         monthNamesShort: ['1월','2월','3월','4월','5월','6월',
         '7월','8월','9월','10월','11월','12월'],
         dayNames: ['일','월','화','수','목','금','토'],
         dayNamesShort: ['일','월','화','수','목','금','토'],
         dayNamesMin: ['일','월','화','수','목','금','토'],
         weekHeader: 'Wk',
         dateFormat: 'yy-mm-dd',
         firstDay: 0,
         isRTL: false,
         showMonthAfterYear: true,
         yearSuffix: ''};
        $.datepicker.setDefaults($.datepicker.regional['ko']);

     $('.date').datepicker({
       changeMonth: true,
       changeYear: true,
       showButtonPanel: true,
       yearRange: 'c-99:c+99',
       minDate: '',
       maxDate: ''
    });


  });
 
  function goList(){
    location.href="/admin/member/list";
  }

  function checkInput()
  {
     
    return true;
  }

  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      
      if($('#user_id').val() == "") {
        alert('아이디를 입력해주세요.');
        return;
      }
            
      if(($('#user_id').val()).length <6) {
        alert('6자 이상의 아이디를 입력해주세요.');
        return;
      }            
      
      if($('#userid_check').val() != "Y") {
        alert('아이디 중복체크를 해주세요.');
        return;
      }          
      
      if(isCelluar($('#cell_no').val()) == false) {
          alert('휴대폰번호를 체크해주세요.');
          return;            
      }      
      
      $('#mainForm').submit();
  }
  
  function deleteProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var formData = {"user_seq":$('#user_seq').val(), "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
      if(confirm('삭제 후 복구가 불가능합니다. 정말 삭제하시겠습니까?')) {
          $.ajax({
            type: "POST",
            url : "/admin/partner/deleteProc",
            data: formData,
            dataType:"json",
            success : function(data, status, xhr) {
              if( data.result == "success" ){
                alert("삭제 되었습니다.");
                location.href = "/admin/member/list";
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
