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

			<div class="find_pw_result">
				<p class="msg_result">
					<?php echo $user_email ?><br>
					비밀번호 재설정 메일이 발송되었습니다.
				</p>
				<a href="/login" class="btn_confirm">확 인</a>
			</div>
		</div>
		<!-- //비밀번호찾기 -->
	</div>
	<!-- //container -->
