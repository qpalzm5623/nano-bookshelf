<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">{page_title}</h2>
		<a href="/member/join/terms" class="btn_prev"><span class="blind">뒤로</span></a>
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
        <form id="join_form" action="/member/join/step2" method="post">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
					<input type="hidden" name="user_type" value="default"/>
					<input type="hidden" name="age" value="<?php echo $age; ?>"/>
          <div id="children_wrap" style="<?php echo !empty($_SESSION['parent_name'])?"":"display:none;" ?>">
  				<strong class="tit_join">법정대리인 정보</strong>
  				<ul class="list_join_info">
  					<li>
  						<label for="parent_name" class="label">이름</label>
  						<div class="input_area">
  							<input type="text" id="parent_name" name="parent_name" class="input_join" value="<?php echo !empty($this->session->userdata("parent_name"))?$this->session->userdata("parent_name"):""; ?>">
  						</div>
  					</li>
  					<li>
  						<label for="parent_birthday" class="label">생년월일</label>
  						<div class="input_area">
  							<input type="text" id="parent_birthday" name="parent_birthday" class="input_join" value="<?php echo !empty($this->session->userdata("parent_birthday"))?$this->session->userdata("parent_birthday"):""; ?>">
  						</div>
  					</li>
  					<li>
  						<label for="parent_phone" class="label">연락처</label>
  						<div class="input_area">
  							<input type="text" id="parent_phone" name="parent_phone" class="input_join" value="<?php echo !empty($this->session->userdata("parent_phone"))?$this->session->userdata("parent_phone"):""; ?>">
  						</div>
  					</li>
  				</ul>
				</div>

  				<strong class="tit_join">회원 정보</strong>
  				<ul class="list_join_info">
  					<li>
  						<label for="user_id" id="id_chk" class="label">아이디</label><!-- is_confirmed: 체크아이콘 -->
  						<div class="input_area">
  							<input type="text" id="user_id" name="user_id" class="input_join">
								<input type="hidden" id="user_id_chk" value="N"/>
  							<a href="javascript:duplicateId()" class="btn_verification on">중복확인</a><!-- on: 활성화 -->
  						</div>
  					</li>
  					<li>
  						<label for="user_password" class="label">비밀번호</label>
  						<div class="input_area">
  							<input type="password" id="user_password" name="user_password" class="input_join">
  							<button type="button" class="btn_type_toggle" onClick="pwTypeToggle(this, '#user_password');">비밀번호보기</button>
  						</div>
  					</li>
  					<li>
  						<label for="user_password2" class="label">비밀번호 확인</label>
  						<div class="input_area">
  							<input type="password" id="user_password2" class="input_join">
  							<button type="button" class="btn_type_toggle" onClick="pwTypeToggle(this, '#user_password2');">비밀번호보기</button>
  						</div>
  					</li>
  				</ul>
  				<ul class="list_join_info">
  					<li>
  						<label for="user_name" class="label">이름</label>
  						<div class="input_area">
  							<input type="text" id="user_name" name="user_name" class="input_join">
  						</div>
  					</li>
  					<li>
  						<label for="phone" id="phone_chk" class="label">휴대폰번호</label>
  						<div class="input_area">
  							<input type="tel" id="phone" name="phone" class="input_join">
  							<a href="javascript:verifiNum()" id="verifi_btn" class="btn_verification">인증번호 발송</a>
  						</div>
  					</li>
  					<li id="veriDiv" style="display:none;">
  						<label for="phone_certification" class="label">인증번호</label>
  						<div class="input_area" style="padding-right:205px;">
  							<input type="tel" id="phone_certification" class="input_join">
								<small id="count_num" style="position:absolute;right:57px;top:7px;color:red;display:none;"></small>
  							<a href="javascript:getVerifiNum()" class="btn_verification">인증확인</a>
								<input type="hidden" id="phone_cert" name="phone_cert" value="N"/>
  						</div>
  					</li>
  					<li class="info_email" style="width:30%;">
  						<label for="email" class="label">이메일</label>
  						<input type="text" id="email_first" class="input_join">
  						<div class="mail_domain" style="width:260px">
  							<span class="at">@</span>
								<input type="text" class="input_join" style="float:left;margin-top:6px;width:90px;border-bottom:1px solid #c0c0c0" readonly id="email_input" value="naver.com"/>
  							<select class="uiselect" id="email_sel" onchange="changeEmail()">
  								<option value="naver.com">naver.com</option>
									<option value="gmail.com">gmail.com</option>
									<option value="daum.net">daum.net</option>
									<option value="nate.com">nate.com</option>
									<option value="self">직접입력</option>
  							</select>
								<input type="hidden" id="email" name="email"/>
  						</div>
  					</li>
  				</ul>
  				<ul class="add_join_info">
						<li>
  						<label for="birth_year" class="label">생년월일</label>
  						<select class="uiselect" id="birth_year" style="width:75px" name="birth_year" onchange="childrenChk()">
  							<option value="">년</option>
                <?php for($i=date("Y"); $i>=1900; $i--){ ?>
                  <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  						<select class="uiselect" style="width:60px" id="birth_month" name="birth_month" onchange="childrenChk()">
  							<option value="">월</option>
                <?php for($i=1; $i<=12; $i++){ ?>
                  <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  						<select class="uiselect" style="width:60px" id="birth_day" name="birth_day" onchange="childrenChk()">
  							<option value="">일</option>
                <?php for($i=1; $i<=31; $i++){ ?>
                  <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                <?php } ?>
  						</select>
  					</li>
  					<li>
  						<label for="join-male" class="label">성별</label>
  						<div class="gender_select">
  							<input type="radio" id="join-male" class="radio_gender" name="gender" value="M" checked>
  							<label for="join-male" class="label_gender">남자</label>
  						</div>
  						<div class="gender_select">
  							<input type="radio" id="join-female" class="radio_gender" name="gender" value="W">
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
  						<input type="text" id="zipcode" name="zipcode" class="input_join" style="width:120px" onclick="getAddress()">
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
		var timer = null;
		var isRunning = false;

		var idReg = /^[a-z]+[a-z0-9_-]{4,20}$/g;
		var phoneReg = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{3,4})$/;

		var passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[$@$!%*?&])[\da-zA-Z!@#]{8,16}$/;

		function verifiNum()
		{
			if(!phoneReg.test($('#phone').val())){
				swal("전화번호를 형식에 맞춰서 작성해주세요.");
				return;
			}

			$('#verifi_btn').hide();
			$('#veriDiv').show();
			$('#count_num').show();

			setVerifiNum();


		}

		function startTimer($limit_sec)
		{
			var min,sec;
			min = parseInt($limit_sec / 60, 10);
			sec = parseInt($limit_sec % 60, 10);

			min = min < 10 ? "0" + min : min;
			sec = sec < 10 ? "0" + sec : sec;

			$('#count_num').text(min + " : " + sec);

			timer = setInterval(function(){
				if(--$limit_sec < 0){
					clearInterval(timer);
					isRunning = false;
					swal("시간초과");
					$('#verifi_btn').show();
					$('#veriDiv').hide();
					$('#count_num').hide();
				}
				min = parseInt($limit_sec / 60, 10);
				sec = parseInt($limit_sec % 60, 10);

				min = min < 10 ? "0" + min : min;
				sec = sec < 10 ? "0" + sec : sec;

				$('#count_num').text(min + " : " + sec);


			},1000);
			isRunning = true;
		}

		function setVerifiNum()
		{
			var csrf_name = $('#csrf').attr("name");
	    var csrf_val = $('#csrf').val();
			var phone = $('#phone').val();
			var data = {
				"phone"	:	phone
			};

	    data[csrf_name] = csrf_val;

	    $.ajax({
	      type: "POST",
	      url : "/member/setVerifiNum",
	      data: data,
	      dataType:"json",
	      success : function(data, status, xhr) {
					swal("인증번호가 발송되었습니다.");
					$('#phone_certification').focus();
					var limit_sec = 120;
					startTimer(limit_sec);
	      },
	      error: function(jqXHR, textStatus, errorThrown) {
	        console.log(jqXHR.responseText);
	      }
	    });
		}

		function getVerifiNum()
		{
			var csrf_name = $('#csrf').attr("name");
	    var csrf_val = $('#csrf').val();
			var phone_certification = $('#phone_certification').val();
			if(phone_certification == ""){
				swal("인증번호를 작성해주세요.");
				return;
			}
			var data = {
				"phone_certification" : phone_certification
			};

	    data[csrf_name] = csrf_val;

	    $.ajax({
	      type: "POST",
	      url : "/member/getVerifiNum",
	      data: data,
	      dataType:"json",
	      success : function(data, status, xhr) {
					if(data.data.chk_yn=="N"){
						swal("인증번호가 일치하지않습니다.");
						return
					}else{
						swal("인증되었습니다.");
						$('#verifi_btn').hide();
						$('#count_num').hide();

						clearInterval(timer);

						$('#phone_cert').val("Y");
	          $('#phone_chk').addClass("is_confirmed");
						$('#verifi_btn').hide();
						$('#phone').attr("readonly",true);
						$('#veriDiv').hide();
					}
	        console.log(data);
	      },
	      error: function(jqXHR, textStatus, errorThrown) {
	        console.log(jqXHR.responseText);
	      }
	    });
		}


	  function duplicateId()
	  {
	    var csrf_name = $('#csrf').attr("name");
	    var csrf_val = $('#csrf').val();
	    var user_id = $('#user_id').val();

			if(user_id==""){
				swal("아이디를 작성해주세요.");
				$('#user_id_chk').val("N");
				$('#user_id').val("");
				$('#id_chk').removeClass("is_confirmed");
				return;
			}

			if(!idReg.test(user_id)){
				swal("아이디는 영문자로 시작하고 5~20자, 특수문자는 -와_만 사용가능합니다.");
				$('#user_id_chk').val("N");
				$('#user_id').val("");
				$('#id_chk').removeClass("is_confirmed");
				return;
			}

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

		function changeEmail()
		{
			var sel = $('#email_sel').val();
			$('#email_input').attr("readonly",true);
			$('#email_input').val(sel);
			if(sel=="self"){
				$('#email_input').val("");
				$('#email_input').focus();
				$('#email_input').attr("readonly",false);
			}
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

		//동일문자 3개이상 찾기
	function stck(str, limit) {

    var o, d, p, n = 0, l = limit == null ? 3 : limit;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (i > 0 && (p = o - c) > -2 && p < 2 && (n = p == d ? n + 1 : 0) > l - 3)
            return false;
            d = p, o = c;
    }
    return true;
	}

	//키보드자판으로 찾기
	function keyboardChk(value) {
		// 대문자로 바뀔 수 있는 문자 따로 구분
    const word = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

    // 특수한 조건 추가
    const specialWord = ["!@#$%^&*()"];

    // 숫자와 추가 조건을 제외한 모든 문자 대문자로
    const wordAll = ["1234567890", ...specialWord, ...word, ...word.map(v => v.toUpperCase())];

    // 해당 문자 배열을 역순으로 조건 생성
    const reverseWord = [...wordAll.map(v => [...v].reverse().join(""))];

    // 생성한 조건을 합치기
    const keyboard = [...wordAll, ...reverseWord];

    for (let i = 0; i < value.length-2; i++) {
        const sliceValue = value.substring(i, i + 3);

        if (keyboard.some(code => code.includes(sliceValue))) {
            return false;
        }
    }

    return true;
}

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



  function goNext()
  {
		var user_id = $('#user_id').val();
		var user_id_chk = $('#user_id_chk').val();
		var user_password = $('#user_password').val();
		var user_password2 = $('#user_password2').val();
		var user_name = $('#user_name').val();
		var phone = $('#phone').val();
		var phone_cert = $('#phone_cert').val();
		var email = $('#email_first').val();
		var email_sel = $('#email_sel').val();
		var email2 = $('#email_input').val();
		var birth_year = $('#birth_year').val();
		var birth_month = $('#birth_month').val();
		var birth_day = $('#birth_day').val();
		var gender = $('#gender').val();
		var location = $('#location').val();



		if(user_id == ""){
			swal("아이디를 작성해주세요");
			$('#user_id').focus();
			return;
		}

		if(user_id_chk == "N"){
			swal("아이디 중복확인을 해주세요");
			$('#user_id').focus();
			return;
		}

		if(user_password == ""){
			swal("비밀번호를 작성해주세요");
			$('#user_password').focus();
			return;
		}

		if(user_password2 == ""){
			swal("비밀번호 확인을 작성해주세요");
			$('#user_password2').focus();
			return;
		}

		if(!passwordReg.test(user_password)){
			swal("비밀번호는 최소8~16자이며 영문소문자,숫자,특수문자를 포함해야합니다.");
			return;
		}else{
			if(stck(user_password)==false){
				swal("비밀번호는 동일문자 연속으로 사용을 금지합니다.");
				return;
			}
			if(keyboardChk(user_password)==false){
				swal("비밀번호는 asdf와 같은 자판배열의 연속문자를 금지합니다.");
				return;
			}
		}

		if(user_password != user_password2){
			swal("비밀번호를 확인해주세요");
			$('#user_password2').focus();
			return;
		}

		if(user_name == ""){
			swal("이름을 작성해주세요");
			$('#user_name').focus();
			return;
		}

		if(phone == ""){
			swal("휴대폰번호를 작성해주세요");
			$('#phone').focus();
			return;
		}

		if(phone_cert == "N"){
			swal("휴대폰 인증을 해주세요");
			$('#phone').focus();
			return;
		}

		if(email == ""){
			swal("이메일을 작성해주세요");
			$('#email_first').focus();
			return;
		}

		if(email_sel=="self" && email2==""){
			swal("이메일을 작성해주세요");
			$('#email_input').focus();
			return;
		}

		if(birth_year==""){
			swal("생년월일을 선택해주세요");
			$('#birth_year').focus();
			return;
		}

		if(birth_month==""){
			swal("생년월일을 선택해주세요");
			$('#birth_month').focus();
			return;
		}

		if(birth_day==""){
			swal("생년월일을 선택해주세요");
			$('#birth_day').focus();
			return;
		}

		if(location == ""){
			swal("지역을 선택해주세요");
			$('#location').focus();
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

		var email_sum = "";
		if(email_sel=="self"){
			email_sum = email + '@' + email_input;
		}else{
			email_sum = email + '@' + email_sel;
		}
		$('#email').val(email_sum);

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
					$('#verifi_btn').show();
					$('#count_num').show();

					$('#phone_cert').val("N");
					$('#phone_chk').removeClass("is_confirmed");
					$('#verifi_btn').show();
					$('#phone').attr("readonly",false);
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
