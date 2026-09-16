<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <form id="userForm">
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
    <input type="hidden" id="user_seq" name="user_seq" value="{user_seq}"/>
    <input type="hidden" id="school_seq" name="school_seq" id="school_seq" value="<?php echo $userData['school_seq']; ?>"/>
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
              <table class="table">
                <colgroup>
                  <col width="5%"/>
                  <col/>
                </colgroup>
                <tbody>
                  <tr>
                    <th colspan="2" class="text-left align-middle" style="background-color:#f2f2f2;">회원정보</th>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">아이디</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="user_id" name="user_id" value="<?php echo $userData['user_id'] ?>" readonly/>
                    </td>
                  </tr>
                  <?php if($this->session->userdata("admin_level")==0){ ?>
                  <tr>
                    <th class="text-left align-middle">패스워드</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="user_password" name="user_password"/><small style="color:red">*변경할때만 입력해주세요.</small>
                    </td>
                  </tr>
                <?php }else{ ?>
                  <input type="hidden" class="form-control col-sm-2 float-left" id="user_password" name="user_password"/>
                <?php } ?>
                  <tr>
                    <th class="text-left align-middle">이름</th>
                    <td class="text-left align-middle">
                      <?php if($this->session->userdata("admin_level")==0){ ?>
                      <input type="text" class="form-control col-sm-2 float-left" id="user_name" name="user_name" value="<?php echo $userData['user_name'] ?>"/>
                    <?php }else{ ?>
                      <input type="text" class="form-control col-sm-2 float-left" id="user_name" name="user_name" value="<?php echo $userData['user_name'] ?>" readonly/>
                    <?php } ?>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">생년월일</th>
                    <td class="text-left align-middle">
                        <input type="text" class="form-control col-sm-2 float-left" id="birthday" name="birthday" value="<?php echo $userData['birthday'] ?>" readonly/>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">이메일</th>
                    <td class="text-left align-middle">
                      <?php if($this->session->userdata("admin_level")==0){ ?>
                      <input type="text" class="form-control col-sm-2 float-left" id="email" name="email" value="<?php echo $userData['email'] ?>"/>
                    <?php }else{ ?>
                      <input type="text" class="form-control col-sm-2 float-left" id="email" name="email" value="<?php echo $userData['email'] ?>" readonly/>
                    <?php } ?>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">등급</th>
                    <td class="text-left align-middle">
                      <select type="text" class="form-control col-sm-2 float-left" name="user_level" id="user_level">
                        <?php if($this->session->userdata("admin_level")<=0){ ?>
                        <option value="0" <?php echo $userData['user_level']=="0"?"selected":"" ?>>본사관리자</option>
                        <?php } ?>
                        <?php if($this->session->userdata("admin_level")<=1){ ?>
                        <option value="1" <?php echo $userData['user_level']=="1"?"selected":"" ?>>기관관리자</option>
                        <?php } ?>
                        <option value="2" <?php echo $userData['user_level']=="2"?"selected":"" ?>>학급관리자</option>
                        <option value="6" <?php echo $userData['user_level']=="6"?"selected":"" ?>>학생회원</option>
                        <option value="7" <?php echo $userData['user_level']=="7"?"selected":"" ?>>일반회원</option>
                        <option value="8" <?php echo $userData['user_level']=="8"?"selected":"" ?>>광고주</option>
                      </select>
                    </td>
                  </tr>
                  <?php if($this->session->userdata("admin_level")==0){ ?>
                  <tr>
                    <th class="text-left align-middle">상태</th>
                    <td class="text-left align-middle">
                      <select type="text" class="form-control col-sm-2 float-left" name="user_status" id="user_status">
                        <option value="C" <?php echo $userData['user_status']=="C"?"selected":"" ?>>승인</option>
                        <option value="L" <?php echo $userData['user_status']=="L"?"selected":"" ?>>탈퇴</option>
                        <option value="D" <?php echo $userData['user_status']=="D"?"selected":"" ?>>삭제</option>
                      </select>
                    </td>
                  </tr>
                <?php }else{ ?>
                  <input type="hidden" name="user_status" id="user_status" value="<?php echo $userData['user_status'] ?>"/>
                <?php } ?>
                  <tr>
                    <th class="text-left align-middle">지역</th>
                    <td class="text-left align-middle">
                      <select class="form-control col-1 float-left" style="margin:5px 5px 5px 5px;" name="location" id="location">
                        <option value="">지역</option>
                        <?php for($i=0; $i<count($locationData); $i++){ ?>
                        <option value="<?php echo ($locationData[$i]['value']); ?>" <?php echo $userData['location']==$locationData[$i]['value']?"selected":"";?>><?php echo $locationData[$i]['value']; ?></option>
                        <?php } ?>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th colspan="2" class="text-left align-middle" style="background-color:#f2f2f2;">기관정보</th>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">계약구분</th>
                    <td class="text-left align-middle">
                      <?php echo $userData['contract_type'];?>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">기관명</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="school_name" name="school_name" readonly value="<?php echo $userData['school_name_org']; ?>"/>
                      <button type="button" class="btn btn-block btn-default float-left col-sm-1" id="school_search_btn" style="margin-left:5px;" onclick="schoolFind()">검색</button>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">학년</th>
                    <td class="text-left align-middle">
                      <select type="text" class="form-control col-sm-2 float-left" name="school_year" id="school_year" onchange="classLoad()">
                        <?php for($i=0; $i<6; $i++){ ?>
                        <option value="<?php echo ($i+1); ?>" <?php echo ($userData['school_year']==($i+1)) ? "selected": ""; ?>><?php echo ($i+1)."학년" ?></option>
                        <?php } ?>
                        <option value="None" <?php echo ($userData['school_year']==""||$userData['school_year']=="0") ? "selected": ""; ?>>None</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">반</th>
                    <td class="text-left align-middle">
                      <select type="text" class="form-control col-sm-2 float-left" name="school_class" id="school_class">
                        <option value="">선택</option>
                        <?php for($i=0; $i<count($classList); $i++){ ?>
                        <option value="<?php echo $classList[$i]['school_class']; ?>" <?php echo ($classList[$i]['school_class']==$userData['school_class']) ? "selected": ""; ?>><?php echo $classList[$i]['school_class']; ?></option>
                        <?php } ?>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle" colspan="2">
                      <button type="button" class="btn btn-sm btn-warning float-left col-sm-1" id="school_delete_btn" style="margin-left:5px;" onclick="schoolDelete()">삭제</button>
                    </th>
                  </tr>
                  <tr>
                    <th colspan="2" class="text-left align-middle" style="background-color:#f2f2f2;">학부모 정보</th>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">이름</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="parent_name" name="parent_name" value="<?php echo $userData['parent_name'] ?>" readonly/>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">생년월일</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left date" id="parent_birthday" name="parent_birthday" value="<?php echo $userData['parent_birthday'] ?>" readonly/>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">휴대전화</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="parent_phone" name="parent_phone" value="<?php echo $userData['parent_phone'] ?>" readonly/>
                      <?php echo ($userData['parent_phone_status']=="Y")?"<small style='color:blue'>인증완료</small>":"<small style='color:red'>인증필요</small>" ?>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle">이메일</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-2 float-left" id="parent_email" name="parent_email" value="<?php echo $userData['parent_email'] ?>" readonly/>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-left align-middle" rowspan="3">주소</th>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-1 float-left" id="parent_zipcode" name="parent_zipcode" onclick="findAddress()" value="<?php echo $userData['parent_zipcode'] ?>" readonly/>
                      <!--<button type="button" class="btn btn-block btn-default float-left col-sm-1" style="margin-left:5px;" onclick="findAddress()">주소검색</button>-->
                    </td>
                  </tr>
                  <tr>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-3 float-left" id="parent_addr1" name="parent_addr1" value="<?php echo $userData['parent_addr1'] ?>" readonly/>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-left align-middle">
                      <input type="text" class="form-control col-sm-3 float-left" id="parent_addr2" name="parent_addr2" value="<?php echo $userData['parent_addr2'] ?>" readonly/>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- /.card-body -->

            <!-- /.card-header -->
              <table class="table">
                <tbody>
                  <tr>
                    <td class="text-left align-middle">
                      <button type="button" class="btn btn-primary float-left mr-3" onclick="modifyMember()">수정</button>
                      <button type="button" class="btn btn-warning float-left mr-3" onclick="deleteUser()">삭제</button>
                      <button type="button" class="btn btn-default float-left" onclick="goList()">목록</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- /.card-body -->

        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
  </form>

</div>
<!-- /.content-wrapper -->
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
  $(function(){
    /*
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
     */

     firstLoad();
  });

  function schoolDelete()
  {
    $('#school_name').val("");
    $('#school_year').val("None");
    $('#school_class').val("");
    $('#school_seq').val("");
  }

  function goList()
  {
      location.href="/admin/memberAdm/memberList{param}";
  }

  function contractPop()
  {
    window.open("/admin/schoolAdm/contractPop","contractPop","width=470, height=430");
  }

  function schoolFind()
  {
    window.open("/admin/schoolAdm/schoolOrgSearchPop1","contractPop","width=470, height=500");
  }

  function choiceSchool(data)
  {
    var school_name = data.school_name;
    var school_seq = data.school_seq;
    var school_year = $('#school_year').val();

    $('#school_seq').val(school_seq);

    //반 로드
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "school_seq" : school_seq,
      "school_year" : school_year
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/admin/schoolAdm/schoolClassLoad",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        var html = "<option value=''>선택</option>";
        if(data.length>0){
          for(var i=0; i<data.length; i++){
            html += '<option value="'+data[i].school_class+'">'+data[i].school_class+'</option>';
          }
        }
        $('#school_class').html(html);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

    $('#school_name').val(school_name);
  }

  function firstLoad()
  {
    var school_seq = $('#school_seq').val();
    var school_year = $('#school_year').val();

    //반 로드
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "school_seq" : school_seq,
      "school_year" : school_year
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/admin/schoolAdm/schoolClassLoad",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        var html = "<option value=''>선택</option>";
        if(data.length>0){
          for(var i=0; i<data.length; i++){
            if(data[i].school_class=="<?php echo $userData['school_class']; ?>"){
              html += '<option value="'+data[i].school_class+'" selected>'+data[i].school_class+'</option>';
            }else{
              html += '<option value="'+data[i].school_class+'" >'+data[i].school_class+'</option>';
            }

          }
        }
        $('#school_class').html(html);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }

  function classLoad()
  {
    var school_seq = $('#school_seq').val();
    var school_year = $('#school_year').val();

    //반 로드
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "school_seq" : school_seq,
      "school_year" : school_year
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/admin/schoolAdm/schoolClassLoad",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        var html = "<option value=''>선택</option>";
        if(data.length>0){
          for(var i=0; i<data.length; i++){
            html += '<option value="'+data[i].school_class+'" >'+data[i].school_class+'</option>';

          }
        }
        $('#school_class').html(html);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }

  function modifyMember()
  {
    var user_name = $('#user_name').val();
    var email = $('#email').val();
    var user_level = $('#user_level').val();
    var _location = $('#location').val();

    if(user_name == ""){
      alert("이름을 작성해주세요.");
      $('#user_name').focus();
      return;
    }

    if(email == ""){
      alert("이메일을 입력해주세요");
      $('#email').focus();
      return;
    }

    if(user_level == ""){
      alert("등급을 선택해주세요");
      return;
    }

    if(_location == ""){
      alert("지역을 입력해주세요");
      $('#location').focus();
      return;
    }

    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var formData = $('#userForm').serialize();
    formData[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/admin/memberAdm/memberModifyProc",
      data: formData,
      dataType:"json",
      success : function(data, status, xhr) {

        if( data.result == "success" ){
          alert("수정 되었습니다.");

          location.href = "/admin/memberAdm/memberList{param}";
        } else {
          alert("이미 기관관리자가 지정되어있습니다.");
        }



      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

  }

  function selfWrite()
  {
    var self_write = $('#self_write').is(":checked");
    if(self_write){
      $('#school_name').attr("readonly",false);
      $('#school_search_btn').hide();
    }else{
      $('#school_name').attr("readonly",true);
      $('#school_search_btn').show();
    }
  }

  function findAddress()
  {
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
                    document.getElementById("parent_addr1").value = '';
                }

                // 우편번호와 주소 정보를 해당 필드에 넣는다.
                document.getElementById('parent_zipcode').value = data.zonecode;
                document.getElementById("parent_addr1").value = addr+extraAddr;
                // 커서를 상세주소 필드로 이동한다.
                document.getElementById("parent_addr2").focus();
            }
        }).open();
    }

    function deleteUser()
    {
      if(confirm("삭제하시겠습니까?")){
        var user_seq = $('#user_seq').val();

        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();

        var data = {
          "user_seq" : user_seq
        };

        data[csrf_name] = csrf_val;

        $.ajax({
          type: "POST",
          url : "/admin/memberAdm/deleteuser",
          data: data,
          dataType:"json",
          success : function(data, status, xhr) {
            if(data.result == "success"){
              alert("삭제되었습니다.");
              location.reload();
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR.responseText);
          }
        });
      }

    }
</script>
