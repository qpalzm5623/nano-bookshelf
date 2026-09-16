	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>-->
	<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">내 책장</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 내 책장 -->
			<div class="my_bookcase_wrap bookcase_main">
				<div class="title_explain inner">
					<div class="title_image"><img src="/resources/images/common/symbol.png" alt=""></div>
					<h3><?php echo $userData['user_name']; ?>의 책장</h3>
				</div>

				<div class="bookcase_info_area">
					<div class="inner">
						<div class="bookcase_info">
							<div class="info_title">
								<i class="icon"></i>
								인증완료
							</div>
							<strong class="count"><?php echo @$confirm['confirmCnt'];?></strong>
						</div>
						<div class="bookcase_info">
							<div class="info_title">
								<i class="icon"></i>
								찜
							</div>
							<strong class="count"><?php echo @$confirm['favoriteCnt'];?></strong>
						</div>
						<div class="bookcase_info">
							<div class="info_title">
								<i class="icon"></i>
								내가 푼 문제
							</div>
							<strong class="count"><?php echo @$confirm['quiestionCnt'];?></strong>
						</div>
					</div>
				</div>

				<div class="title_box inner">
					<h3 class="title">관심 주제</h3>
					<a href="/mypage/topic_edit" class="btn_more">수정하기</a>
				</div>
					
				<div class="inner">
					<div class="info_box">
						<ul class="info_list">
							<li class="info_item info_content"><?php echo @$topic[0]; ?></li>
							<li class="info_item info_content"><?php echo @$topic[1]; ?></li>
							<li class="info_item info_content"><?php echo @$topic[2]; ?></li>
						</ul>
					</div>
				</div>
						
				<ul class="menu_link_list">
					<li class="menu_link">
						<a href="/mypage/book_confirm_list" class="inner">
							<strong class="menu_title">독서 인증 기록</strong>
							<span class="menu_text">나의 독서 인증 기록을 확인할 수 있습니다.</span>
						</a>
					</li>
					<li class="menu_link">
						<a href="/mypage/favorite_list" class="inner">
							<strong class="menu_title">찜한 책</strong>
						</a>
					</li>
				</ul>

				<div class="title_box inner">
					<h3 class="title">나의 독서 취향</h3>
					<div class="filter">
						<a href="#" id="chart1" class="btn">카테고리별</a>
						<a href="#" id="chart2" class="btn font_orange">주제별</a>
					</div>
				</div>

				<div class="graph inner" id="graphArea">
                    <canvas id="graph_category" ></canvas>				    
                    <canvas id="graph_subject" class="hide" ></canvas>				    
				</div>

			</div>
			<!-- // 내 책장 -->

		</div>
		<!-- // contents -->
	</div>
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
	});        
	var type = "subject";
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
        $.ajax({
            type: "POST",
            url : "/mypage/graphData",
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
		//console.log($data);
		for(var i = 0; i<$data.length; i++){
			userData[i] = $data[i].cnt;
			labelArr[i] = $data[i].subject!=null?$data[i].subject:"기타";
			total = total + ($data[i].cnt *1);
		}
		const data = {
              labels: labelArr,
              datasets: [{
            		label:'건',
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
    </script>