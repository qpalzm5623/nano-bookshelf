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
            <li class="breadcrumb-item"><a href="{base_url}admin/main">Home</a></li>
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
            <form role="form" id="companyForm" enctype="multipart/form-data" action="/admin/configAdm/settingProc" method="POST">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" id="seq" name="seq" value="<?php echo $data['seq'];?>"/>

              <input type="hidden" id="logo_org" name="logo_org" value="<?php echo $data['site_logo'];?>"/>
              <input type="hidden" id="banner_org" name="banner_org" value="<?php echo $data['banner'];?>"/>
              <input type="hidden" id="logo_mo_org" name="logo_mo_org" value="<?php echo $data['mobile_logo'];?>"/>
              <input type="hidden" id="banner_mo_org" name="banner_mo_org" value="<?php echo $data['mobile_banner'];?>"/>
              <input type="hidden" id="business_license_org" name="business_license_org" value="<?php echo $data['business_file'];?>"/>

              <div class="card-body">
                <h4 style="color:#007bff;">운영사 정보</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>사이트명</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="site_name" name="site_name" placeholder="사이트명" value="<?php echo $data['site_name'];?>" />
                      </td>
                      <th>사업자등록번호</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="site_businees_no" name="site_businees_no" placeholder="사업자등록번호" value="<?php echo $data['site_businees_no'];?>" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');"/>
                      </td>
                    </tr>
                    <tr>
                      <th>도메인 주소</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="domain" name="domain" placeholder="도메인 주소" value="<?php echo $data['domain'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>법인명</th>
                      <td >
                        <input type="text" class="form-control col-sm-6 float-left" id="company_name" name="company_name" placeholder="법인명" value="<?php echo $data['company_name'];?>"  >
                      </td>
                      <th>대표자명</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="ceo_name" name="ceo_name" placeholder="대표자명" value="<?php echo $data['ceo_name'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>대표번호</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="tel_no" name="tel_no" placeholder="대표번호" value="<?php echo $data['tel_no'];?>" />
                      </td>
                      <th>고객센터번호</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="as_no" name="as_no" placeholder="고객센터번호" value="<?php echo $data['as_no'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>팩스</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="fax_no" name="fax_no" placeholder="팩스" value="<?php echo $data['fax_no'];?>" />
                      </td>
                      <th>이메일</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="email" name="email" placeholder="이메일" value="<?php echo $data['email'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>주소</th>
                      <td>
                        <input type="text" class="form-control col-sm-3 float-left" id="zipcode" name="zipcode" placeholder="우편번호" value="<?php echo $data['zipcode'];?>" />
                        <button type="button" class="btn btn-default float-left" id="zipcode_btn" style="margin-left:5px;" onclick="findAddress();">우편번호 찾기</button>
                        <div>
                        <input type="text" class="form-control col-sm-12 float-left" id="address" name="address" placeholder="주소" value="<?php echo $data['address'];?>" />
                        <input type="text" class="form-control col-sm-12 float-left" id="address_detail" name="address_detail" placeholder="상세주소" value="<?php echo $data['address_detail'];?>" />
                        </div>
                      </td>
                      <th>개인정보책임자</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="information_officer" name="information_officer" placeholder="개인정보책임자" value="<?php echo $data['information_officer'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>업종</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="industry" name="industry" placeholder="업종" value="<?php echo $data['industry'];?>" />
                      </td>
                      <th>업태</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="condition" name="condition" placeholder="업태" value="<?php echo $data['condition'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>로고이미지</th>
                      <td>
                        <input type="file" class="form-control col-sm-6 float-left" id="logo" name="logo" />
                      </td>
                      <th>배너이미지</th>
                      <td>
                        <input type="file" class="form-control col-sm-6 float-left" id="banner" name="banner" />
                      </td>
                    </tr>
                    <tr>
                      <th>모바일 로고이미지</th>
                      <td>
                        <input type="file" class="form-control col-sm-6 float-left" id="logo_mo" name="logo_mo"/>
                      </td>
                      <th>모바일 배너이미지</th>
                      <td>
                        <input type="file" class="form-control col-sm-6 float-left" id="banner_mo" name="banner_mo"/>
                      </td>
                    </tr>
                    <tr>
                      <th>사업자 등록증</th>
                      <td colspan="3">
                        <input type="file" class="form-control col-sm-6 float-left" id="business_license" name="business_license"/>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="card-body">
                <h4 style="color:#007bff;">연동 정보</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>HRD-NET 아이디</th>
                      <td colspan="3">
                        <input type="text" class="form-control col-sm-6 float-left" id="hrdnet_id" name="hrdnet_id" placeholder="HRD-NET 아이디" value="<?php echo $data['hrdnet_id'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>본인인증 사이트 코드</th>
                      <td >
                        <input type="text" class="form-control col-sm-6 float-left" id="cert_id" name="cert_id" placeholder="본인인증 사이트 코드"  value="<?php echo $data['cert_id'];?>" />
                      </td>
                      <th>본인인증 사이트 키</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="cert_password" name="cert_password" placeholder="본인인증 사이트 키"  value="<?php echo $data['cert_password'];?>"/>
                      </td>
                    </tr>
                    <tr>
                      <th>아이핀 사이트 코드</th>
                      <td >
                        <input type="text" class="form-control col-sm-6 float-left" id="ipin_id" name="ipin_id" placeholder="아이핀 사이트 코드" value="<?php echo $data['ipin_id'];?>"/>
                      </td>
                      <th>아이핀 사이트 키</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="ipin_password" name="ipin_password" placeholder="아이핀 사이트 키" value="<?php echo $data['ipin_password'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>결제사</th>
                      <td colspan="3">
                        <select class="form-control col-sm-4 float-left" name="payment_company_code" id="payment_company_code">
                            <option value="">결제사</option>
                            <option value="KCP" <?php echo $data['payment_company_code']=="KCP"?"selected":"";?>>KCP</option>
                            <option value="INICIS" <?php echo $data['payment_company_code']=="INICIS"?"selected":"";?>>이니시스</option>
                        </select>
                      </td>

                    </tr>
                    <tr>
                      <th>테스트 상점 아이디</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="payment_test_id" name="payment_test_id" placeholder="테스트 상점 아이디" value="<?php echo $data['payment_test_id'];?>" />
                      </td>
                      <th>테스트 상점 키</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="payment_test_key" name="payment_test_key" placeholder="테스트 상점 키" value="<?php echo $data['payment_test_key'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>상점 아이디</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="payment_id" name="payment_id" placeholder="상점 아이디" value="<?php echo $data['payment_id'];?>" />
                      </td>
                      <th>상점 키</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="payment_key" name="payment_key" placeholder="상점 키" value="<?php echo $data['payment_key'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>결제 수단</th>
                      <td colspan="3">
                        <input type="checkbox" class="" id="payment_type1" name="payment_use_service[]" value="Acc" <?php echo strstr($data['payment_use_service'], "Acc")?"checked":"";?> />
                        무통장 결제
                        <input type="checkbox" class="" id="payment_type2" name="payment_use_service[]" value="Card"  <?php echo strstr($data['payment_use_service'], "Card")?"checked":"";?>  />
                        카드 결제
                        <input type="checkbox" class="" id="payment_type3" name="payment_use_service[]" value="DirectBank"  <?php echo strstr($data['payment_use_service'], "DirectBank")?"checked":"";?>  />
                        계좌 이체
                        <input type="checkbox" class="" id="payment_type4" name="payment_use_service[]" value="VBank"  <?php echo strstr($data['payment_use_service'], "VBank")?"checked":"";?>  />
                        가상 계좌
                      </td>
                    </tr>
                    <tr>
                      <th>무통장 결제 은행</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="bank_name" name="bank_name" placeholder="무통장 결제 은행" value="<?php echo $data['bank_name'];?>" />
                      </td>
                      <th>무통장 결제 계좌번호</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="bank_account" name="bank_account" placeholder="무통장 결제 계좌번호" value="<?php echo $data['bank_account'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>무통장 결제 계좌주</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="bank_user_name" name="bank_user_name" placeholder="무통장 결제 계좌주" value="<?php echo $data['bank_user_name'];?>" />
                      </td>
                      <th>라이센스번호</th>
                      <td>
                        <input type="text" class="form-control col-sm-6 float-left" id="license" name="license" placeholder="라이센스번호" value="<?php echo $data['license'];?>" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="card-body">
                <h4 style="color:#007bff;">SEO 정보</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="85%" />
                  <tbody>
                    <tr>
                      <th>META TITLE</th>
                      <td>
                        <input type="text" class="form-control col-sm-12 float-left" id="meta_title" name="meta_title" placeholder="META TITLE" value="<?php echo $data['meta_title'];?>" />
                      </td>
                    </tr>
                    <tr>
                      <th>META KEYWORDS</th>
                      <td>
                        <input type="text" class="form-control col-sm-12 float-left" id="meta_keywords" name="meta_keywords" placeholder="META KEYWORDS" value="<?php echo $data['meta_keywords'];?>" />
                      </td>
                    </tr> 
                    <tr>
                      <th>META DESCRIPTION</th>
                      <td>
                        <input type="text" class="form-control col-sm-12 float-left" id="meta_description" name="meta_description" placeholder="META DESCRIPTION" value="<?php echo $data['meta_description'];?>" />
                      </td>
                    </tr>                 
                    <tr>
                      <th>META AUTHOR</th>
                      <td>
                        <input type="text" class="form-control col-sm-12 float-left" id="meta_author" name="meta_author" placeholder="META AUTHOR" value="<?php echo $data['meta_author'];?>" />
                      </td>
                    </tr>                         
                    <tr>
                      <th>META IMAGE</th>
                      <td>
                        <input type="text" class="form-control col-sm-12 float-left" id="meta_image" name="meta_image" placeholder="META IMAGE" value="<?php echo $data['meta_image'];?>" />
                      </td>
                    </tr>                      
                  </tbody>
                </table>
              </div>              

              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="save()">등록</button>
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
                  document.getElementById("address").value = '';
              }

              // 우편번호와 주소 정보를 해당 필드에 넣는다.
              document.getElementById('zipcode').value = data.zonecode;
              document.getElementById("address").value = addr+extraAddr;
              // 커서를 상세주소 필드로 이동한다.
              document.getElementById("address_detail").focus();
          }
      }).open();
  }

  function goList(){
    location.href="/admin/operationAdm/companyList";
  }

  function businessNoChk()
  {
    var business_no = $('#business_no').val();

    if( business_no == "" ){
      alert("사업자번호를 입력해 주세요.");
      $('#business_no').focus();
      return;
    }

    if(!checkBusinessNoChk(business_no)){
      alert("올바른 사업자번호를 입력해 주세요");
      return;
    }

    var data = {
      "business_no" : business_no
    };

    data[$('#csrf').attr("name")] = $('#csrf').val();

    $.ajax({
      type: "POST",
      url : "/admin/operationAdm/duplicateBusinessNo",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.success == "success"){
          alert("사용 가능한 사업자 번호입니다.");
          $('#business_no_chk').val($('#business_no')).val();
        }else{
          alert("이미 사용중인 사업자 번호입니다.");
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log("error : " + errorThrown);
        console.log(jqXHR.responseText);
      }
    });
  }

  function save()
  {
    var company_name = $('#company_name').val();
    if(company_name == ""){
      alert("법인명을 입력해 주세요.");
      return;
    }

    var company_type = $('#company_type').val();
    if(company_type == ""){
      alert("기업분류를 선택해 주세요.");
      return;
    }

    var ceo_name = $('#ceo_name').val();
    if(ceo_name == ""){
      alert("대표자명을 입력해 주세요.");
      return;
    }

    var company_zipcode = $('#company_zipcode').val();
    var company_address = $('#company_address').val();
    var company_address_detail = $('#company_address_detail').val();
    if(company_zipcode == ""){
      alert("우편번호를 입력해 주세요.");
      return;
    }
    if(company_address == ""){
      alert("주소를 입력해 주세요.");
      return;
    }
    if(company_address_detail == ""){
      alert("상세주소를 입력해 주세요.");
      return;
    }


    $('#companyForm').submit();
  }

  //사업자번호 체크
  function checkBusinessNoChk(value) {
    var valueMap = value.replace(/-/gi, '').split('').map(function(item) {
        return parseInt(item, 10);
    });

    if (valueMap.length === 10) {
        var multiply = new Array(1, 3, 7, 1, 3, 7, 1, 3, 5);
        var checkSum = 0;

        for (var i = 0; i < multiply.length; ++i) {
            checkSum += multiply[i] * valueMap[i];
        }

        checkSum += parseInt((multiply[8] * valueMap[8]) / 10, 10);
        return Math.floor(valueMap[9]) === (10 - (checkSum % 10));
    }

    return false;
}

</script>
