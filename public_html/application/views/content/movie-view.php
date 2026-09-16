<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">영상</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 영상 -->
		<div class="content_wrap">
			<div class="media_detail">
				<div class="player">
					<?php echo $movieData['edu_contents'] ?>
				</div>
				<div class="cont">
					<strong><?php echo $movieData['edu_title']; ?></strong>
				</div>
			</div>
		</div>
		<!-- //영상 -->
	</div>
	<!-- //container -->
