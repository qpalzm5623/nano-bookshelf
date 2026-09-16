<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">웹툰</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 웹툰 -->
		<div class="content_wrap">
			<div class="webtoon_detail">
				<?php echo $webtoonData['edu_contents'] ?>
			</div>
		</div>
		<!-- //웹툰 -->
	</div>
	<!-- //container -->
