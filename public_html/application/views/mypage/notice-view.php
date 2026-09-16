
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">공지사항</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 공지사항 -->
			<div class="manage_wrap">
				<ul class="board_list">
				    <?php 
				            $row=$data;
				    ?>
					<li class="board_item on">
						<div class="board_title inner">
							<div class="board_subject"><?php echo $row['notice_title'];?></div>
							<span class="board_date"><?php echo date("Y-m-d", strtotime($row['notice_reg_datetime']));?></span>
							<i class="icon_arrow lg"></i>
						</div>
						<div class="board_content board_text_box inner">
							<?php echo nl2br($row['notice_contents']);?>
						</div>
					</li>
				</ul>
			</div>
			<!-- // 공지사항 -->

		</div>
		<!-- // contents -->

	</div>
 