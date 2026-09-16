<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">뉴스기사</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 뉴스기사 -->
		<div class="content_wrap">
			<div class="news_detail">
				<!--<img src="/upload/board/<?php echo $newsData['edu_thumb'] ?>" class="img" alt="">-->
				<div class="cont">
					<strong><?php echo $newsData['edu_title'] ?></strong>
					<?php echo $newsData['edu_contents'] ?>
				</div>
			</div>
		</div>
		<!-- //뉴스기사 -->
	</div>
	<!-- //container -->
