<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">퀴즈</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 퀴즈 -->
		<div class="quiz_wrap">
			<div class="quiz_question">
        <!-- 문제 -->
				<div class="cont_question">
					<div class="tit" id="tit"></div>
					<div class="cont" id="question"></div>
					<span class="pagination" id="page"></span>
				</div>
				<div class="answer" id="answerWrap">
				</div>
				<div class="quiz_explain" id="quiz_discription" style="display:none;">
					<div class="expl" id="answer_discription">

					</div>
					<div class="btn" id="btn"></div>
				</div>
        <!-- 정답 -->
			</div>
		</div>
		<!-- //퀴즈 -->
	</div>
	<!-- //container -->

	<script>
	var tno = 1;
	var quizData;
	$(function(){
		quizLoad();
	});
	function quizLoad()
	{

		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "tno" : tno
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/content/quizLoad",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        quizData = data.data;
				makeTitle(quizData);
				if(data.data.total_quiz==tno){
					$('#btn').html('<a href="javascript:quizComplete()" class="btn_next">결과보기</a>');
				}else{
					$('#btn').html('<a href="javascript:nextQuiz()" class="btn_next">다음 문제로</a>');
				}

				var html = "";
				if(quizData.quiz_type=="t1"){
					html += makeScriptHtml(quizData);
				}else{
					html += makeOxHtml(quizData);
				}

				$('#answerWrap').html(html);

				$('#answerWrap').show();

      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}

	function nextQuiz()
	{
		tno++;
		$('#quiz_discription').hide();

		quizLoad();
	}

	function quizComplete()
	{
		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {

    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/content/quizCompleteProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        location.href = "/content/quizResult";
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}

	function makeTitle($data)
	{
		$('#question').text($data.quiz_title);
		$('#page').text(tno+"/"+$data.total_quiz);
		$('#tit').text("문제");
	}

	function makeOxHtml($data)
	{
		var html = "";
		html += '<a href="javascript:clickAnswer(\'t2\',\'O\')"><img src="/images/content/quiz_o.png" alt="O"></a>';
		html += '<a href="javascript:clickAnswer(\'t2\',\'X\')"><img src="/images/content/quiz_x.png" alt="X"></a>';

		return html;
	}

	function makeScriptHtml($data)
	{
		var html = "";
		html += '<ul>';
		html += '<li>';
		html += '<input type="radio" id="answer1" class="radio_answer" name="answer" value="'+$data.quiz_script[0]+'" onchange="clickAnswer(\'t1\',\'0\')">';
		html += '<label for="answer1" class="label_answer">1. '+$data.quiz_script[0]+'</label>';
		html += '</li>';
		html += '<li>';
		html += '<input type="radio" id="answer2" class="radio_answer" name="answer" value="'+$data.quiz_script[1]+'" onchange="clickAnswer(\'t1\',\'1\')">';
		html += '<label for="answer2" class="label_answer">2. '+$data.quiz_script[1]+'</label>';
		html += '</li>';
		html += '<li>';
		html += '<input type="radio" id="answer3" class="radio_answer" name="answer" value="'+$data.quiz_script[2]+'" onchange="clickAnswer(\'t1\',\'2\')">';
		html += '<label for="answer3" class="label_answer">3. '+$data.quiz_script[2]+'</label>';
		html += '</li>';
		html += '</ul>';

		return html;
	}

	function clickAnswer($type,$answer)
	{
		var answer = "";
		if($type=="t1"){
			answer = quizData.quiz_script[$answer];
		}else{
			answer = $answer;
		}

		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = {
      "tno" : tno,
			"answer"	:	answer
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/content/quizAnswerProc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        console.log(data);

				var html = "";
				if(data.data.quiz_type=="t1"){
					html += makeScriptDiscription(data.data);
				}else{
					html += makeOxDiscription(data.data);
				}

				$('#answer_discription').html(html);
				$('#quiz_discription').show();
				$('#answerWrap').hide();

      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}

	function makeOxDiscription($data)
	{
		var html = "";

		if($data.quiz_answer=="O"){
			html += '<div class="icon"><img src="/images/content/quiz_o.png" alt=""></div>';
			html += '<div class="txt">'+$data.quiz_description+'</div>';
		}else{
			html += '<div class="icon"><img src="/images/content/quiz_x.png" alt=""></div>';
			html += '<div class="txt">'+$data.quiz_description+'</div>';
		}

		return html;
	}

	function makeScriptDiscription($data)
	{
		var html = "";
		html += '<div class="txt">'+$data.quiz_description+'</div>';
		return html;
	}
	</script>
