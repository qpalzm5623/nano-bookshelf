<style>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7); /* 70% 투명한 백색 배경 */
  z-index: 999999; /* 다른 요소들보다 위에 배치 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  border: 8px solid rgba(0, 0, 0, 0.3); /* 반투명한 검은색 테두리 */
  border-top: 8px solid #333; /* 검은색 실제 로딩바 */
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite; /* 회전 애니메이션 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hide {display:none}
</style>
  <!-- container -->
		<!-- contents -->
		<div class="contents">
			<!-- visual -->
			<div class="visual_wrap">
				<div class="visual_list swiper-wrapper">
				    <?php 
				    for($i=0; $i < count($bannerList);$i++) {?>
					    <div class="visual_item swiper-slide">
					        <a href="/book/banner_list/<?php echo $bannerList[$i]['banner_seq'];?>"><img src="/upload/banner/<?php echo $bannerList[$i]['banner_image'];?>" alt=""></a>
					    </div>
				   <?php } ?>

				</div>
				<div class="swiper-pagination"></div>
			</div>

			<div class="certified_book_wrap">
				<div class="title_box">
					<div class="inner">
						<h2 class="title"><?php echo $userData['user_name']; ?> 님,<br>책 읽기 인증에 도전해 보세요.</h2>
						<a href="/mypage/book_confirm_list" class="btn_more">더보기</a>
					</div>
				</div>

				<div class="certified_book">
					<div class="certified_book_info">
						<dl>
							<dt><a href="/mypage/book_list" style="color:#fff;">인증 대기 도서</a></dt>
							<dd><?php echo @number_format($confirm['assingmentCnt']);?>권</dd>
						</dl>
						<dl>
							<dt class="bg_blue_green"><a href="/mypage/book_confirm_list" style="color:#fff;">인증 완료 도서</a></dt>
							<dd class="font_blue_green"><?php echo @number_format($confirm['confirmCnt']);?>권</dd>
						</dl>
					</div>
                    <?php if($userData['share_book_cnt'] > 0) {?>
					<div class="book_list_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($shareBookList);$i++){
						        $row = $shareBookList[$i];
						        $bookLink = ($row['qh_seq'] != "") ? "/book/quiz_result/{$row['book_no']}/{$row['quiz_seq']}/{$row['qh_seq']}" : "/book/detail/{$row['book_no']}/{$row['quiz_seq']}";
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="<?php echo $bookLink;?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<?php if($row['qh_seq'] != ""){?><a href="<?php echo $bookLink;?>" class="book_badge"></a><?php }?>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						   <?php }?>
						</ul>
					</div>
				    <?php }?>
				</div>
			</div>

			<!-- 권장 도서 -->
			<div class="main_book_wrap">
				<div class="tab_box">
					<a href="#" class="tab on">맞춤 추천</a>
					<a href="#" class="tab">인기 도서</a>
					<a href="#" class="tab">권장 도서</a>
				</div>

				<div class="tab_contents" style="display:block;">
                    <?php if(@$topic[0] != ""){?>
					<div class="title_box inner">
						<h2 class="title"><?php echo $topic[0];?></h2>
						<a href="/book/?topic=<?php echo $topic[0];?>" class="btn_more">더보기</a>
					</div>

					<div class="main_book_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($topicBookList1);$i++){
						              $row = $topicBookList1[$i];
						        ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						   <?php }?>
						</ul>
					</div>
                    <?php }?>
                    <?php if(@$topic[1] != ""){?>
					<div class="title_box inner">
						<h2 class="title"><?php echo $topic[1];?></h2>
						<a href="/book/?topic=<?php echo $topic[1];?>" class="btn_more">더보기</a>
					</div>

					<div class="main_book_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($topicBookList2);$i++){
						            $row = $topicBookList2[$i];
						        ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>						    
						</ul>
					</div>
                    <?php }?>
                    <?php if(@$topic[2] != ""){?>
					<div class="title_box inner">
						<h2 class="title"><?php echo $topic[2];?></h2>
						<a href="/book/?topic=<?php echo $topic[2];?>" class="btn_more">더보기</a>
					</div>

					<div class="main_book_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($topicBookList3);$i++){
						        $row = $topicBookList3[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
                    <?php }?>
					<a href="/mypage/topic_edit" class="modify_interest">
						<span>관심 주제 수정하기</span>
					</a>

					<div class="title_box inner">
						<h2 class="title">최근 북퀴즈가 등록된 책</h2>
						<a href="/book/" class="btn_more">더보기</a>
					</div>

					<div class="main_book_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($recentlyBookList);$i++){
						        $row = $recentlyBookList[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
				</div>

				<div class="tab_contents">
					<div class="title_box inner">
						<h2 class="title">가장 많이 선택 받은 책</h2>
						<div class="filter">
							<a href="javascript:;;" id="popular7Btn" class="btn font_orange">최근 7일간</a>
							<a href="javascript:;;" id="popularAllBtn" class="btn">전체</a>
						</div>
					</div>

					<div class="main_book_area"  id="popular7">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($popularBook7List);$i++){
						        $row = $popularBook7List[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
					
					<div class="main_book_area hide"  id="popularAll">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($popularBookList);$i++){
						        $row = $popularBookList[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
										
					<div class="title_box inner">
						<h2 class="title"><?php echo $userData['grade'];?>학년 인기도서</h2>
						<div class="filter">
							<a href="javascript:;;" id="grade7Btn" class="btn font_orange">최근 7일간</a>
							<a href="javascript:;;" id="gradeAllBtn" class="btn">전체</a>
						</div>
					</div>

					<div class="main_book_area"  id="grade7">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($gradeBook7List);$i++){
						        $row = $gradeBook7List[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
					
                    <div class="main_book_area hide"  id="gradeAll">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($gradeBookList);$i++){
						        $row = $gradeBookList[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>					
				</div>

				<div class="tab_contents">
					<div class="title_box inner">
						<h2 class="title"><?php echo $userData['grade'];?>학년 권장도서</h2>
						<a href="/book/?grade=<?php echo $userData['grade_org'];?>&recommend=Y" class="btn_more">더보기</a>
					</div>

					<div class="main_book_area">
						<ul class="book_list swiper-wrapper">
						    <?php for($i=0;$i<count($recommendBookList);$i++){
						        $row = $recommendBookList[$i];
						    ?>
							<li class="book swiper-slide">
								<div class="image_box">
									<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
									<a href="javascript:;;" data-book_no="<?php echo $row['book_no'];?>" data-quiz_seq="<?php echo $row['quiz_seq'];?>" class="btn_wish <?php echo $row['fh_seq']!=null?"on":"";?>">wish</a>
									<span class="book_label">NEW</span>
								</div>
								<div class="book_content">
									<div class="book_subject ellipsis"><?php echo $row['book_name'];?></div>
								</div>
							</li>
						    <?php }?>
						</ul>
					</div>
				</div>
			</div>

			<div class="main_board_wrap">
				<div class="title_box inner">
					<h2 class="title">공지사항</h2>
					<a href="/mypage/notice_list" class="btn_more">더보기</a>
				</div>
				<ul class="main_board_list inner">
                    <?php for($i=0;$i<count($noticeList);$i++) {?>				    
					<li class="main_board_item">
						<a href="/mypage/notice_view/<?php echo $noticeList[$i]['notice_seq'];?>" class="subject"><?php echo $noticeList[$i]['notice_title'];?></a>
						<span class="date"><?php echo date("m-d", strtotime($noticeList[$i]['notice_reg_datetime']));?></span>
					</li>
				    <?php }?>
				</ul>
			</div>
		</div>
		<!-- // contents -->
 
	</div>
  <!-- //container -->
  
  			
			<!-- 본인확인 팝업 -->
			<div class="layer_popup_wrap identification" style="display:<?php echo @$userData['confirm_yn']!="Y"?"block":"none";?>;z-index:100;background-color:#fff;">
				<div class="layer_popup">
					<div class="popup_header">
						<h2 class="popup_title">
							<div class="logo"><img src="/resources/images/common/logo.png" alt=""></div>을 시작하려면 본인 인증이 필요합니다.
						</h2>
					</div>
					<div class="popup_contents">
						<div class="scroll_contents">
							<!-- 본인확인 폼 -->
							<ul class="form_area">
								<li class="form_box">
									<div class="form_title">이름</div>
									<div class="input_box square readonly"><input type="text" value="<?php echo $userData['user_name'];?>" readonly></div>
								</li>
								<li class="form_box">
									<strong class="form_title">휴대폰 번호</strong>
									<div class="input_box square readonly"><input type="text" value="<?php echo $userData['cell_no'];?>" readonly></div>
								</li>
								<li class="form_box">
									<strong class="form_title">성별 / 학년</strong>
									<div class="input_area">
										<div class="input_box square readonly"><input type="text" value="<?php echo @$userData['gender']=='M'?"남자":"여자";?>" readonly></div>
										<div class="input_box square readonly"><input type="text" value="<?php echo @$userData['grade'];?>" readonly></div>
									</div>
								</li>
								<li class="form_box">
									<strong class="form_title">반 / 담당 선생님</strong>
									<div class="input_area">
										<div class="input_box square readonly"><input type="text" value="<?php echo @$userData['class_name'];?>" readonly></div>
										<div class="input_box square readonly"><input type="text" value="<?php echo @$userData['teacher_name'];?>" readonly></div>
									</div>
								</li>
								<li class="form_box" style="margin-bottom:20px;">
									<strong class="form_title">관심 주제 선택 (3개)</strong>
									<div class="check_area">
									    <?php for($i=0;$i<count($topicList);$i++) {?>
										<div class="check_button">
											<input type="checkbox" name="topic[]" value="<?php echo $topicList[$i]['code_type'];?>" id="check<?php echo $i;?>" onclick="check">
											<label for="check<?php echo $i;?>"><?php echo $topicList[$i]['code_type'];?></label>
										</div>
									    <?php } ?> 
									</div>
								</li>
							</ul>
							<!-- // 본인확인 폼 -->
						</div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close" onclick="saveData();">저 장</a>
					</div>
				</div>
			</div>
			<!-- // 본인확인 팝업 -->
    <script>
    
        
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            if (checkedCheckboxes.length > 3) {
                swal("최대 3개의 체크박스만 선택할 수 있습니다.");
                //uiLayer.close('#mainContentReport');                    
                //alert("최대 3개의 체크박스만 선택할 수 있습니다.");
                this.checked = false; // 체크박스 선택 해제
            }
        });
    });
	$(function() {
	    $('#popular7Btn').on("click",function(){
	        $('#popular7Btn').addClass("font_orange");
	        $('#popularAllBtn').removeClass("font_orange");
	        $('#popular7').show();
	        $('#popularAll').hide();
	        $('#popular7').removeClass('hide');
	        $('#popularAll').addClass('hide');	        
	    });
	    $('#popularAllBtn').on("click",function(){
	        $('#popular7Btn').removeClass("font_orange");
	        $('#popularAllBtn').addClass("font_orange");	        
	        $('#popular7').hide();
	        $('#popularAll').show();	        
	        $('#popular7').addClass('hide');
	        $('#popularAll').removeClass('hide');	   	        
	    });
	    $('#grade7Btn').on("click",function(){
	        $('#grade7Btn').addClass("font_orange");
	        $('#gradeAllBtn').removeClass("font_orange");
	        $('#grade7').show();
	        $('#gradeAll').hide();	        
	        $('#grade7').removeClass('hide');
	        $('#gradeAll').addClass('hide');
	    });
	    $('#gradeAllBtn').on("click",function(){
	        $('#grade7Btn').removeClass("font_orange");
	        $('#gradeAllBtn').addClass("font_orange");	        
	        $('#grade7').hide();
	        $('#gradeAll').show();	        
	        $('#grade7').addClass('hide');
	        $('#gradeAll').removeClass('hide');	   
	    });
	    
		const visual = new Swiper('.visual_wrap', {
			slidesPerView: 1,
  	        spaceBetween: 0,
			loop: true,
			pagination: {
				el: ".swiper-pagination",
			}
		});

		const certifiedBook = new Swiper('.book_list_area', {
			slidesPerView: 2.9,
  			spaceBetween: 17,
			loop: true,
			breakpoints: {
				340: {
					slidesPerView: 2.9,
					spaceBetween: 17,
				},
				759: {
					slidesPerView: 3.7,
					spaceBetween: 20,
				},
			}
		});

		const mainBook = new Swiper('.main_book_area', {
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
	})
    function saveData()
    {
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        
         var i=0;
        var dataArray=new Array();
        $('input:checkbox[name="topic[]"]').each(function() {
            if(this.checked){//checked 처리된 항목의 값
                //alert(this.value);
                dataArray[i]=this.value;//배열로 저장
                i++;
            }
        });        
        
        if(dataArray.length === 0) {
            swal("좋아하는 관심 주제 그룹을 선택해 주세요.");
            return;
        }
        
        var data = {
            "topic" : JSON.stringify(dataArray),
        };
        
        data[csrf_name] = csrf_val;
        
        $.ajax({
            type: "POST",
            url : "/mypage/topicSaveProc",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              if(data.result == "success"){
                swal("저장되었습니다.");
                uiLayer.close('#mainContentReport');
        		e.preventDefault();
        		$('.layer_popup_wrap').hide();
        		location.reload();
              }else{
              }
            
            
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });
      
    }
 
  var select_feed_seq = 0;
  var select_comment_seq = 0;
  var select_adv_seq = 0;

  function moreView(is_me,feed_seq)
  {
    select_feed_seq = feed_seq;
    if(is_me == "Y"){
      uiLayer.open('#mainContentMore_me');
    }else{
      uiLayer.open('#mainContentMore_other');
    }

  }

  function moreAdView(is_me,adv_seq)
  {
    select_adv_seq = adv_seq;
    uiLayer.open('#mainContentMore_ad');


  }

     
    var scrollBool = true;
    var loadBool = true;

    $(function(){
      //feedLoad();

      window.onscroll = function(e) {
    	    //추가되는 임시 콘텐츠
    			//if($(window).scrollTop() == $(document).height() - $(window).height()){

			var scrollHeight = $(document).height();
			var scrollPosition = $(window).height() + $(window).scrollTop();

			if (scrollPosition >= scrollHeight - 150) {


				if(scrollBool == true){
					scrollBool = false;
                    if(loadBool == true){
                    
                      num++;
                      //scrollLoad();
                    }
				}
			}
    	};
    	
	    $('.btn_wish').on("click",function(){
	        if($(this).hasClass("on"))
    	        $(this).removeClass("on");
	        else
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
                    //cswal(data.msg);
                    //if(data.result=="success"){
    				//	swal("저장되었습니다.", {
    				//		icon: "success",
    				//	}).then((value)=>{
    				//		//location.href = "/member/setting";
    				//		location.reload();
    				//	});
                    //
    				//}else{
    				//	cswal(data.msg);
    				//}
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });			        
	    });    	
    });

    var num = 0;
    var mySwiper = new Swiper('.swiper-container', {
      slidesPerView: 1,
      pagination: {
        el: ".swiper-pagination",
      },
    });


     
  </script>
