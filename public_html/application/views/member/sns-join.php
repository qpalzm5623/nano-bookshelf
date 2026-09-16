<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">{page_title}</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 회원정보입력 -->
		<div class="join_area">
			<ol class="join_step">
				<li class="current">1. 회원정보입력</li>
				<li>2. 학교정보입력</li>
				<li>3. 가입완료</li>
			</ol>

			<div class="join_form">
        <form id="join_form" action="/member/sns_join2" method="post">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <input type="hidden" name="user_type" value="<?php echo $user_type; ?>"/>
          <input type="hidden" name="sns_key" value="<?php echo $sns_key; ?>"/>
					<div id="children_wrap" style="display:none;">
  				<strong class="tit_join">법정대리인 정보</strong>
  				<ul class="list_join_info">
  					<li>
  						<label for="parent_name" class="label">이름</label>
  						<div class="input_area">
  							<input type="text" id="parent_name" name="parent_name" class="input_join">
  						</div>
  					</li>
  					<li>
  						<label for="parent_birthday" class="label">생년월일</label>
  						<div class="input_area">
  							<input type="text" id="parent_birthday" name="parent_birthday" class="input_join">
  						</div>
  					</li>
  					<li>
  						<label for="parent_phone" class="label">연락처</label>
  						<div class="input_area">
  							<input type="text" id="parent_phone" name="parent_phone" class="input_join">
  						</div>
  					</li>
  				</ul>
				</div>
  				<strong class="tit_join">회원 정보</strong>
  				<ul class="list_join_info">
  					<li>
  						<label for="join-id" id="id_chk" class="label">아이디</label><!-- is_confirmed: 체크아이콘 -->
  						<div class="input_area">
  							<input type="text" id="user_id" name="user_id" class="input_join">
                <input type="hidden" id="user_id_chk" value="N"/>
  							<a href="javascript:duplicateId()" class="btn_verification on">중복확인</a><!-- on: 활성화 -->
  						</div>
  					</li>
  				</ul>
  				<ul class="list_join_info">
  					<li>
  						<label for="join-name" class="label">이름</label>
  						<div class="input_area">
  							<input type="text" id="user_name" name="user_name" class="input_join" value="<?php echo $user_name; ?>">
  						</div>
  					</li>
  					<li>
  						<label for="join-phone" class="label">휴대폰번호</label>
  						<div class="input_area">
  							<input type="tel" id="phone" name="phone" class="input_join" value="<?php echo $phone; ?>">
  						</div>
  					</li>
            <li>
  						<label for="join-email" class="label">이메일</label>
  						<div class="input_area">
  							<input type="text" id="email" name="email" class="input_join" value="<?php echo $email; ?>">
  						</div>
  					</li>
  				</ul>
  				<ul class="add_join_info">
  					<li>
  						<label for="join-birth" class="label">생년월일</label>
  						<select class="uiselect" id="join-birth" style="width:75px" name="birth_year" id="birth_year" onchange="childrenChk()">
  							<option value="">년</option>
                <?php for($i=date("Y"); $i>=1900; $i--){ ?>
                  <option value="<?php echo $i; ?>" <?php echo $year == $i ? "selected":""?>><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  						<select class="uiselect" style="width:60px" name="birth_month" id="birth_month" onchange="childrenChk()">
  							<option value="">월</option>
                <?php for($i=1; $i<=12; $i++){ ?>
                  <option value="<?php echo $i; ?>" <?php echo $month == $i ? "selected":""?>><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  						<select class="uiselect" style="width:60px" name="birth_day" id="birth_day" onchange="childrenChk()">
  							<option>일</option>
                <?php for($i=1; $i<=31; $i++){ ?>
                  <option value="<?php echo $i; ?>" <?php echo $day == $i ? "selected":""?>><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  					</li>
  					<li>
  						<label for="join-male" class="label">성별</label>
  						<div class="gender_select">
  							<input type="radio" id="join-male" class="radio_gender" name="gender" value="M" <?php echo $gender=="M"?"checked":"" ?>>
  							<label for="join-male" class="label_gender">남자</label>
  						</div>
  						<div class="gender_select">
  							<input type="radio" id="join-female" class="radio_gender" name="gender" value="W" <?php echo $gender=="W"?"checked":"" ?>>
  							<label for="join-female" class="label_gender">여자</label>
  						</div>
  					</li>
            <li>
  						<label for="join-birth" class="label">지역</label>
  						<select class="uiselect" id="location" name="location" style="width:75px">
  							<option value="">지역</option>
                <?php for($i=0; $i<count($locationData); $i++){ ?>
                  <option value="<?php echo $locationData[$i]['value']; ?>"><?php echo $locationData[$i]['value']; ?></option>
                <?php } ?>
  						</select>
  					</li>
  					<li>
  						<label for="join-address" class="label">주소</label>
  						<input type="text" id="zipcode" name="zipcode" class="input_join" style="width:120px">
  						<a href="javascript:getAddress()" class="btn_verification on">우편번호 검색</a>
  					</li>
  				</ul>
  				<div class="info_address">
  					<input type="text" class="input_join" name="addr1" id="addr1" style="width:55%">
  					<input type="text" class="input_join" name="addr2" id="addr2" style="width:40%">
  				</div>
  				<a href="javascript:goNext();" class="btn_join_next">다 음</a>
        </form>
			</div>
		</div>
		<!-- //회원정보입력 -->
	</div>
	<!-- //container -->
<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
	$(function(){
		childrenChk();
	});

	function childrenChk()
	{
		var birth_year = $('#birth_year').val();
		var birth_month = $('#birth_month').val();
		var birth_day = $('#birth_day').val();

		if(birth_month==""){
			birth_month = "01";
		}

		if(birth_day==""){
			birth_day = "01";
		}

		var age = ageCal(birth_year,birth_month,birth_day);

		if(age<14){
			$('#children_wrap').show();
		}else{
			$('#children_wrap').hide();
		}
	}

  function duplicateId()
  {
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    var user_id = $('#user_id').val();

    var data = {
      "user_id" : user_id
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/duplicateId",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.result=="success"){
          swal("사용 가능한 아이디 입니다.");
          $('#user_id_chk').val("Y");
          $('#id_chk').addClass("is_confirmed");
        }else{
          swal("이미 존재하는 아이디입니다.");
          $('#user_id_chk').val("N");
          $('#user_id').val("");
          $('#id_chk').removeClass("is_confirmed");
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }

  function getAddress() {
      new daum.Postcode({
          oncomplete: function(data) {
              // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

              // 각 주소의 노출 규칙에 따라 주소를 조합한다.
              // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
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
                  // 조합된 참고항목을 해당 필드에 넣는다.
                  //document.getElementById("sample6_extraAddress").value = extraAddr;

              } else {
                  //document.getElementById("sample6_extraAddress").value = '';
              }

              // 우편번호와 주소 정보를 해당 필드에 넣는다.
              document.getElementById('zipcode').value = data.zonecode;
              document.getElementById("addr1").value = addr;
              // 커서를 상세주소 필드로 이동한다.
              document.getElementById("addr2").focus();
          }
      }).open();
  }

  function goNext()
  {
    var user_id = $('#user_id').val();
    var user_id_chk = $('#user_id_chk').val();
    var user_name = $('#user_name').val();
    var phone = $('#phone').val();
    var email = $('#email').val();
    var birth_year = $('#birth_year').val();
    var birth_month = $('#birth_month').val();
    var birth_day = $('#birth_day').val();
    var gender = $('input[name=gender]:checked').val();
    var location = $('#location').val();

    if(user_id==""){
      swal("아이디를 입력해주세요.");
      $('#user_id').focus();
      return;
    }

    if(user_id_chk=="N"){
      swal("아이디 중복체크를 해주세요.");
      $('#user_id').focus();
      return;
    }

    if(user_name=="N"){
      swal("이름을 입력 해주세요.");
      $('#user_name').focus();
      return;
    }

    if(phone==""){
      swal("전화번호를 입력 해주세요.");
      $('#phone').focus();
      return;
    }

    if(email==""){
      swal("이메일을 입력 해주세요.");
      $('#email').focus();
      return;
    }

    if(birth_year==""){
      swal("생일을 입력 해주세요.");
      $('#birth_year').focus();
      return;
    }

    if(birth_month==""){
      swal("생일을 입력 해주세요.");
      $('#birth_month').focus();
      return;
    }

    if(birth_day==""){
      swal("생일을 입력 해주세요.");
      $('#birth_day').focus();
      return;
    }

    if(location==""){
      swal("지역을 선택 해주세요.");
      return;
    }

		var age = ageCal(birth_year,birth_month,birth_day);
		if(age<14){
			var parent_name = $('#parent_name').val();
			var parent_birthday = $('#parent_birthday').val();
			var parent_phone = $('#parent_phone').val();

			if(parent_name == ""){
				swal("법정대리인의 이름을 작성해주세요");
				$('#location').focus();
				return;
			}

			if(parent_birthday == ""){
				swal("법정대리인의 생년월일을 작성해주세요");
				$('#location').focus();
				return;
			}

			if(parent_phone == ""){
				swal("법정대리인의 연락처를 작성해주세요");
				$('#location').focus();
				return;
			}
		}

		var csrf_name = $('#csrf').attr("name");
		var csrf_val = $('#csrf').val();

		var data = {
			"phone" : phone
		};

		data[csrf_name] = csrf_val;

		$.ajax({
			type: "POST",
			url : "/member/duplicatePhone",
			data: data,
			dataType:"json",
			success : function(data, status, xhr) {
				if(data.result=="success"){
					$('#join_form').submit();
				}else{
					swal("동일 핸드폰 번호로 가입된 아이디가 있습니다.");
					$('#phone').focus();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR.responseText);
			}
		});
  }

	function ageCal($year,$month,$day)
	{
		var birthDate = new Date($year+'-'+$month+'-'+$day);

		var currentDate = new Date();

		var yearDiff = currentDate.getFullYear() - birthDate.getFullYear();

		// 생일이 지났는지 체크.
		var monthDiff = currentDate.getMonth() - birthDate.getMonth();
		var dayDiff = currentDate.getDate() - birthDate.getDate();
		if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		  yearDiff--;
		}

		return yearDiff;
	}
  </script>
