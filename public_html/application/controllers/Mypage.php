<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Mypage extends MY_Controller {

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
		$this->load->model("notice_model");
		$this->load->model("rank_model");
		$this->load->model("code_model");
		$this->load->model("book_model");
		$this->load->model("content_model");
		$this->load->model("pointHistory_model");
		$this->load->model("favoriteHistory_model");
		$this->load->model("quizHistory_model");
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
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "mypage";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
		$whereData = array("where" => " and group_name='".$userData['group_name']."' and class_name='".$userData['class_name']."'", "limit" => "limit 1", "group_name"=>$userData['group_name'], "class_name"=>$userData['class_name']);
		$teacherData = $this->user_model->getTeacherData($whereData);
		$userData['teacher_name'] = $teacherData['user_name'];        
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "userData" => $userData,
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
        $this->parser->parse('mypage/index',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);	    

	}
	

    public function password()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "topic_edit";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "userData" => $userData,
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
        $this->parser->parse('mypage/password',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }	
    

	public function changePw_proc()
	{
		$old_password = $this->input->post("user_password");
		$new_password = $this->input->post("new_password");

		$user_id = $this->session->userdata("user_id");
		$userdata = $this->user_model->getUserData($user_id);
		$user_password = $this->decrypt("password",$userdata['user_password']);
		if($old_password != $user_password){
			echo '{"result":"failed","msg":"기존비밀번호가 다릅니다."}';
			exit;
		}
		$new_password = $this->encrypt("password",$new_password);
		$this->user_model->changePassword($user_id,$new_password);

		echo '{"result":"success"}';
		exit;
	}

	public function leave_proc()
	{
		$user_id = $this->session->userdata("user_id");
		$withdrawal_type = $this->input->post("withdrawal_type");
		$withdrawal_text = $this->input->post("withdrawal_text");
		$withdrawal_date = date("Y-m-d H:i:s");

		$data = array(
			"withdrawal_type"	=>	$withdrawal_type,
			"withdrawal_text"	=>	$withdrawal_text,
			"withdrawal_date"	=>	$withdrawal_date
		);

		$this->member_model->leaveUser($user_id,$data);

		$this->session->sess_destroy();

		echo '{"result":"success"}';
		exit;
	}
    

    public function topic_edit()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "topic_edit";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "userData" => $userData,
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
        $this->parser->parse('mypage/topic-edit',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }
    
    public function point_list()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		//$year = $this->input->get("year")??date("Y");
		//$month = $this->input->get("month")??date("m");        
		
		$year = $this->input->get("year")??date("Y");
		$month = $this->input->get("month")??"";        		
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		$where = "";
		if($year != "") {
		    $where .= " AND YEAR(reg_date) = '{$year}'";
		}
		if($month != "") {
		    $where .= " AND MONTH(reg_date) = '{$month}'";
		}	
		
		$where .= " AND point > 0 ";	
		
		$where = array("where" => $where, "limit" => "limit 50", "user_id"=>$userData['user_id']);
		
		$pointList = $this->pointHistory_model->getPointHistoryList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "year"	=>	$year,
          "month"	=>	$month,
          "topicList"	=>	$topicList,
          "pointList" => $pointList,
          "userData" => $userData,
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
        $this->parser->parse('mypage/point-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }      
    
    
    public function favorite_list()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
		
		$grade = $this->input->get("grade");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
		$where = " AND d.user_id='".$userData['user_id']."'";
		if($year != "") {
		    $where .= " AND YEAR(a.reg_date) = '{$year}'";
		}
		if($month != "") {
		    $where .= " AND MONTH(a.reg_date) = '{$month}'";
		}		
		if($grade != "") {
		    $where .= " AND a.recommend_class = '{$grade}'";
		}		
		
		$where = array("where" => $where, "limit" => "limit 50", "user_id"=>$userData['user_id']);
		
		$bookList = $this->favoriteHistory_model->getFavoriteHistoryList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "bookList" => $bookList,
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
        $this->parser->parse('mypage/favorite-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }      
    
        
    public function notice_list()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);

		$where = array("where" => " AND group_name='{$userData['group_name']}' and notice_display_yn='Y'", "limit" => "limit 50", "sort"=>" order by notice_seq desc");
		
		$noticeList = $this->board_model->getNoticeAppList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "list" => $noticeList,
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
        $this->parser->parse('mypage/notice-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }
    
    public function notice_view($seq="")
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);

		
		$data = $this->board_model->getNoticeAppData($seq);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "data"	=>	$data,
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
        $this->parser->parse('mypage/notice-view',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }    
    
    public function faq_list()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);

		$where = array("where" => " ", "limit" => "limit 50", "sort"=>" order by faq_seq desc");
		
		$list = $this->board_model->getFaqList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "list" => $list,
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
        $this->parser->parse('mypage/faq-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }    
    
    
    public function qna_list()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);

		$where = array("where" => " ", "limit" => "limit 50", "sort"=>" order by faq_seq desc");
		
		$list = $this->board_model->getFaqList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "list" => $list,
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
        $this->parser->parse('mypage/qna-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }        
    
    public function qna()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);

		$where = array("where" => " AND qna.user_id='{$userData['user_id']}'", "limit" => "limit 50", "sort"=>" order by qna_seq desc");
		
		$list = $this->board_model->getQnaList($where);
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "list" => $list,
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
        $this->parser->parse('mypage/qna',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }        
    
    public function terms()
    {
        $sub = "mypage";
    
        $depth1 = "mypage";
        $depth2 = "book_main";
        
		$year = $this->input->post("year");
		$month = $this->input->post("month");        
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$terms = $this->board_model->getTermsData();
		$terms = nl2br($terms['terms']);

		$data = array(
			"terms"	=>	$terms
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
        $this->parser->parse('mypage/terms',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }         

    public function book_main()
    {
        $sub = "mypage";
    
        $depth1 = "book_main";
        $depth2 = "book_main";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		
		$where = array("user_id"=>$userData['user_id']);
		$confirm['confirmCnt'] =  @$this->quizHistory_model->getQuizHistoryGroupListTotalCount($where)['cnt'];
		$confirm['favoriteCnt'] = $this->favoriteHistory_model->getFavoriteHistoryTotalCount($where);
		$confirm['quiestionCnt'] = @$this->quizHistory_model->getQuizHistoryGroupMypageTotalCountMypage($where)['quiz_total'];
		

		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "confirm" => $confirm,
          "topic"	=>	json_decode($userData['topic']),
        );            
         
        $this->CONFIG_DATA["sub"] = $sub;
        $this->parser->parse('include/head',$this->CONFIG_DATA);
        $this->parser->parse('include/aside',$this->CONFIG_DATA);
        $this->parser->parse('mypage/book-main',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }    


    public function book_confirm_list()
    {
        $sub = "mypage";
    
        $depth1 = "book_main";
        $depth2 = "book_main";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		
		
		$where = array("user_id"=>$userData['user_id']);
		$quizHistoryGroupTotalCount = $this->quizHistory_model->getQuizHistoryGroupListTotalCount($where);
		$quizHistoryGroupList = $this->quizHistory_model->getQuizHistoryGroupList($where);
		$quizHistoryGroupDateList = array();
		$dateList = array();
		
		for($i=0;$i < count($quizHistoryGroupList);$i++ ) {
		    $row = $quizHistoryGroupList[$i];
		    $quizHistoryGroupDateList[$row['date']][] = $row;
		    $dateList[$row['date']] = $row['date'];
		}
		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "dateList" => $dateList,
          "quizHistoryGroupList" => $quizHistoryGroupList,
          "quizHistoryGroupDateList" => $quizHistoryGroupDateList,
          "quizHistoryGroupTotalCount" =>$quizHistoryGroupTotalCount,
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
        $this->parser->parse('mypage/book-confirm-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }    
    
    public function book_list()
    {
        $sub = "mypage";
    
        $depth1 = "book_main";
        $depth2 = "book_main";
        
        
        $this->CONFIG_DATA["depth1"] = $depth1;
        $this->CONFIG_DATA["depth2"] = $depth2;

        $userData = $this->CONFIG_DATA['userData'];
        
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		$where = " AND q.user_id='{$userData['user_id']}' HAVING score < 60";
        $whereData = array("where"=>$where,
                           "limit"=>"", 
                           "user_id" => $userData['user_id']);
                           
        $bookList = $this->book_model->getBookUserAssignmentList($whereData);		
        
        		
        $data = array(
          "depth1"	=>	$depth1,
          "depth2"	=>	$depth2,
          "topicList"	=>	$topicList,
          "bookList" => $bookList,
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
        $this->parser->parse('mypage/book-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
    }      

    public function book_stay_list()
    {
        $sub = "mypage";
    
        $depth1 = "book_main";
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
        $this->parser->parse('mypage/book-stay-list',$data);
        $this->parser->parse('include/footer',$this->CONFIG_DATA);
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
 

	public function graphData()
	{
		//$challengeArr = $this->content_model->getChallengeDepth1();
		$userData = $this->CONFIG_DATA['userData'];
		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];
		$user_id = $this->CONFIG_DATA['userData']['user_id'];

        $type = $this->input->post("type");
        
		$monthArr = array();
		
		$where['type'] = $type;
		$where['user_id'] = $user_id;
		//" AND user_id = '{".$userData['user_id']."}'";
		$data = $this->quizHistory_model->getQuizHistoryGroup($where,$user_seq);		
		if($type == "category") {
    		for($i=0;$i<count($data);$i++) {
    		    switch($data[$i]['subject']) {
    		        case "A" :
    		        $data[$i]['subject'] = "소설";
    		        break;
    		        case "B" :
    		        $data[$i]['subject'] = "비문학/정보글";
    		        break;
    		        case "C" :
    		        $data[$i]['subject'] = "인물(위인)";
    		        break;    		        
    		    }
    		        
    		}
    	}
		 

		$returnArr = array(
			"data"	=>	$data
		); 

		echo json_encode($returnArr);
		exit;

	}
	
    public function qnaProc()
	{
	    $title=@$this->input->post("title");
	    $contents=@$this->input->post("contents");	    
	    
	    $userData = $this->CONFIG_DATA['userData'];
	    
		$data = array(
			"title" => $title,
			"contents" => $contents,
			"qna_type" => "user",
			"user_seq" => $userData['user_seq'],
			"status" => "Y",
			"reg_date"	=> date("Y-m-d H:i:s"),
			"user_id"	=>	$userData['user_id'],
		);
		
		$result = $this->board_model->insertQna($data);	    
		echo '{"result":"success"}';
	}  	
	
    public function topicSaveProc()
    {
        $topic=@$this->input->post("topic");
	    $userData = $this->CONFIG_DATA['userData'];
	    
	    //confirm_yn
	    
		$data = array(
			"topic" => $topic,
			"confirm_yn" =>"Y"
		);
		
		$result = $this->user_model->updateMember($data, $userData['user_seq']);
        echo '{"result":"success"}';
    }	
}
