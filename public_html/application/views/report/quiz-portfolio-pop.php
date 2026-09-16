	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"/>
    <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>-->
	<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>			
			<div class="bookquiz_portfolio">
				
				<div class="title_box inner">
					<div class="title_image"><img src="/resources/images/common/symbol.png" alt=""></div>
					<h2 class="title">포트폴리오</h2>
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
							<td colspan="3"><?php echo $data['reg_date'];?></td>
						</tr>
					</table>
				</div>
				<div class="quiz_result_area">
				    <?php if($_REQUEST['startDate']){?>
				    <div class="book_content" style="font-weight: bold;text-align:center">
				    <?php echo $_REQUEST['startDate'];?> 부터
				    </div>
				    <?php }?>
				    <?php if($_REQUEST['endDate']){?>
				    <div class="book_content" style="font-weight: bold;text-align:center">
				    <?php echo $_REQUEST['endDate'];?> 까지
				    </div>
				    <?php }?>
				    <div class="book_content" style="font-weight: bold;text-align:center">
				    <span style="color:#00aca8">총 <?php echo count(@$list);?> 권</span> 읽었습니다.
				    </div>
				</div>
                <div class="quiz_result_area">
                    <div class="result_title_box" >
                        <h4 class="result_title" ><?php echo $data['user_name'];?> 학생의 독서 취향</h4>
                    </div>				
                </div>
                <div class="quiz_result_area" style="margin-top:90px;">
    				<div class="title_box inner" style="justify-content:end;">
    					<div class="filter text-right">
    						<a href="#" id="chart1" class="btn font_orange">카테고리별</a>
    						<a href="#" id="chart2" class="btn">주제별</a>
    					</div>
    				</div>

    				<div class="graph inner" id="graphArea">
                        <canvas id="graph_category" ></canvas>				    
                        <canvas id="graph_subject" class="hide" ></canvas>				    
    				</div>                
                </div>
					<div class="book_area">
						<ul class="book_list swiper-wrapper">
        				    <?php 
        				    for($i=0;$i<count(@$list);$i++) {
        				        
        				        $row = @$list[$i];    
        				        if(empty($book[$row['book_no']]) ) {
        				        $book[$row['book_no']] = $row['book_no'];
        				        
        				    ?>						    
        							<li class="book swiper-slide">
        								<img src="/upload/book/<?php echo $row['book_cover'];?>"  style="width:80px;" alt="" onError="this.src='/resources/images/common/no_image.png'">
        							</li>

							    <?php }?>
							<?php }?>
                          </ul>    
                      </div>
				<h3 class="sub_title inner">북퀴즈 응시 이력
				    <span class="span" id="showUp">자세히 보기▼</span>
				</h3>
				<div class="hide" id="book_list">
                  <?php 
                    for($i=0;$i<count($list);$i++) {
                       $info = $list[$i];
                       if(empty($date)) $date = substr($info['reg_date'], 0 , 10);
                       if($date != substr($info['reg_date'], 0 , 10) || $i == 0) {
                           $date = substr($info['reg_date'], 0 , 10);
                    ?>				
                    
    				<div class="list_set_up">
    					<div class="inner">
    						<span class="count"><?php echo substr($info['reg_date'],0,10);?></span>
    					</div>
    				</div>
    			    <?php }?>
    				<!-- 도서 목록 -->
    				<ul class="book_list type_list">
    					<li class="book inner">
    						<div class="image_box">
    							<a href="#"><img src="/upload/book/<?php echo $info['book_cover'];?>"  style="width:120px;" alt="" onError="this.src='/resources/images/common/no_image.png'"></a>
    						</div>
    						<div class="book_content">
    							<a href="#" class="book_subject ellipsis_multi"><?php echo $info['book_name'];?></a>
    							<ul class="book_info">
    								<li><?php echo $info['setter'];?></li>
    								<li><?php echo $info['score'];?></li>
    							</ul>
    						</div>
    						<div class="think_box">
    							<span class="think_title">생각담기</span>
    							<div class="question">Q. <?php 
                                    if($info['think_quiz_seq'] < 15) {
                                        echo @$questionList[$info['think_quiz_seq']];
                                    } else {
                                        echo $info['think_quiz'];
                                    }
                                    
                                ?></div>
    							<div class="answer"><?php echo nl2br($info['think_reply']);?><?php echo $info['think_reply_file']!=""?"<img src='/upload/user_quiz/".$info['think_reply_file']."' style='width:100%;'>":"";?></div>
    						</div>
    					</li>
    				</ul>
    			    <?php }?>
    			</div>		
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <script>
	$(function(){
		loadMonthChart();
		$('#chart1').on("click",function(){
		    type = "category";
		    $('#chart1').addClass("font_orange");
		    $('#chart2').removeClass("font_orange");
		    loadMonthChart();
		});
		$('#chart2').on("click",function(){
		    type = "subject";
		    $('#chart1').removeClass("font_orange");
		    $('#chart2').addClass("font_orange");
		    loadMonthChart();
		});		
		$('#showUp').on("click",function(){
		    if($(this).text() == "자세히 보기▼") {
		        $(this).text("자세히 보기▲");
		        $('#book_list').hide();
		    } else {
		        $(this).text("자세히 보기▼");
		        $('#book_list').show();
		        
		    }
		    
		    
		});
	});        
	var type = "category";
	function loadMonthChart()
	{
	    
        
        if(type == "category") {
            $('#graph_category').show();
            $('#graph_subject').hide();
        } else {
            $('#graph_category').hide();
            $('#graph_subject').show();            
        }
        	    
		var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        var formData = {};
        formData[csrf_name] = csrf_val;
        formData["type"] = type;
        formData["user_id"] = "<?php echo $data['user_id'];?>";
        formData["user_seq"] = "<?php echo $data['user_seq'];?>";
        
        formData["start_date"] = "<?php echo $_REQUEST['startDate'];?>";
        formData["end_date"] = "<?php echo $_REQUEST['endDate'];?>";
        $.ajax({
            type: "POST",
            url : "/report/graphDataPortfolio",
            data: formData,
            dataType:"json",
            success : function($data, status, xhr) {
	    	   makeChart($data.data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });
	}

	function makeChart($data)
	{
	    

	    
		var labelArr = [];
		var userData = [];
		var total = 0;
		console.log($data);
		for(var i = 0; i<$data.length; i++){
			userData[i] = $data[i].cnt;
			labelArr[i] = $data[i].subject!=null?$data[i].subject:"기타";
			total = total + ($data[i].cnt *1);
		}
		const data = {
              labels: labelArr,
              datasets: [{
            		label:'%',
            		datalabels : {
                    anchor: 'end', // 표시 위치
                    align: 'top',  // 표시위치에서 어디쪽으로 배치할지
            		formatter:function(value,context){
                        // data 에 넣은 데이타 순번. 물론 0 부터 시작
                        var idx = context.dataIndex;
                        // 여기선 첫번째 데이타엔 단위를 '원' 으로, 그 다음 데이타엔 'P' 를 사용
                        // addComma() 는 여기서 기술하지 않았지만, 천단위 세팅. ChartJS 의 data 엔 숫자만 입력
                        return labelArr[idx]+ '\n' +value+'';
                    },
            	    display:false
                },
                data: userData,
                backgroundColor: [
                  'rgba(255, 26, 104, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)',
                  'rgba(0, 0, 0, 0.2)'
                ],
                borderColor: [
                  'rgba(255, 26, 104, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)',
                  'rgba(0, 0, 0, 1)'
                ],
                borderWidth: 1,
                cutout: '60%'
              }]
          };
                  

		const centerTextDoughnut = {
			id: 'centerTextDoughnut',
			afterDatasetsDraw(chart,args,pluginOptions){
				const { ctx } = chart;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.font = 'bold 20px sans-serif';
				const text = total+'권';
				const textWidth = ctx.measureText(text).width;
				const x = chart.getDatasetMeta(0).data[0].x;
				const y = chart.getDatasetMeta(0).data[0].y;
				ctx.fillText(text, x, y);
			}
		}

    // config
        const config = {
            type: 'doughnut',
            data,
            options: {
    		    plugins: {
    			    legend: {
    				    position: 'bottom',
    					    labels: {
    					        boxWidth:10
    						}
    					}
    				}
                },
    			plugins: [centerTextDoughnut]
            };
            
        // render init block
        
        const myChart = new Chart(
            document.getElementById('graph_'+type),
            config
        );

        
        /*
        new Chart(document.getElementById("graph"), {
            type: 'doughnut',
            data: {
              labels: ["Africa", "Asia", "Europe", "Latin America", "North America"],
              datasets: [
                {
                  label: "Population (millions)",
                  backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
                  data: [2478,5267,734,784,433]
                }
              ]
            },
            options: {
              title: {
                display: true,
                text: 'Predicted world population (millions) in 2050'
              }
            }
        });        
        */
	}        
	
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
    </script>		