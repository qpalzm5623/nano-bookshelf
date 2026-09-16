<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">회원탈퇴</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 회원탈퇴 -->
		<div class="leave_wrap">
			<div class="leave_box">
				<strong class="tit">저탄소스쿨 탈퇴 전 확인하세요.</strong>
				<div class="leave_terms">
					지금 회원탈퇴를 하시면 아래의 정보들이 영구적으로 소멸 되며, 이벤트 및 유용한 정보를 받아보실 수 없습니다.<br>
					- 탄소 절감량 및 내역<br>
					- 미니게임 및 퀴즈 내역<br>
					- 회원정보<br>
					(이메일, 주소, 휴대전화번호, 보호자 인증 내역 등)<br>
				</div>
			</div>
			<div class="leave_next">
				<span class="uicheckbox_wrap uicheckbox_size20">
					<input type="checkbox" id="leaveTermsAgree" class="uicheckbox_check">
					<label for="leaveTermsAgree" class="uicheckbox_label">위 내용을 확인했습니다.</label>
				</span>
				<div class="btn_area">
					<a href="javascript:goNext()" class="btn_leave_next">계 속</a>
				</div>
			</div>
		</div>
		<!-- //회원탈퇴 -->
	</div>
	<!-- //container -->
<script>
function goNext()
{
	var agree = $('#leaveTermsAgree').is(":checked");
	if(!agree){
		swal("내용 동의해주세요");
		return
	}

	location.href="/member/leaveStep2";
}
</script>
