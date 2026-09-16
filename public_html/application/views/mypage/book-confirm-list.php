	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">독서 인증 기록</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 독서 인증 기록 -->
			<div class="my_bookcase_wrap certified_book">
				<div class="inner">
					<div class="title_explain">
						<div class="title_image"><img src="/resources/images/common/book_badge_lg.png" alt=""></div>
						<h3>지금까지 <strong class="font_blue_green">총 <?php echo $quizHistoryGroupTotalCount['cnt'];?>권</strong>의<br>책 읽기 인증이 완료되었습니다.</h3>
					</div>
				</div>

				<ul class="menu_link_list">
					<li class="menu_link">
						<a href="/mypage/book_list" class="inner">
							<strong class="menu_title">인증 대기 도서</strong>
						</a>
					</li>
				</ul>

				<h3 class="title inner">인증 완료 도서</h3>
                <?php 
                $date = "";
                foreach($dateList as $key=>$value) {
                    
                ?>
				<div class="list_set_up">
					<div class="inner">
						<span class="count"><?php echo $key;?></span>
					</div>
				</div>
			    

				<!-- 도서 목록 -->
				<div class="inner">
					<ul class="book_list basic_list">
					    <?php 
					    for($i=0;$i<count($quizHistoryGroupDateList[$key]);$i++){
					        $row = $quizHistoryGroupDateList[$key][$i];
					    ?>
						<li class="book">
							<div class="image_box">
								<a href="/book/quiz_result/<?php echo @$row['book_no'];?>/<?php echo @$row['quiz_seq'];?>/<?php echo @$row['qh_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
								<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi"><?php echo $row['book_name'];?></a>
								<ul class="book_info">
									<li><?php echo $row['author'];?></li>
									<li><?php echo $row['publisher'];?></li>
									<li><?php echo $row['user_id'];?></li>
								</ul>
							</div>
						</li>
					    <?php }?>
					</ul>
				</div>
			    <?php }?>
			    <?php /*

				
				<div class="list_set_up">
					<div class="inner">
						<span class="count">YYYY-MM-DD</span>
					</div>
				</div>

				<!-- 도서 목록 -->
				<div class="inner">
					<ul class="book_list basic_list">
						<li class="book">
							<div class="image_box">
								<a href="#"><img src="/resources/images/common/no_image.png" alt=""></a>
								<a href="#" class="btn_wish">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi">제목제제목제목제목제목제목제목목제목제목제제목제제목제목제목제목제목제목목제목제목제목제목목제목</a>
								<ul class="book_info">
									<li>지은이</li>
									<li>출판사</li>
									<li>출제자</li>
								</ul>
							</div>
						</li>
						<li class="book">
							<div class="image_box">
								<a href="#"><img src="/resources/images/common/no_image.png" alt=""></a>
								<a href="#" class="btn_wish">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi">제목제제목제목제목제목제목제목목제목제목제제목제제목제목제목제목제목제목목제목제목제목제목목제목</a>
								<ul class="book_info">
									<li>지은이</li>
									<li>출판사</li>
									<li>출제자</li>
								</ul>
							</div>
						</li>
						<li class="book">
							<div class="image_box">
								<a href="#"><img src="/resources/images/common/no_image.png" alt=""></a>
								<a href="#" class="btn_wish">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi">제목제제목제목제목제목제목제목목제목제목제제목제제목제목제목제목제목제목목제목제목제목제목목제목</a>
								<ul class="book_info">
									<li>지은이</li>
									<li>출판사</li>
									<li>출제자</li>
								</ul>
							</div>
						</li>
						<li class="book">
							<div class="image_box">
								<a href="#"><img src="/resources/images/common/no_image.png" alt=""></a>
								<a href="#" class="btn_wish on">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi">제목제목제목제제목제목제목제목제목제목목제목제목</a>
								<ul class="book_info">
									<li>지은이</li>
									<li>출판사</li>
									<li>출제자</li>
								</ul>
							</div>
						</li>
						<li class="book">
							<div class="image_box">
								<a href="#"><img src="/resources/images/common/no_image.png" alt=""></a>
								<a href="#" class="btn_wish on">wish</a>
							</div>
							<div class="book_content">
								<a href="#" class="book_subject ellipsis_multi">제목제목제목제제목제목제목제목제목제목목제목제목</a>
								<ul class="book_info">
									<li>지은이</li>
									<li>출판사</li>
									<li>출제자</li>
								</ul>
							</div>
						</li>
					</ul>
				</div>
			</div>
			<!-- // 독서 인증 기록 -->
			*/?>

		</div>
		<!-- // contents -->


 

	</div>
	
	<script>
	$(function(){
	    $('.btn_wish').on("click",function(){
	        $(this).addClass("on");
	        
    		var data = {
    			"quiz_seq"	:	$(this).data("quiz_seq"),
    			"book_no"	:	$(this).data("book_no"),
    		};
    		

    		var csrf_name = $('#csrf').attr("name");
            var csrf_val = $('#csrf').val();

            data[csrf_name] = csrf_val;
    		$.ajax({
                type: "POST",
                url : "/book/wishProc",
                data: data,
                dataType:"json",
                success : function(data, status, xhr) {
                    if(data.result=="success"){
    					swal("저장되었습니다.", {
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
	    });
	});  
	</script>	