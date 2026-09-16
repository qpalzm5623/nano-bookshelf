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
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="user_seq" value="<?php echo @$data['user_seq'];?>" /> 
              <input type="hidden" name="user_type" value="<?php echo @data['user_type'];?>" /> 
              <input type="hidden" name="mode" value="mypage" /> 
              <input type="hidden" name="userid_check" id="userid_check" value="<?php echo @$data['user_seq']?"Y":"";?>" /> 

              <div class="card-body">
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>계정구분</th>
                      <td colspan="3">
                        마스터
                      </td>
                    </tr>
                    <tr>
                      <th>아이디</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left" id="user_id" name="user_id" onChange="this.value=this.value.toLowerCase();" placeholder="아이디" value="<?php echo @$data['user_id'];?>" required />
                        <?php echo @$data['user_id'];?>
                      </td>
                    </tr>                    
                    <tr>
                      <th>* 비밀번호</th>
                      <td colspan="3">
                        <input type="password" class="form-control col-sm-6 float-left" id="user_password" name="user_password" placeholder="비밀번호" value="" />
                      </td>
                    </tr>                    
                    <tr>
                      <th>이름</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left" id="user_name" name="user_name" placeholder="이름" value="<?php echo @$data['user_name'];?>" required />
                        <?php echo @$data['user_name'];?>
                      </td>
                    </tr>
                    <tr>
                      <th>* 휴대폰번호</th>
                      <td colspan="3">
                        <input type="tel" class="form-control col-sm-6 float-left" id="cell_no" name="cell_no" placeholder="휴대폰번호" value="<?php echo @$data['cell_no'];?>"  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');" required maxlength="13" minlength="10"/>
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
                      <th>계약일</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left date" id="start_date" name="start_date" value="<?php echo @$data['start_date'];?>" readonly required />
                        <?php echo @$data['start_date'];?>
                      </td>
                    </tr>                    
                    <tr>
                      <th>만료일</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left date" id="end_date" name="end_date" value="<?php echo @$data['end_date'];?>" readonly required />
                        <?php echo @$data['end_date'];?>
                      </td>
                    </tr>
                    <tr>
                      <th>서비스 시작일</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left date" id="service_start_date" name="service_start_date" value="<?php echo @$data['service_start_date'];?>" readonly required />
                        <?php echo @$data['service_start_date'];?>
                      </td>
                    </tr>                    
                    <tr>
                      <th>서비스 만료일</th>
                      <td colspan="3">
                        <input type="hidden" class="form-control col-sm-6 float-left date" id="service_end_date" name="service_end_date" value="<?php echo @$data['service_end_date'];?>" readonly required />
                         <?php echo @$data['service_end_date'];?>
                      </td>
                    </tr>                    
                    <tr>
                      <th>마케팅 수신동의</th>
                      <td colspan="3">
                        <?php if(@$data['sms_yn'] == "Y") echo "동의"; else echo "미동의";?>
                      </td>
                    </tr>
                    <tr>
                      <th>개인정보 이용동의</th>
                      <td colspan="3">
                        <?php 
                            if(@$data['marketing_yn'] == 1) echo "1년";
                            else if(@$data['marketing_yn'] == 3) echo "3년";
                            else if(@$data['marketing_yn'] == "C") echo "회원 탈퇴 시까지";
                        ?>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">수정</button>                
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/4.3.0/jquery.form.min.js"></script>
<script>

        
    /* 첨부파일 검증 */
    function validation(obj){
        const fileTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/tif'];
        if (obj.name.length > 100) {
            alert("파일명이 100자 이상인 파일은 제외되었습니다.");
            return false;
        } else if (obj.size > (100 * 1024 * 1024)) {
            alert("최대 파일 용량인 100MB를 초과한 파일은 제외되었습니다.");
            return false;
        } else if (obj.name.lastIndexOf('.') == -1) {
            alert("확장자가 없는 파일은 제외되었습니다.");
            return false;
        } else if (!fileTypes.includes(obj.type)) {
            alert("첨부가 불가능한 파일은 제외되었습니다.");
            return false;
        } else {
            return true;
        }
    }    
  
	function uploadImg($this, obj, i){
		var target = $this.data('target');
		var seq = $this.data('seq');

		$thisfile = $this;
        var fileName = $thisfile.val().split('\\').pop().toLowerCase();
        $thisfile.siblings(".file_text").text(fileName);
        
		if (/(MSIE|Trident)/.test(navigator.userAgent)) {
			$files = $this;
			
			var real = $this;
			var cloned = real.clone(true);
			real.hide();
			cloned.insertAfter(real);

			// Move the real element to the hidden form - you can then submit it
			//real.appendTo("#some-hidden-form");			
		} else {
			$files = $this.clone();
		}	
		
		$("<form action='logo_upload_file' enctype='multipart/form-data' method='post'/><input type='hidden' id='csrf' name='<?=$this->security->get_csrf_token_name();?>' value='<?=$this->security->get_csrf_hash();?>'/>")
			.ajaxForm({
				dataType: 'json',
				beforeSend: function() {
				},
				success: function(data){
				    if(data != "") {
				        $('#logo').val(data.url);
				        $('#logo_data').html("<img src='/upload/logo/"+data.url+"'>");
				        
				    }
				},
				complete: function(data) {
					//console.log(data);
				}
			})
			.append( $files )
			.submit();
	}

   $(function(){
      const myForm = $('#mainForm');
      myForm.validate({
        rules: {
        },
        messages: {
        },
        submitHandler: function() {
            var formData = myForm.serialize();
            $.ajax({
              type: "POST",
              url : "/admin/partner/typeWriteProc",
              data: formData,
              dataType:"json",
              success : function(data, status, xhr) {
                if( data.result == "success" ){
                  alert("수정 되었습니다.");
                  location.reload();
                } else {
                  if(data.msg == "duplicate id"){
                    alert(data.msg);
                    //alert("이미 등록된 아이디가 있습니다.");
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
  
  function checkUserid(){
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
 
  function goList(){
    location.href="/admin/partner/list";
  }

  function checkInput()
  {
     
    return true;
  }

  function writeProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      
      $('#mainForm').submit();
  }
  
  function deleteProc(){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var formData = {"user_seq":$('#user_seq').val(), csrf_name:csrf_val};
      $.ajax({
        type: "POST",
        url : "/admin/partner/deleteProc",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("삭제 되었습니다.");
            location.href = "/admin/partner/list";
          } else {
              alert(data.msg);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
    });
  }  
</script>
