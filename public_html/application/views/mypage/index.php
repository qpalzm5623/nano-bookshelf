	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">관리</h2>
			</div>
		</header>

		<div id="container">
			<!-- contents -->
			<div class="contents">

				<!-- 관리 -->
				<div class="manage_wrap">
						
					<div class="title_box inner">
						<h3 class="title">내정보</h3>
						<a href="#" class="btn_info"><i class="icon_info gray"></i>정보</a>
					</div>

					<div class="inner">
						<div class="info_box">
							<div class="title_box">
								<div class="title_image"><img src="/images/common/symbol.png" alt=""></div>
								<h4 class="title"><?php echo $userData['user_name'];?></h4>
								<div class="user_info"><?php echo $userData['grade'];?> | <?php echo $userData['gender']=="M"?"남":"여";?></div>
							</div>
	
							<ul class="info_list">
								<li class="info_item">
									<span class="info_title">소속</span>
									<div class="info_content ellipsis_multi"><?php echo $userData['group_name'];?></div>
								</li>
								<li class="info_item">
									<span class="info_title">반</span>
									<div class="info_content"><?php echo $userData['class_name'];?></div>
								</li>
								<li class="info_item">
									<span class="info_title">담당 선생님</span>
									<div class="info_content"><?php echo $userData['teacher_name'];?></div>
								</li>
							</ul>
						</div>
					</div>
							
					<ul class="menu_link_list">
						<li class="menu_link">
							<a href="/mypage/point_list" class="inner">
								<div class="menu_title">내 포인트 <span class="font_blue_green"><?php echo $userData['point'];?>P</span></div>
							</a>
						</li>
						<li class="menu_link">
							<a href="/mypage/password" class="inner">
								<strong class="menu_title">비밀번호 변경</strong>
							</a>
						</li>
					</ul>

					<ul class="menu_link_list">
						<li class="menu_link">
							<a href="/mypage/notice_list" class="inner">
								<strong class="menu_title">공지사항</strong>
							</a>
						</li>
						<li class="menu_link">
							<a href="/mypage/faq_list" class="inner">
								<strong class="menu_title">자주 묻는 질문</strong>
							</a>
						</li>
						<li class="menu_link">
							<a href="/mypage/qna" class="inner">
								<strong class="menu_title">고객센터</strong>
							</a>
						</li>
						<li class="menu_link">
							<a href="/mypage/terms" class="inner">
								<strong class="menu_title">이용약관</strong>
							</a>
						</li>
					</ul>

					<div class="btn_area">
						<a href="javascript:logout();" class="btn_logout">로그아웃</a>
					</div>

				</div>
				<!-- // 관리 -->

			</div>
		</div>
		
 			<!-- 알림 팝업 -->
			<div class="layer_popup_wrap confirm" id="infoLayer">
				<div class="layer_popup">
					<div class="popup_contents">
						<div class="popup_text">내 정보 수정이 필요할 경우,
담당 선생님께 문의해 주세요.
</div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close">확 인</a>
					</div>
				</div>
			</div>
			<!-- // 알림 팝업 -->		
		<!-- //navigation -->
	</div>
	<script>
	    $(function() {

			$('.btn_info').on("click", function(){
			    $('#infoLayer').show();
			});	    

		});
	</script>
	