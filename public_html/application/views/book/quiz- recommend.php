<script>
    $('.nav').hide();
</script>    
<style>
.hide {display:none;}
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
                
				<!-- popup contents -->
                <div class="popup_contents">
                    <?php
                    //print_r($data);
                    //print_r($quizData);                    
                    for($i=1;$i<=$data['quiz_cnt'];$i++) {
                        $type = $quizData['type'];
                        $ext = $quizData['ext'];
                        $q = $quizData['q'];
                        $file = $quizData['img'];
                        $answer_cnt = 0;
                        $c1 = $quizData['c1'][$i];
                        $c2 = $quizData['c2'][$i];
                        $c3 = $quizData['c3'][$i];
                        $c4 = $quizData['c4'][$i];
                        $c5 = $quizData['c5'][$i];
                        
                        if($c5 != "") {
                            $answer_cnt = 5;
                            $quizRow[$i] = array($c1, $c2,$c3, $c4,$c5);
                        }
                        if($c4 != "") {
                            $answer_cnt = 4;
                            $quizRow[$i] = array($c1, $c2,$c3, $c4);
                        }
                        if($c3 != "") {
                            $answer_cnt = 3;
                            $quizRow[$i] = array($c1, $c2,$c3);
                        }
                        if($c2 != "") {
                            $answer_cnt = 2;
                            $quizRow[$i] = array($c1, $c2);
                        }    
                        if($c1 != "") {
                            $answer_cnt = 1;
                            $quizRow[$i] = array($c1);
                        }
                        $quizAnswer[$i] = $quizData['c'.$quizData['a'][$i]][$i];
                        print_r($quizRow);
                        
                        
                        if($type[$i] =="C") {
                    ?>
                        <div class="quiz_form inner  <?php if($i >1) echo "hide";?>" id="quiz<?php echo $i;?>" data-type="multi">
                            <!-- 문제-->
                            <div class="question">
                                <span class="number"><?=$i;?>.</span><?php echo $q[$i];?>
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
                                    if($c1 != "") {
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_1" name="c[<?php echo $i;?>]" value="<?php echo $c1;?>">
                                        <label for="c<?php echo $i?>_1"><?php echo $c1;?></label>
                                    </li>
                                    <?php 
                                    }
                                    ?>
                                    <?php 
                                    if($c2 != "") {
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_2" name="c[<?php echo $i;?>]" value="<?php echo $c2;?>">
                                        <label for="c<?php echo $i?>_2"><?php echo $c2;?></label>
                                    </li>
                                    <?php 
                                    }
                                    ?>
                                    <?php 
                                    if($c3 != "") {
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_3" name="c[<?php echo $i;?>]"  value="<?php echo $c3;?>">
                                        <label for="c<?php echo $i?>_3"><?php echo $c3;?></label>
                                    </li>
                                    <?php 
                                    }
                                    ?>
                                    <?php 
                                    if($c4 != "") {
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_4" name="c[<?php echo $i;?>]"  value="<?php echo $c4;?>">
                                        <label for="c<?php echo $i?>_4"><?php echo $c4;?></label>
                                    </li>
                                    <?php 
                                    }
                                    ?>
                                    <?php 
                                    if($c5 != "") {
                                    ?>
                                    <li class="answer_item">
                                        <input type="radio" id="c<?php echo $i?>_5" name="c[<?php echo $i;?>]"  value="<?php echo $c5;?>">
                                        <label for="c<?php echo $i?>_5"><?php echo $c5;?></label>
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
                                <span class="number"><?=$i;?>.</span><?php echo $q[$i];?>
                            </div>
                            <!-- //문제-->
                            <div class="question_data"><img src="/resources/images/sub/quiz_data.jpg" alt=""></div>
                            <div class="answer_area">
                                <!-- 주관식 -->
                                <div class="essay_form">
                                    <textarea  name="c[<?php echo $i;?>]" placeholder="정답을 입력해 주세요."></textarea>
                                    <!--<button class="btn_mic"></button>-->
                                </div>
                                <!-- // 주관식 -->
                            </div>
                            <span class="notice_text">※ 생각담기 문제는 채점에 포함되지 않아요.</span>
                        </div>                    
                        <?php } ?>
                     <?php }?>
                     
                    <div class="quiz_form inner hide"  id="quiz_think">
                        <!-- 문제-->
                        <div class="question">
                            <span class="number">질문.</span>아래는 디즈니 애니메이션 <인어공주>의 한 부분입니다.
                        </div>
                        <!-- //문제-->
                        <div class="question_data"><img src="/resources/images/sub/quiz_data.jpg" alt=""></div>
                        <div class="answer_area">
                            <!-- 주관식 -->
                            <div class="essay_form">
                                <textarea name="think_reply" placeholder="정답을 입력해 주세요."></textarea>
                                <!--<button class="btn_mic"></button>-->
                            </div>
                            <!-- // 주관식 -->

                            <!-- 첨부파일 -->
                            <div class="attachment">
                                <label class="attachment_upload">
                                    <input type="file" name="think_file">
                                    <i class="icon"></i>
                                    <span class="upload_text">직접 종이에 쓴 생각을 <br>사진으로 찍어 올릴 수 있어요.</span>
                                </label>
                            </div>
                            <!-- // 첨부파일 -->
                        </div>
                        <span class="notice_text">※ 생각담기 문제는 채점에 포함되지 않아요.</span>
                    </div>                        
                </div>
                
				<!-- // popup contents -->
 	
                
				<!-- popup footer -->
                <div class="popup_footer">
                    <div class="btn_area">
                        <a href="#" class="btn_back"><i class="icon_back"></i><span>이전</span></a>
                        <a href="#" class="btn_next btn_next1"><span>다음</span><i class="icon_back"></i></a>
                        <a href="#" id="" class="btn_next btn_next2 hide"><span>답변 제출</span><i class="icon_back"></i></a>
                    </div>
                </div>
				<!-- // popup footer -->
				
                <div class="layer_popup_wrap confirm hide" id="submitAlert" style="background:#fff;">
    				<div class="layer_popup blue_green">
    					<div class="popup_contents">
    						<div class="popup_text">생각담기 답변을 제출하고<br>책 읽기 인증을 완료하겠습니까?</div>
    					</div>
    					<div class="popup_btn_area">
    						<a href="#" class="btn" id="submitBtn">인증 완료하기</a>
    						<a href="#" class="btn" id="closeBtn">돌아가기</a>
    					</div>
    				</div>
    			</div>				
            </div>
        </div>
    </div>	
<script>
    let cursor = 1;
    let cursor_size = <?php echo $data['quiz_cnt'];?>;
    $(function(){
        $('.btn_back').on("click",function() {
            if(cursor == 1) {
                alert('첫번째 페이지입니다.');
            } else {
                $('#quiz'+cursor).hide();
                $('#quiz'+(cursor-1)).show();
            }
            
            if(cursor < cursor_size-1) {
                $('.btn_next1').show();
                $('.btn_next2').hide();
            }           
            
            cursor--;
        });
        $('.btn_next').on("click",function() {
            //정답입력여부 확인
            if($('#quiz'+cursor).data("type") == "one") {
                cswal("정답을 입력하세요.");
                return;             
            } else {
                if($('input[name="c['+cursor+']"]').is(":checked") == false) {
                    cswal("정답을 선택하세요.");
                    return;
                }
            }
            
            if(cursor == cursor_size-1) {
                $('.btn_next1').hide();
                $('.btn_next2').show();
            }
           
            // 마지막 
            if(cursor == cursor_size) {
                $('#submitAlert').show();
                return;
            }
            
            $('#quiz'+cursor).hide();
            $('#quiz'+(cursor+1)).show();
            cursor++;
            //$('#closeBtn').hide();
        });        
        $('#submitBtn').on("click",function() {
             // 생각담기가 있을경우
             
             // 문제 완료
             
             
             $('#closeBtn').hide();
        });
        $('#closeBtn').on("click",function() {
             $('#submitAlert').hide();
        });
    });
    //$('#submitAlert').show();
</script>