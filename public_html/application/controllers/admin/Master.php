<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Master extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("user_model");
		$this->load->model("code_model");
		$this->load->model("academi_model");
		$this->load->model("adm_model");
		$this->load->model("quiz_model");
		$this->load->model("payment_model"); // 결제 모델
		$this->load->helper('load_controller');
		$this->load->helper('label'); // 레이블 변환 공통 헬퍼
		$this->load->library('excel');

		//$this->CONFIG_DATA['academy_list'] = $this->academi_model->getAcademiList(array("where"=>"","limit"=>""));
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
			$this->academiInfo();
		}    
	}
		
	public function user_popup($seq="")
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


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		//$academiList = $this->user_model->getUserList($data);
		
		$data = $this->user_model->getUserSeq($seq);
		// 선생님 정보
		$teacherWhere = array(
		                    "group_name" => $data['group_name'],
		                    "class_name" => $data['class_name'],
		                );
		$teacherData = $this->user_model->getTeacherData($teacherWhere);
		// 선생님 정보
		$data['teacher_name'] = $teacherData['user_name'];
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50" );
		
		$planList = $this->code_model->getCodeList($whereData);						
		
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND group_name='{$data['group_name']}'",
			"limit"			=>	""
		);
		$list_total = $this->user_model->getUserTotalCount($whereData);
		
        //$list = array();
		$list = $this->user_model->getUserList($whereData);		
		$list = $this->add_counting($list,$list_total,0);

		$data['class_user_cnt'] = $list_total;

		// grade / user_type / user_status 레이블 변환 (label_helper 사용)
		$list = apply_user_labels($list, true);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "list" =>  $list,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/member/user-pop",$content_data);


	}	
	
  //숙재배정 리스트
	public function list()
	{
		$depth1 = "master";
		$depth2 = "list";
		$title = "마스터 등록/조회";
		$sub_title = "마스터 등록/조회";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$searchUserStatus = $this->input->get('searchUserStatus');
		$searchRatePlan = $this->input->get('searchRatePlan');
		$keyword = $this->input->get('keyword');		

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		$where .= "AND user_type = 'master'";
		
		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate 23:59:59' ";   
		}		

		if($searchUserStatus != '') {
		    $where .= " AND user_status='$searchUserStatus'";   
		}		
		
		if($searchRatePlan != "")  {
		    $where .= " AND pricing_plan='$searchRatePlan'";   
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

		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
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

		// 날짜 포맷 + user_type/user_status 레이블 변환 (label_helper 사용)
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d", strtotime($list[$i]['reg_date']));
		}
		$list = apply_user_labels($list);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"list_total"    => $list_total,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/master/list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	 
 
  public function write($seq = "")
	{
		$depth1 = "master";
		$depth2 = "list";
		$title = "마스터 등록";
		$sub_title = "마스터 등록";
			    
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";


		
		$param = "";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		$academiList = $this->user_model->getUserList($data);

		$data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		
		$data = $this->user_model->getUserSeq($seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "academiList" =>  $academiList,
            "data"        => $data,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/master/write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	public function writeProc()
	{
	    $user_seq= @$this->input->post("user_seq");
	    $user_type=$this->input->post("user_type");
	    $user_id=$this->input->post("user_id");
	    $user_password=$this->input->post("user_password");
	    $group_name=$this->input->post("group_name");
	    $user_name=$this->input->post("user_name");
	    $cell_no=$this->input->post("cell_no");
	    $email=$this->input->post("email");
	    $address=$this->input->post("address");
	    $product=$this->input->post("product");
	    $pricing_plan=$this->input->post("pricing_plan");
	    $business_no=$this->input->post("business_no");
	    $start_date=$this->input->post("start_date");
	    $end_date=$this->input->post("end_date");
	    $use_count=$this->input->post("use_count");
	    $sms_yn=$this->input->post("sms_yn");
	    $marketing_yn=$this->input->post("marketing_yn");
	    $user_status=$this->input->post("user_status");
	    $stop_term=$this->input->post("stop_term");
	    $stop_reason=$this->input->post("stop_reason");
	    $memo=$this->input->post("memo");
		$reg_date = date("Y-m-d H:i:s");

		$user_id = strtolower($user_id);
		

        if($user_seq != "") {
            // 업데이트
            if($user_password != "") {
        		$data = array(
        			"user_name"	=>	$user_name,
        			"user_password"	=>	$this->encrypt("password",$user_password),
        			"group_name"	=>	$group_name,
        			"user_type"	=>	$user_type,
        			"cell_no"	=>	$cell_no,
        			
        			"start_date"	=>	$start_date,
        			"end_date"	=>	$end_date,
        			"email"	=>	$email,
        			"address"	=>	$address,

        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			"memo"	=>	$memo,
        			"mod_date" => $reg_date
        		);		                
            } else {
        		$data = array(
        			"user_name"	=>	$user_name,
        			"group_name"	=>	$group_name,
        			"user_type"	=>	$user_type,
        			"cell_no"	=>	$cell_no,
        			"email"	=>	$email,
        			"address"	=>	$address,
        			"start_date"	=>	$start_date,
        			"end_date"	=>	$end_date,
        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			"memo"	=>	$memo,
        			"mod_date" => $reg_date
        		);		
        	}
    		            
            $result = $this->user_model->updateUser($user_seq, $data);
        } else { 
            // 신규회원
    		$duplicateId = $this->user_model->getDuplicateUserId($user_id);

    		if($duplicateId>0){
    			$this->jsonFail('중복된 아이디가 있습니다.');
    		}
    		$data = array(
    			"user_name"	=>	$user_name,
    			"user_id"	=>	$user_id,
    			"user_password"	=>	$this->encrypt("password",$user_password),
    			"group_name"	=>	$group_name,
    			"user_type"	=>	$user_type,
    			"cell_no"	=>	$cell_no,
    			"email"	=>	$email,
    			"address"	=>	$address,
    			"start_date"	=>	$start_date,
    			"end_date"	=>	$end_date,
    			"sms_yn"	=>	$sms_yn,
    			"marketing_yn"	=>	$marketing_yn,
    			"user_status"	=>	$user_status,
    			"stop_term"	=>	$stop_term,
    			"stop_reason"	=>	$stop_reason,
    			"memo"	=>	$memo,
    			"reg_date"	=>	$reg_date,
    		);		    		

		    $result = $this->user_model->insertUser($data);
		} 

		$this->jsonSuccess();
	}		

	public function quiz_confirm_list()
	{
		$depth1 = "master";
		$depth2 = "quiz_confirm_list";
		$title = "마스터 퀴즈 승인 관리";
		$sub_title = "마스터 퀴즈 승인 관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		$where = " AND c.user_type='master'";

		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		$list_total = $this->quiz_model->getQuizTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "";

		$whereData = array(
				"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);
        $list = array();
		$list = $this->quiz_model->getQuizList($whereData);

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

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			switch($list[$i]['status']){
				case "Y":
				$list[$i]['status'] = "공개";
				break;
				case "N":
				$list[$i]['status'] = "비공개";
				break;
			}
			
			if($list[$i]['worksheet'] != "" )
			    $list[$i]['worksheet'] = "O";
			else 
			    $list[$i]['worksheet'] = "X";

		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/master/quiz_confirm_list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	 

	public function studentWriteProc()
	{
		$user_name = $this->input->post("user_name");
        $user_id = $this->input->post("user_id");
        $user_password = $this->input->post("user_password");
        $academy_seq = $this->input->post("academy_seq");
        $email = $this->input->post("email");
        $gender = $this->input->post("gender");
        $phone = $this->input->post("phone");
        $parent_phone = $this->input->post("parent_phone");
        $school_name = $this->input->post("school_name");
        $school_year = $this->input->post("school_year");
        $academy_class_seq = $this->input->post("academy_class_seq");
		$status = $this->input->post("status");
		$reg_date = date("Y-m-d H:i:s");

		$user_id = strtolower($user_id);


		$duplicateId = $this->academi_model->getDuplicateUserId($user_id);

		if($duplicateId>0){
			$this->jsonFail('중복된 아이디가 있습니다.');
		}

		//승인인원체크
		if($status == "C"){
			$student_total = $this->academi_model->getStudentTotal($academy_seq);
			$current_total = $this->academi_model->getCurrentStudent($academy_seq);
			if($student_total<=$current_total){
				$this->jsonFail('student over');
			}
		}



		$data = array(
			"user_name"	=>	$user_name,
			"user_id"	=>	$user_id,
			"user_password"	=>	$this->encrypt("password",$user_password),
			"academy_seq"	=>	$academy_seq,
			"email"	=>	$email,
			"gender"	=>	$gender,
			"phone"	=>	str_replace(",","",$phone),
			"parent_phone"	=>	str_replace(",","",$parent_phone),
			"school_name"	=>	$school_name,
			"school_year"	=>	$school_year,
			"academy_class_seq"	=>	$academy_class_seq,
			"status"		=>	$status,
			"reg_date"	=>	$reg_date,
		);

		$result = $this->academi_model->insertUser($data);

		$this->jsonSuccess();
	}
	
    public function master_user_popup($userid="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "마스터 관리";
		$sub_title = "마스터 관리";
			    
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

		
		$param = "";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		//$academiList = $this->user_model->getUserList($data);
		
		$data = $this->user_model->getUserData($userid);
		// 선생님 정보
				$teacherWhere = array(
		                    "group_name" => $data['group_name'],
		                    "class_name" => $data['class_name'],
		                );
		$teacherData = $this->user_model->getTeacherData($teacherWhere);
		// 선생님 정보
		$data['teacher_name'] = $teacherData['user_name'];
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50" );
		
		$planList = $this->code_model->getCodeList($whereData);						
		
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND a.user_id='{$userid}'",
			"limit"			=>	""
		);
		$list_total = $this->quiz_model->getQuizTotalCount($whereData);
		
        //$list = array();
		$list = $this->quiz_model->getQuizList($whereData);		
		$list = $this->add_counting($list,$list_total,0);
		$term_where ="";
		
		$data['class_user_cnt'] = $list_total;
		
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "list" =>  $list,
            "list_total" =>  $list_total,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/master/master_user_popup",$content_data);


	}	
		
	public function checkUserId() 
	{
	    $user_id = $this->input->post("user_id");
        $duplicateId = $this->academi_model->getDuplicateUserId($user_id);

		if($duplicateId>0){
			$this->jsonFail('중복된 아이디가 있습니다.');
		} else{ 
		    $this->jsonSuccess(['msg' => '사용이 가능한 아이디 입니다.']);
	    }
		exit;	    
	}

	public function modify($user_seq)
	{
		$depth1 = "admin";
		$depth2 = "studentList";
		$title = "가맹점 관리";
		$sub_title = "가맹점 관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$mode = $this->input->get("mode") ?? "";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

    $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		$academiList = $this->academi_model->getAcademiList($data);

		$data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		$academiClassList = $this->academi_model->getAcademiClassList($data);

		$userData = $this->member_model->getStudent($user_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "academiList" =>  $academiList,
            "academiClassList"  =>  $academiClassList,
			"userData"	=>	$userData,
			"user_seq"	=>	$user_seq,
			"mode"	=>	$mode,
			"num"	=>	$num,
			"srcN"	=>	$srcN,
			"srcType"	=>	$srcType,
			"status"	=>	$status,
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/partner/write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function studentModifyProc()
	{
		$user_seq = $this->input->post("user_seq");
		$user_name = $this->input->post("user_name");
        $user_password = $this->input->post("user_password");
		$user_password_org = $this->input->post("user_password_org");
        $academy_seq = $this->input->post("academy_seq");
        $email = $this->input->post("email");
        $gender = $this->input->post("gender");
        $phone = $this->input->post("phone");
        $parent_phone = $this->input->post("parent_phone");
        $school_name = $this->input->post("school_name");
        $school_year = $this->input->post("school_year");
        $academy_class_seq = $this->input->post("academy_class_seq");
		$status = $this->input->post("status");
		$reg_date = date("Y-m-d H:i:s");

		//승인인원체크
		if($status == "C"){
			$student_total = $this->academi_model->getStudentTotal($academy_seq);
			$current_total = $this->academi_model->getCurrentStudent($academy_seq);
			if($student_total <= $current_total){
				$this->jsonFail('student over');
			}
		}

		if(empty($user_password)){
			$user_password = $this->decrypt("password",$user_password_org);
		}

		$data = array(
			"user_name"	=>	$user_name,
			"user_password"	=>	$this->encrypt("password",$user_password),
			"academy_seq"	=>	$academy_seq,
			"email"	=>	$email,
			"gender"	=>	$gender,
			"phone"	=>	str_replace(",","",$phone),
			"parent_phone"	=>	str_replace(",","",$parent_phone),
			"school_name"	=>	$school_name,
			"school_year"	=>	$school_year,
			"academy_class_seq"	=>	$academy_class_seq,
			"status"		=>	$status,
			"update_time"	=>	$reg_date,
		);

		$result = $this->academi_model->updateUser($user_seq,$data);

		$this->jsonSuccess();
	}

	public function studentDelete($user_seq)
	{
		$this->academi_model->deleteUser($user_seq);
		$this->msg("삭제되었습니다.");
		$this->goURL("/admin/academiAdm/studentList");
		exit;
	}
            
	public function quizSaveProc()
	{
		$quiz_seq = $this->input->post("quiz_seq");
		$confirm_yn = $this->input->post("confirm_yn");
		$confirm_message = $this->input->post("confirm_message");
		$mode = $this->input->post("mode");

        if($mode == "accept") {
    		$data = array(
    			"confirm_yn"	=>	$confirm_yn,
    			"confirm_date" => date("Y-m-d H:i:s")
    		);
    		$result = $this->quiz_model->updateQuiz($data,$quiz_seq);
    	} else if($mode == "deny") {
    		$data = array(
    			"confirm_yn"	=>	$confirm_yn,
    			"confirm_message"	=>	$confirm_message,
    			"confirm_date" => date("Y-m-d H:i:s")
    		);
    		$result = $this->quiz_model->updateQuiz($data,$quiz_seq);
    	}

		$this->jsonSuccess();
	}

	public function academiClassDeleteProc()
	{
		$academy_class_seq = $this->input->post("academy_class_seq");
		$class_name = $this->input->post("class_name");

		$data = array(
			"class_name"	=>	$class_name
		);

		$result = $this->academi_model->deleteAcademyClass($academy_class_seq,$data);

		if($result['result']=="success"){
			$this->jsonSuccess();
		}else{
			$this->jsonFail();
		}
	}
	
    public function master_popup($seq="")
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


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

        $data = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		//$academiList = $this->user_model->getUserList($data);
		
		$data = $this->user_model->getUserSeq($seq);
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						
		
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
		 
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "list" =>  $list,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/master/user-pop",$content_data);


	}		

	public function studentListPop()
	{
		$depth1 = "admin";
		$depth2 = "homeworkList";
		$title = "숙제배정하기";
		$sub_title = "숙제배정하기";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');

		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND academy_seq = '{$academy_seq}'";
		}

		$whereData = array(
			"where"	=>	$where,
			"limit"	=>	""
		);

		$academy_class = $this->academi_model->getAcademiClassList($whereData);

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"academy_class"	=>	$academy_class
		);




		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/homework/student-list-pop",$content_data);


	}

	public function studentDownLoad()
	{


		$this->load->library('excel');

		$srcN = $this->input->post('srcN_excel');
		$srcType = $this->input->post('srcType_excel');
		$status = $this->input->post('status_excel');


		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

		$where = "";

		if(!empty($srcN)){
			if($srcType=="name"){
				$where .= "AND user.user_name LIKE '%{$srcN}%'";
			}else if($srcType=="id"){
				$where .= "AND user.user_id LIKE '%{$srcN}%'";
			}else{
				$where .= "AND user.user_name LIKE '%{$srcN}%' OR user.user_id LIKE '%{$srcN}%'";
			}
		}

		if($status!="all"){
			$where .= "AND user.status = '{$status}'";
		}

		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND user.academy_seq = '{$academy_seq}'";
		}

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$studentList = $this->academi_model->getStudentList($whereData);

		//customSetting
		for($i = 0; $i < count($studentList); $i++)
		{
			$studentList[$i]['reg_date'] = date("Y-m-d",strtotime($studentList[$i]['reg_date']));

              switch($studentList[$i]['status']){
                case "C":
                $studentList[$i]['status'] = "승인";
                break;

                case "R":
                $studentList[$i]['status'] = "대기";
                break;

                case "L":
                $studentList[$i]['status'] = "탈퇴";
                break;

                case "D":
                $studentList[$i]['status'] = "삭제";
                break;
              }

			switch($studentList[$i]['school_year']){
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				$studentList[$i]['school_year'] = "초등 ".$studentList[$i]['school_year']."학년";
				break;
				case 7:
				case 8:
				case 9:
				$studentList[$i]['school_year'] = "중등 ".($studentList[$i]['school_year']-6)."학년";
				break;
				case 10:
				case 11:
				case 12:
				$studentList[$i]['school_year'] = "고등 ".($studentList[$i]['school_year']-9)."학년";
				break;
			}
		}




		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		$this->excel->getActiveSheet()->setCellValue('A1', '회원아이디');
		$this->excel->getActiveSheet()->setCellValue('B1', '회원이름');
		$this->excel->getActiveSheet()->setCellValue('C1', '이메일');
		$this->excel->getActiveSheet()->setCellValue('D1', '성별');
		$this->excel->getActiveSheet()->setCellValue('E1', '핸드폰');
		$this->excel->getActiveSheet()->setCellValue('F1', '부모연락처');
		$this->excel->getActiveSheet()->setCellValue('G1', '학교이름');
		$this->excel->getActiveSheet()->setCellValue('H1', '학년');
		$this->excel->getActiveSheet()->setCellValue('I1', '반');
		$this->excel->getActiveSheet()->setCellValue('J1', '상태');
		$this->excel->getActiveSheet()->setCellValue('K1', '등록일');


		for($i=0; $i<count($studentList); $i++){
		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$studentList[$i]['user_id']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$studentList[$i]['user_name']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$studentList[$i]['email']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$studentList[$i]['gender']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$studentList[$i]['phone']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$studentList[$i]['parent_phone']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$studentList[$i]['school_name']);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$studentList[$i]['school_year']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$studentList[$i]['class_name']);
			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$studentList[$i]['status']);
			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$studentList[$i]['reg_date']);

		}

		$this->excel->setActiveSheetIndex(0);

		$title = "회원내역_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}

	public function updateUserStatus()
	{
		$user_status = $this->input->post("user_status");
		$user_seq_arr = $this->input->post("chk");

		$student_arr = $this->academi_model->getStudentArray($user_seq_arr);

		for($i=0; $i<count($student_arr); $i++){
			$user_seq = $student_arr[$i]['user_seq'];
			//승인인원체크
			if($user_status == "C"){
				$student_total = $this->academi_model->getStudentTotal($student_arr[$i]['academy_seq']);
				$current_total = $this->academi_model->getCurrentStudent($student_arr[$i]['academy_seq']);
				if($student_total <= $current_total){
					$this->jsonFail('student over');
				}
			}

			$this->academi_model->updateUserStatus($user_seq,$user_status);
		}

		$this->jsonSuccess();


	}


	public function masterExcel()
	{
		$sub_title = "엑셀 업로드";
		$depth1 = "";
		$depth2 = "";

		$this->CONFIG_DATA['depth1'] = $depth1;
		$this->CONFIG_DATA['depth2'] = $depth2;

      	$content_data = array(
          "base_url"  	=>  $this->BASE_URL,
      		"sub_title"		=>	$sub_title,
    			"depth1"			=>	$depth1
        );

      	//header and css loads
        $this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

      	//footer js files
      	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
      	//contents
        $this->parser->parse("admin/master/master-excel-pop",$content_data);
	}		
	
	//가맹점 등록 엑셀 저장
	public function masterExcelProc()
	{
		$excel = load_controller('admin/excelAdm');
		$excel_file = $_FILES['excel']['tmp_name'];

		$objPHPExcel = PHPExcel_IOFactory::load($excel_file);
		$objPHPExcel->setActiveSheetIndex(0);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray(null,true,true,true);

		/*sheetData
		A = 아이디
		B = 비밀번호
		C = 이름
		D = 휴대폰번호
		E = 이메일
		F = 주소
		G = 계약일
		H = 만료일
		I = 서비스 시작일
		J = 서비스 종료일
		K = 마케팅수신동의
		L = 개인정보 이용동의
		M = 상태
		N = 메모
		*/

		//엑셀 제목 삭제
		array_shift($sheetData);

		//에러 정리 array
		$errorArr = array();

		if( count($sheetData) > 0 ){
			$errorArr['noData'] = true;
			$success = 0;
			$failed = 0;
			for( $i = 0; $i < count($sheetData); $i++ ){
				$user_id = $sheetData[$i]['A'];
				$password = $sheetData[$i]['B'];
				$user_name = $sheetData[$i]['C'];
				$cell_no = $sheetData[$i]['D'];
				$email = $sheetData[$i]['E'];
				$address = $sheetData[$i]['F'];
				$start_date = $sheetData[$i]['G'];
				
				$end_date = $sheetData[$i]['H'];
				$service_start_date = $sheetData[$i]['I'];
				$service_end_date = $sheetData[$i]['J'];
				
				$start_date = $this->dateChange($start_date);
				$end_date = $this->dateChange($end_date);
				$service_start_date = $this->dateChange($service_start_date);
				$service_end_date = $this->dateChange($service_end_date);
								
				$marketing_yn = $sheetData[$i]['K'];
				$privacy_term = $sheetData[$i]['L'];
				$user_status = $sheetData[$i]['M'];
				$memo = $sheetData[$i]['N'];
				
				$reg_date = date("Y-m-d H:i:s");

				if(empty($user_id)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "아이디를 입력해야합니다.";
					$failed++;
					continue;
				}

				if(strlen($user_id) < 6){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "아이디를 6자 이상 입력해야합니다.";
					$failed++;
					continue;
				}												

				if(empty($password)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "비밀번호를 입력해야합니다.";
					$failed++;
					continue;
				}
				
				
				if(empty($marketing_yn)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "마케팅수신동의를 입력해야합니다.";
					$failed++;
					continue;
				}							
				
				if(empty($privacy_term)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "개인정보이용동의를 입력해야합니다.";
					$failed++;
					continue;
				}					
				
				if(empty($user_status)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "상태를 입력해야합니다.";
					$failed++;
					continue;
				}		
			 		
				

				//등록여부
				$duplicateId = $this->user_model->getDuplicateUserId($user_id);

				if($duplicateId==0){


					//등록진행
            		$data = array(
            		    "user_id"	=>	$user_id,
            		    "user_password"	=>	$this->encrypt("password",$password),
            			"user_name"	=>	$user_name,
            			"user_type"	=>	"master",
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,            			
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,
            			"privacy_term"	=>	$privacy_term,
            			"marketing_yn"	=>	$marketing_yn,
            			"user_status"	=>	$user_status,
            			"memo"	=>	$memo,
            			"reg_date" => $reg_date
            		);	

					$result = $this->user_model->insertUser($data);
					$success++;
				}else{
					$errorArr[$failed]['user_id'] = $user_id;
					$errorArr[$failed]['error_msg'] = "{$user_id}는 이미 등록된 아이디입니다.";
					$failed++;
					continue;
				}
			}

		}else{
			$errorArr['noData'] = true;
		}

		$sub_title = "엑셀 업로드 결과";
		$depth1 = "";
		$depth2 = "";

		$this->CONFIG_DATA['depth1'] = $depth1;
		$this->CONFIG_DATA['depth2'] = $depth2;

      	$content_data = array(
      		"sub_title"		=>	$sub_title,
    			"depth1"			=>	$depth1,
    			"success"			=>	$success,
    			"failed"			=>	$failed,
    			"errorArr"		=>	$errorArr
        );
        

      	//header and css loads
        $this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

      	//footer js files
      	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
      	//contents
        $this->parser->parse("admin/master/master-excel-proc",$content_data);
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

	// ═══════════════════════════════════════════════════════
	// 결제 관리 - 슈퍼어드민(admin_level == "0") 전용
	// ═══════════════════════════════════════════════════════

	/**
	 * 전체 결제 내역 조회 리스트
	 * URL: /admin/master/payment_list
	 */
	public function payment_list()
	{
		$depth1    = "master";
		$depth2    = "paymentList";
		$title     = "결제 내역 관리";
		$sub_title = "전체 결제 내역 조회";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		// 검색 파라미터
		$num              = (int)($this->input->get('num') ?? 0);
		$searchTermType   = $this->input->get('searchTermType');
		$startDate        = $this->input->get('startDate');
		$endDate          = $this->input->get('endDate');
		$searchStatus     = $this->input->get('searchStatus');
		$searchPlanType   = $this->input->get('searchPlanType');
		$keyword          = $this->input->get('keyword');

		$where = "";

		// 기간 필터
		if ($searchTermType === 'term' && !empty($startDate) && !empty($endDate)) {
			$where .= " AND p.reg_date >= '{$startDate}' AND p.reg_date <= '{$endDate} 23:59:59'";
		}

		// 결제 상태 필터
		if (!empty($searchStatus)) {
			$where .= " AND p.payment_status = '{$searchStatus}'";
		}

		// 요금제 필터
		if (!empty($searchPlanType)) {
			$where .= " AND p.plan_type = '{$searchPlanType}'";
		}

		// 키워드 필터 (학원명, 아이디)
		if (!empty($keyword)) {
			$where .= " AND (p.group_name LIKE '%{$keyword}%' OR p.user_id LIKE '%{$keyword}%')";
		}

		$page_size = 15;

		$whereData  = array('where' => $where);
		$list_total = $this->payment_model->getPaymentTotalCount($whereData);
		$total_page = ceil($list_total / $page_size);

		$whereData = array(
			'where' => $where,
			'sort'  => 'ORDER BY p.reg_date DESC',
			'limit' => "LIMIT {$num},{$page_size}",
		);
		$list = $this->payment_model->getPaymentList($whereData);

		// 상태/요금제 레이블 한국어 변환
		$status_label = array(
			'pending'   => '결제대기',
			'paid'      => '결제완료',
			'failed'    => '결제실패',
			'cancelled' => '취소',
			'refunded'  => '환불',
		);
		$plan_label = array(
			'monthly' => '월 구독',
			'6month'  => '6개월',
			'12month' => '12개월',
		);

		for ($i = 0; $i < count($list); $i++) {
			$list[$i]['payment_status_label'] = $status_label[$list[$i]['payment_status']] ?? $list[$i]['payment_status'];
			$list[$i]['plan_type_label']      = $plan_label[$list[$i]['plan_type']] ?? $list[$i]['plan_type'];
			$list[$i]['reg_date']             = date('Y-m-d', strtotime($list[$i]['reg_date']));
		}

		// 페이징 생성
		$page_list_size = 10;
		$current_page   = ceil(($num + 1) / $page_size);
		$start_page     = floor(($current_page - 1) / $page_list_size) * $page_list_size + 1;
		$end_page       = min($start_page + $page_list_size - 1, $total_page);
		$paging = $this->make_paging2("payment_list", $start_page, $end_page, $page_size, $num, '', $total_page, '');

		$content_data = array(
			"depth1"          => $depth1,
			"title"           => $title,
			"sub_title"       => $sub_title,
			"list"            => $list,
			"list_total"      => $list_total,
			"paging"          => $paging,
			"num"             => $num,
			"searchTermType"  => $searchTermType,
			"startDate"       => $startDate,
			"endDate"         => $endDate,
			"searchStatus"    => $searchStatus,
			"searchPlanType"  => $searchPlanType,
			"keyword"         => $keyword,
		);

		$this->parser->parse("admin/include/header",       $this->CONFIG_DATA);
		$this->parser->parse("admin/include/left",         $this->CONFIG_DATA);
		$this->parser->parse("admin/master/payment-list",  $content_data);
		$this->parser->parse("admin/include/footer",       $this->CONFIG_DATA);
		$this->parser->parse("admin/include/footer_js",    $this->CONFIG_DATA);
	}

	/**
	 * 결제 상세 팝업
	 * URL: /admin/master/payment_detail/{payment_seq}
	 */
	public function payment_detail($payment_seq = "")
	{
		$data = $this->payment_model->getPaymentDetail($payment_seq);

		if (empty($data)) {
			echo "<script>alert('존재하지 않는 결제 내역입니다.'); window.close();</script>";
			return;
		}

		$status_label = array(
			'pending'   => '결제대기',
			'paid'      => '결제완료',
			'failed'    => '결제실패',
			'cancelled' => '취소',
			'refunded'  => '환불',
		);
		$plan_label = array(
			'monthly' => '월 구독 (정기결제)',
			'6month'  => '6개월 (10% 할인)',
			'12month' => '12개월 (20% 할인)',
		);

		$data['payment_status_label'] = $status_label[$data['payment_status']] ?? $data['payment_status'];
		$data['plan_type_label']      = $plan_label[$data['plan_type']] ?? $data['plan_type'];

		$content_data = array(
			"data" => $data,
		);

		$this->parser->parse("admin/include/pop-header",         $this->CONFIG_DATA);
		$this->parser->parse("admin/master/payment-detail-pop",  $content_data);
		$this->parser->parse("admin/include/pop-footer",         $this->CONFIG_DATA);
	}

	/**
	 * 결제 상태 수동 변경 (POST - AJAX)
	 * URL: /admin/master/payment_status_update
	 * 슈퍼어드민이 직접 결제 상태를 변경할 수 있는 수동 처리 엔드포인트
	 */
	public function payment_status_update()
	{
		if ($this->input->method() !== 'post') {
			$this->jsonFail('잘못된 요청입니다.');
			return;
		}

		$payment_seq    = $this->input->post('payment_seq');
		$payment_status = $this->input->post('payment_status');
		$memo           = $this->input->post('memo');

		// 허용된 상태값 검증
		$allowed_status = array('pending', 'paid', 'failed', 'cancelled', 'refunded');
		if (!in_array($payment_status, $allowed_status)) {
			$this->jsonFail('잘못된 상태값입니다.');
			return;
		}

		$update_data = array(
			'payment_status' => $payment_status,
		);

		// 메모가 있는 경우에만 업데이트
		if (!is_null($memo)) {
			$update_data['memo'] = $memo;
		}

		$result = $this->payment_model->updatePayment($payment_seq, $update_data);

		if ($result !== false) {
			$this->jsonSuccess(['msg' => '상태가 변경되었습니다.']);
		} else {
			$this->jsonFail('상태 변경 중 오류가 발생했습니다.');
		}
	}

}
