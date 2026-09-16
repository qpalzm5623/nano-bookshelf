	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title logo"><img src="/resources/images/common/logo_white.png" alt=""></h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div class="contents">
			
			<!-- 도서 상세 -->
			<div class="book_detail_wrap">
				<div class="book_info_area">
					<div class="image_box">
					    
						<img src="/upload/book/<?php echo $data['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'">
						<a href="#" data-book_no="<?php echo $data['book_no'];?>" data-quiz_seq="<?php echo $data['quiz_seq'];?>"  class="btn_wish <?php echo $data['fh_seq']!=null?"on":"";?>">wish</a>
					</div>
					<div class="book_info">
						<h3 class="subject ellipsis_multi" style="text-align:center;"><?php echo $data['book_name'];?></h3>
						<span class="series"><?php echo $data['serise'];?></span>
						<span class="author"><?php echo $data['author'];?></span>
					</div>
				</div>

				<h4 class="title"><i class="icon"></i>생각꺼내기</h4>
				<div class="text_box"><?php echo $data['think_title'];?></div>

				<h4 class="title"><i class="icon"></i>책정보</h4>
				
				<div class="info_box inner">
					<ul class="info_list">
						<li class="info_item">
							<span class="info_title">출판사</span>
							<div class="info_content"><?php echo $data['publisher'];?></div>
						</li>
						<li class="info_item">
							<span class="info_title">권장 학년</span>
							<div class="info_content"><?php echo $data['recommend_class'];?></div>
						</li>
						<li class="info_item">
							<span class="info_title">카테고리</span>
							<div class="info_content"><?php echo $data['subject'];?></div>
						</li>
						<li class="info_item">
							<span class="info_title">카테고리2</span>
							<div class="info_content"><?php echo $data['category']=="K"?"국내서":"외서";?></div>
						</li>
					</ul>
					<div class="topic_tag_list">
					        <?php $tags = explode(",", $data['tags']);
					        for($i=0;$i<count($tags);$i++){?>
					            <span class="tag"><?php echo $tags[$i];?></span>
					        <?php } ?>
					</div>
				</div>
                <?php if($data['award'] != "") {?>
				<h4 class="title"><i class="icon"></i>수상 내역 & 미디어 추천</h4>
				<div class="text_box bg_gray"><?php echo $data['award'];?></div>
				<?php } ?>

				<div class="good_book">
					<h3 class="title">함께 읽으면 좋은 책</h3>

					<div class="book_area">
						<ul class="book_list swiper-wrapper">
        				    <?php 
        				    for($i=0;$i<count(@$bookList);$i++) {
        				        $row = @$bookList[$i];    
        				    ?>						    
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:void(0)" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
								</div>
								<div class="book_content">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><div class="book_subject ellipsis"><?php echo $row['book_name'];?></div></a>
								</div>
							</li>
							<?php }?>
							 
						</ul>
					</div>
				</div>
                <?php if($cnt >= 2) {?>
                    <a href="#"  class="book_quiz show_data">북퀴즈 도전하기</a>
                <?php } else {?>
				    <a href="/book/quiz_main/<?php echo $data['book_no'];?>/<?php echo $data['quiz_seq'];?>" class="book_quiz">북퀴즈 도전하기</a>
				<?php }?>
			</div>
			<!-- // 도서 상세 -->
		</div>
		<!-- // contents -->
	</div>
<div class="layer_popup_wrap confirm" id="infoLayer" style="display: none;">
				<div class="layer_popup">
					<div class="popup_contents">
						<div class="popup_text">2회 인증 성공으로 
더이상 도전 할 수 없어요<br>
</div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close">확 인</a>
					</div>
				</div>
			</div>	
	<script>

	    $(function() {

			$('.show_data').on("click", function(){
			    $('#infoLayer').show();
			});	    

		});
		    
		$(function() {
		    $('.nav').hide();
			const mainBook = new Swiper('.book_area', {
				slidesPerView: 5,
      	spaceBetween: 20,
				loop: true,
				breakpoints: {
					340: {
						slidesPerView: 3,
						spaceBetween: 17,
					},
					759: {
						slidesPerView: 5,
						spaceBetween: 20,
					},
				}
			});
		});
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
                            
                            location.reload();
                            /*
        					swal("저장되었습니다.", {
        						icon: "success",
        					}).then((value)=>{
        						//location.href = "/member/setting";
        						location.reload();
        					});
        					*/

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
	