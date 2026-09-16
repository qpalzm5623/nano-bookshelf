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
		<div class="content_wrap">
			<div class="news_list">
				<ul>
					<?php for($i=0; $i<count($movieList); $i++){ ?>
					<li>
						<a href="/content/movieView/<?php echo $movieList[$i]['edu_seq']; ?>">
							<img src="/upload/board/<?php echo $movieList[$i]['edu_thumb']; ?>" class="thumb" alt="">
							<strong><?php echo $movieList[$i]['edu_title'] ?></strong>
							<div class="desc"><?php echo strip_tags($movieList[$i]['edu_contents']) ?></div>
						</a>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		<!-- 영상
		<div class="content_wrap">
			<div class="media_list">
				<ul>
					<?php for($i=0; $i<count($movieList); $i++){ ?>
					<li>
						<a href="/content/movieView/<?php echo $movieList[$i]['edu_seq'] ?>">
							<div class="thumb"><img src="/upload/board/<?php echo $movieList[$i]['edu_thumb'] ?>" alt=""></div>
							<div class="desc"><?php echo $movieList[$i]['edu_title'] ?></div>
						</a>
					</li>
					<?php } ?>
				</ul>
			</div>
		</div>
		//영상 -->
	</div>
	<!-- //container -->
