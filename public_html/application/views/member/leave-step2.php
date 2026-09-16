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
		<form id="leaveForm">
			<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
		<div class="leave_wrap">
			<div class="leave_box">
				<strong class="tit">계정을 삭제하려는이유는 무엇인가요? </strong>
				<ul class="list_reason">
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason1" class="uicheckbox_check" name="withdrawal_type" value="A">
							<label for="leaveReason1" class="uicheckbox_label">기록 삭제 목적</label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason2" class="uicheckbox_check" name="withdrawal_type" value="B">
							<label for="leaveReason2" class="uicheckbox_label">이용이 불편하고 장애가 많아서 </label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason3" class="uicheckbox_check" name="withdrawal_type" value="C">
							<label for="leaveReason3" class="uicheckbox_label">사용 빈도가 낮아서 </label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason4" class="uicheckbox_check" name="withdrawal_type" value="D">
							<label for="leaveReason4" class="uicheckbox_label">콘텐츠 불만 </label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason5" class="uicheckbox_check" name="withdrawal_type" value="E">
							<label for="leaveReason5" class="uicheckbox_label">개인정보 유출 우려</label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason6" class="uicheckbox_check" name="withdrawal_type" value="F">
							<label for="leaveReason6" class="uicheckbox_label">새로운 계정 생성</label>
						</span>
					</li>
					<li>
						<span class="uicheckbox_wrap uicheckbox_size20">
							<input type="radio" id="leaveReason7" class="uicheckbox_check"name="withdrawal_type" value="G">
							<label for="leaveReason7" class="uicheckbox_label">기타</label>
						</span>
						<div class="reason_write">
							<textarea name="withdrawal_text"></textarea>
						</div>
					</li>
				</ul>
			</div>
			<div class="leave_next">
				<span class="uicheckbox_wrap uicheckbox_size20">
					<input type="checkbox" id="leaveCheckAll" class="uicheckbox_check">
					<label for="leaveCheckAll" class="uicheckbox_label">전부 삭제하고 탈퇴하겠습니다.</label>
				</span>
				<div class="btn_area">
					<a href="javascript:goLeave()" class="btn_leave_next2">탈퇴하기</a>
					<a href="/member/setting" class="btn_leave_next2">취소하기</a>
				</div>
			</div>
		</div>
		<!-- //회원탈퇴 -->
	</div>
	<!-- //container -->
<script>
function goLeave()
{
	var withdrawal_type = $('input[name="withdrawal_type"]').is(":checked");
	console.log(withdrawal_type);
	if(!withdrawal_type){
		swal("삭제이유를 선택해주세요");
		return;
	}
	var delete_chk = $('#leaveCheckAll').is(":checked");
	if(!delete_chk){
		swal("삭제동의를 해주세요");
		return;
	}

	var csrf_name = $('#csrf').attr("name");
	var csrf_val = $('#csrf').val();

	var data = $('#leaveForm').serialize();

	data[csrf_name] = csrf_val;

	$.ajax({
		type: "POST",
		url : "/member/leave_proc",
		data: data,
		dataType:"json",
		success : function(data, status, xhr) {
			swal("탈퇴완료 했습니다.", {
				icon: "success",
			}).then((value)=>{
				location.href="/";
			});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(jqXHR.responseText);
		}
	});
}
</script>
