<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">공지사항</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 공지사항 -->
		<div class="notice_wrap">
			<ul>
				<?php for($i=0; $i<count($noticeList); $i++){ ?>
				<li>
					<div class="title">
						<a href="#" onclick="readNotice(this,'<?php echo $noticeList[$i]['notice_seq'] ?>')">
							<strong class="tit"><?php echo $noticeList[$i]['notice_title'] ?></strong>
							<span class="date"><?php echo date("Y-m-d",strtotime($noticeList[$i]['notice_reg_datetime'])); ?></span>
						</a>
					</div>
					<div class="cont">
						<?php echo $noticeList[$i]['notice_contents'] ?>
					</div>
				</li>
				<?php } ?>
			</ul>
		</div>
		<!-- //공지사항 -->
	</div>
	<!-- //container -->
<script>
function readNotice(obj,notice_seq)
{
	var csrf_name = $('#csrf').attr("name");
	var csrf_val = $('#csrf').val();

	var data = {
		"notice_seq"  : notice_seq
	};

	data[csrf_name] = csrf_val;

	$.ajax({
		type: "POST",
		url : "/board/noticeReadProc",
		data: data,
		dataType:"json",
		success : function(data, status, xhr) {
			handleNoticeToggle(obj);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(jqXHR.responseText);
		}
	});

}
</script>
