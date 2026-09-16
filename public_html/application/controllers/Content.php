<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Content extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
		/**
		* 언어셋 설정
		*/
		$this->load->config('gettext');
		$this->load->helper('gettext');
		$this->load->model("member_model");
		$this->load->model("board_model");
		$this->load->model("content_model");
		$this->load->helper("string");
		$charset = array(
			$this->getChar()
		);

		$this->load->library(
            'gettext',
            array(
                'gettext_text_domain' => 'default',
                'gettext_locale' => $charset,
                'gettext_locale_dir' => 'language/locales'
            )
        );

		$this->loginCheck();
	}

	public function index()
	{

	}

  public function home()
  {
    $sub = "home";

		$depth1 = "content";
		$depth2 = "home";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/header',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/home',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //news list
  public function newsList()
  {
    $sub = "newsList";

		$depth1 = "content";
		$depth2 = "newsList";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$newsList = $this->content_model->getEduBoardList('news');

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"newsList"	=>	$newsList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/news-list',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //news view
  public function newsView($news_seq)
  {
    $sub = "newsView";

		$depth1 = "content";
		$depth2 = "newsList";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//읽음체크 및 최초 조회면 포인트 지급
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$type = "news";

		$histData = array(
			"user_id"	=>	$user_id,
			"type"	=>	$type,
			"edu_seq"	=>	$news_seq
		);
		$this->content_model->getEduHistory($histData);

		$newsData = $this->content_model->getEduBoardView($news_seq);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"newsData"	=>	$newsData
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/news-view',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //webtoon list
  public function webtoonList()
  {
    $sub = "webtoonList";

		$depth1 = "content";
		$depth2 = "webtoonList";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$webtoonList = $this->content_model->getEduBoardList('webtoon');

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"webtoonList"	=>	$webtoonList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/webtoon-list',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //webtoon view
  public function webtoonView($edu_seq)
  {
    $sub = "webtoonView";

		$depth1 = "content";
		$depth2 = "webtoonView";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//읽음체크 및 최초 조회면 포인트 지급
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$type = "webtoon";

		$histData = array(
			"user_id"	=>	$user_id,
			"type"	=>	$type,
			"edu_seq"	=>	$edu_seq
		);
		$this->content_model->getEduHistory($histData);

		$webtoonData = $this->content_model->getEduBoardView($edu_seq);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"webtoonData"	=>	$webtoonData
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/webtoon-view',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //movie list
  public function movieList()
  {
    $sub = "movieList";

		$depth1 = "content";
		$depth2 = "movieList";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$movieList = $this->content_model->getEduBoardList('movie');

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"movieList"	=>	$movieList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/movie-list',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //movie view
  public function movieView($edu_seq)
  {
    $sub = "movieView";

		$depth1 = "content";
		$depth2 = "movieView";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//읽음체크 및 최초 조회면 포인트 지급
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$type = "movie";

		$histData = array(
			"user_id"	=>	$user_id,
			"type"	=>	$type,
			"edu_seq"	=>	$edu_seq
		);
		$this->content_model->getEduHistory($histData);

		$movieData = $this->content_model->getEduBoardView($edu_seq);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"movieData"	=>	$movieData
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/movie-view',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //quiz
  public function quiz()
  {
    $sub = "quiz";

		$depth1 = "content";
		$depth2 = "quiz";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$userData = $this->CONFIG_DATA['userData'];

		$quizHistoryData = $this->content_model->getUserQuizData($userData['user_seq']);

		$quizData = $this->content_model->getQuizPlayData();

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"quizHistoryData"	=>	$quizHistoryData,
			"quizData"	=>	$quizData
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/quiz',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

  //quiz step
  public function quizStep()
  {
    $sub = "quiz";

		$depth1 = "content";
		$depth2 = "quizStep";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;



		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/quiz-step',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

	public function quizLoad()
	{
		$tno = $this->input->post("tno");

		$quizData = $this->content_model->getQuizPlayData();

		$total_quiz = $quizData['quiz_total'];
		$quiz_contents = unserialize($quizData['quiz_contents']);
		$quiz_contents = $quiz_contents[$tno-1];

		$quiz_title = $quiz_contents['q'];
		$quiz_type = $quiz_contents['type'];
		$quiz_answer = $quiz_contents['a'];
		$quiz_description = $quiz_contents['d'];
		$quiz_script = array();
		if($quiz_type=="t1"){
			$quiz_script = $quiz_contents['ex'];
		}

		$returnArr = array(
			"quiz_title"	=>	$quiz_title,
			"quiz_type"	=>	$quiz_type,
			"quiz_script"	=>	$quiz_script,
			"total_quiz"	=>	$total_quiz
		);

		echo '{"result":"success","data":'.json_encode($returnArr).'}';
		exit;
	}

	public function quizAnswerProc()
	{
		$tno = $this->input->post("tno");
		$answer = $this->input->post("answer");
		$quizData = $this->content_model->getQuizPlayData();

		$total_quiz = $quizData['quiz_total'];
		$quiz_contents = unserialize($quizData['quiz_contents']);
		$quiz_contents = $quiz_contents[$tno-1];

		$quiz_answer = $quiz_contents['a'];
		$quiz_description = $quiz_contents['d'];
		$quiz_type = $quiz_contents['type'];

		$point = 0;
		$score = 0;
		if($quiz_answer == $answer){
			$score = 10;
			$point = 3;
		}

		$this->session->set_userdata("quiz_".$tno."_answer",$answer);
		$this->session->set_userdata("quiz_".$tno."_point",$point);
		$this->session->set_userdata("quiz_".$tno."_score",$score);

		$data = array(
			"quiz_answer"	=>	$quiz_answer,
			"quiz_description"	=>	$quiz_description,
			"quiz_type"	=>	$quiz_type
		);

		echo '{"result":"success","data":'.json_encode($data).'}';
		exit;
	}

	public function quizCompleteProc()
	{
		$quizData = $this->content_model->getQuizPlayData();
		$userData = $this->CONFIG_DATA['userData'];

		$quiz_total = $quizData['quiz_total'];
		$total_score = 0;
		$total_point = 0;
		$answerArr = array();
		for($i=0; $i<$quiz_total; $i++){
			$answer = $this->session->userdata("quiz_".($i+1)."_answer");
			$answer = empty($answer)?"":$answer;
			$point = $this->session->userdata("quiz_".($i+1)."_point");
			$point = empty($point)?0:$point;
			$score = $this->session->userdata("quiz_".($i+1)."_score");
			$score = empty($score)?0:$score;
			$answerArr[$i]['answer'] = $answer;
			$answerArr[$i]['point'] = $point;
			$answerArr[$i]['score'] = $score;

			$total_score += $score;
			$total_point += $point;
		}

		$quiz_seq = $quizData['quiz_seq'];
		$user_seq = $userData['user_seq'];
		$user_id = $userData['user_id'];
		$user_name = $userData['user_name'];
		$quiz_title = $quizData['quiz_title'];
		$quiz_contents = $quizData['quiz_contents'];
		$answer = serialize($answerArr);
		$score = $total_score;
		$reg_date = date("Y-m-d H:i:s");
		$user_ip = $this->input->ip_address();

		$data = array(
			"quiz_seq"	=>	$quiz_seq,
			"user_seq"	=>	$user_seq,
			"user_id"	=>	$user_id,
			"user_name"	=>	$user_name,
			"quiz_title"	=>	$quiz_title,
			"quiz_contents"	=>	$quiz_contents,
			"answer"	=>	$answer,
			"score"	=>	$score,
			"reg_date"	=>	$reg_date,
			"user_ip"	=>	$user_ip,
		);

		$this->content_model->insertUpdateQuiz($data);

		echo '{"result":"success"}';
		exit;

	}

  //quiz result
  public function quizResult()
  {
    $sub = "quiz";

		$depth1 = "content";
		$depth2 = "quizResult";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];
		$quizData = $this->content_model->getUserQuizData($user_seq);

		$answer_num = 0;
		$wrong_num = 0;
		$answer_score = 0;

		$quiz_contents = unserialize($quizData['quiz_contents']);
		$answer_contents = unserialize($quizData['answer']);
		for($i=0; $i<count($quiz_contents); $i++){
			$answer_score += $answer_contents[$i]['score'];
			if($answer_contents[$i]['score']==0){
				$wrong_num++;
			}else{
				$answer_num++;
			}
		}

		$quiz_title = str_replace("<br>"," ",$quizData['quiz_title']);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"quiz_title"	=>	$quiz_title,
			"quiz_contents"	=>	$quiz_contents,
			"answer_contents"	=>	$answer_contents,
			"answer_num"	=>	$answer_num,
			"answer_score"	=>	$answer_score,
			"wrong_num"	=>	$wrong_num
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/quiz-result',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

	//game view
  public function game()
  {
    $sub = "gameView";

		$depth1 = "content";
		$depth2 = "gameView";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//읽음체크 및 최초 조회면 포인트 지급
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$type = "game";

		$histData = array(
			"user_id"	=>	$user_id,
		);
		$this->content_model->getGameHistory($histData);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('content/game-view',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }
  


}
