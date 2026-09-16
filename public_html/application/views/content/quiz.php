<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">퀴즈</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 퀴즈 -->
		<div class="quiz_wrap">
			<div class="quiz_start">
				<div class="logo">
					<img src="/images/content/quiz_logo.png" alt="">
					<?php if(is_array($quizHistoryData)){ ?>
					<span class="already">이미<br> 풀었어요!</span>
					<?php } ?>
				</div>
				<strong class="quiz_info"><?php echo $quizData['quiz_title'] ?></strong>

				<?php if(is_array($quizHistoryData)){ ?>
				<!-- 이미풀었을때 -->
				<div class="my_result">
					<span class="dt">내 점수</span>
					<span class="dd"><?php echo $quizHistoryData['score'] ?></span>
				</div>
				<a href="/content/quizResult" class="btn_quiz">결 과 보 기</a>
				<a href="/content/quizStep" class="btn_quiz">다 시 풀 기</a>
				<!-- //이미풀었을때 -->
			<?php }else{ ?>
				<a href="/content/quizStep" class="btn_quiz">S T A R T</a>
			<?php } ?>
			</div>
		</div>
		<!-- //퀴즈 -->
	</div>
	<!-- //container -->
