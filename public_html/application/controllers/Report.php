<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Report extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
		/**
		* 언어셋 설정
		*/
		$this->load->config('gettext');
		$this->load->helper('gettext');
		$this->load->model("user_model");
		$this->load->model("code_model");
		$this->load->model("quiz_model");
        $this->load->model("quizShare_model");
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

	}

	public function index()
	{

	}

    public function quiz_result_pop($seq="")
	{
	    
	    
		$depth1 = "partner";
		$depth2 = "list";
		$title = "원생관리";
		$sub_title = "원생관리";
			    
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

		
		$param = "";
		
		$info = $this->quizHistory_model->getQuizHistoryAdmin($seq);
		
		$user_seq = $info['user_seq'];



		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		//$academiList = $this->user_model->getUserList($data);
		
		$data = $this->user_model->getUserSeq($user_seq);
			switch($data['grade']) {
			    case "0":
			        $data['grade'] = "미취학";
			    break;
			    case "1":
			        $data['grade'] = "초1";
			    break;
			    case "2":
			        $data['grade'] = "초2";
			    break;
			    case "3":
			        $data['grade'] = "초3";
			    break;
			    case "4":
			        $data['grade'] = "초4";
			    break;
			    case "5":
			        $data['grade'] = "초5";
			    break;
			    case "6":
			        $data['grade'] = "초6";
			    break;
			    case "7":
			        $data['grade'] = "중1";
			    break;			    
			    case "8":
			        $data['grade'] = "중2";
			    break;			    
			    case "9":
			        $data['grade'] = "중3";
			    break;			    
			    case "10":
			        $data['grade'] = "고1";
			    break;			    
			    case "11":
			        $data['grade'] = "고2";
			    break;			    
			    case "12":
			        $data['grade'] = "고3";
			    break;			    			    
			}		
		// 선생님 정보
		$data['teacher_name'] = "";
		
		$whereData = array("where" => " and code_group='question'", "limit" => "limit 50" );
		
		$questionList = $this->code_model->getCodeList($whereData);						
		
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND group_name='{$data['group_name']}'",
			"limit"			=>	""
		);
		$list_total = $this->user_model->getUserTotalCount($whereData);
		
        //$list = array();
		$list = $this->user_model->getUserList($whereData);		
		$list = $this->add_counting($list,$list_total,0);
		$term_where ="";
		
		$data['class_user_cnt'] = $list_total;
		
		for($i = 0; $i < count($list); $i++)
		{
			switch($list[$i]['grade']) {
			    case "0":
			        $list[$i]['grade'] = "미취학";
			    break;
			    case "1":
			        $list[$i]['grade'] = "초1";
			    break;
			    case "2":
			        $list[$i]['grade'] = "초2";
			    break;
			    case "3":
			        $list[$i]['grade'] = "초3";
			    break;
			    case "4":
			        $list[$i]['grade'] = "초4";
			    break;
			    case "5":
			        $list[$i]['grade'] = "초5";
			    break;
			    case "6":
			        $list[$i]['grade'] = "초6";
			    break;
			    case "7":
			        $list[$i]['grade'] = "중1";
			    break;			    
			    case "8":
			        $list[$i]['grade'] = "중2";
			    break;			    
			    case "9":
			        $list[$i]['grade'] = "중3";
			    break;			    
			    case "10":
			        $list[$i]['grade'] = "고1";
			    break;			    
			    case "11":
			        $list[$i]['grade'] = "고2";
			    break;			    
			    case "12":
			        $list[$i]['grade'] = "고3";
			    break;			    			    
			}

		}	
		for($i=0;$i <count($questionList);$i++) {
		    $questionCodeList[$questionList[$i]['code_type']] = $questionList[$i]['code_name'];
		}	
		 
		$topic = @json_decode($data['topic']);
		
        $quizData = unserialize(@$data[0]['quiz_contents']);
        //print_r($quizData);
        
		$book_no = $info['book_no'];
		$quiz_seq = $info['quiz_seq'];
		$qh_seq = $info['qh_seq'];

		    

        $whereData = array("book_no"=>$book_no,
                           "quiz_seq"=>$quiz_seq,
                           "qh_seq"=>$qh_seq,
                          );
                           
        $historyData = $this->quizHistory_model->getQuizHistory($whereData);				
        //print_r($historyData);		
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "questionList" =>$questionCodeList,
            "historyData" =>$historyData,
            "info" =>  $info,
            "topic" =>  $topic,
            "list" =>  $list,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("include/report-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("report/quiz-result-pop",$content_data);
		
		$this->parser->parse("include/report-footer",$this->CONFIG_DATA);
	}		

    public function quiz_portfolio_pop($user_id="")
	{
	    // http://nanobook.themvp.kr/report/quiz_portfolio_pop/user1?searchTermType=&startDate=&endDate=&keyword=
		$depth1 = "partner";
		$depth2 = "list";
			    
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$keyword = $this->input->get('keyword');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

		
		$param = "";
		$where = " AND a.user_id='{$user_id}'";
        if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			$where .= " and b.group_name='".$this->session->userdata("group_name")."'";
		}		

		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (b.user_name like '%".$keyword."%' )";   
		}					
		$where .= " AND a.score >= 60";

        $data = array(
			"where"	=>	$where,
			"limit"	=>	""
		);
		
		
		$list = $this->quizHistory_model->getQuizHistoryAdminList($data);
		
		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		//$academiList = $this->user_model->getUserList($data);
		
		$data = $this->user_model->getUserData($user_id);
		switch($data['grade']) {
		    case "0":
		        $data['grade'] = "미취학";
		    break;
		    case "1":
		        $data['grade'] = "초1";
		    break;
		    case "2":
		        $data['grade'] = "초2";
		    break;
		    case "3":
		        $data['grade'] = "초3";
		    break;
		    case "4":
		        $data['grade'] = "초4";
		    break;
		    case "5":
		        $data['grade'] = "초5";
		    break;
		    case "6":
		        $data['grade'] = "초6";
		    break;
		    case "7":
		        $data['grade'] = "중1";
		    break;			    
		    case "8":
		        $data['grade'] = "중2";
		    break;			    
		    case "9":
		        $data['grade'] = "중3";
		    break;			    
		    case "10":
		        $data['grade'] = "고1";
		    break;			    
		    case "11":
		        $data['grade'] = "고2";
		    break;			    
		    case "12":
		        $data['grade'] = "고3";
		    break;			    			    
		}		
		// 선생님 정보
		$data['teacher_name'] = "";
		
		$whereData = array("where" => " and code_group='question'", "limit" => "limit 50" );
		
		$questionList = $this->code_model->getCodeList($whereData);						
		
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND group_name='{$data['group_name']}'",
			"limit"			=>	""
		);
		$list_total = $this->user_model->getUserTotalCount($whereData);
		
        //$list = array();
		$term_where ="";
		
		$data['class_user_cnt'] = $list_total;
		
		for($i = 0; $i < count($list); $i++)
		{
			switch($list[$i]['grade']) {
			    case "0":
			        $list[$i]['grade'] = "미취학";
			    break;
			    case "1":
			        $list[$i]['grade'] = "초1";
			    break;
			    case "2":
			        $list[$i]['grade'] = "초2";
			    break;
			    case "3":
			        $list[$i]['grade'] = "초3";
			    break;
			    case "4":
			        $list[$i]['grade'] = "초4";
			    break;
			    case "5":
			        $list[$i]['grade'] = "초5";
			    break;
			    case "6":
			        $list[$i]['grade'] = "초6";
			    break;
			    case "7":
			        $list[$i]['grade'] = "중1";
			    break;			    
			    case "8":
			        $list[$i]['grade'] = "중2";
			    break;			    
			    case "9":
			        $list[$i]['grade'] = "중3";
			    break;			    
			    case "10":
			        $list[$i]['grade'] = "고1";
			    break;			    
			    case "11":
			        $list[$i]['grade'] = "고2";
			    break;			    
			    case "12":
			        $list[$i]['grade'] = "고3";
			    break;			    			    
			}

		}	
		for($i=0;$i <count($questionList);$i++) {
		    $questionCodeList[$questionList[$i]['code_type']] = $questionList[$i]['code_name'];
		}	
		 
		$topic = @json_decode($data['topic']);
		$content_data = array(
			"depth1"		=>	$depth1,
            "data" =>  $data,
            "questionList" =>$questionCodeList,
            "list" =>  $list,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("include/report-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("report/quiz-portfolio-pop",$content_data);
		
		$this->parser->parse("include/report-footer",$this->CONFIG_DATA);


	}		
	
	//board add counting
	public function add_counting($arr,$total,$num)
    {
        $i = $total-$num;
        $returnArr = $arr;
        
        for( $v = 1; $v <= count($returnArr); $v++ )
        {
            //$returnArr[$v-1]['bd_name'] = $bd_name;
            $returnArr[$v-1]['count'] = $i;
            $i--;
        }
        
        return $returnArr;
    }	
    
	public function graphData()
	{
		//$challengeArr = $this->content_model->getChallengeDepth1();
		$user_id = $this->input->post("user_id");
		$user_seq = $this->input->post("user_seq");

        $type = $this->input->post("type");
        
		$monthArr = array();
		
		$where['type'] = $type;
		$where['user_id'] = $user_id;
		//" AND user_id = '{".$userData['user_id']."}'";
		$data = $this->quizHistory_model->getQuizHistoryGroup($where,$user_seq);		
		 

		$returnArr = array(
			"data"	=>	$data
		); 

		echo json_encode($returnArr);
		exit;

	}    
	
	public function graphDataPortfolio()
	{
		//$challengeArr = $this->content_model->getChallengeDepth1();
		$user_id = $this->input->post("user_id");
		$user_seq = $this->input->post("user_seq");
		
		$start_date = $this->input->post("start_date");
		$end_date = $this->input->post("end_date");

        $type = $this->input->post("type");
        
		$monthArr = array();
		
		$where['type'] = $type;
		$where['user_id'] = $user_id;
		$where['start_date'] = $start_date;
		$where['end_date'] = $end_date;
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

}
