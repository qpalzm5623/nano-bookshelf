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
		<div class="content_wrap">
			<div class="news_list">
				<ul>
					<?php for($i=0; $i<count($webtoonList); $i++){ ?>
					<li>
						<a href="/content/webtoonView/<?php echo $webtoonList[$i]['edu_seq']; ?>">
							<img src="/upload/board/<?php echo $webtoonList[$i]['edu_thumb']; ?>" class="thumb" alt="">
							<strong><?php echo $webtoonList[$i]['edu_title'] ?></strong>
							<div class="desc"><?php echo strip_tags($webtoonList[$i]['edu_contents']) ?></div>
						</a>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		<!-- 웹툰
		<div class="content_wrap">
			<div class="webtoon_list">
				<ul>
					<?php for($i=0; $i<count($webtoonList); $i++){ ?>
					<li>
						<a href="/content/webtoonView/<?php echo $webtoonList[$i]['edu_seq'] ?>">
							<img src="/upload/board/<?php echo $webtoonList[$i]['edu_thumb'] ?>" class="thumb" alt="">
							<div class="desc"><?php echo $webtoonList[$i]['edu_title'] ?></div>
						</a>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		 //웹툰 -->
	</div>
	<!-- //container -->
