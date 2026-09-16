	<div id="wrap">
		
		<!-- contents -->
		<div class="contents">
			<!-- 북퀴즈 -->
			<div class="full_popup bookquiz bg">
				<!-- popup header -->
				<div class="popup_header">
					<div class="inner">
						<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
						<h2 class="header_title">북퀴즈</h2>
					</div>
				</div>
				<!-- // popup header -->

				<!-- popup contents -->
				<div class="popup_contents">
					<div class="bookquiz_main">
						<div class="image_box">
							<!--<img src="/resources/images/common/no_image.png" alt="">-->
							<img src="/upload/book/<?php echo $data['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'">
						</div>
						<h3 class="subject ellipsis_multi"><?php echo $data['book_name'];?></h3>
						<div class="btn_area"><a href="/book/quiz/<?php echo $data['book_no'];?>/<?php echo $data['quiz_seq'];?>" class="btn_basic bg_blue_green">퀴즈 풀기 시작</a></div>
						<ul class="notice_list">
							<li>※ 60점 이상 맞히면 통과예요.</li>
							<li>※ 60점이 안 되면 다시 풀어야 해요.</li>
							<li>※ 맞은 문항수만큼 포인트가 쌓여요.</li>
							<li>※ 북퀴즈를 시작하면 중간에 멈출 수 없어요.</li>
						</ul>
					</div>
				</div>
				<!-- // popup contents -->
			</div>
			<!-- // 북퀴즈 -->
		</div>
		<!-- // contents -->
	</div>