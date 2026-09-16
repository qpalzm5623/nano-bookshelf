<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">고객센터</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 1:1 문의 -->
		<div class="inquiry_wrap">
			<ul class="tab_type">
				<li><a href="/board/faq">자주 묻는 질문</a></li>
				<li><a href="/board/qnaWrite" class="on">1:1 문의</a></li>
			</ul>
			<div class="inquiry_write">
				<div class="sub_tab">
					<ul>
						<li><a href="/board/qnaWrite" class="on">문의하기</a></li>
						<li><a href="/board/qnaList">나의 문의 내역</a></li>
					</ul>
				</div>
				<div class="inquiry_form">
					<ul>
						<li>
							<label for="tit_inquiry" class="label_inquiry">제목</label>
							<input type="text" id="tit_inquiry" class="input_inquiry">
						</li>
						<li>
							<label for="cont_inquiry" class="label_inquiry">내용</label>
							<textarea id="cont_inquiry"></textarea>
						</li>
					</ul>
					<a href="javascript:wrtieQna()" class="btn_inquiry">등 록 하 기</a>
				</div>
			</div>
		</div>
		<!-- //1:1 문의 -->
	</div>
	<!-- //container -->
	<script>
	function wrtieQna()
	{
		var qna_title = $('#tit_inquiry').val();
		var qna_contents = $('#cont_inquiry').val();

		if(qna_title == ""){
			alert("제목을 작성해주세요");
			$('#tit_inquiry').focus();
			return
		}

		if(qna_contents == ""){
			alert("내용을 작성해주세요");
			$('#cont_inquiry').focus();
			return
		}

		var csrf_name = $('#csrf').attr("name");
		var csrf_val = $('#csrf').val();


		var data = {
			"qna_title"  : qna_title,
			"qna_contents"	:	qna_contents
		};

		data[csrf_name] = csrf_val;

		$.ajax({
			type: "POST",
			url : "/board/qnaWriteProc",
			data: data,
			dataType:"json",
			success : function(data, status, xhr) {
				swal("작성되었습니다.", {
					icon: "success",
				}).then((value)=>{
					location.href="/board/qnaList";
				});
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR.responseText);
			}
		});
	}
	</script>
