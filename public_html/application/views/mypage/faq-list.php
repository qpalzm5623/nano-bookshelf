	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">자주 묻는 질문</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div id="contents" class="contents">

			<!-- 자주 묻는 질문 -->
			<div class="manage_wrap">
				<ul class="board_list">
				    <?php 
				        for($i=0;$i<count($list);$i++){
				            $row=$list[$i];
				    ?>
					<li class="board_item">
						<div class="board_title inner">
							<div class="board_subject"><?php echo $row['faq_title'];?></div>
							<i class="icon_arrow lg"></i>
						</div>
						<div class="board_content board_text_box inner">
							<?php echo nl2br($row['faq_contents']);?>
						</div>
					</li>
				    <?php }?> 
				</ul>
			</div>
			<!-- // 자주 묻는 질문 -->

		</div>
		<!-- // contents -->
 
	</div>
 