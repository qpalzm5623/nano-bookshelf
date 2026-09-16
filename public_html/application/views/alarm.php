<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title page_title_left">알림</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 알림 -->
		<div class="alarm_area">
			<?php if(count($alarmData)>0){ ?>
			<a href="javascript:readAllAlarm()" class="btn_alarm_delete">전체 알림 삭제</a>
			<ul class="list_alarm">
				<?php for($i=0; $i<count($alarmData); $i++){ ?>
				<li class="<?php echo $alarmData[$i]['alarm_type']!='quiz'&&$alarmData[$i]['alarm_type']!='carbon'&&$alarmData[$i]['alarm_type']!='qna'?"img_type":"" ?>">
					<a href="#" onclick="readAlarm('<?php echo $alarmData[$i]['alarm_seq'] ?>','<?php echo $alarmData[$i]['link'] ?>')">
						<?php if($alarmData[$i]['alarm_type']!='quiz'&&$alarmData[$i]['alarm_type']!='carbon'&&$alarmData[$i]['alarm_type']!='qna'){ ?>
							<?php if(empty($alarmData[$i]['send_profile']) && $alarmData[$i]['send_id']!="admin"){ ?>
								<img src="/images/common/user.png" class="user_img" alt="">
							<?php }else if($alarmData[$i]['send_id']=="admin"){ ?>
								<img src="/images/layout/footer_logo.png" class="user_img" alt="">
							<?php }else{ ?>
								<img src="/upload/member/<?php echo $alarmData[$i]['send_profile']; ?>" class="user_img" alt="">
							<?php } ?>

						<?php } ?>
						<p class="expl"><?php echo $alarmData[$i]['title'] ?></p>
						<span class="date"><?php echo date("Y-m-d",strtotime($alarmData[$i]['reg_date'])); ?></span>
						<?php if($alarmData[$i]['alarm_type']!='quiz'&&$alarmData[$i]['alarm_type']!='carbon'&&$alarmData[$i]['alarm_type']!='qna'){ ?>
						<?php $images = explode("|",$alarmData[$i]['feed_photo']) ?>
						<img src="/upload/member/feed/<?php echo $images[0] ?>" class="thumb" alt="">
						<?php } ?>
					</a>
				</li>
				<?php } ?>
			</ul>
		<?php } ?>
		</div>
		<!-- //알림 -->
	</div>
	<!-- //container -->
	<script>
	$(function(){
		readAllAuto();
	});

	function readAlarm($alarm_seq,$url)
	{
		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "alarm_seq" : $alarm_seq
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/alarmReadProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        location.href = $url;
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}

	function readAllAlarm()
	{
		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {

    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/alarmReadAllProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
				swal("전체 알람 삭제했습니다.", {
					icon: "success",
				}).then((value)=>{
					location.reload();
				});
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}

	function readAllAuto()
	{
		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {

    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/alarmReadAllProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {

      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}
	</script>
