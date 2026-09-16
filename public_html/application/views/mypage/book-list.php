<style>
.search_wrap {
    padding-top: 0px;
}    
.list_set_up .list_view_type {
    margin-left: 13px;
    padding-left: 19px;
    border-left: 0px;
}
</style>	
	
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">
				인증 대기 도서
				</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
			<div class="search_wrap">
			    <div class="inner">
    				<div class="resent_search_area width_full">
    					<div class="resent_search_box swiper-wrapper">
 
    					</div>
    				</div>
    			</div>
							    
				<div class="list_set_up">
					<div class="inner">
						<span class="count">총 <?php echo count(@$bookList);?>권</span>
						<!-- 정렬 -->
 
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