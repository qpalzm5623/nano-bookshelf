<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">설정</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 설정 -->
		<div class="setting_wrap">
			<div class="setting_group">
				<span class="tit">계정 설정</span>
				<ul class="list_setting">
					<li>
						<span class="dt">아이디</span>
						<div class="dd"><?php echo $userData['user_id'] ?></div>
					</li>
					<li>
						<span class="dt">이름</span>
						<div class="dd"><?php echo $userData['user_name'] ?></div>
					</li>
					<li>
						<span class="dt">학교</span>
						<div class="dd">
							<?php
							if(!empty($userData['school_seq'])){
								echo $userData['school_name']." ".$userData['school_year']."학년 ".$userData['school_class'];
							}
							?>
							<a href="/member/changeSchool"><img src="/images/util/option.png" style="width:20px; margin-left:5px;" /></a>
						</div>

					</li>
					<li>
						<a href="/member/changePw" class="link_blue">비밀번호 변경하기</a>
					</li>
					<li>
						<a href="/member/leave" class="link_red">회원탈퇴하기</a>
					</li>
				</ul>
			</div>

			<div class="setting_group">
				<span class="tit">푸시 알림 설정</span>
				<ul class="list_setting push_setting">
					<li>
						새로운 퀴즈가 등록되었을 때
						<span class="btn_setting_check">
							<input type="checkbox" id="push_quiz" class="input_setting" value="Y" onclick="changePush('quiz')" <?php echo $userData['push_quiz']=="Y"?"checked":"" ?>>
							<label for="push_quiz" class="label_setting">설정</label>
						</span>
					</li>
					<li>
						누가 내 게시글에 좋아요 했을 때
						<span class="btn_setting_check">
							<input type="checkbox" id="push_like" class="input_setting" value="Y" onclick="changePush('like')" <?php echo $userData['push_like']=="Y"?"checked":"" ?>>
							<label for="push_like" class="label_setting">설정</label>
						</span>
					</li>
					<li>
						누가 내 게시글에 댓글을 달았을 때
						<span class="btn_setting_check">
							<input type="checkbox" id="push_comment" class="input_setting" value="Y" onclick="changePush('comment')" <?php echo $userData['push_comment']=="Y"?"checked":"" ?>>
							<label for="push_comment" class="label_setting">설정</label>
						</span>
					</li>
					<li>
						나의 학급에서 새로운 게시물이 등록되었을 때
						<span class="btn_setting_check">
							<input type="checkbox" id="push_feed" class="input_setting" value="Y" onclick="changePush('feed')" <?php echo $userData['push_feed']=="Y"?"checked":"" ?>>
							<label for="push_feed" class="label_setting">설정</label>
						</span>
					</li>
					<li>
						탄소 절감량 100kg 달성할 때마다
						<span class="btn_setting_check">
							<input type="checkbox" id="push_carbon" class="input_setting" value="Y" onclick="changePush('carbon')" <?php echo $userData['push_carbon']=="Y"?"checked":"" ?>>
							<label for="push_carbon" class="label_setting">설정</label>
						</span>
					</li>
				</ul>
			</div>
		</div>
		<!-- //설정 -->
	</div>
	<!-- //container -->

	<script>
	function changePush($str)
	{
		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

		var val = $('#push_'+$str).is(":checked");

		if(val){
			val = "Y";
		}else{
			val = "N";
		}

		var data = {
			"type"	:	$str,
			"val"	:	val
		};

    data[csrf_name] = csrf_val;

		$.ajax({
      type: "POST",
      url : "/member/changePush",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {

      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}
	</script>
