<style>
.list_set_up {
    padding: 7px 0 8px;
    background: #ddd;
    margin: 17px 0px 0px 0px;
}    
</style>	
	
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">
				<?php echo @$data['title'];?>
				</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
							    
				<div class="list_set_up">
					<div class="inner">
						<span class="count">총 <?php echo count(@$bookList);?>권</span>
						<!-- 정렬 -->
						<div class="sort_box">
						    <!--
						    <form method="get" name="sform" id="sform">
        				    <input type="hidden" name="grade" id="grade" value="<?php echo @$_REQUEST['grade'];?>">
        				    <input type="hidden" name="topic" id="topic" value="<?php echo @$_REQUEST['topic'];?>">				    
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
						    </form>
						    -->
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
    	    
       $('#sgrade').on("change",function(){
           $('#grade').val($(this).val());
           $('#sform').submit();
       });
       
       	    
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