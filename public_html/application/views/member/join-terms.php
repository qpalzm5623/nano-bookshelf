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
		<!-- 약관동의 -->

		<div class="terms_area">
      <form id="terms_form" action="/member/join/step1" method="post">
        <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
        <input type="hidden" id="age" name="age" value=""/>
  			<ul class="terms_list">
  				<li class="terms_all_check">
  					<span class="uicheckbox_wrap uicheckbox_size17">
  						<input type="checkbox" id="termsCheckAll" class="uicheckbox_check" onchange="allCheck()">
  						<label for="termsCheckAll" class="uicheckbox_label">전체 동의하기</label>
  					</span>
  				</li>
  				<li>
  					<span class="uicheckbox_wrap uicheckbox_size17">
  						<input type="checkbox" id="termsCheck1" class="uicheckbox_check">
  						<label for="termsCheck1" class="uicheckbox_label">(필수) 이용약관</label>
  					</span>
  					<a href="/home/terms" class="btn_more">보기</a>
  				</li>
  				<li>
  					<span class="uicheckbox_wrap uicheckbox_size17">
  						<input type="checkbox" id="termsCheck2" class="uicheckbox_check">
  						<label for="termsCheck2" class="uicheckbox_label">(필수) 개인정보 수집 및 이용 동의</label>
  					</span>
  					<a href="/home/privacy" class="btn_more">보기</a>
  				</li>
  				<li>
  					<span class="uicheckbox_wrap uicheckbox_size17">
  						<input type="checkbox" id="termsCheck3" class="uicheckbox_check">
  						<label for="termsCheck3" class="uicheckbox_label">(필수) 제3자 제공에 대한 동의</label>
  					</span>
  					<a href="/home/privacy2" class="btn_more">보기</a>
  				</li>
  			</ul>
  			<div class="member_type_choice">
  				<p class="member_type_desc">회원 유형에 따라 가입 절차가 다르니<br>본인에 해당하는 회원 유형을 선택해 주세요.</p>
  				<ul>
  					<li class="on"><a href="javascript:goNext('normal');">일반 회원<span class="age">(만 14세 이상)</span></a></li>
  					<li><a href="javascript:fnPopup();">어린이 회원<span class="age">(만 14세 미만)</span></a></li>
  				</ul>
  			</div>
      </form>
		</div>
		<!-- //약관동의 -->
	</div>
	<!-- //container -->
	<!-- 본인인증 서비스 팝업을 호출하기 위해서는 다음과 같은 form이 필요합니다. -->
	<form name="form_chk" method="post">
		<input type="hidden" name="m" value="checkplusService">				<!-- 필수 데이타로, 누락하시면 안됩니다. -->
		<input type="hidden" name="EncodeData" value="<?= $enc_data ?>">		<!-- 위에서 업체정보를 암호화 한 데이타입니다. -->
	</form>
  <script>
	window.name ="Parent_window";

	function fnPopup(){
		var termsCheck1 = $('#termsCheck1').is(":checked");
		var termsCheck2 = $('#termsCheck2').is(":checked");
		var termsCheck3 = $('#termsCheck3').is(":checked");

		if(!termsCheck1){
			swal("이용약관에 동의해주세요");
			return;
		}
		if(!termsCheck2){
			swal("개인정보 수집 및 이용 동의에 동의해주세요");
			return;
		}
		if(!termsCheck3){
			swal("제3자 제공에 대한 동의에 동의해주세요");
			return;
		}
		
		window.open('', 'popupChk', 'width=500, height=550, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');
		document.form_chk.action = "https://nice.checkplus.co.kr/CheckPlusSafeModel/checkplus.cb";
		document.form_chk.target = "popupChk";
		document.form_chk.submit();
	}
	function allCheck()
	{

		var chk = $('#termsCheckAll').is(":checked");

		$('#termsCheck1').prop("checked",chk);
		$('#termsCheck2').prop("checked",chk);
		$('#termsCheck3').prop("checked",chk);
	}

  function goNext(str)
  {
		var termsCheck1 = $('#termsCheck1').is(":checked");
		var termsCheck2 = $('#termsCheck2').is(":checked");
		var termsCheck3 = $('#termsCheck3').is(":checked");

		if(!termsCheck1){
			swal("이용약관에 동의해주세요");
			return;
		}
		if(!termsCheck2){
			swal("개인정보 수집 및 이용 동의에 동의해주세요");
			return;
		}
		if(!termsCheck3){
			swal("제3자 제공에 대한 동의에 동의해주세요");
			return;
		}

    $('#terms_form').submit();
  }
  </script>
