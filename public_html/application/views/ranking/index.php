<?php
function mytory_asterisk($string) {
		$string = trim($string);
		$length = mb_strlen($string, 'utf-8');
		$string_changed = $string;
		if ($length <= 2) {
			// 한두 글자면 그냥 뒤에 별표 붙여서 내보낸다.
			$string_changed = mb_substr($string, 0, 1, 'utf-8') . '*';
		}
		if ($length >= 3) {
			// 3으로 나눠서 앞뒤.
			$leave_length = floor($length/3); // 남겨 둘 길이. 반올림하니 너무 많이 남기게 돼, 내림으로 해서 남기는 걸 줄였다.
			$asterisk_length = $length - ($leave_length * 2);
			$offset = $leave_length + $asterisk_length;
			$head = mb_substr($string, 0, $leave_length, 'utf-8');
			$tail = mb_substr($string, $offset, $leave_length, 'utf-8');
			$string_changed = $head . implode('', array_fill(0, $asterisk_length, '*')) . $tail;
		}
		return $string_changed;
	}
?>
	<style>
.layer_popup .popup_text {
    line-height: 29px;
    font-size: 16px;
}    
    .ranking_list_area {min-height:calc(100vh - 240px); margin-top:16px; padding:0 20px 22px; background:#fff; border-radius:20px 20px 0 0;}
	</style>
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">랭킹</h2>
				<a href="#" class="btn_info"><i class="icon_info"></i>정보</a>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 랭킹 -->
			<div class="ranking_wrap">

				<!-- 기간 -->
				<div class="period">
					<span class="period_title">기간</span>
					<select name="year" id="year">
							<?php for($i=date("Y");$i>=2023;$i--){?>
							<option value="<?php echo $i;?>" <?php if(@$year ==$i){ echo "selected";}?>><?php echo $i;?>년</option>
						    <?php }?>
					</select>
					<select name="month" id="month">
							<?php for($i=1;$i<=12;$i++){?>
							<option value="<?php echo $i;?>" <?php if(@$month ==$i){ echo "selected";}?>><?php echo sprintf("%02d", $i);?>월</option>
						    <?php }?>
					</select>
				</div>
				<!-- // 기간 -->

				<div class="ranking_area">
					<div class="inner">
						
						<div class="ranking_top">
							<div class="checkbox">
								<input type="checkbox" id="myGroup" name="myGroup" value="Y" <?php echo @$_GET['myGroup']=="Y"?"checked":"";?>><label for="myGroup">내 학원만 보기</label>
							</div>
						</div>
						
						<div class="ranking_list_area"> <!-- 240303 추가-->
    						<!-- 랭킹 목록 -->
    						<ul class="ranking_list">
    						    <?php 
    						    for($i=0;$i<count(@$rankList);$i++){
    						        $row = $rankList[$i];
    						    ?>
    							<li>
    								<span class="number"><?php echo $i+1;?></span>
    								<div class="name"><?php echo (@$_GET['myGroup']=="Y") ? $row['user_name'] : mytory_asterisk($row['user_name']);?><BR><span class="class">(<?php echo $row['group_name'];?>-<?php echo $row['class_name'];?>)</span></div>
    								<div class="point"><?php echo number_format($row['point']);?>P</div>
    							</li>
    						    <?php }?>
    						</ul>
    						<!-- // 랭킹 목록 -->
    					</div>
						<!--<div class="bg"></div>-->
					</div>
				</div>

			</div>
			<!-- // 랭킹 -->

		</div>
		<!-- contents -->
		
			<!-- 알림 팝업 -->
			<div class="layer_popup_wrap confirm" id="infoLayer">
				<div class="layer_popup">
					<div class="popup_contents">
						<div class="popup_text">매월 1일 00시 00분~말일 23시 59분까지<BR>
실시간으로 획득한  합계 포인트를 기준으로<BR>
월별 랭킹이 집계됩니다.
</div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close">확 인</a>
					</div>
				</div>
			</div>
			<!-- // 알림 팝업 -->		
		
	</div>
	<script>
	    $(function() {
	        $('#myGroup').on("change",function(){
	            if($('#myGroup').is(":checked") == true)
			        location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val()+"&myGroup=Y";
			    else
			        location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val()+"&myGroup=";
			});
			$('.btn_info').on("click", function(){
			    $('#infoLayer').show();
			});	    
			$('#year').on("change",function(){
			    location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val();
			});
			$('#month').on("change",function(){
			    location="?year="+$('#year :selected').val()+"&month="+$('#month :selected').val();
			});
		});
	</script>
	