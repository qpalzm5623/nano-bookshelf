<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">비밀번호 변경하기</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 비밀번호변경 -->
		<div class="join_area">
			<div class="join_form">
				<ul class="list_join_info">
					<li>
						<label for="change-pw1" class="label">현재 비밀번호</label>
						<div class="input_area">
							<input type="password" id="change-pw1" class="input_join">
							<button type="button" class="btn_type_toggle" onclick="pwTypeToggle(this, '#change-pw1');">비밀번호보기</button>
						</div>
					</li>
					<li>
						<label for="change-pw2" class="label">새 비밀번호</label>
						<div class="input_area">
							<input type="password" id="change-pw2" class="input_join">
							<button type="button" class="btn_type_toggle" onclick="pwTypeToggle(this, '#change-pw2');">비밀번호보기</button>
						</div>
					</li>
					<li>
						<label for="change-pw3" class="label">새 비밀번호 확인</label>
						<div class="input_area">
							<input type="password" id="change-pw3" class="input_join">
							<button type="button" class="btn_type_toggle" onclick="pwTypeToggle(this, '#change-pw3');">비밀번호보기</button>
						</div>
					</li>
				</ul>
				<a href="javascript:changePw()" class="btn_join_next">저 장</a>
			</div>
		</div>
		<!-- //비밀번호변경 -->
	</div>
	<!-- //container -->
	<script>
	var passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@$!%*?&])[\da-zA-Z!@#]{8,16}$/;

	function changePw(){
		var user_password = $('#change-pw1').val();
		var new_password = $('#change-pw2').val();
		var new_chk_password = $('#change-pw3').val();

		if(!passwordReg.test(new_password)){
			swal("비밀번호는 최소8~16자이며 영문소문자,대문자,숫자,특수문자를 포함해야합니다.");
			return;
		}else{
			if(stck(new_password)==false){
				swal("비밀번호는 동일문자 연속으로 사용을 금지합니다.");
				return;
			}
			if(keyboardChk(new_password)==false){
				swal("비밀번호는 asdf와 같은 자판배열의 연속문자를 금지합니다.");
				return;
			}
		}

		if(new_password == ""){
			swal("새 비밀번호를 작성해주세요.");
			$('#change-pw2').focus();
			return
		}

		if(new_password != new_chk_password){
			swal("비밀번호를 확인해주세요.");
			$('#change-pw3').focus();
			return
		}

		var data = {
			"user_password"	:	user_password,
			"new_password"	:	new_password
		};

		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    data[csrf_name] = csrf_val;

		$.ajax({
      type: "POST",
      url : "/member/changePw_proc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.result=="success"){
					swal("변경되었습니다.", {
						icon: "success",
					}).then((value)=>{
						location.href = "/member/setting";
					});

				}else{
					swal(data.msg);
				}
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

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
	</script>
