<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">고객센터</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 1:1 문의 -->
		<div class="inquiry_wrap">
			<ul class="tab_type">
        <li><a href="/board/faq">자주 묻는 질문</a></li>
				<li><a href="/board/qnaWrite" class="on">1:1 문의</a></li>
			</ul>
			<div class="inquiry_history">
				<div class="sub_tab">
					<ul>
						<li><a href="/board/qnaWrite">문의하기</a></li>
						<li><a href="/board/qnaList" class="on">나의 문의 내역</a></li>
					</ul>
				</div>
				<div class="list_inquiry">
					<ul>
						<?php for($i=0; $i<count($qnaList); $i++){ ?>
						<li>
							<div class="title">
								<a href="#" onclick="handleNoticeToggle(this);return false;">
									<strong class="tit"><?php echo $qnaList[$i]['qna_title'] ?> <?php if(!empty($qnaList[$i]['qna_comment'])){ ?><span class="answered">답변완료</span><?php } ?></strong>
									<span class="date"><?php echo date("Y-m-d",strtotime($qnaList[$i]['qna_reg_datetime'])); ?></span>
								</a>
							</div>
							<div class="cont">
								<?php echo $qnaList[$i]['qna_contents']; ?>
							</div>
							<?php if(!empty($qnaList[$i]['qna_comment'])){ ?>
							<div class="answer">
								<strong class="tit_answer">답변</strong>
								<?php echo $qnaList[$i]['qna_comment']; ?>
								<span class="date"><?php echo date("Y-m-d",strtotime($qnaList[$i]['qna_comment_reg_datetime'])); ?></span>
							</div>
							<?php } ?>
						</li>
						<?php } ?>
					</ul>
				</div>
			</div>
		</div>
		<!-- //1:1 문의 -->
	</div>
	<!-- //container -->
