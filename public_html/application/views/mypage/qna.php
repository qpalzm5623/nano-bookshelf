
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">고객센터</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 고객센터 -->
			<div class="manage_wrap">

				<!-- 탭 -->
				<div class="sub_tab_box tab_box">
					<a href="#" class="tab on">1:1 문의</a>
					<a href="#" class="tab">나의 문의 내역</a>
				</div>
				<!-- // 탭 -->

				<!-- 1:1 문의 -->
				<div class="tab_contents" style="display:block;">
					<!-- 1:1 문의 입력 폼 -->
					<div class="inquiry_form_area inner">
						<div class="inquiry_form">
							<div class="inquiry_input_box">
								<div class="inquiry_title"><label>제목</label></div>
								<div class="inquiry_input"><input type="text" name="title" id="title" required placeholder="제목을 입력해 주세요."></div>	
							</div>
							<div class="inquiry_textarea">
								<textarea name="contents" id="scontents" required placeholder="나노의 책장 이용 시 불편한 점이나 궁금한 점을 남겨 주세요."></textarea>
							</div>
							<div class="inquiry_agree_box">
								<div class="inquiry_agree">
									<label><input type="checkbox" id="check1"> 개인정보 수집 및 이용 동의</label>
									<a href="#" class="btn_view">자세히<i class="icon_arrow"></i></a>
								</div>
								<div class="inquiry_agree_content">수집이용목적<br>
									이용자 문의 또는 불만, 분쟁, 제휴 상담<br><br>
									수집항목<br>
									이메일 주소<br><br>
									보유기간<br>
									관계법령에 따라 보관하고 문의 해결 후 파기처리합니다.
								</div>
							</div>
						</div>

						<div class="btn_area">
							<button id="saveBtn" type="button" class="btn_basic bg_blue_green">등 록</button>
						</div>
					</div>
					<!-- // 1:1 문의 입력 폼 -->
				</div>
				<!-- //1:1 문의 -->

				<!-- 나의 문의 내역 -->
				<div class="tab_contents">
					<ul class="board_list">
				    <?php 
				        for($i=0;$i<count($list);$i++){
				            $row=$list[$i];
				    ?>
					<li class="board_item">
						<!-- 제목 -->
						<div class="board_title inner">
							<div class="board_subject"><?php echo $row['title'];?> <span class="status">
							    <?php if(!empty($row['reply_contents'])){?>답변완료<?php }else{ ?>문의중<?php }?>
							    </span></div>
							<span class="board_date"><?php echo date("Y-m-d", strtotime($row['reg_date']));?></span>
							<i class="icon_arrow"></i>
						</div>
						<!-- 내용 -->
						<div class="board_content">
							<!-- 문의 -->
							<div class="inquiry inner">
								<?php echo nl2br($row['contents']);?>
							</div>
							<?php if($row['reply_contents'] != ""){?>
							<!-- 답변 -->
							<div class="answer board_text_box inner">
								<span class="answer_title">└ 답변</span>
								<div class="board_text"><?php echo nl2br($row['reply_contents']);?></div>
								<span class="board_date"><?php echo date("Y-m-d", strtotime($row['reply_date']));?></span>
							</div>
							<?php }?>
						</div>						
					</li>
				    <?php }?>
				     
					</ul>
				</div>
				<!-- // 나의 문의 내역 -->
			</div>
			<!-- // 고객센터 -->
		</div>
		<!-- // contents -->


	</div>

	<script>
		$(function() {
			$('.inquiry_agree_box .btn_view').on('click', function(e) {
				e.preventDefault();
				$('.inquiry_agree_box').toggleClass('on');
			});
            $('#saveBtn').on("click",function(){
        		var title = $('#title').val();
        		var contents = $('#scontents').val();
        		var check1 = $('#check1').val();    
        		

        		if(title == ""){
        			cswal("제목을 작성해주세요.");
        			$('#title').focus();
        			return
        		}

        		if(contents == ""){
        			cswal("내용을 작성해주세요.");
        			$('#scontents').focus();
        			return
        		}
        		
        		if($('#check1').is(":checked") == false){
        			cswal("개인정보 수집 및 이용 동의를 해주세요.");
        			$('#contents').focus();
        			return
        		}

        		var data = {
        			"title"	:	title,
        			"contents"	:	contents
        		};

        		var csrf_name = $('#csrf').attr("name");
                var csrf_val = $('#csrf').val();

                data[csrf_name] = csrf_val;

        		$.ajax({
                    type: "POST",
                    url : "/mypage/qnaProc",
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
               //$('mForm').submit();
           });
    });
</script>