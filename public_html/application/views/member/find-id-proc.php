<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">아이디/비밀번호찾기 </h2>
		<a href="/member/findId" class="btn_prev"><span class="blind">뒤로</span></a>
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

			<div class="find_id_result">
				<?php if(is_array($userData)){ ?>
				<p class="msg_result">이메일 정보와 일치하는 아이디입니다.</p>
				<div class="box_result">
					<ul>
						<li>
							<span class="dt">아이디</span>
							<span class="dd"><?php echo $userData['user_id']; ?></span>
						</li>
						<li>
							<span class="dt">가입일</span>
							<span class="dd"><?php echo date("Y.m.d",strtotime($userData['reg_date'])); ?></span>
						</li>
					</ul>
				</div>
				<div class="btn_result">
					<a href="/login">로그인 페이지로</a>
					<a href="/member/findPw">비밀번호 찾기</a>
				</div>
			<?php }else{ ?>
				<p class="msg_result">정보와 일치하는 아이디가 없습니다.</p>
				<div class="btn_result">
					<a href="/login">로그인 페이지로</a>
					<a href="/member/findId">아이디 찾기</a>
				</div>
			<?php } ?>
			</div>
		</div>
		<!-- //아이디찾기 -->
	</div>
	<!-- //container -->
