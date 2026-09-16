<style>
.list_set_up {
    padding: 7px 0 8px;
    background: #ddd;
    margin: 17px 0px 0px 0px;
}    
.btn_delete {content:'';display:inline-block;width:16px;height:16px;background:url(/resources/images/common/icon_delete.png) no-repeat center/contain; }

</style>	
	
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">
				<?php if(!empty(@$_REQUEST['keyword'])) {?>
				    검색
				<?php } else if(!empty(@$_REQUEST['topic'])) {?>
				    <?php echo @$_REQUEST['topic'];?>
				<?php } else {?>
				<?php } ?>
				</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
			<?php if(empty(@$_REQUEST['topic'])) { ?>
			<div class="search_wrap">
			    <div class="inner">
    			    <form method="get" action="/book/" name="sform" id="sform">
    				<div class="input_box">
    				    <input type="hidden" name="grade" id="grade" value="<?php echo @$_REQUEST['grade'];?>">
    				    <input type="hidden" name="topic" id="topic" value="<?php echo @$_REQUEST['topic'];?>">
    					<input type="text" placeholder="도서명, 지은이, 세부 태그, 출제자 아이디 를 검색하세요." name="keyword" id="keyword" required value="<?php echo @$_REQUEST['keyword'];?>">
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
    							<a href="/book/?keyword=<?php echo $row['keyword'];?>&grade=<?php echo @$_GET['grade'];?>&topic=<?php echo @$_GET['topic'];?>" class="search_word"><?php echo $row['keyword'];?><i class="btn_delete" data-keyword="<?php echo $row['keyword'];?>"></i></a>
    							
    						</div>
    						<?php 
    					    }
    					    ?>
    					</div>
    				</div>
    			</div>
			</div>
			<?php } ?>
							    
				<div class="list_set_up">
					<div class="inner">
						<span class="count">총 <?php echo count(@$bookList);?>권</span>
						<!-- 정렬 -->
						<div class="sort_box">
							<select name="grade" id="sgrade" class="select">
								<option value="" selected>학년별</option>
								<option value="">전체</option>
								<option value="0" <?php echo @$_REQUEST['grade']=="0"?"selected":"";?>>미취학</option>
								<option value="1" <?php echo @$_REQUEST['grade']=="1"?"selected":"";?>>초1</option>
								<option value="2" <?php echo @$_REQUEST['grade']=="2"?"selected":"";?>>초2</option>
								<option value="3" <?php echo @$_REQUEST['grade']=="3"?"selected":"";?>>초3</option>
								<option value="4" <?php echo @$_REQUEST['grade']=="4"?"selected":"";?>>초4</option>
								<option value="5" <?php echo @$_REQUEST['grade']=="5"?"selected":"";?>>초5</option>
								<option value="6" <?php echo @$_REQUEST['grade']=="6"?"selected":"";?>>초6</option>
								<option value="7" <?php echo @$_REQUEST['grade']=="7"?"selected":"";?>>중1</option>
								<option value="8" <?php echo @$_REQUEST['grade']=="8"?"selected":"";?>>중2</option>
								<option value="9" <?php echo @$_REQUEST['grade']=="9"?"selected":"";?>>중3</option>
							</select>
							<span class="icon_arrow"></span>
						</div>
						<!-- // 정렬 -->
						<div class="list_view_type" data-list=".book_list">
							<a href="#" class="btn_list_type list on" data-type="type_list">리스트형</a>
							<a href="#" class="btn_list_type album" data-type="type_album">앨범형</a>
						</div>
					</div>
				</div>
				<?php if(empty($bookList)) {?>
                <div class="no_data">
					<i class="icon_no_data"></i>
					<span class="no_data_text">검색 결과가 없습니다.</span>
				</div>				
			    <?php } else {?>
				<!-- 도서 목록 -->
				<div class="inner">
					<ul class="book_list basic_list type_album">
    				    <?php 
    				    for($i=0;$i<count($bookList);$i++) {
    				        $row = $bookList[$i];    
    				    ?>
						<li class="book">
							<div class="image_box">
								<a href="/book/detail/<?php echo $row['book_no'];?>/<?php echo $row['quiz_seq'];?>"><img src="/upload/book/<?php echo $row['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'" ></a>
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
				<?php } ?>
			</div>
		</div>
		<!-- contents -->
	</div>
	
	<script>
$(function(){
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
   
   $('#sgrade').on("change",function(){
       $('#grade').val($(this).val());
       $('#sform').submit();
   });
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
	})
		    
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