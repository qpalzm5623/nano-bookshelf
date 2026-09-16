
	<div id="wrap">
		<h1 class="hidden">내책장</h1>
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">비밀번호 변경</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
			<!-- 비밀번호 변경 -->
			<div class="change_password form_wrap">
			    <form method="post" id="mForm" name="mForm">
				<ul class="form_area">
					<li class="form_box">
						<strong class="form_title">기존 비밀번호</strong>
						<div class="input_box"><input type="password" name="password" id="password" required placeholder="비밀번호를 입력해 주세요."><button type="button" class="input_view"  onclick="pwTypeToggle(this, '#password');">비밀번호 보기</button><!-- <button class="input_view on">비밀번호 보기</button>--></div>
					</li>
					<li class="form_box">
						<strong class="form_title">새 비밀번호</strong>
						<div class="input_box"><input type="password" name="new_password" id="new_password" required  placeholder="비밀번호를 입력해 주세요."><button type="button" class="input_view"  onclick="pwTypeToggle(this, '#new_password');">비밀번호 보기</button><!-- <button class="input_view on">비밀번호 보기</button>--></div>
					</li>
					<li class="form_box">
						<strong class="form_title">새 비밀번호 확인</strong>
						<div class="input_box"><input type="password" name="new_password_re" id="new_password_re" required  placeholder="비밀번호를 입력해 주세요."><button type="button" class="input_view"  onclick="pwTypeToggle(this, '#new_password_re');">비밀번호 보기</button><!-- <button class="input_view on">비밀번호 보기</button>--></div>
					</li>
				</ul>
				<button  type="button" id="changeBtn" class="btn_basic bg_blue_green">비밀번호 변경</button>
				</form>
			</div>
			<!-- // 비밀번호 변경 -->
		</div>
		<!-- // contents -->

	</div>
<script language="javascript">
function pwTypeToggle(btn, target){
	if(jQuery(btn).hasClass('active')){
		jQuery(btn).removeClass('active');
		jQuery(target).attr('type', 'password');
		return;
	}
	jQuery(btn).addClass('active');
	jQuery(target).attr('type', 'text');
}
    
$(function() {
   $('#changeBtn').on("click",function(){
		var user_password = $('#password').val();
		var new_password = $('#new_password').val();
		var new_chk_password = $('#new_password_re').val();    
		

		if(user_password == ""){
			cswal("기존 비밀번호를 작성해주세요.");
			$('#password').focus();
			return
		}

		if(new_password == ""){
			cswal("새 비밀번호를 작성해주세요.");
			$('#new_password').focus();
			return
		}

		if(new_password != new_chk_password){
			cswal("비밀번호를 확인해주세요.");
			$('#new_password_re').focus();
			return
		}

		var data = {
			"user_password"	:	user_password,
			"new_password"	:	new_password
		};

		var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();

        data[csrf_name] = csrf_val;

		$.ajax({
            type: "POST",
            url : "/mypage/changePw_proc",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
                if(data.result=="success"){
					swal("변경되었습니다.", {
						icon: "success",
					}).then((value)=>{
						//location.href = "/member/setting";
						location.reload();
					});

				}else{
					swal(data.msg);
				}
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });		
        $('mForm').submit();
   });
});
</script>