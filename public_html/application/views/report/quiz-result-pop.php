			<div class="bookquiz_portfolio">
				
				<div class="title_box inner">
					<div class="title_image"><img src="/resources/images/common/symbol.png" alt=""></div>
					<h2 class="title">북퀴즈결과</h2>
				</div>

				<div class="basic_table">
					<table>
						<colgroup>
							<col style="width:25%;">
							<col style="width:25%;">
							<col style="width:25%;">
							<col style="width:25%;">
						</colgroup>
						<tr>
							<th>이름</th>
							<td colspan="3"><?php echo $data['user_name'];?></td>
						</tr>
						<tr>
							<th>학년</th>
							<td><?php echo $data['grade'];?></td>
							<th>성별</th>
							<td><?php echo $data['gender']=="M"?"남":"여";?></td>
						</tr>
						<tr>
							<th>소속</th>
							<td colspan="3"><?php echo $data['group_name'];?></td>
						</tr>
						<tr>
							<th>반</th>
							<td><?php echo $data['class_name'];?></td>
							<th>선생님</th>
							<td><?php echo $data['teacher_name'];?></td>
						</tr>
						<tr>
							<th>날짜</th>
							<td colspan="3"><?php echo $info['reg_date'];?></td>
						</tr>
					</table>
				</div>

                <!-- 퀴즈 문제풀이 -->
                <div class="book_quiz_result"  style="margin-top:30px;width:100%;">
                    <!-- 책 정보 -->
                    <div class="book_info_area">
                        <div class="image_box">
                            <img src="/upload/book/<?php echo $info['book_cover'];?>" alt="" onError="this.src='/resources/images/common/no_image.png'">
                        </div>
                        <div class="book_info" style="width:100%;">
                            <h3 class="subject ellipsis_multi" style="text-align:center"><?php echo $info['book_name'];?></h3>
                            <span class="series"><?php echo $info['serise'];?></span>
                            <span class="author"><?php echo $info['author'];?></span>
                            
                            <div class="info_box">
                                <ul class="info_list">
                                    <li class="info_item">
                                        <span class="info_title">출판사</span>
                                        <div class="info_content"><?php echo $info['publisher'];?></div>
                                    </li>
                                    <li class="info_item">
                                        <span class="info_title">카테고리</span>
                                        <div class="info_content"><?php echo $info['subject'];?></div>
                                    </li>
                                    <li class="info_item">
                                        <span class="info_title">문항 수</span>
                                        <div class="info_content"><?php echo $info['quiz_cnt'];?></div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
 
                    <!-- 북퀴즈 결과 -->
                    <div class="quiz_result_area">
                        <div class="result_title_box">
                            <h4 class="result_title"><?php echo substr($info['reg_date'],0,10);?> 북퀴즈 결과</h4>
                        </div>

                        <div class="quiz_summary">
                            <dl>
                                <dt>맞는 문제</dt>
                                <dd><?php echo $historyData['correct_cnt'];?></dd>
                            </dl>
                            <dl>
                                <dt>틀린 문제</dt>
                                <dd><?php echo $info['quiz_cnt']-$historyData['correct_cnt'];?></dd>
                            </dl>
                            <dl>
                                <dt>내점수</dt>
                                <dd><?php echo $historyData['score'];?></dd>
                            </dl>
                        </div>
                        
                        <div class="quiz_summary" style="background:#fff">
                            <h4 class="result_title">오답리스트</h4>
                                  <?php 
                                  $class = "";
                                  $ar = unserialize($info['quiz_answer_result']);
                                  $a = unserialize($info['quiz_result']);
                                  $quizData = unserialize($info['quiz_contents']);
                                  for($i=1;$i<=$info['quiz_cnt'];$i++) {
                                      $type = $quizData['type'];
                                      $ext = $quizData['ext'];
                                      $q = $quizData['q'][$i];
                                      $file = @$quizData['img'];
                                      $answer_cnt = 0;
                                      if($type[$i] == "C") {
                                          $c1 = $quizData['c1'][$i];
                                          $c2 = $quizData['c2'][$i];
                                          $c3 = $quizData['c3'][$i];
                                          $c4 = $quizData['c4'][$i];
                                          $c5 = $quizData['c5'][$i];
                                          if($ar[$i] == $a['a'][$i]) 
                                              $class = "correct";
                                          else
                                              $class = "wrong";
                                          if($class == "wrong") {
                                      ?>
                                      <div style="border:1px solid #ddd;margin-top:25px;padding:10px;">
                                          <div class="question"><?php echo $i;?>. <?php echo $q;?></div>
                                          <div class="answer_area">
                                                  <?php if($c1 != "") {?>
                                                  <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c1?"checked":"";?>> <?php echo $c1;?></div>
                                                  <?php }?>
                                                  <?php if($c2 != "") {?>
                                                  <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c2?"checked":"";?>> <?php echo $c2;?></div>
                                                  <?php }?>
                                                  <?php if($c3 != "") {?>
                                                  <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c3?"checked":"";?>> <?php echo $c3;?></div>
                                                  <?php }?>
                                                  <?php if($c4 != "") {?>
                                                  <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c4?"checked":"";?>> <?php echo $c4;?></div>
                                                  <?php }?>
                                                  <?php if($c5 != "") {?>
                                                  <div class="answer_content"><input type="radio" name="quiz<?php echo $i;?>" <?php echo $ar[$i]==$c5?"checked":"";?>> <?php echo $c5;?></div>
                                                  <?php }?>
                                              <?php if($class == "wrong"){ ?>
                                              <div class="answer_box  correct" style="display:inline-flex;padding:5px;" >
                                                  <span class="answer_title bg_blue_green">정답 : </span>
                                                  <div class="answer_content"><?php echo $a['a'][$i];?></div>
                                              </div>
                                              <?php }?>
                                          </div>
                                      </div>
                                      <?php 
                                          }
                                      } else {
                              	        $quiz_result_data = explode(",", $a['a'][$i]);
                              	        $class = "wrong";
                              	        foreach($quiz_result_data as $value) {
                                  	        if(trim($value) == $ar[$i]) {
                                  	            $class = "correct";
                                  	        }    	        
                                  	    }
                                              
                                          if($class == "wrong") {
                                      ?>
                                      <div style="border:1px solid #ddd;padding:10px;">
                                          <div class="question"><?php echo $i;?>. <?php echo $q;?></div>
                                          <div class="answer_area">
                                              <?php if($class == "wrong"){ ?>
                                              <div class="answer_box  correct"  style="display:inline-flex;padding:5px;" >
                                                  <span class="answer_title bg_blue_green">정답 : </span>
                                                  <div class="answer_content"><?php echo $a['a'][$i];?></div>
                                              </div>
                                              <?php }?>
                                          </div>
                                      </div>
                                      <?php 
                                          }                                            
                                      }
                                  } ?>
                        </div>                        
        				<!-- 도서 목록 -->
        				<ul class="book_list type_list">
        					<li class="book inner">
        						<div class="think_box">
        							<span class="think_title">생각담기</span>
        							<div class="question">Q. <?php 
                                    if($info['think_quiz_seq'] < 7) {
                                        echo $questionList[$info['think_quiz_seq']];
                                    } else {
                                        echo $info['think_quiz'];
                                    }
                                    
                                ?> </div>
        							<div class="answer"><?php echo nl2br($info['think_reply']);?></div>
        						</div>
        					</li>
        				</ul>                            
 
                    </div>
                    <!-- // 북퀴즈 결과 -->
                </div>
                <!-- // 퀴즈 문제풀이 -->
                    
                
			</div>
		</div>
 