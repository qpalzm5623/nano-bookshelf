<style>
.btn_delete {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    background: url(/resources/images/common/icon_delete.png) no-repeat center / contain;
}    
.resent_search_box .search_word:after {
    content:none;
    display:none;
    width: 0px;
    background: none;
}
.layer_popup .popup_text {
    line-height: 29px;
    font-size: 16px;
}
</style>	
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">검색</h2>
				<a href="#" class="btn_info"><i class="icon_info"></i>정보</a>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
			<div class="search_wrap inner">
			    <form method="get" action="/book/">
				<div class="input_box">
					<input type="text" placeholder="도서명, 지은이, 세부 태그, 출제자 아이디 를 검색하세요." name="keyword" id="keyword" required>
					<button type="submit" class="input_search"><i class="icon_search_orange"></i>검색</button>
				</div>
				</form>
				<div class="resent_search_area width_full">
					<div class="resent_search_box swiper-wrapper">
    				    <?php 
    				    for($i=0;$i<count(@$keywordList);$i++) {
    				        $row = @$keywordList[$i];    
    				    ?>					    
						<div class="swiper-slide">
							<a href="/book/?keyword=<?php echo $row['keyword'];?>" class="search_word"><?php echo $row['keyword'];?><i class="btn_delete" data-keyword="<?php echo $row['keyword'];?>"></i></a>
							
						</div>
						<?php 
					    }
					    ?>
					</div>
				</div>
				
				<h3 class="title">책 주제별</h3>
				
				<!-- 주제별 책 목록 -->
				<ul class="book_list_by_topic">
				    <?php 
				    for($i=0;$i<count($topicList);$i++) {
				        $row = $topicList[$i];    
				    ?>
					<li class="book_topic">
						<a href="/book/?topic=<?php echo $row['code_name'];?>"></a>
						<div class="book_content">
							<h4 class="book_subject"><?php echo $row['code_name'];?></h4>
							<p class="book_description"><?php echo $row['code_desc'];?></p>
						</div>
						<div class="image_box" style="width:128px;height:79px;"><img src="/upload/code/<?php echo $row['code_image'];?>" alt=""></div>
					</li>
				    <?php }?>
				</ul>
				<!-- //책 주제별 목록 -->
			</div>
		</div>
		<!-- //contents -->


			<!-- 알림 팝업 -->
			<div class="layer_popup_wrap confirm" id="infoLayer">
				<div class="layer_popup">
					<div class="popup_contents">
						<div class="popup_text">도서명, 지은이, 세부 태그, 출제자 아이디를<br>
검색하여 원하는 도서를 찾을 수 있습니다.</div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close">확 인</a>
					</div>
				</div>
			</div>
			<!-- // 알림 팝업 -->
 
	</div>

	<script>
	    
		$(function() {
			const certifiedBook = new Swiper('.resent_search_area', {
				slidesPerView: 'auto',
      	        spaceBetween: 7,
				loop: false,
				breakpoints: {
					340: {
						// slidesPerView: 2.9,
						spaceBetween: 4,
					},
					759: {
						// slidesPerView: 3.7,
						spaceBetween: 7,
					},
				}
			});
			$('.btn_info').on("click", function(){
			    $('#infoLayer').show();
			});
			$('.btn_delete').on("click",function(){
		var data = {
			"keyword"	:	$(this).data("keyword"),
		};
		

		var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();

        data[csrf_name] = csrf_val;
		$.ajax({
            type: "POST",
            url : "/book/keywordDeleteProc",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
                location.reload();
                return;
                if(data.result=="success"){
					swal("삭제되었습니다.", {
						icon: "success",
					}).then((value)=>{
						//location.href = "/member/setting";
						location.reload();
					});

				}else{
					cswal(data.msg);
				}
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });	
       event.preventDefault();
			});
		})
	</script>