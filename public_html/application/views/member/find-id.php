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
		<!-- 아이디찾기 -->
		<div class="find_area">
			<ul class="tab_type">
				<li><a href="/member/findId" class="on">아이디 찾기</a></li>
				<li><a href="/member/findPw">비밀번호 찾기</a></li>
			</ul>
			<form id="findIdForm" action="/member/findIdProc" method="post">
				<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
			<div class="input_member_info">
				<ul>
					<li><input type="text" class="input_find" id="user_name" name="user_name" placeholder="이름 입력"></li>
					<li><input type="text" class="input_find" id="email" name="email" placeholder="이메일 입력"></li>
				</ul>
				<a href="javascript:findId()" class="btn_find">아 이 디 찾 기</a>
			</div>
			</form>
		</div>
		<!-- //아이디찾기 -->
	</div>
	<!-- //container -->
	<script>
	function findId()
	{
		var user_name = $('#user_name').val();
		var email = $('#email').val();

		if(user_name==""){
			swal("이름을 작성해주세요");
			return
		}

		if(email==""){
			swal("이메일을 작성해주세요");
			return
		}

		$('#findIdForm').submit();


	}
	</script>
