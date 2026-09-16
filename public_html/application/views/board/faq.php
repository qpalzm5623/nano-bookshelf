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
		<!-- 자주 묻는 질문 -->
		<div class="faq_wrap">
			<ul class="tab_type">
				<li><a href="/board/faq" class="on">자주 묻는 질문</a></li>
				<li><a href="/board/qnaWrite">1:1 문의</a></li>
			</ul>
			<div class="faq_list">
				<ul>
					<?php for($i=0; $i<count($faqList); $i++){ ?>
					<li>
						<div class="title">
							<a href="#" onclick="handleNoticeToggle(this);return false;">
								<strong class="tit"><?php echo $faqList[$i]['faq_title']; ?></strong>
							</a>
						</div>
						<div class="cont">
							<?php echo $faqList[$i]['faq_contents']; ?>
						</div>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		<!-- //자주 묻는 질문 -->
