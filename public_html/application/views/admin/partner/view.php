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
            <form role="form" id="academiWriteForm" enctype="multipart/form-data">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>

              <div class="card-body">
                <h4 style="color:#007bff;">가맹점 정보</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>계약형태</th>
                      <td colspan="3">
                        <select class="form-control col-sm-4 float-left" name="academy_type" id="academy_type">
                            <option value="laha">라하잉글리시</option>
                            <option value="touchwa">터치와</option>
                            <option value="etc">외부가맹</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>학원명</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="academy_name" name="academy_name" placeholder="학원명" value="" />
                      </td>
                    </tr>
                    <tr>
                      <th>학원 아이디</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="academy_id" name="academy_id" placeholder="학원 아이디" value="" />
                      </td>
                    </tr>
                    <tr>
                      <th>학원 비밀번호</th>
                      <td colspan="3">
                        <input type="password" class="form-control col-sm-6 float-left" id="academy_password" name="academy_password" placeholder="학원 비밀번호" value="" />
                      </td>
                    </tr>
                    <tr>
                      <th>원장이름</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="academy_owner_name" name="academy_owner_name" placeholder="원장이름" value="" />
                      </td>
                    </tr>
                    <tr>
                      <th>원장 연락처</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="phone" name="phone" placeholder="원장 연락처" value=""  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>학원 대표번호</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="tel" name="tel" placeholder="학원 대표번호" value=""  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>학원 이메일</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="email" name="email" placeholder="학원 이메일" value=""/>
                      </td>
                    </tr>
                    <tr>
                      <th rowspan="3">주소</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-3 float-left" id="zipcode" name="zipcode" placeholder="우편번호" value="" />
                        <button type="button" class="btn btn-default float-left" id="zipcode_btn" style="margin-left:5px;" onclick="findAddress();">우편번호 찾기</button>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="addr_1" name="addr_1" placeholder="주소" value="" />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="addr_2" name="addr_2" placeholder="상세주소" value="" />
                      </td>
                    </tr>
                    <tr>
                      <th>상품</th>
                      <td colspan="3">
                        <select class="form-control col-sm-4 float-left" name="product" id="product">
                            <option value="50">원생 50명 미만 / 10GB </option>
                            <option value="100">원생 100명 미만 / 20GB </option>
                            <option value="200">원생 200명 미만 / 30GB </option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>상품 추가 옵션</th>
                      <td colspan="3">
                        <select class="form-control col-sm-4 float-left" name="product_opt" id="product_opt">
                            <option value="">옵션추가 선택</option>
                            <option value="10">10GB 추가 </option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>사업자번호</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="business_no" name="business_no" placeholder="사업자등록번호" value="" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>계약일</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left date" id="contract_date" name="contract_date" readonly/>
                      </td>
                    </tr>
                    <tr>
                      <th>만료일</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left date" id="expiration_date" name="expiration_date" readonly/>
                        <input type="hidden" class="form-control col-sm-6 float-left" id="month_payment" name="month_payment"  value=""  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>사용인원</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="students_total" name="students_total" placeholder="사용인원" value=""  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>할당용량</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-2 float-left" id="contract_disk" name="contract_disk" placeholder="할당용량 GB" value=""  oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                        <span style="float:left">GB</span>
                      </td>
                    </tr>
                    <tr>
                      <th>메모</th>
                      <td colspan="3">
                        <textarea rows="5" class="form-control col-sm-6 float-left" id="memo" name="memo"></textarea>
                      </td>
                    </tr>
                    <tr>
                      <th>상태</th>
                      <td colspan="3">
                        <select class="form-control col-sm-4 float-left" name="status" id="status">
                            <option value="C">승인</option>
                            <option value="R">승인대기</option>
                            <option value="S">서비스중지</option>
                            <option value="E">서비스종료</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" style="margin-right:10px;" onclick="goList()">목록</button>
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
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>


   $(function(){
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

function findAddress() {
      new daum.Postcode({
          oncomplete: function(data) {

              var addr = ''; // 주소 변수
              var extraAddr = ''; // 참고항목 변수

              //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
              if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                  addr = data.roadAddress;
              } else { // 사용자가 지번 주소를 선택했을 경우(J)
                  addr = data.jibunAddress;
              }

              // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
              if(data.userSelectedType === 'R'){
                  // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                  // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                  if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                      extraAddr += data.bname;
                  }
                  // 건물명이 있고, 공동주택일 경우 추가한다.
                  if(data.buildingName !== '' && data.apartment === 'Y'){
                      extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                  }
                  // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                  if(extraAddr !== ''){
                      extraAddr = ' (' + extraAddr + ')';
                  }

              } else {
                  document.getElementById("addr_1").value = '';
              }

              // 우편번호와 주소 정보를 해당 필드에 넣는다.
              document.getElementById('zipcode').value = data.zonecode;
              document.getElementById("addr_1").value = addr+extraAddr;
              // 커서를 상세주소 필드로 이동한다.
              document.getElementById("addr_2").focus();
          }
      }).open();
  }

  function goList(){
    location.href="/admin/academiList";
  }

  function checkInput()
  {
    var academy_name = $('#academy_name').val();
    var academy_id = $('#academy_id').val();
    var academy_password = $('#academy_password').val();
    var business_no = $('#business_no').val();
    var month_payment = $('#month_payment').val();
    var students_total = $('#students_total').val();
    var contract_disk = $('#contract_disk').val();

    var email = $('#email').val();

    if( academy_name == "" ){
      alert("학원명을 입력해주세요.");
      return false;
    }

    if( academy_id == "" ){
      alert("학원 아이디를 입력해주세요.");
      return false;
    }

    if( academy_password == "" ){
      alert("학원 비밀번호를 입력해주세요.");
      return false;
    }

    if( email == "" ){
      alert("이메일을 입력해주세요.");
      return false;
    }

    if( business_no == "" ){
      alert("사업자번호를 입력해주세요.");
      return false;
    }

    if( month_payment == "" ){
      alert("월정금액을 입력해주세요.");
      return false;
    }

    if( students_total == "" ){
      alert("사용인원을 입력해주세요.");
      return false;
    }

    if( contract_disk == "" ){
      alert("할당용량을 입력해주세요.");
      return false;
    }

    return true;
  }

  function writeProc(){

    if(checkInput()){
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();

      var form = $('#academiWriteForm')[0];
      var formData = new FormData($('#academiWriteForm')[0]);

      formData.append(csrf_name,csrf_val);


      $.ajax({
        type: "POST",
        url : "/admin/academiWriteProc",
        data: formData,
        dataType:"json",
        processData: false,
        contentType: false,
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            alert("등록 되었습니다.");
            location.href = "/admin/academiList";
          } else {
            if(data.msg == "duplicate id"){
              alert("이미 등록된 아이디가 있습니다.");
            }
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
    }



  }
</script>
