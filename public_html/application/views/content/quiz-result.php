<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">퀴즈</h2>
		<a href="/content/quiz" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 퀴즈 -->
		<div class="quiz_wrap">
			<div class="quiz_summary">
				<div class="tit"><?php echo $quiz_title; ?></div>
				<ul>
					<li>
						<span class="dt">맞은 문제</span>
						<span class="dd"><?php echo $answer_num; ?></span>
					</li>
					<li>
						<span class="dt">틀린 문제</span>
						<span class="dd"><?php echo $wrong_num; ?></span>
					</li>
					<li>
						<span class="dt">내 점수</span>
						<span class="dd"><?php echo $answer_score; ?></span>
					</li>
				</ul>
			</div>
			<div class="list_result">
				<ul>
					<?php for($i=0; $i<count($quiz_contents); $i++){ ?>
					<li>
						<?php if($answer_contents[$i]['score']==0){ ?>
						<span class="icon_result wrong">틀림</span>
						<?php }else{ ?>
							<span class="icon_result right">맞음</span>
						<?php } ?>
						<span class="subject"><?php echo ($i+1) ?>. <?php echo $quiz_contents[$i]['q']; ?> </span>
						<div class="my_answer">
							<span class="dt">나의 답</span>
							<span class="dd"><?php echo $answer_contents[$i]['answer']; ?></span>
						</div>
						<div class="explain">
							<span class="dt">해설</span>
							<span class="dd"><?php echo $quiz_contents[$i]['d']; ?></span>
						</div>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		<!-- //퀴즈 -->
	</div>
	<!-- //container -->
