	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">내 포인트</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div class="contents">

			<!-- 내 포인트 -->
			<div class="manage_wrap">
				<div class="inner">
					<div class="title_explain" style="display:block">
						<h3><?php echo $userData['user_name'];?> 님의 현재 포인트는<br><strong class="font_blue_green"><?php echo $userData['point'];?> 포인트</strong>입니다.</h3>
						    <span style="font-size:12pt">포인트 기준 : 정답수X3 + 생각담기 (5)</span>
					</div>
				</div>

				<div class="point_area">
					<!-- 기간 -->
					<div class="period">
						<span class="period_title">기간</span>
    					<select name="year" id="year">
    							<?php for($i=date("Y");$i>=2023;$i--){?>
    							<option value="<?php echo $i;?>" <?php if(@$year ==$i){ echo "selected";}?>><?php echo $i;?>년</option>
    						    <?php }?>
    					</select>
    					<select name="month" id="month">
        					    <option value="" <?php if(@$month ==""){ echo "selected";}?>>전체</option>
    							<?php for($i=1;$i<=12;$i++){?>
    							<option value="<?php echo $i;?>" <?php if(@$month ==$i){ echo "selected";}?>><?php echo sprintf("%02d", $i);?>월</option>
    						    <?php }?>
    					</select>
					</div>
					<!-- // 기간 -->
				
					<!-- 포인트 목록 -->
					<ul class="point_list">
					    <?php 
					    $point = 0;
					    for($i=0;$i<count($pointList);$i++){
					        $row = $pointList[$i];
					        $point = $point + $row['point'];
					    ?>
						<li class="point_item">
							<div class="point_inner">
								<div class="point_title"><?php echo $row['content'];?></div>
								<span class="point_amount">+ <?php echo $row['point'];?></span>
							</div>
							<div class="point_inner">
								<span class="point_date"><?php echo substr($row['reg_date'],0,10);?> </span>
								<span class="total_point"><?php echo $point;?></span>
							</div>
						</li>
					    <?php }?>
					   
					</ul>
					<!-- // 포인트 목록 -->
				</div>
			</div>
			<!-- // 내포인트 -->

		</div>
		<!-- // contents -->

	</div>
	<script>
	    $(function() {
			$('#year').on("change",function(){
			    location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val();
			});
			$('#month').on("change",function(){
			    location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val();
			});
		});
	</script>
	