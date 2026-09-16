<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<script>
    $(function() {
        setTimeout(function() {
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
        }, 300);
    });
</script>
<style>
.list_set_up {
    padding: 7px 0 8px;
    background: #ddd;
    margin: 17px 0px 0px 0px;
}
.katex { font-size: 1.1em; }
</style>	
	
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
		</header>

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
                    <!-- 퀴즈 문제풀이 -->
                    <div class="book_quiz_result">
                        <!-- 책 정보 -->
                        <div class="book_info_area">
                            <div class="image_box">
                                <img src="/upload/book/<?php echo $data['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'">
                                <span class="book_badge"></span>
                            </div>
                            <div class="book_info" style="width:100%;">
        						<h3 class="subject ellipsis_multi"><?php echo $data['book_name'];?></h3>
        						<span class="series"><?php echo $data['serise'];?></span>
        						<span class="author"><?php echo $data['author'];?></span>
                                
                                <div class="info_box">
                                    <ul class="info_list">
                                        <li class="info_item">
                                            <span class="info_title">출판사</span>
                                            <div class="info_content"><?php echo $data['publisher'];?></div>
                                        </li>
                                        <li class="info_item">
                                            <span class="info_title">카테고리</span>
                                            <div class="info_content"><?php echo $data['subject'];?></div>
                                        </li>
                                        <li class="info_item">
                                            <span class="info_title">문항 수</span>
                                            <div class="info_content"><?php echo $data['quiz_cnt'];?></div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <!-- // 책 정보 -->

                        <!-- 북퀴즈 결과 -->
                        <div class="quiz_result_area">
                            <div class="result_title_box">
                                <h4 class="result_title"><?php echo substr($historyData['reg_date'], 0,10);?> 북퀴즈 결과</h4>
                            </div>

                            <div class="quiz_summary">
                                <dl>
                                    <dt>맞은 문제</dt>
                                    <dd><?php echo $historyData['correct_cnt'];?></dd>
                                </dl>
                                <dl>
                                    <dt>틀린 문제</dt>
                                    <dd><?php echo $data['quiz_cnt']-$historyData['correct_cnt'];?></dd>
                                </dl>
                                <dl>
                                    <dt>내점수</dt>
                                    <dd><?php echo $historyData['score'];?></dd>
                                </dl>
                            </div>
                            
                            <ul class="quiz_result">
                                <?php 
                                $class = "";
                                
                                $ar = unserialize($historyData['quiz_answer_result']);
                                $a = unserialize($historyData['quiz_result']);
                                for($i=1;$i<=$data['quiz_cnt'];$i++) {
                                    $type = $quizData['type'];
                                    $ext = $quizData['ext'];
                                    $q = $quizData['q'][$i];
                                    $file = @$quizData['img'];
                                    $answer_cnt = 0;
                                    $c1 = $quizData['c1'][$i];
                                    $c2 = $quizData['c2'][$i];
                                    $c3 = $quizData['c3'][$i];
                                    $c4 = $quizData['c4'][$i];
                                    $c5 = $quizData['c5'][$i];
                        	        if($type[$i] == "C") {
                                        if($ar[$i] == $a['a'][$i]) 
                                            $class = "correct";
                                        else
                                            $class = "wrong";
                            	    } else {
                            	        $quiz_result_data = explode(",", $a['a'][$i]);
                            	        $class = "wrong";
                            	        foreach($quiz_result_data as $value) {
                                	        if(trim($value) == $ar[$i]) {
                                	            $class = "correct";
                                	        }    	        
                                	    }
                            	    }
                                    
                                    //if($ar[$i] == $a['a'][$i]) 
                                    //    $class = "correct";
                                    //else
                                    //    $class = "wrong";
                                ?>
                                <li class="quiz <?php echo $class;?>">
                                    <div class="question"><?php echo $i;?>. <?php echo $q;?></div>
                                    <div class="answer_area">
                                        <div class="answer_box">
                                            <span class="answer_title">나의답</span>
                                            <div class="answer_content"><?php echo $ar[$i];?></div>
                                        </div>
                                        <?php if($class == "wrong"){ ?>
                                        <div class="answer_box">
                                            <span class="answer_title bg_blue_green">정답</span>
                                            <div class="answer_content"><?php echo $a['a'][$i];?></div>
                                        </div>
                                        <?php }?>
                                    </div>
                                </li>
                                <!--
                                <li class="quiz correct">
                                    <div class="question">1. 아래 내용 중 틀린 것을 고르세요.</div>
                                    <div class="answer_area">
                                        <div class="answer_box">
                                            <span class="answer_title">나의답</span>
                                            <div class="answer_content">텍스트 샘플</div>
                                        </div>
                                    </div>
                                </li>
                                -->
                                <?php } ?>
                            </ul>
                        </div>
                        <!-- // 북퀴즈 결과 -->
                    </div>
                    <!-- // 퀴즈 문제풀이 -->
                </div>
				<!-- // popup contents -->
                
            </div>
        </div>
    </div>