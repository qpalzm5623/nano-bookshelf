		<!-- navigation -->
		<nav class="nav">
			<ul class="nav_list">
				<li class="nav_item <?php echo $this->CONFIG_DATA["depth1"]=="home"?"on":"";?>">
					<a href="/main">
						<i class="item_icon"></i>
						<span class="item_title">홈</span>
					</a>
				</li>
				<li class="nav_item  <?php echo $this->CONFIG_DATA["depth1"]=="book"?"on":"";?>">
					<a href="/book/topic_list">
						<i class="item_icon"></i>
						<span class="item_title">검색</span>
					</a>
				</li>
				<li class="nav_item  <?php echo $this->CONFIG_DATA["depth1"]=="ranking"?"on":"";?>">
					<a href="/ranking/">
						<i class="item_icon"></i>
						<span class="item_title">랭킹</span>
					</a>
				</li>
				<li class="nav_item  <?php echo $this->CONFIG_DATA["depth1"]=="book_main"?"on":"";?>">
					<a href="/mypage/book_main">
						<i class="item_icon"></i>
						<span class="item_title">내 책장</span>
					</a>
				</li>
				<li class="nav_item  <?php echo $this->CONFIG_DATA["depth1"]=="mypage"?"on":"";?>">
					<a href="/mypage/">
						<i class="item_icon"></i>
						<span class="item_title">관리</span>
					</a>
				</li>
			</ul>
		</nav>
		<!-- // navigation -->
		

		<!-- 알림 팝업 -->
		<div class="layer_popup_wrap confirm message_popup" style="z-index:1">
			<div class="layer_popup">
				<div class="popup_contents">
					<div class="popup_text"></div>
				</div>
				<div class="popup_btn_area">
					<a href="#" class="btn popup_close">확 인</a>
				</div>
			</div>
		</div>
		<!-- // 알림 팝업 -->		
<script>
// [보안] 메시지를 text로 넣어 서버/사용자 입력이 HTML로 실행되는 것을 막는다. 줄바꿈만 <br>로 변환.
function cswal(message) {
    var $text = $('.popup_text').empty();
    String(message == null ? '' : message).split(/<br\s*\/?>|\n/i).forEach(function(line, i){
        if (i > 0) { $text.append('<br>'); }
        $text.append(document.createTextNode(line));
    });
    $('.message_popup').show();
}

// 네트워크/서버 오류 시 사용자에게 알려주는 공통 처리. 학교 와이파이처럼 불안정한 환경에서 "무반응"을 방지한다.
// 사용법: $.ajax({... error: ajaxFail, complete: function(){ $btn.prop('disabled', false); } })
function ajaxFail(jqXHR) {
    var msg = "일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.";
    if (jqXHR && jqXHR.status === 0) { msg = "네트워크 연결을 확인해주세요."; }
    else if (jqXHR && (jqXHR.status === 403)) { msg = "로그인이 만료되었거나 요청이 만료되었습니다.\n새로고침 후 다시 시도해주세요."; }
    cswal(msg);
}

$(function(){
   // 이전 페이지가 같은 사이트일 때만 뒤로가기, 아니면 홈으로 (외부 사이트로 튕기는 문제 방지)
   $('.btn_back').on("click",function(e){
       e.preventDefault();
       var sameSite = document.referrer && document.referrer.indexOf(location.host) !== -1;
       if (sameSite && history.length > 1) { history.go(-1); }
       else { location.href = "/main"; }
   });
});
</script>