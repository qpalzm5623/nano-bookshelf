<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Insight extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("academi_model");
        $this->load->model("content_model");
        $this->load->model("quiz_model");
        $this->load->model("quizResult_model");
        $this->load->model("quizHistory_model");
		$this->load->model("school_model");
		$this->load->model("config_model");
		$this->load->model("user_model");
		$this->load->model("code_model");
		$this->load->model("book_model");
		$uri = explode("/",uri_string());
		// login Check
        if( !$this->session->userdata("admin_id") ){
            if( $uri[count($uri)-1] != "login" && $uri[count($uri)-1] != "login_proc" ){
                //$this->msg("로그인 해주시기 바랍니다.");
                $this->goURL(base_url("admin/login"));
                exit;
            }
		}
	}

	public function index()
	{
		//login page redirect
		if( !$this->session->userdata("admin_id") ){
			$this->goURL("/admin");
		}else{
			$this->insightMain();
		}

	}

	//인사이트 메인
	public function insightMain()
	{
		$depth1 = "insight";
		$depth2 = "insight";
		$title = "인사이트";
		$sub_title = "인사이트";

		$depth1 = "insight";
		$depth2 = "insight";
		$title = "인사이트";
		$sub_title = "인사이트";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? "all" : $month;

		$where = "";
		$level_where = "";
		$admin_group_name = $this->session->userdata("group_name");
		$last_day = date("t", strtotime("$year-$month-01"));
		$all_term_where = "";

		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
			$level_where .= "AND group_name = '{$admin_group_name}'";
		}

		// 선생님
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="teacher"){
		    $level_where .= "AND group_name = '{$admin_group_name}'";
			//$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}
		
		// Master
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="master"){
		    $level_where .= "AND group_name = '{$admin_group_name}'";
			//$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}		
		
		$term_where = "";
		if($year != "" && $month != "all") {
		    $term_where = " AND reg_date >='$year-$month-01' AND reg_date <= '$year-$month-$last_day'";
		    $all_term_where = " AND reg_date <= '$year-$month-$last_day'";
		} else {
		    $last_day = date("t", strtotime("$year-12-01"));
		    $all_term_where = " AND reg_date <= '$year-12-$last_day'";
		}
		
		$where = " AND user_type='director'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";

        $director = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );
        
		$where = " AND user_type='teacher'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";        
        
        $teacher = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );      
        
		$where = " AND user_type='master'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";                
        
        $master = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        
		$where = " AND user_type='user'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";                
        $user = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        
		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
		$where="".$level_where;

		$days = date("t",strtotime($year."-".$month."-01"));
		        
        $book_quiz = array(
            "total"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
            "new"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
            "confirm"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
        );             
        
        $where="".$level_where;
        
        $book_quiz_confirm = array(
            "total"=>$this->quizHistory_model->getQuizHistoryInsightTotal($year,$month,$where),
            "confirm"=>$this->quizHistory_model->getQuizHistoryInsightTotal($year,$month,$where),
        );
        
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
			$where .= "AND b.group_name = '{$admin_group_name}'";
		}        
        
        //선호도 현황
		$whereData = array(
			"sort"			=>	" ORDER BY a.quiz_use_cnt DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 3"
		);

		$bookList = $this->book_model->getBookList($whereData);
		$where = "".$level_where;
        
        //랭킹 현황
		$whereData = array(
			"order"			=>	"ORDER BY point DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 3"
		);
        //$list = array();
		$userList = $this->user_model->getUserList($whereData);        
		
		


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"director"	=>	$director,
			"teacher"	=>	$teacher,
			"master"	=>	$master,
			"user"	=>	$user,
			"book_quiz_confirm" => $book_quiz_confirm,
			"book_quiz" => $book_quiz,
			
			"book_list" => $bookList,
			"user_list" => $userList,
			
			"member_total"	=>	@$member_total,
			"search_member_total"	=>	@$search_member_total,
			"search_leave_member_total"	=>	@$search_leave_member_total,
			"board_view_count_total"	=>	@$board_view_count_total,
			"challenge_total"	=>	@$challenge_total,
			"carbon_total"	=>	@$carbon_total,
			"oauth_total"	=>	@$oauth_total,
			"year"	=>	@$year,
			"month"	=>	@$month
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){
		    $this->parser->parse("admin/main-director",$content_data);
		} else 
		    $this->parser->parse("admin/main",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//인사이트 회원
	public function insightMember()
	{
		$depth1 = "insight";
		$depth2 = "memberInsight";
		$title = "회원증감 현황";
		$sub_title = "회원증감 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}


		//회원 총 인원
		$member_total = $this->member_model->getMemberTotal($where);

		//검색 총 인원
		$search_member_total = $this->member_model->getYearMonthMemberTotal($year,$month,$where);

		//검색 탈퇴 회원
		$search_leave_member_total = $this->member_model->getSearchLeaveMemberTotal($year,$month,$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-member",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	//인사이트 회원
	public function insightMemberMaster()
	{
		$depth1 = "insight";
		$depth2 = "memberInsight";
		$title = "회원증감 현황";
		$sub_title = "회원증감 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}


		//회원 총 인원
		$member_total = $this->member_model->getMemberTotal($where);

		//검색 총 인원
		$search_member_total = $this->member_model->getYearMonthMemberTotal($year,$month,$where);

		//검색 탈퇴 회원
		$search_leave_member_total = $this->member_model->getSearchLeaveMemberTotal($year,$month,$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-member-master",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	
	//인사이트 회원
	public function insightMemberDirector()
	{
		$depth1 = "insight";
		$depth2 = "memberInsight";
		$title = "회원증감 현황";
		$sub_title = "회원증감 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}


		//회원 총 인원
		$member_total = $this->member_model->getMemberTotal($where);

		//검색 총 인원
		$search_member_total = $this->member_model->getYearMonthMemberTotal($year,$month,$where);

		//검색 탈퇴 회원
		$search_leave_member_total = $this->member_model->getSearchLeaveMemberTotal($year,$month,$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-member-director",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	
	//인사이트 회원
	public function insightMemberUser()
	{
		$depth1 = "insight";
		$depth2 = "memberInsight";
		$title = "회원증감 현황";
		$sub_title = "회원증감 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));
		

		$where = "";
		
		$admin_group_name = $this->session->userdata("group_name");
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
			$where .= "AND group_name = '{$admin_group_name}'";
		}		


		//회원 총 인원
		$member_total = $this->member_model->getMemberTotal($where);

		//검색 총 인원
		$search_member_total = $this->member_model->getYearMonthMemberTotal($year,$month,$where);

		//검색 탈퇴 회원
		$search_leave_member_total = $this->member_model->getSearchLeaveMemberTotal($year,$month,$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-member-user",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	
	//인사이트 회원
	public function insightMemberTeacher()
	{
		$depth1 = "insight";
		$depth2 = "memberInsight";
		$title = "회원증감 현황";
		$sub_title = "회원증감 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$year = $this->input->get("year");
		$month = $this->input->get("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}


		//회원 총 인원
		$member_total = $this->member_model->getMemberTotal($where);

		//검색 총 인원
		$search_member_total = $this->member_model->getYearMonthMemberTotal($year,$month,$where);

		//검색 탈퇴 회원
		$search_leave_member_total = $this->member_model->getSearchLeaveMemberTotal($year,$month,$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-member-teacher",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	

	public function loadMemberInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");
		$user_type = $this->input->post("user_type");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$where = "";
		
		$where = " AND user_type='$user_type'";
		
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
		    $admin_group_name = $this->session->userdata("group_name");
			$where .= "AND users.group_name = '{$admin_group_name}'";
		}		

		//기관관리자 접근
		//if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
		//	$admin_school_seq = $this->session->userdata("school_seq");
		//	$where .= "AND users.school_seq = '{$admin_school_seq}'";
		//}
        //
		////학급관리자 접근
		//if($this->session->userdata("admin_level")==2){
		//	$admin_school_year = $this->session->userdata("school_year");
		//	$admin_school_class = $this->session->userdata("school_class");
		//	$admin_school_seq = $this->session->userdata("school_seq");
		//	$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		//}
		

		$dayMemberInsight = $this->member_model->getDayMemberInsight($year,$month,$where);


		echo '{"result":"success","data":'.json_encode($dayMemberInsight).'}';
		exit;
	}

	//인사이트 활동
	public function insightQuiz()
	{
		$depth1 = "insight";
		$depth2 = "playQuizInsight";
		$title = "북퀴즈 등록 현황";
		$sub_title = "북퀴즈 등록 현황";
		
		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"year" => $year,
			"month" => $month,
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-quiz",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

	}
	
	//인사이트 활동
	public function insightQuizConfirm()
	{
		$depth1 = "insight";
		$depth2 = "playQuizConfirmInsight";
		$title = "북퀴즈 인증 현황";
		$sub_title = "북퀴즈 인증  현황";
		
		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"year" => $year,
			"month" => $month,
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-quiz-confirm",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

	}
		
	public function loadQuizInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}
		
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
		    $admin_group_name = $this->session->userdata("group_name");
			$where .= "AND users.group_name = '{$admin_group_name}'";
		}				
		
		

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$total = $this->quiz_model->getQuizInsight($year,$month,$where);
		$total_new = $this->quiz_model->getQuizInsight($year,$month,$where);
		$total_request = $this->quiz_model->getQuizInsight($year,$month,$where);



		$returnData = array(
			"total"	=>	$total,
			"total_new"	=>	$total_new,
			"total_request"	=>	$total_request
		);


		echo '{"result":"success","data":'.json_encode($returnData).'}';
		exit;
	}	
	
	public function loadQuizResultInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}
		
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
		    $admin_group_name = $this->session->userdata("group_name");
			$where .= "AND users.group_name = '{$admin_group_name}'";
		}				
				

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$total = $this->quizResult_model->getQuizResultInsight($year,$month,$where);
		$total_new = $this->quizResult_model->getQuizResultInsight($year,$month,$where);



		$returnData = array(
			"total"	=>	$total,
			"total_new"	=>	$total_new,
		);


		echo '{"result":"success","data":'.json_encode($returnData).'}';
		exit;
	}	
	
    //토픽 리스트
	public function insightRanking()
	{
		$depth1 = "insight";
		$depth2 = "insightRanking";
		$title = "랭킹 현황";
		$sub_title = "랭킹 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$searchGroupName = $this->input->get('searchGroupName');
		$keyword = $this->input->get('keyword');		

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		$where .= "AND user_type = 'user'";
		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("user_type");
			
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate' ";   
		}
		
		if($searchGroupName != '') {
		    $where .= " AND group_name='$searchGroupName'";   
		}		
		
		if($this->session->userdata("admin_type")=="director") {
		    $where .= " AND group_name='".$this->session->userdata("group_name")."'";   
		}
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (user_id like '%".$keyword."%' OR group_name like '%".$keyword."%' or user_name like '%".$keyword."%' or cell_no like '%".$keyword."%')";   
		}		
				

		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		$list_total = $this->user_model->getUserTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "";
		
		$groupList = $this->user_model->getUserGroupList();

		$whereData = array(
			"order"			=>	"ORDER BY point DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);
        //$list = array();
		$list = $this->user_model->getUserList($whereData);
		
		$schoolList = $this->user_model->getUserGradeList($whereData);

		//넘버링
		$current_page = ceil ( ($num + 1) / $page_size );

		$start_page = floor ( ($current_page - 1) / $page_list_size ) * $page_list_size + 1;
		$end_page = $start_page + $page_list_size - 1;

		if ($total_page < $end_page)
		{
		    $end_page = $total_page;
		}

		$prev_list = ($num-$page_size > 0 ) ? $num-$page_size:0;
		$next_list = ($num+$page_size < ($total_page-1)*$page_size) ? $num+$page_size:($total_page-1)*$page_size;
		//넘버링 끝
		$list = $this->add_counting($list,$list_total,$num);

		$paging = $this->make_paging2("list",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list_total"	=>	$list_total,
			"list"	=>	$list,
			"groupList" => $groupList,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-ranking",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		

	public function loadPlayInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");
		$school_seq = $this->input->post("school_seq");
		$location = $this->input->post("location");

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")>0&&$this->session->userdata("admin_level")<=2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND users.school_seq = '{$admin_school_seq}'";
		}

		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;

		$days = date("t",strtotime($year."-".$month."-01"));

		$news_total = $this->board_model->getDayPlayInsight($year,$month,$school_seq,$location,'news',$where);
		$quiz_total = $this->board_model->getDayQuizInsight($year,$month,$school_seq,$location,$where);
		$webtoon_total = $this->board_model->getDayPlayInsight($year,$month,$school_seq,$location,'webtoon',$where);
		$movie_total = $this->board_model->getDayPlayInsight($year,$month,$school_seq,$location,'movie',$where);
		$game_total = $this->board_model->getDayGameInsight($year,$month,$school_seq,$location,$where);



		$returnData = array(
			"news_total"	=>	$news_total,
			"quiz_total"	=>	$quiz_total,
			"webtoon_total"	=>	$webtoon_total,
			"movie_total"	=>	$movie_total,
			"game_total"	=>	$game_total
		);


		echo '{"result":"success","data":'.json_encode($returnData).'}';
		exit;
	}
	
    //도서 리스트
	public function insightBook()
	{
		$depth1 = "insight";
		$depth2 = "insightBook";
		$title = "선호도 현황";
		$sub_title = "선호도 현황";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$openYn = $this->input->get('openYn');
		$quizYn = $this->input->get('quizYn');
		$keyword = $this->input->get('keyword');
		$subject = $this->input->get('subject');
		$recommendClass = $this->input->get('recommendClass');
				

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";

		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);

		$where = "";
		
		if($this->session->userdata("admin_type")=="director") {
		    $where .= " AND group_name='".$this->session->userdata("group_name")."'";   
		}
				

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= "AND edu_title LIKE '%{$srcN}%'";
		}

		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate' ";   
		}
		
		if($openYn != '') {
		    $where .= " AND open_yn='$openYn'";   
		}		
		
		if($quizYn != "")  {
		    $where .= " AND quiz_yn='$quizYn'";   
		}
		
		if($subject != "")  {
		    $where .= " AND subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (book_name like '%".$keyword."%' OR book_no like '%".$keyword."%' or author like '%".$keyword."%' or publisher like '%".$keyword."%'  or tags like '%".$keyword."%'  or award like '%".$keyword."%')";   
		}			

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->book_model->getBookTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	" ORDER BY a.quiz_use_cnt DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$list = $this->book_model->getBookList($whereData);

		//넘버링
		$current_page = ceil ( ($num + 1) / $page_size );

		$start_page = floor ( ($current_page - 1) / $page_list_size ) * $page_list_size + 1;
		$end_page = $start_page + $page_list_size - 1;

		if ($total_page < $end_page)
		{
				$end_page = $total_page;
		}

		$prev_list = ($num-$page_size > 0 ) ? $num-$page_size:0;
		$next_list = ($num+$page_size < ($total_page-1)*$page_size) ? $num+$page_size:($total_page-1)*$page_size;
		//넘버링 끝
		$list = $this->add_counting($list,$list_total,$num);

		$params = "&srcN={$srcN}&category={$category}";

		$paging = $this->make_paging2("/admin/contentAdm/eduList",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
		    $list[$i]['cnt'] = 0;
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			switch($list[$i]['open_yn']){
				case "Y":
				$list[$i]['open_yn'] = "공개";
				break;
				case "N":
				$list[$i]['open_yn'] = "비공개";
				break;
			}

		}
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"topicList"=>$topicList,
			"paging"		=>	@$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
        

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-book",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	

  

	/**
	*============================== end =====================================*
	*/

	//make paging2
	public function make_paging2($url,$start_page,$end_page,$page_size,$num,$srcN="",$total_page,$params="")
	{
	    $pageArr[]['no'] = '<li><a class="page-link" href="'.$url.'?num=0&srcN='.$srcN.$params.'"><</a></li>';
		if( $end_page <= 0 )
        {
            $pageArr[]['no'] = '<li class="page-item"><a class="page-link" href="#">1</a></li>';
        }

        for( $i = $start_page; $i <= $end_page; $i++ )
        {
          $page = ( $i - 1 ) * $page_size;
          if( $num != $page )
          {
	    			$pageArr[$i]['no'] = '<li class="page-item"><a class="page-link" href="'.$url.'?num='.$page.'&srcN='.$srcN.$params.'">'.$i.'</a></li>';
          }
          else
          {
            $pageArr[$i]['no'] = '<li ><a class="page-link" href="#" style="background:#efefef">'.$i.'</a></li>';
          }
        }

        if($total_page> $end_page)
            $pageArr[]['no'] = '<li><a class="page-link" href="'.$url.'?num='.((($end_page*10)-10)+10).'&srcN='.$srcN.$params.'">></a></li>';
        else
            $pageArr[]['no'] = '<li><a class="page-link" href="#">></a></li>';

        return $pageArr;
	}

	//make paging
	public function make_paging($bd_name,$start_page,$end_page,$page_size,$num,$srcN="")
  {

    if( $end_page <= 0 )
    {
        $pageArr[0]['no'] = '<li class="page-item"><a class="page-link" href="#">1</a></li>';
    }

    for( $i = $start_page; $i <= $end_page; $i++ )
    {
      $page = ( $i - 1 ) * $page_size;
      if( $num != $page )
      {
				$pageArr[$i]['no'] = '<li class="page-item"><a class="page-link" href="/admin/board/'.$bd_name.'?num='.$page.'&srcN='.$srcN.'">'.$i.'</a></li>';
      }
      else
      {
        $pageArr[$i]['no'] = '<li><a class="page-link" href="#">'.$i.'</a></li>';
      }
    }

    return $pageArr;
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

}
