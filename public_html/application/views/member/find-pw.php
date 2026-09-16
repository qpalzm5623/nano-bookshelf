<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">아이디/비밀번호찾기 </h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 비밀번호찾기 -->
		<div class="find_area">
			<ul class="tab_type">
				<li><a href="/member/findId">아이디 찾기</a></li>
				<li><a href="/member/findPw" class="on">비밀번호 찾기</a></li>
			</ul>
			<form id="findPwForm" action="/member/findPwProc" method="post">
				<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
			<div class="input_member_info">
				<p class="msg_find_pw">가입할 때 등록했던 이메일을 입력해 주세요. <br>비밀번호 재설정 메일을 보내드립니다.</p>
				<ul>
					<li><input type="text" class="input_find" id="user_id" name="user_id" placeholder="아이디 입력"></li>
					<li><input type="text" class="input_find" id="user_name" name="user_name" placeholder="이름 입력"></li>
					<li><input type="text" class="input_find" id="email" name="email" placeholder="이메일 입력"></li>
				</ul>
				<a href="javascript:findPw()" class="btn_find">비 밀 번 호 재 설 정</a>
			</div>
			</form>
		</div>
		<!-- //비밀번호찾기 -->
	</div>
	<!-- //container -->
	<script>
	function findPw()
	{
		var user_id = $('#user_id').val();
		var user_name = $('#user_name').val();
		var email = $('#email').val();

		if(user_id==""){
			swal("아이디를 작성해주세요");
			return
		}

		if(user_name==""){
			swal("이름을 작성해주세요");
			return
		}

		if(email==""){
			swal("이메일을 작성해주세요");
			return
		}

		$('#findPwForm').submit();
	}
	</script>
