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
function cswal(message) {
    $('.popup_text').html(message);
    $('.message_popup').show();
}
$(function(){
   $('.btn_back').on("click",function(){
       history.go(-1);
   });
});
</script>