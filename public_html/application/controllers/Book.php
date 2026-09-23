<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Book extends MY_Controller {

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
		$this->load->model("book_model");
		$this->load->model("banner_model");
		$this->load->model("rank_model");
		$this->load->model("code_model");
		$this->load->model("favoriteHistory_model");
		$this->load->model("quizHistory_model");
		$this->load->model("recommendHistory_model");
		$this->load->model("pointHistory_model");
		$this->load->model("keyword_model");
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
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "book";
        $userData = $this->CONFIG_DATA['userData'];
        $keyword = $this->input->get("keyword");
        $new_keyword = str_replace(" ", "", $keyword);
        $grade = $this->input->get("grade");
        $recommend = $this->input->get("recommend");
        $topic = $this->input->get("topic");
		if($keyword) {
		    $whereData = array("where" => "", "limit" => "limit 20" , "user_id"=>$userData['user_id'], "keyword"=>$keyword );
		    $check_keyword = $this->keyword_model->getKeyword($whereData);    
		    if(empty($check_keyword)) {
		        $data = array(
		            "keyword"=>$keyword,
		            "user_id"=>$userData['user_id'],
		            "reg_date"=>date("Y-m-d H:i:s"),
		        );
		        $uk_id = $this->keyword_model->insertKeyword($data);    
		    }
		}   
		
		$whereData = array("where" => "", "limit" => "limit 20" , "user_id"=>$userData['user_id']);
		$keywordList = $this->keyword_model->getKeywordList($whereData);             
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		$where ="";
		if($keyword) {
		    $where .= " AND (REPLACE(a.book_name, ' ', '') like '%{$new_keyword}%' OR a.book_name like '%{$keyword}%' OR a.author like '%{$keyword}%' OR a.publisher like '%{$keyword}%' OR a.user_id like '{$keyword}')";
		}
		
		if($topic) {
		    $where .= " AND (a.subject ='{$topic}')";
		}		
		
		if($grade != "") {
		    //$where .= " AND (a.recommend_class ='{$grade}') and recommend_yn = 'Y'";
		    $where .= " AND (a.recommend_class ='{$grade}')";
		}				
		
		if($recommend) {
		    $where .= " AND (a.recommend_yn ='Y')";
		}				
		
		$where .= " AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
		
        $whereData = array("where"=>$where,
        "limit"=>"", "user_id" => $userData['user_id']);
        $bookList = $this->book_model->getBookUserList($whereData);		
		
		
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "bookList"	=>	$bookList,
          "keywordList" => $keywordList,
          "topic"	=>	json_decode($userData['topic']),
        );            
        /*
        $user_seq = $this->CONFIG_DATA['userData']['user_seq'];
        
        $user_total_point = $this->member_model->getUserTotalPoint($user_seq);
        $user_quiz_point = $this->member_model->getUserPoint($user_seq,'Q');
        $user_challenge_point = $this->member_model->getUserPoint($user_seq,'C');
        $user_contents_point = $this->member_model->getUserPoint($user_seq,'B');
        */
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/index',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    
	}
	
	public function banner_list($banner_seq)
	{
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "book";
        $userData = $this->CONFIG_DATA['userData'];
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;        
        $grade = $this->input->get("grade");
        
        $where = "";

		$whereData = array("where" => " and banner_seq='{$banner_seq}' and status='Y'", "limit" => "limit 5", "banner_seq" => $banner_seq);
		$banner = $this->banner_model->getBannerUser($whereData);
		//print_r(json_decode($banner['banner_contents']));
		$json = json_decode($banner['banner_contents']);
		$book_no = array();
		for($i =0; $i < count(@$json);$i++) {
		    $row = @$json[$i];
		    if(is_object($row))
		    $book_no[] = "'".$row->book_no."'";
		}
		
		if(count($book_no) ==0) {
		    $where = " AND a.book_no in ('')";
		} else 
		    $where = " AND a.book_no in (".implode(",", $book_no).")";
		    
		//$where .= " AND (c.status='Y' OR s.quiz_seq != NULL)";
		$where .= " AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
		if($grade != "") {
		    //$where .= " AND (a.recommend_class ='{$grade}') and recommend_yn = 'Y'";
		    $where .= " AND (a.recommend_class ='{$grade}')";
		}			
		
        $whereData = array("where"=>$where,
                          "limit"=>" limit 20", 
                          "user_id" => $userData['user_id']);
        $bookList = $this->book_model->getBookUserList($whereData);		
		
		
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "data" => $banner,
          "bookList"	=>	$bookList,
          "topic"	=>	json_decode($userData['topic']),
        );            

        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/banner-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    
	}	
	
	public function detail($book_no, $quiz_seq)
	{
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "book";
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;        
        $userData = $this->CONFIG_DATA['userData'];
        $keyword = $this->input->get("keyword");
        $topic = $this->input->get("topic");
        $where = " AND a.book_no='${book_no}' AND c.quiz_seq='${quiz_seq}'";
        $whereData = array("where"=>$where,
                           "limit"=>" limit 1", 
                           "user_id" => $userData['user_id']);
        $data = $this->book_model->getBookUserDetail($whereData);		
        
        $whereData = array("where"=>"",
                           "limit"=>" limit 20", 
                           "user_id" => $userData['user_id']);        
                           
        
        $bookList =  $this->book_model->getBookUserDetailList($whereData);		
        
        $quizData = array("book_no"=>$book_no,
                         "quiz_seq"=>$quiz_seq,
                         "user_id" => $userData['user_id']
                         );
        
        $info = $this->quizHistory_model->getQuizHistorySuccessCount($quizData);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "data"	=>	$data,
          "cnt"	=>	$info['cnt'],
          "bookList" => $bookList,
          "topic"	=>	json_decode($userData['topic']),
        );                       
      
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/book-detail',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    

	}	
	
	public function quiz_main($book_no, $quiz_seq)
	{
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "book";
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;        
        $userData = $this->CONFIG_DATA['userData'];
        $keyword = $this->input->get("keyword");
        $topic = $this->input->get("topic");
        $where = " AND a.book_no='${book_no}' AND c.quiz_seq='${quiz_seq}'";
        $whereData = array("where"=>$where,
        "limit"=>"", "user_id" => $userData['user_id']);
        $data = $this->book_model->getBookUserDetail($whereData);		
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "data"	=>	$data,
          "topic"	=>	json_decode($userData['topic']),
        );                       
      
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/quiz-main',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    

	}		
	
	
	public function quiz($book_no, $quiz_seq)
	{
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "book";
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;        
        $userData = $this->CONFIG_DATA['userData'];
        $keyword = $this->input->get("keyword");
        $topic = $this->input->get("topic");
        $where = " AND a.book_no='${book_no}' AND c.quiz_seq='${quiz_seq}'";
        $whereData = array("where"=>$where,
        "limit"=>"", "user_id" => $userData['user_id']);
        $data = $this->book_model->getBookUserQuizDetail($whereData);		
        
        $quizData = unserialize($data[0]['quiz_contents']);
        //print_r($quizData);
        
		$whereData = array("where" => " and code_group='question' and code_type='".$data[0]['think_quiz_seq']."'", "limit" => "limit 50");
		$questionList = $this->code_model->getCodeList($whereData);		        
		
		if($data[0]['think_quiz_seq'] == "0")
		    $questionDetail = $data[0]['think_quiz'];
		else
		    $questionDetail = @$questionList[0]['code_name'];
        
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "data"	=>	$data[0],
          "quizData" =>$quizData,
          "questionDetail" =>$questionDetail,
        );                       
      
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/quiz',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    

	}			
	
	public function quiz_result($book_no="", $quiz_seq="", $qh_seq="")
	{
        $sub = "book";
    
        $depth1 = "book_main";
        $depth2 = "book";
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;        
        $userData = $this->CONFIG_DATA['userData'];
        if($book_no =="") {
            exit;
        }
        
        if($quiz_seq =="") {
            exit;
        }        
        
        $where = " AND a.book_no='{$book_no}' AND c.quiz_seq='{$quiz_seq}'";
        $whereData = array("where"=>$where,
                           "limit"=>"", 
                           "user_id" => $userData['user_id']);
        $data = $this->book_model->getBookUserQuizDetail($whereData);		
        
        $quizData = unserialize(@$data[0]['quiz_contents']);
        //print_r($quizData);
        
		$whereData = array("where" => " and code_group='question' and code_type='".$data[0]['think_quiz_seq']."'", "limit" => "limit 50");
		$questionList = $this->code_model->getCodeList($whereData);		        
		
		if($data[0]['think_quiz_seq'] == "0")
		    $questionDetail = $data[0]['think_quiz'];
		else
		    $questionDetail = $questionList[0]['code_name'];		

        //$where = " AND qh_seq='{$qh_seq}' and book_no='{$book_no}' AND quiz_seq='{$quiz_seq}'";
        //$whereData = array("where"=>$where,
        //                   "limit"=>"", 
        //                   "user_id" => $userData['user_id']);
        $whereData = array("book_no"=>$book_no,
                           "quiz_seq"=>$quiz_seq,
                           "qh_seq"=>$qh_seq,
                          );
                           
        $historyData = $this->quizHistory_model->getQuizHistory($whereData);				
        //print_r($historyData);
		
        
        $data = array(
            "depth1"	=>	$depth1,
            "depth2"	=>	$depth2,
            "data"	=>	$data[0],
            "historyData" => $historyData,
            "quizData" =>$quizData,
            "questionDetail" =>$questionDetail,
        );                       
      
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/quiz-result',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    

	}			

    public function topic_list()
    {
        $sub = "book";
    
        $depth1 = "book";
        $depth2 = "topic_list";
        
        $userData = $this->CONFIG_DATA['userData'];        
		$whereData = array("where" => "", "limit" => "limit 20" , "user_id"=>$userData['user_id']);
		$keywordList = $this->keyword_model->getKeywordList($whereData);             
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50", "sort"=>"ORDER BY code_sort_id ASC");
		$topicList = $this->code_model->getCodeList($whereData);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "keywordList" => $keywordList,
          "topic"	=>	json_decode($userData['topic']),
        );            
        /*
        $user_seq = $this->CONFIG_DATA['userData']['user_seq'];
        
        $user_total_point = $this->member_model->getUserTotalPoint($user_seq);
        $user_quiz_point = $this->member_model->getUserPoint($user_seq,'Q');
        $user_challenge_point = $this->member_model->getUserPoint($user_seq,'C');
        $user_contents_point = $this->member_model->getUserPoint($user_seq,'B');
        */
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('book/topic-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }
    
    public function book_main()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "topic"	=>	json_decode($userData['topic']),
        );            
        /*
        $user_seq = $this->CONFIG_DATA['userData']['user_seq'];
        
        $user_total_point = $this->member_model->getUserTotalPoint($user_seq);
        $user_quiz_point = $this->member_model->getUserPoint($user_seq,'Q');
        $user_challenge_point = $this->member_model->getUserPoint($user_seq,'C');
        $user_contents_point = $this->member_model->getUserPoint($user_seq,'B');
        */
        
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('mypage/book-main',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }    

	public function carbonTreeLoad()
	{
		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];

		$carbonData = $this->rank_model->getUserCarbonData($user_seq);

		$carbon_point = floor($carbonData['carbon']);
		$tree_num = ($carbon_point/9)<=0?0:floor($carbon_point/9);

		$data = array(
			"carbon_point"	=>	$carbon_point,
			"tree_num"	=>	$tree_num
		);

		echo '{"result":"success","data":'.json_encode($data).'}';
		exit;
	}

    public function ranking()
    {
      $sub = "rank";
    
      $depth1 = "ranking";
      $depth2 = "ranking";
    
    
      $this->CONFIG_DATA["depth1"] = $depth1;
      $this->CONFIG_DATA["depth2"] = $depth2;
    
      $data = array(
        "depth1"	=>	$depth1,
        "depth2"	=>	$depth2,
      );
    
    
      $this->CONFIG_DATA["sub"] = $sub;
      $this->parser->parse('include/head',$this->CONFIG_DATA);
      $this->parser->parse('include/aside',$this->CONFIG_DATA);
      $this->parser->parse('rank/ranking',$data);
      $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }

	public function soloRank()
	{
		$search_year = $this->input->post("search_year");
		$search_month = $this->input->post("search_month");
		$my_group = $this->input->post("my_group");

		$school_seq = $this->CONFIG_DATA['userData']['school_seq'];

		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];

		$where = " AND year = '{$search_year}' AND month = '{$search_month}'";
		if(!empty($my_group)){
			$where .= " AND school_seq = '{$school_seq}'";
		}

		$result = $this->rank_model->getSoloRank($where,$user_seq);

		$result['userData'] = $this->CONFIG_DATA['userData'];

		echo '{"result":"success","data":'.json_encode($result).'}';
		exit;
	}

    public function rankClass()
    {
      $sub = "rank";
    
      $depth1 = "ranking";
      $depth2 = "rankClass";
    
    
      $this->CONFIG_DATA["depth1"] = $depth1;
      $this->CONFIG_DATA["depth2"] = $depth2;
    
      $data = array(
        "depth1"	=>	$depth1,
        "depth2"	=>	$depth2,
      );
    
    
      $this->CONFIG_DATA["sub"] = $sub;
      $this->parser->parse('include/head',$this->CONFIG_DATA);
      $this->parser->parse('include/aside',$this->CONFIG_DATA);
      $this->parser->parse('rank/rank-class',$data);
      $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }

	public function classRank()
	{
		$search_year = $this->input->post("search_year");
		$search_month = $this->input->post("search_month");
		$my_group = $this->input->post("my_group");

		$school_seq = $this->CONFIG_DATA['userData']['school_seq'];

		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];

		$where = " AND year = '{$search_year}' AND month = '{$search_month}'";
		if(!empty($my_group)){
			$where .= " AND school_seq = '{$school_seq}'";
		}

		$result = $this->rank_model->getClassRank($where,$user_seq);
		$result['userData'] = $this->CONFIG_DATA['userData'];

		echo '{"result":"success","data":'.json_encode($result).'}';
		exit;
	}

    public function rankSchool()
    {
      $sub = "rank";
    
      $depth1 = "ranking";
      $depth2 = "rankSchool";
    
    
      $this->CONFIG_DATA["depth1"] = $depth1;
      $this->CONFIG_DATA["depth2"] = $depth2;
    
      $data = array(
        "depth1"	=>	$depth1,
        "depth2"	=>	$depth2,
      );
    
    
      $this->CONFIG_DATA["sub"] = $sub;
      $this->parser->parse('include/head',$this->CONFIG_DATA);
      $this->parser->parse('include/aside',$this->CONFIG_DATA);
      $this->parser->parse('rank/rank-school',$data);
      $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }

	public function schoolRank()
	{
		$search_year = $this->input->post("search_year");
		$search_month = $this->input->post("search_month");


		$school_seq = $this->CONFIG_DATA['userData']['school_seq'];

		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];

		$where = " AND year = '{$search_year}' AND month = '{$search_month}'";

		$result = $this->rank_model->getSchoolRank($where,$user_seq);
		$result['userData'] = $this->CONFIG_DATA['userData'];

		echo '{"result":"success","data":'.json_encode($result).'}';
		exit;
	}

	public function monthCarbonLoad()
	{
		$challengeArr = $this->content_model->getChallengeDepth1();
		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];

		$monthArr = array();
		$year = date("Y");
		for($i=0; $i<date("n"); $i++){
			$month = sprintf('%02d',($i+1));

			$carbon_data = $this->rank_model->getTotalChallengeMonthData($year,$month);
			$user_carbon_data = $this->rank_model->getUserChallengeMonthData($year,$month,$user_seq);
			$challengeData = array();
			$userData = array();
			$user_total = 0;
			for($q=0; $q<count($user_carbon_data); $q++){
				$user_total += $user_carbon_data[$q]['total_carbon'];
			}

			for($j=0; $j<count($challengeArr); $j++){
				$challengeData[$j]['challenge_title'] = $challengeArr[$j]['challenge_title'];
				$userData[$j]['challenge_title'] = $challengeArr[$j]['challenge_title'];
				$challengeData[$j]['carbon_total'] = 0;
				$userData[$j]['carbon_total'] = 0;
				$userData[$j]['user_total'] = 0;

				if(count($carbon_data)>0){
					for($t=0; $t<count($carbon_data); $t++){
						if($carbon_data[$t]['challenge_title']==$challengeArr[$j]['challenge_title']){
							$challengeData[$j]['carbon_total'] = $carbon_data[$t]['total_carbon'];
						}
					}
				}

				if(count($user_carbon_data)>0){
					for($t=0; $t<count($user_carbon_data); $t++){
						if($user_carbon_data[$t]['challenge_title']==$challengeArr[$j]['challenge_title']){
							$userData[$j]['carbon_total'] = $user_carbon_data[$t]['total_carbon'];
							//$user_total += $user_carbon_data[$t]['total_carbon'];
						}
					}
				}

				if($userData[$j]['carbon_total'] > 0){
					$userData[$j]['per'] = number_format(($userData[$j]['carbon_total'] / $user_total) * 100);
				}else{
					$userData[$j]['per'] = 0;
				}

			}

			$monthArr[$i] = array(
				"month"	=>	$month,
				"challenge_data"	=>	$challengeData,
				"userData"	=>	$userData,
				"user_total"	=>	$user_total
			);
		}

		$returnArr = array(
			"monthData"	=>	$monthArr,
			"challenge"	=>	$challengeArr
		);

		echo json_encode($returnArr);
		exit;

	}
	
    public function wishProc()
	{
	    $book_no=@$this->input->post("book_no");
	    $quiz_seq=@$this->input->post("quiz_seq");	    
	    
	    $userData = $this->CONFIG_DATA['userData'];
	    
		$data = array(
			"book_no" => $book_no,
			"quiz_seq" => $quiz_seq,
			"reg_date"	=> date("Y-m-d H:i:s"),
			"user_name" => $userData['user_name'],
			"grade" => $userData['grade_org'],
			"gender" => $userData['gender'],
			"user_id"	=>	$userData['user_id'],
		);
		$info = $this->favoriteHistory_model->getFavoriteHistory($data);
		if(empty($info)) {
		    $result = $this->favoriteHistory_model->insertFavoriteHistory($data);	    
		    $this->book_model->updateFavorite($book_no,"+");
		} else {
		    $result = $this->favoriteHistory_model->deleteFavoriteHistory($data);	     
		    $this->book_model->updateFavorite($book_no,"-");
		}
		    
		    
		    
		echo '{"result":"success"}';
		exit;
	}  	
	
    public function keywordDeleteProc()
	{
	    $userData = $this->CONFIG_DATA['userData'];
	    $keyword=@$this->input->post("keyword");
	    
	    $userData = $this->CONFIG_DATA['userData'];
	    
		$data = array(
			"keyword" => $keyword,
			"user_id"	=>	$userData['user_id'],
		);
		$info = $this->keyword_model->deleteKeyword($data);
		    
		echo '{"result":"success"}';
		exit;
	}	
	
	public function quizSaveProc()
	{
	    $book_no=@$this->input->post("book_no");
	    $quiz_seq=@$this->input->post("quiz_seq");	    
	    $quiz_answer_result=@$this->input->post("quiz_answer_result");
	    $quiz_result=@$this->input->post("quiz_result");	    
	    $think_reply=@$this->input->post("think_reply");	    
	    $think_reply_file=@$this->input->post("think_reply_file");	    
	    
	    $c=@$this->input->post("c");

	    
	    $userData = $this->CONFIG_DATA['userData'];
	    $think_answer_reply = serialize($c);
	    
	    $score= 0;
		$data = array(
			"book_no" => $book_no,
			"quiz_seq" => $quiz_seq,
			"quiz_result" => serialize($quiz_result),
			"think_reply" => $think_reply,
			"think_answer_reply" => $think_answer_reply,
			"think_reply_file" => $think_reply_file,
			"score" => $score,
			"reg_date"	=> date("Y-m-d H:i:s"),
			"user_name" => $userData['user_name'],
			"grade" => $userData['grade_org'],
			"gender" => $userData['gender'],
			"user_id"	=>	$userData['user_id'],
		);
	    
	    // 갯수 확인
	    

	    
        $where = " AND a.book_no='${book_no}' AND c.quiz_seq='${quiz_seq}'";
        $whereData = array("where"=>$where,
        "limit"=>"", "user_id" => $userData['user_id']);
        $quizData = $this->book_model->getBookUserQuizDetail($whereData);		
        
        $quiz_result = unserialize($quiz_result);
        
        
	    $scoreCnt = 0;
	    //echo '<meta charset="utf-8">';
	    // 점수 계산
	    for($i=1;$i<=count($quiz_result['a']);$i++) {
	        //echo "{$quiz_result['a'][$i]} == {$c[$i]}<BR>";
	        if($quiz_result['type'][$i] == "C") {
    	        if($quiz_result['a'][$i] == $c[$i]) {
    	            $scoreCnt++;       
    	        }
    	    } else {
    	        $quiz_result_data = explode(",", $quiz_result['a'][$i]);
    	        foreach($quiz_result_data as $value) {
        	        if(trim($value) == $c[$i]) {
        	            $scoreCnt++;       
        	        }    	        
        	    }
    	    }
	    }
	    //exit;
	    $score = round(($scoreCnt / $quizData[0]['quiz_cnt']) * 100);
	    //echo ($scoreCnt / $quizData[0]['quiz_cnt']);
	    
	    
	    $info = $this->quizHistory_model->getQuizHistorySuccessCount($data);

	    // ─── 당일 재도전 불가 체크 ───
	    // 정책: 동일 도서·퀴즈에 대해 당일 60점 미만 실패가 3회 이상이면 당일 재도전 불가
	    //       단, 이미 인증 성공한(cnt >= 1) 경우는 이 제한을 적용하지 않음
	    if($info['cnt'] == 0) {
	        $failInfo = $this->quizHistory_model->getQuizHistoryTodayFailCount($data);
	        if($failInfo['cnt'] >= 3) {
	            echo '{"result":"fail", "msg":"오늘 3회 인증에 실패했습니다. 내일(자정 이후) 다시 도전해 주세요."}';
	            exit;
	        }
	    }

	    	    
	    //echo $quizData[0]['quiz_cnt']."====".$scoreCnt;
	    //print_r(unserialize($quiz_result));
	    
	    

	    //print_r($_POST);
        // 저장	    
		$data = array(
			"book_no" => $book_no,
			"quiz_seq" => $quiz_seq,
			"quiz_result" => serialize($quiz_result),
			"think_reply" => $think_reply,
			"quiz_answer_result" => $think_answer_reply,
			"think_reply_file" => $think_reply_file,
			"reg_date"	=> date("Y-m-d H:i:s"),
			"quiz_cnt" => $quizData[0]['quiz_cnt'],
			"correct_cnt" => $scoreCnt,
			"score" => $score,
			"user_name" => $userData['user_name'],
			"grade" => $userData['grade_org'],
			"gender" => $userData['gender'],
			"user_id"	=>	$userData['user_id'],
		);
		//$info = $this->quizHistory_model->getQuizHistoryHistory($data);
		
		$result = $this->quizHistory_model->insertQuizHistory($data);	    
		
		
		
		// ─── 포인트 저장 ───
		// 정책: 60% 이상 정답 시 인증 완료, 1권당 최대 2회까지 포인트 지급
	    if($info['cnt'] < 2) {
	        if($score >= 60) {

    	        // ① 기본 포인트: 정답수 × 3p
    	        $point = $scoreCnt * 3;
    	        $content = "{$scoreCnt}개 정답 ({$point}p)";

    	        // ② 생각담기(주관식) 작성 시 +5p
    	        //    (생각담기 문제가 없는 퀴즈도 있으므로, 작성한 경우에만 적용)
    	        if($think_reply != "" || $think_reply_file != "") {
    	            $content .= " + 생각담기 (5p)";
    	            $point = $point + 5;
    	        }

    	        // ③ 가중 포인트: 초4 이상 권장도서(recommend_class >= 4)는 전체 포인트 × 20% 추가
    	        //    고학년 책은 읽기 분량이 많아 20% 가중치 적용
    	        $book_recommend_class = (int)($quizData[0]['recommend_class'] ?? 0);
    	        $weight_point = 0;
    	        if($book_recommend_class >= 4) {
    	            $weight_point = (int)round($point * 0.2);
    	            $content .= " + 권장도서 가중 ({$weight_point}p, 20%)";
    	            $point = $point + $weight_point;
    	        }

    	        // 포인트 히스토리 저장
    	        $data = array(
    	            "point_type" => "QUIZ",
    	            "content"    => $content,
    	            "qh_seq"     => $result,
    	            "point"      => $point,
    	            "book_no"    => $book_no,
    	            "quiz_seq"   => $quiz_seq,
    	            "user_id"    => $userData['user_id'],
    	            "user_name"  => $userData['user_name'],
    	            "read_yn"    => "N",
    	            "reg_date"   => date("Y-m-d H:i:s")
    	        );

    	        $this->pointHistory_model->insertPointHistory($data);

    	        // 개인 누적 포인트 업데이트
    	        $this->member_model->updatePoint($userData['user_id'], $point);
    	    }
	    }
	    
	    if($info['cnt'] == 0 && $score >= 60) {
    	    // 인증 권수 추가
    	    $this->book_model->updateQuizEnd($book_no);		
    	}
		//print_r($result);

		echo '{"result":"success", "qh_seq":"'.$result.'", "score":"'.$score.'"}';
	}  	
	

	public function quizRecommendSaveProc()
	{
	    $book_no=@$this->input->post("book_no");
	    $quiz_seq=@$this->input->post("quiz_seq");	    
	    $qh_seq=@$this->input->post("qh_seq");	    
	    $recommend_yn=@$this->input->post("recommend_yn");	    
	    
	    $userData = $this->CONFIG_DATA['userData'];
	    
	    //print_r($_POST);
	    
		$data = array(
			"recommend_yn" => $recommend_yn,
		);
		$result = $this->quizHistory_model->updateQuizHistory($data, $qh_seq);
		
		// 히스토리 추가
		if($recommend_yn == "Y") {
    		$data = array(
    			"book_no" => $book_no,
    			"quiz_seq" => $quiz_seq,
    			"reg_date"	=> date("Y-m-d H:i:s"),
    			"user_name" => $userData['user_name'],
    			"grade" => $userData['grade_org'],
    			"gender" => $userData['gender'],
    			"user_id"	=>	$userData['user_id'],
    		);
    		$info = $this->recommendHistory_model->getRecommendHistory($data);
    		if(empty($info)) {
    		    $result = $this->recommendHistory_model->insertRecommendHistory($data);	    
    		    $this->book_model->updateFavorite($book_no,"+");
    		}  
    	}
		
		echo '{"result":"success"}';
	}  	
	
	public function upload_file() 
	{
		$file = $_FILES['file']['name'];
		$file = empty($file) ? "" : $file;
    			    
        $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/user_quiz/";

    	$userData = $this->CONFIG_DATA['userData'];
        
        
		if(!empty($file)){
    	    $ext = substr(strrchr($file, '.'), 1); 
    		$file_name = $userData['user_id']."_".date("Ymdhis").".".$ext;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["file"]["tmp_name"],$upload_path.$file_name);

			$file = $file_name;
		}
		
		echo '{"result":"success","url":"'.$file.'"}';
		exit;		
	}
	

}
