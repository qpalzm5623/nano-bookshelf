<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<script>
    $('.nav').hide();
    function renderMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    }
    $(function() {
        setTimeout(renderMath, 300);
    });
</script>    
<style>
.hide {display:none;}
.btn_recommend { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.btn_recommend.on, .btn_recommend:active { transform: scale(1.08); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
.katex { font-size: 1.1em; }
</style>
    <div id="wrap">
        <header></header>

        <div class="contents">
			<!-- 북퀴즈 문제 -->
			<div class="full_popup bookquiz">
				<!-- popup header -->
				<div class="popup_header">
					<div class="inner">
						<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
						<h2 class="header_title">북퀴즈</h2>
					</div>
				</div>
				<!-- // popup header -->
                <form method="post" name="quizForm" id="quizForm">
                    <input type="hidden" name="book_no" id="book_no" value="<?php echo $data['book_no'];?>" >
                    <input type="hidden" name="quiz_seq" id="quiz_seq" value="<?php echo $data['quiz_seq'];?>" >
				<!-- popup contents -->
                <div class="popup_contents quiz_contents">
                    <?php
                    //print_r($data);
                    //print_r($quizData);                    
                    for($i=1;$i<=$data['quiz_cnt'];$i++) {
                        $quizType[$i]= $quizData['type'];
                        $type = $quizData['type'];
                        
                        $ext = $quizData['ext'];
                        $q = $quizData['q'];
                        $file = @$quizData['img'];
                        $answer_cnt = 0;
                        $c1 = $quizData['c1'][$i];
                        $c2 = $quizData['c2'][$i];
                        $c3 = $quizData['c3'][$i];
                        $c4 = $quizData['c4'][$i];
                        $c5 = $quizData['c5'][$i];
                        
                        if($c5 != "" &&  $answer_cnt == 0) {
                            $answer_cnt = 5;
                            $quizRow[$i] = array($c1, $c2,$c3, $c4,$c5);
                        }
                        if($c4 != "" &&  $answer_cnt == 0) {
                            $answer_cnt = 4;
                            $quizRow[$i] = array($c1, $c2,$c3, $c4);
                        }
                        if($c3 != "" &&  $answer_cnt == 0) {
                            $answer_cnt = 3;
                            $quizRow[$i] = array($c1, $c2,$c3);
                        }
                        if($c2 != "" &&  $answer_cnt == 0) {
                            $answer_cnt = 2;
                            $quizRow[$i] = array($c1, $c2);
                        }    
                        if($c1 != "" &&  $answer_cnt == 0) {
                            $answer_cnt = 1;
                            $quizRow[$i] = array($c1);
                        }
                        if($type[$i] == "C")
                            $quizAnswer[$i] = @$quizData['c'.$quizData['a'][$i]][$i];
                        else
                            $quizAnswer[$i] = $quizData['a'][$i];
                        //print_r($quizRow);
                        @shuffle($quizRow[$i]);
                        //print_r($quizRow);
                        //print_r($quizAnswer);
                        
                        
                        if($type[$i] =="C") {
                    ?>
                        <div class="quiz_form inner  <?php if($i >1) echo "hide";?>" id="quiz<?php echo $i;?>" data-type="multi">
                            <!-- 문제-->
                            <div class="question">
                                <span class="number"><?=$i;?>.</span><?php echo trim($q[$i]);?>
                            </div>
                            <!-- //문제-->
                            <?php 
                            if($file[$i] != "") {?>
                            <div class="question_data">
                                <?php
                                if($ext[$i] == "IMG") {
                                ?>
                                <img src="/upload/quiz/<?php echo $file[$i];?>" alt="">
                                <?php
                                } else if($ext[$i] == "MP3") {
                                ?>
                                <audio src="/upload/quiz/<?php echo $file[$i];?>" controls></audio>
                                <?php
                                } else if($ext[$i] == "MP4") {
                                ?>
                                <video style="width:100%" controls><source src='/upload/quiz/<?php echo $file[$i];?>' type='video/mp4' /></video>
                                <?php
                                } else if($ext[$i] == "YOUTUBE") {
                                ?>
                                <iframe width="100%" height="315" src="<?php echo $file[$i];?>" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                                <?php }?>
                            </div>
                            <?php }?>
                            <div class="answer_area">
                                <!-- 객관식 -->
                                <ul class="multiple_choice">
                                    <?php
                                    for($j = 0; $j < count($quizRow[$i]);$j++) {
                                        $quizNewRow = $quizRow[$i];
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_<?=$j?>" name="c[<?php echo $i;?>]" value="<?php echo $quizNewRow[$j];?>">
                                        <label for="c<?php echo $i?>_<?=$j?>"><?php echo $quizNewRow[$j];?></label>
                                    </li>                                                                            
                                    <?php 
                                    }
                                    ?> 
                                </ul>
                                <!-- // 객관식 -->

                            </div>
                        </div>
                        <?php } else {?>
                        <div class="quiz_form inner <?php if($i >1) echo "hide";?>"  id="quiz<?php echo $i;?>" data-type="one">
                            <!-- 문제-->
                            <div class="question">
                                <span class="number"><?=$i;?>.</span><?php echo trim($q[$i]);?>
                            </div>
                            <!-- //문제-->
                            <div class="question_data">
                                <?php
                                if($ext[$i] == "IMG") {
                                ?>
                                <img src="/upload/quiz/<?php echo $file[$i];?>" alt="">
                                <?php
                                } else if($ext[$i] == "MP3") {
                                ?>
                                <audio src="/upload/quiz/<?php echo $file[$i];?>" controls></audio>
                                <?php
                                } else if($ext[$i] == "MP4") {
                                ?>
                                <video style="width:100%" controls><source src='/upload/quiz/<?php echo $file[$i];?>' type='video/mp4' /></video>
                                <?php
                                } else if($ext[$i] == "YOUTUBE") {
                                ?>
                                <iframe width="100%" height="315" src="<?php echo $file[$i];?>" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                                <?php }?>                                
                            </div>
                            <div class="answer_area">
                                <!-- 주관식 -->
                                <div class="essay_form">
                                    <textarea  name="c[<?php echo $i;?>]" placeholder="정답을 입력해 주세요."></textarea>
                                    <!--<button class="btn_mic"></button>-->
                                </div>
                                <!-- // 주관식 -->
                            </div>
                        </div>                    
                        <?php } ?>
                     <?php }?>
                     
                    <div class="quiz_form inner hide"  id="quiz_think">
                        <!-- 문제-->
                        <div class="question">
                            <span class="number">질문.</span><?php echo $questionDetail;?>
                        </div>
                        <!-- //문제-->
                        <!--<div class="question_data"><img src="/resources/images/sub/quiz_data.jpg" alt=""></div>-->
                        <div class="answer_area">
                            <!-- 주관식 -->
                            <div class="essay_form">
                                <textarea name="think_reply" id="think_reply" placeholder="자유롭게 생각을 적어 보세요."></textarea>
                                <!--<button class="btn_mic"></button>-->
                            </div>
                            <!-- // 주관식 -->

                            <!-- 첨부파일 -->
                            <div class="attachment">
                                <label class="attachment_upload">
                                    <input type="file" name="file" id="file" onchange="uploadImg($(this), this, '<?php echo $i; ?>')"  data-target="think_reply_file" data-seq="1" data-type="image"  data-maxsize="100">
                                    <input type="hidden" id="think_reply_file" name="think_reply_file"  value="" />
                                    <i class="icon"></i>
                                    <span class="upload_text">직접 종이에 쓴 생각을 <br>사진으로 찍어 올릴 수 있어요.</span>
                                </label>
                                
                            </div>
                            <!-- // 첨부파일 -->
                        </div>
                        <span class="notice_text">※ 생각담기 문제는 채점에 포함되지 않아요.</span>
                        <div id="photo"></div>
                    </div>                        
                </div>
                
				<!-- popup footer -->
                <div class="popup_footer quiz_contents">
                    <div class="btn_area">
                        <a href="#" class="btn_back"><i class="icon_back"></i><span>이전</span></a>
                        <a href="#" class="btn_next btn_next1"><span>다음</span><i class="icon_back"></i></a>
                        <a href="#" id="quizEndBtn" class="btn_next btn_next2 hide"><span>답변 제출</span><i class="icon_back"></i></a>
                    </div>
                </div>
				<!-- // popup footer -->
				
				<!-- popup contents -->
				<div class="popup_contents recommend_contents hide">
					<!-- 책 추천화면 -->
					<div class="book_recommend">
						<h3 class="title">이 책을 다른 친구들에게도<br>추천하겠습니까?</h3>
						<div class="btn_area">
							<a href="#" class="btn_recommend" id="recommendYBtn"><i class="icon_recommend"></i><span class="text">추천해요!</span></a>
							<a href="#" class="btn_recommend" id="recommendNBtn"><i class="icon_not_recommend"></i><span class="text">추천하지 않아요!</span></a>
						</div>
					</div>
					<!-- // 책 추천화면 -->
				</div>
				<!-- // popup contents -->
				
				<!-- popup footer -->
				<div class="popup_footer recommend_contents hide">
					<div class="btn_area">
						<a href="#" class="btn_next btn_full" id="quizResultBtn"><span>퀴즈 결과 보러 가기</span><i class="icon_back"></i></a>
					</div>
				</div>
				<!-- // popup footer -->				
				
				<!-- 통과 실패 -->
				<div class="quiz_pass_fail inner hide" id="quizPassFail">
					<i class="icon_pass_fail"></i>
					<h3 class="title">60점이 넘어야 책 읽기 완료<br>인증을 할 수 있어요.<br>다시 도전해 볼까요?</h3>
					<div class="btn_area">
						<a href="#" id="restartBtn" class="btn_basic bg_blue_green">다시 풀어 볼래요!</a>
						<a href="#" id="stopBtn" class="btn_basic">다음에 할래요...</a>
					</div>
				</div>
				<!-- // 통과 실패 -->				
				
                <div class="layer_popup_wrap confirm hide" id="submitAlert" style="background:#fff;">
    				<div class="layer_popup blue_green">
    					<div class="popup_contents">
    						<div class="popup_text_confirm">생각담기 답변을 제출하고<br>책 읽기 인증을 완료하겠습니까?</div>
    					</div>
    					<div class="popup_btn_area">
    						<a href="#" class="btn" id="submitBtn">인증 완료하기</a>
    						<a href="#" class="btn" id="closeBtn">돌아가기</a>
    					</div>
    				</div>
    			</div>
    			<?php 
        			$info['q'] = $quizRow;
        			$info['type'] = $quizType;
    			    $info['a'] = $quizAnswer;
    			?>
    			<textarea name="quiz_result" class="hide"><?php echo serialize($info);?></textarea>
    			<input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
    			</form>
            </div>
        </div>
    </div>	
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/4.3.0/jquery.form.min.js"></script>
<script>
    let cursor = 1;
    let cursor_size = <?php echo $data['quiz_cnt'];?>;
    let qh_seq = 0;
    let score = 0;
    let hasRecommended = false;
    $(function(){
        $('.btn_back').on("click",function() {
            if(cursor == 1) {
                alert('첫번째 페이지입니다.');
            } else {
                $('#quiz'+cursor).hide();
                $('#quiz'+(cursor-1)).show();
                
                $('#quiz'+cursor).addClass('hide');    
                $('#quiz'+(cursor-1)).removeClass('hide');
                $('#quiz_think').hide();
                
            }
            
            if(cursor < cursor_size-1) {
                $('.btn_next1').show();
                $('.btn_next1').removeClass('hide');
                $('.btn_next2').hide();
                $('.btn_next2').addClass('hide');
                
                $('#quiz_think').hide();
                $('#quiz_think').addClass('hide');
            }           
            
            cursor--;
        });
        $('.btn_next').on("click",function() {
            console.log(cursor);
            console.log($('#quiz'+cursor).data("type"));
            //정답입력여부 확인
            if($('#quiz'+cursor).data("type") == "one") {
                if($('textarea[name="c['+cursor+']"]').val() == "") {
                    cswal("정답을 입력하세요.");
                    return;             
                }
            } else {
                if($('input[name="c['+cursor+']"]').is(":checked") == false) {
                    cswal("정답을 선택하세요.");
                    return;
                }
            }
           
            // 마지막 
            if(cursor == cursor_size) {
                <?php if($questionDetail!= ""){?>
                    $('#quiz'+cursor).hide();
                    $('#quiz_think').show();
                    $('#quiz_think').removeClass('hide');
                    
                    $('.btn_next1').hide();
                    $('.btn_next2').show();
                    
                    $('.btn_next1').addClass('hide');
                    $('.btn_next2').removeClass('hide');
                <?php } else {?>
                    $('#submitAlert').show();
                    if(cursor == cursor_size-1) {
                        $('.btn_next1').hide();
                        $('.btn_next2').show();
                        
                        $('.btn_next1').addClass('hide');
                        $('.btn_next2').removeClass('hide');
                    }                    
                <?php } ?>
                return;
            }
            
            $('#quiz'+cursor).hide();
            $('#quiz'+(cursor+1)).show();
            $('#quiz'+cursor).addClass('hide');    
            $('#quiz'+(cursor-1)).removeClass('hide');            
            cursor++;
            //$('#closeBtn').hide();
        });  
        $('#quizEndBtn').on("click",function(){
            if($('#quiz_think').hasClass('hide') == false) {
                
                if((($('#think_reply').val()).length < 10 || $('#think_reply').val() == "") && $('#think_reply_file').val() == "") {
                    cswal("10자 이상의 답변이나 사진을 올려주세요.");
                    return;
                }
            }
            
            $('#submitAlert').show();
                               
        });
        
        // 추천해요 클릭시
        $('#recommendYBtn').on("click",function() {
            $('#recommendYBtn').addClass('on');
            $('#recommendNBtn').removeClass('on');
            hasRecommended = true;
            let vdata = {};
    		var csrf_name = $('#csrf').attr("name");
            var csrf_val = $('#csrf').val();

            vdata['book_no'] = $('#book_no').val();
            vdata['quiz_seq'] = $('#quiz_seq').val();
            vdata['qh_seq'] = qh_seq;
            vdata['recommend_yn'] = "Y";
            vdata[csrf_name] = csrf_val;
            
            console.log(vdata);
            // 저장
    		$.ajax({
                type: "POST",
                url : "/book/quizRecommendSaveProc",
                data: vdata,
                dataType:"json",
                success : function(data, status, xhr) {
                    if(data.result=="success"){
                        //console.log(data);
                        //qh_seq = data.qh_seq;
                        cswal("저장되었습니다.");
    					//swal("저장되었습니다.", {
    					//	icon: "success",
    					//}).then((value)=>{
    					//	//location.href = "/member/setting";
    					//});

    				}else{
    					cswal(data.msg);
    				}
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });	            
        });
        $('#recommendNBtn').on("click",function() {
            $('#recommendNBtn').addClass('on');
            $('#recommendYBtn').removeClass('on');
            hasRecommended = true;
            let vdata = {};
    		var csrf_name = $('#csrf').attr("name");
            var csrf_val = $('#csrf').val();

            vdata['book_no'] = $('#book_no').val();
            vdata['quiz_seq'] = $('#quiz_seq').val();
            vdata['qh_seq'] = qh_seq;
            vdata['recommend_yn'] = "N";
            vdata[csrf_name] = csrf_val;
            
            console.log(vdata);
            // 저장
    		$.ajax({
                type: "POST",
                url : "/book/quizRecommendSaveProc",
                data: vdata,
                dataType:"json",
                success : function(data, status, xhr) {
                    if(data.result=="success"){
                        //console.log(data);
                        //qh_seq = data.qh_seq;
                        cswal("저장되었습니다.");
    					//swal("저장되었습니다.", {
    					//	icon: "success",
    					//}).then((value)=>{
    					//	//location.href = "/member/setting";
    					//});

    				}else{
    					cswal(data.msg);
    				}
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });	      
        });
        
        $('#submitBtn').on("click",function() {
            let data = $('#quizForm').serialize();
    		var csrf_name = $('#csrf').attr("name");
            var csrf_val = $('#csrf').val();

            data[csrf_name] = csrf_val;            
            // 저장
    		$.ajax({
                type: "POST",
                url : "/book/quizSaveProc",
                data: data,
                dataType:"json",
                success : function(data, status, xhr) {
                    if(data.result=="success"){
                        qh_seq = data.qh_seq;
    					//swal("저장되었습니다.", {
    					//	icon: "success",
    					//}).then((value)=>{
    					//	//location.href = "/member/setting";
    					//});
                        // 문제 완료
                        $('#submitAlert').hide(); 
                        
                        $('.quiz_contents').hide();
                        score = (data.score*1);
                        if((data.score*1) >= 60) {
                            $('.recommend_contents').show();
                            $('.recommend_contents').removeClass('hide');
                        } else 
                            $('#quizPassFail').show();
                            
                        
    				}else{
    					swal(data.msg);
    				}
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log(jqXHR.responseText);
                }
            });		            
            //$('#closeBtn').hide();
        });
        $('#closeBtn').on("click",function() {
             $('#submitAlert').hide();
             //$('#quiz'+cursor).show();
        });
        
        // 퀴즈 결과 보러 가기
        $('#quizResultBtn').on("click",function() {
            if(!hasRecommended) {
                cswal("추천 여부를 먼저 선택해 주세요.");
                return;
            }
            if(score>=60) {
                location = "/book/quiz_result/<?php echo $data['book_no'];?>/<?php echo $data['quiz_seq'];?>/"+qh_seq;   
            }else {
                $('.recommend_contents').hide();
                $('.recommend_contents').addClass("hide");
                $('.quiz_pass_fail').show();
                $('.recommend_contents').removeClass("hide");
            }
        });        

        $('#restartBtn').on("click",function() {
             location.reload();
             //$('#quiz'+cursor).show();
        });        
        
        $('#stopBtn').on("click",function() {
             location = "/main";
             //$('#quiz'+cursor).show();
        });
    });
    
	function uploadImg($this, obj, i){
		var target = $this.data('target');
		var seq = $this.data('seq');

		$thisfile = $this;
        var fileName = $thisfile.val().split('\\').pop().toLowerCase();
        $thisfile.siblings(".file_text").text(fileName);
        
		if (/(MSIE|Trident)/.test(navigator.userAgent)) {
			$files = $this;
			
			var real = $this;
			var cloned = real.clone(true);
			real.hide();
			cloned.insertAfter(real);

			// Move the real element to the hidden form - you can then submit it
			//real.appendTo("#some-hidden-form");			
		} else {
			$files = $this.clone();
		}	
		
		$("<form action='/book/upload_file' enctype='multipart/form-data' method='post'/>")
			.ajaxForm({
				dataType: 'json',
				beforeSend: function() {
				},
				success: function(data){
				    if(data != "") {
				        $('#'+target).val(data.url);
				        $('.attachment').css("background-image:url('/upload/user_quiz/"+data.url+"')");
				        $('#photo').html("<img src='/upload/user_quiz/"+data.url+"' width='100%'>")
				        
				    }
				},
				complete: function(data) {
					//console.log(data);
				}
			})
			.append( $files )
			.submit();
	}    
    //$('#submitAlert').show();
</script>