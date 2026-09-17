<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Partner extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("user_model");
		$this->load->model("code_model");
		$this->load->model("academi_model");
		$this->load->model("userHistory_model");
		$this->load->model("adm_model");
		$this->load->model("book_model");
		$this->load->model("payment_model"); // 결제 모델
		$this->load->helper('load_controller');
		
		$this->load->model("quiz_model");
		$this->load->model("quizHistory_model");
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
	
    //리스트
	public function list()
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "가맹점 등록/조회";
		$sub_title = "가맹점 등록/조회";

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
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						
		
	    for($i=0;$i<count($planList);$i++) {
	        $planNewList[$planList[$i]['code_type']] = $planList[$i]['code_name'];
	    }				

		$this->load->helper('label'); // 레이블 변환 공통 헬퍼

		$where = "";
		$where .= "AND user_type = 'director'";
		
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

		// 날짜 포맷 + 요금제명 변환 + user_type/user_status 레이블 변환 (label_helper 사용)
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date']     = date("Y-m-d", strtotime($list[$i]['reg_date']));
			$list[$i]['pricing_plan'] = $planNewList[$list[$i]['pricing_plan']] ?? $list[$i]['pricing_plan'];
		}
		$list = apply_user_labels($list);
		


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"planList" => $planList,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/partner/list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	
    //리스트
	public function teacher_list()
	{
		$depth1 = "partner";
		$depth2 = "teacherList";
		$title = "선생님 등록/조회";
		$sub_title = "선생님 등록/조회";

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
		$where .= "AND user_type = 'teacher' and group_name='".$this->session->userdata("group_name")."'";
		
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

		$paging = $this->make_paging2("teacher_list",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
            switch($list[$i]['user_status']){
                case "Y":
                    $list[$i]['user_status'] = "정상";
                break;
                case "N":
                    $list[$i]['user_status'] = "정지";
                break;
            }
            switch($list[$i]['user_type']){
                case "director":
                    $list[$i]['user_type'] = "원장";
                break;
                case "teacher":
                    $list[$i]['user_type'] = "선생님";
                break;
                case "master":
                    $list[$i]['user_type'] = "마스터";
                break;
                case "user":
                    $list[$i]['user_type'] = "원생";
                break;
            }     

		}
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"planList" => $planList,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/partner/teacher-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
	
  //숙재배정 리스트
	public function total_list()
	{
		$depth1 = "partner";
		$depth2 = "total_list";
		$title = "가맹점 사용현황리스트";
		$sub_title = "가맹점 사용현황리스트";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";


		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);				
	    for($i=0;$i<count($planList);$i++) {
	        $planNewList[$planList[$i]['code_type']] = $planList[$i]['code_name'];
	    }
	    
	    
		$where = "";
		$where .= "AND user_type = 'director'";
		
		if($srcN != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (user_id like '%".$srcN."%' OR group_name like '%".$srcN."%' or user_name like '%".$srcN."%' or cell_no like '%".$srcN."%')";   
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

		$paging = $this->make_paging2("total_list",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
		    $totalCount = 0;
		    $teacherCount = 0;
            $where = " AND user_type = 'user' and group_name='".$list[$i]['group_name']."' ";
            
    		$whereData = array(
    			"where"			=>	$where,
    		);
    		$totalCount = $this->user_model->getUserTotalCount($whereData);
    		
    		
            $where = " AND user_type = 'teacher' and group_name='".$list[$i]['group_name']."'  and user_status='Y'";
    		$whereData = array(
    			"where"			=>	$where,
    		);
    		$teacherCount = $this->user_model->getUserTotalCount($whereData);    		
    				    
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
			$list[$i]['teacher_count'] = $teacherCount;
			$list[$i]['user_count'] = $totalCount;			
			$list[$i]['pricing_plan'] = $planNewList[$list[$i]['pricing_plan']];
            switch($list[$i]['user_status']){
                case "Y":
                    $list[$i]['user_status'] = "정상";
                break;
                case "N":
                    $list[$i]['user_status'] = "정지";
                break;
            }
            switch($list[$i]['user_type']){
                case "director":
                    $list[$i]['user_type'] = "원장";
                break;
                case "teacher":
                    $list[$i]['user_type'] = "선생님";
                break;
                case "master":
                    $list[$i]['user_type'] = "마스터";
                break;
                case "user":
                    $list[$i]['user_type'] = "원생";
                break;
            }     			
		}
		


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"planList" => $planList,
			"planNewList"=>$planNewList,
			"paging"		=>	$paging,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/partner/total_list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
	
    public function teacher_write($seq="")
	{
		$depth1 = "partner";
		$depth2 = "teacherList";
		$title = "선생님 등록/조회";
		$sub_title = "선생님 등록/조회";
			    
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
		if($this->session->userdata("admin_type") == "director") {
		    $director_seq =$this->session->userdata("admin_seq"); 
		}		
		
		$director_data = $this->user_model->getUserSeq($director_seq);
 
		
		$data = $this->user_model->getUserSeq($seq);
		if($data['group_name'] == "") 
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList(@$whereData);
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "planList" => $planList,
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

		    $this->parser->parse("admin/partner/teacher-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
 
    public function write($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		if($this->session->userdata("admin_level") == "0"){
		    $title = "가맹점관리";
		    $sub_title = "가맹점 등록/조회";
	    } else {
		    $title = "내정보";
		    $sub_title = "내정보";
		}
			    
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
		if($this->session->userdata("admin_type") == "director" || $this->session->userdata("admin_type") == "master" || $this->session->userdata("admin_type") == "teacher") {
		    $seq =$this->session->userdata("admin_seq"); 
		}
		
		
		$data = $this->user_model->getUserSeq($seq);
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						
		

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "planList" => $planList,
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
		if($this->session->userdata("admin_type") == "director") {
		    $this->parser->parse("admin/partner/mypage-director",$content_data);
		} else if($this->session->userdata("admin_type") == "master") {
		    $this->parser->parse("admin/partner/mypage-master",$content_data);
		} else if($this->session->userdata("admin_type") == "teacher") {
		    $this->parser->parse("admin/partner/mypage-teacher",$content_data);
		} else
		    $this->parser->parse("admin/partner/write",$content_data);

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
	    $pricing_price=$this->input->post("pricing_price");
	    $business_no=$this->input->post("business_no");
	    $start_date=$this->input->post("start_date");
	    $end_date=$this->input->post("end_date");
	    
	    
	    
	    $service_start_date=$this->input->post("service_start_date");
	    $service_end_date=$this->input->post("service_end_date");
	    	    
	    $use_count=$this->input->post("use_count");
	    $sms_yn=$this->input->post("sms_yn");
	    $marketing_yn=$this->input->post("marketing_yn");
	    $privacy_term=$this->input->post("privacy_term");
	    
	    $user_status=$this->input->post("user_status");
	    $stop_term=$this->input->post("stop_term");
	    $stop_reason=$this->input->post("stop_reason");
	    $memo=$this->input->post("memo");
		$reg_date = date("Y-m-d H:i:s");

		$user_id = strtolower($user_id);
		
		$class_name=$this->input->post("class_name");
		    $info = $this->user_model->getUserData($user_id);
            if($user_seq != "") {
                
                // 업데이트
                if($user_password != "") {
            		$data = array(
            			"user_name"	=>	$user_name,
            			"user_password"	=>	$this->encrypt("password",$user_password),
            			"group_name"	=>	$group_name,
            			"user_type"	=>	$user_type,
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"class_name"=>	@$class_name,
            			"pricing_plan"	=>	$pricing_plan,
            			"pricing_price"	=>	$pricing_price,
            			"business_no"	=>	$business_no,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,        			
            			"use_count"	=>	$use_count,
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
            			"class_name"=>	@$class_name,
            			"pricing_plan"	=>	$pricing_plan,
            			"pricing_price"	=>	$pricing_price,
            			"business_no"	=>	$business_no,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,        			
            			"use_count"	=>	$use_count,
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
                
                if($user_type=="teacher") {
                    // 반 정보가 달라졌을경우 학생의 반 수정
                    if($info['class_name'] != $class_name) {
                        $result = $this->user_model->updateClassName($class_name,$group_name, $info['class_name']);
                    }
                }
            } else { 
                // 신규회원
        		$duplicateId = $this->user_model->getDuplicateUserId($user_id);

        		if($duplicateId>0){
        			$this->jsonFail('중복된 아이디가 있습니다.');
        		}   
        		if($user_type=='director') {
            		// 학원 원장 계정 정보
            		$whereData = array(
            			"where"			=>	" AND group_name='$group_name'",
            		);        		    
            		$directorData = $this->user_model->getDirectorData($whereData);
            		if($directorData['user_seq'] != "") {
            			$this->jsonFail('중복된 학원명이 있습니다.');            		    
            		}
            		
        		}
    		    if($user_type=='user') {
            		$whereData = array(
            			"where"			=>	" AND group_name='$group_name' AND user_type='user'",
            		);
            		// 인원수 체크
            		$userCnt = $this->user_model->getUserTotalCount($whereData);
            		
            		// 학원 원장 계정 정보
            		$whereData = array(
            			"where"			=>	" AND group_name='$group_name'",
            		);
            		// 인원수 체크
            		$directorData = $this->user_model->getDirectorData($whereData);    		
            		if($userCnt >= $directorData['user_count']) {
            			$this->jsonFail('인원이 초과하였습니다.');    		    
            		}        		
            	}
    		    if($user_type=='teacher') {
            		$whereData = array(
            			"where"			=>	" AND group_name='$group_name' AND user_type='teacher'",
            		);
            		// 인원수 체크
            		$userCnt = $this->user_model->getUserTotalCount($whereData);
            		

            		if($userCnt >= 10) {
            			$this->jsonFail('인원이 초과하였습니다.');    		    
            		}        		
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
        			"class_name"=>	@$class_name,
        			"pricing_plan"	=>	$pricing_plan,
        			"pricing_price"	=>	$pricing_price,
        			"business_no"	=>	$business_no,
        			"start_date"	=>	$start_date,
        			"end_date"	=>	$end_date,
        			"service_start_date"	=>	$service_start_date,
        			"service_end_date"	=>	$service_end_date,        			
        			"use_count"	=>	$use_count,
        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			"memo"	=>	$memo,
        			"reg_date"	=>	$reg_date,
        		);		    		

    		    $result = $this->user_model->insertUser($data);
    		    
		    		$data = array(
		    			"user_name"	=>	$user_name,
		    			"user_id"	=>	$user_id,		    
		    			"user_type"	=>	$user_type,
		    			"reg_date"	=>	$reg_date);
		    		$result = $this->userHistory_model->insertUserHistory($data);    		    
    		} 

		$this->jsonSuccess();
	}
	
	public function logo_upload_file() 
	{
		$file = $_FILES['file']['name'];
		$file = empty($file) ? "" : $file;
    			    
        $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/logo/";
        
		if(!empty($file)){
			$file_name = "logo_".date("Ymdhis")."_".$file;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["file"]["tmp_name"],$upload_path.$file_name);

			$file = $file_name;
		}
		
		$this->jsonResponse(['result' => 'success', 'url' => $file]);
	}	
	
	public function typeWriteProc()
	{
		// [수정] @ 오류 억제자 제거 — input->post()는 값 없으면 false 반환하므로 ?? '' 처리로 대체
	    $user_seq       = $this->input->post("user_seq")       ?? '';
	    $user_type      = $this->input->post("user_type")      ?? '';
	    $user_id        = $this->input->post("user_id")        ?? '';
	    $user_password  = $this->input->post("user_password")  ?? '';
	    $group_name     = $this->input->post("group_name")     ?? '';
	    $user_name      = $this->input->post("user_name")      ?? '';
	    $cell_no        = $this->input->post("cell_no")        ?? '';
	    $email          = $this->input->post("email")          ?? '';
	    $address        = $this->input->post("address")        ?? '';
	    $product        = $this->input->post("product")        ?? '';
	    $pricing_plan   = $this->input->post("pricing_plan")   ?? '';
	    $pricing_price  = $this->input->post("pricing_price")  ?? '';
	    $business_no    = $this->input->post("business_no")    ?? '';
	    $start_date     = $this->input->post("start_date")     ?? '';
	    $end_date       = $this->input->post("end_date")       ?? '';
	    $logo           = $this->input->post("logo")           ?? '';
	    $service_start_date = $this->input->post("service_start_date") ?? '';
	    $service_end_date   = $this->input->post("service_end_date")   ?? '';
	    $use_count      = $this->input->post("use_count")      ?? '';
	    $sms_yn         = $this->input->post("sms_yn")         ?? '';
	    $marketing_yn   = $this->input->post("marketing_yn")   ?? '';
	    $privacy_term   = $this->input->post("privacy_term")   ?? '';
	    $user_status    = $this->input->post("user_status")    ?? '';
	    $stop_term      = $this->input->post("stop_term")      ?? '';
	    $stop_reason    = $this->input->post("stop_reason")    ?? '';
	    $memo           = $this->input->post("memo")           ?? '';
		$reg_date       = date("Y-m-d H:i:s");
		$class_name     = $this->input->post("class_name")      ?? '';
		$mode           = $this->input->post("mode")            ?? '';

		$user_id = strtolower($user_id);
		
		if($mode == "mypage") {
		    if($user_password != "") {
		        $data = array(
            			"cell_no"	=>	$cell_no,
            			"user_password"	=>	$this->encrypt("password",$user_password),
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"logo"	=>	$logo,
            			"mod_date" => $reg_date
            		);		
                $result = $this->user_model->updateUser($this->session->userdata("admin_seq"), $data);
		    } else {
		        $data = array(
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"logo"	=>	$logo,
            			"mod_date" => $reg_date
            		);		
                $result = $this->user_model->updateUser($this->session->userdata("admin_seq"), $data);
            }
		} else {
            if($user_seq != "") {
                // 업데이트
                if($user_password != "") {
            		$data = array(
            			"user_name"	=>	$user_name,
            			"user_password"	=>	$this->encrypt("password",$user_password),
            			"group_name"	=>	$group_name,
            			"user_type"	=>	$user_type,
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"class_name"	=>	@$class_name,
            			"pricing_plan"	=>	$pricing_plan,
            			"pricing_price"	=>	$pricing_price,
            			"business_no"	=>	$business_no,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,        			
            			"use_count"	=>	$use_count,
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
            			"class_name"	=>	@$class_name,
            			"pricing_plan"	=>	$pricing_plan,
            			"pricing_price"	=>	$pricing_price,
            			"business_no"	=>	$business_no,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,        			
            			"use_count"	=>	$use_count,
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
        			"class_name"	=>	@$class_name,
        			"pricing_plan"	=>	$pricing_plan,
        			"pricing_price"	=>	$pricing_price,
        			"business_no"	=>	$business_no,
        			"start_date"	=>	$start_date,
        			"end_date"	=>	$end_date,
        			"service_start_date"	=>	$service_start_date,
        			"service_end_date"	=>	$service_end_date,        			
        			"use_count"	=>	$use_count,
        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			"memo"	=>	$memo,
        			"reg_date"	=>	$reg_date,
        		);		    		

    		    $result = $this->user_model->insertUser($data);
    		    
		    		$data = array(
		    			"user_name"	=>	$user_name,
		    			"user_id"	=>	$user_id,		    
		    			"user_type"	=>	$user_type,
		    			"reg_date"	=>	$reg_date);
		    		$result = $this->userHistory_model->insertUserHistory($data);    		        		    
    		} 
    	}

		$this->jsonSuccess();
	}	
 
	public function deleteProc()
	{
	    $user_seq = $this->input->post("user_seq");
		$this->user_model->deleteUserClear($user_seq);
		//$this->msg("삭제되었습니다.");
		//$this->goURL("/admin/partner/list");
		$this->jsonSuccess();
	}
	
	public function deleteUser()
	{
	    $user_seq = $this->input->post("user_seq");
		//$this->user_model->deleteUser($user_seq);
		$this->user_model->deleteUserClear($user_seq);
		$this->jsonSuccess();
	}	


	public function updateUserStatus()
	{
		//$user_status = $this->input->post("user_status");
		$user_status = $this->input->post("status");
		$user_seq_arr = $this->input->post("user_seq");

		for($i=0; $i<count($user_seq_arr); $i++){
			$user_seq = $user_seq_arr[$i];
			//승인인원체크
			//if($user_status == "C"){
			//	$student_total = $this->academi_model->getStudentTotal($student_arr[$i]['academy_seq']);
			//	$current_total = $this->academi_model->getCurrentStudent($student_arr[$i]['academy_seq']);
			//	if($student_total <= $current_total){
			//		echo '{"result":"failed","msg":"student over"}';
			//		exit;
			//	}
			//}

			$this->user_model->updateUserStatus($user_seq,$user_status);
		}

		$this->jsonSuccess();
	}
	
	public function passwordChange()
	{
		$password = $this->input->post("password");
		$user_seq = $this->input->post("user_seq");

		// [수정] $user_status(미정의 변수) → 실제 입력받은 $password를 암호화하여 전달
		if(empty($password) || empty($user_seq)){
			$this->jsonFail('필수값이 누락되었습니다.');
		}

		$this->user_model->changePasswordSeq($user_seq, $this->encrypt("password", $password));

		$this->jsonSuccess();
	}	
	
	public function cellNoChange()
	{
		//$user_status = $this->input->post("user_status");
		$cell_no = $this->input->post("cell_no");
		$user_seq = $this->input->post("user_seq");
 
		$this->user_model->updateUserCellNo($user_seq,$cell_no);

		$this->jsonSuccess();
	}		
	

	//기관 등록 엑셀 팝업
	public function partnerExcel()
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
        $this->parser->parse("admin/partner/partner-excel-pop",$content_data);
	}	

	//기관 엑셀 다운로드
	public function schoolDownLoad()
	{

		$this->load->library('excel');

		$srcN = $this->input->post('srcN_excel');
		$srcType = $this->input->post('srcType_excel');
		$status = $this->input->post('status_excel');


		$srcN = empty($srcN) ? "" : $srcN;

		$srcType = empty($srcType) ? "all" : $srcType;

		$status = empty($status) ? "all" : $status;

		$where = "";

		if(!empty($srcN)){
			if($srcType=="name"){
				$where .= "AND school.school_name LIKE '%{$srcN}%'";
			}else if($srcType=="a_name"){
				$where .= "AND user.user_name LIKE '%{$srcN}%'";
			}else if($srcType=="a_id"){
				$where .= "AND user.user_id LIKE '%{$srcN}%'";
			}else{
				$where .= "AND (school.school_name LIKE '%{$srcN}%' OR user.user_name LIKE '%{$srcN}%' OR user.user_id LIKE '%{$srcN}%')";
			}
		}

		if($status != 'all'){
			$where .= "AND school.status = '{$status}'";
		}

		/*
		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND user.academy_seq = '{$academy_seq}'";
		}
		*/

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$schoolList = $this->school_model->getSchoolList($whereData);

		//customSetting
		for($i = 0; $i < count($schoolList); $i++)
		{
			$schoolList[$i]['reg_date'] = date("Y-m-d",strtotime($schoolList[$i]['reg_date']));

      switch($schoolList[$i]['status']){
        case "Y":
        $schoolList[$i]['status'] = "승인";
        break;

        case "N":
        $schoolList[$i]['status'] = "미승인";
        break;
      }

			if(empty($schoolList[$i]['admin_id'])){
				$schoolList[$i]['admin_id'] = "미지정";
			}

			if(empty($schoolList[$i]['admin_name'])){
				$schoolList[$i]['admin_name'] = "미지정";
			}

			switch($schoolList[$i]['school_classification']){
				case "ELE":
				$schoolList[$i]['school_classification'] = "초등학교";
				break;
				case "MID":
				$schoolList[$i]['school_classification'] = "중학교";
				break;
				case "HIG":
				$schoolList[$i]['school_classification'] = "고등학교";
				break;
				case "ETC":
				$schoolList[$i]['school_classification'] = "기타";
				break;
			}
		}

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
		$this->excel->getActiveSheet()->setCellValue('B1', '관리코드');
		$this->excel->getActiveSheet()->setCellValue('C1', '기관명');
		$this->excel->getActiveSheet()->setCellValue('D1', '기관구분');
		$this->excel->getActiveSheet()->setCellValue('E1', '우편번호');
		$this->excel->getActiveSheet()->setCellValue('F1', '주소1');
		$this->excel->getActiveSheet()->setCellValue('G1', '주소2');
		$this->excel->getActiveSheet()->setCellValue('H1', '연락처');
		$this->excel->getActiveSheet()->setCellValue('I1', '승인유무');
		$this->excel->getActiveSheet()->setCellValue('J1', '계약시작일');
		$this->excel->getActiveSheet()->setCellValue('K1', '계약종료일');
		$this->excel->getActiveSheet()->setCellValue('L1', '메모');
		$this->excel->getActiveSheet()->setCellValue('M1', '이메일');
		$this->excel->getActiveSheet()->setCellValue('N1', '지역');
		$this->excel->getActiveSheet()->setCellValue('O1', '도서열람가능여부');


		for($i=0; $i<count($schoolList); $i++){
		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$schoolList[$i]['contract_type']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$schoolList[$i]['school_no']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$schoolList[$i]['school_name']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$schoolList[$i]['school_classification']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$schoolList[$i]['zipcode']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$schoolList[$i]['addr_1']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$schoolList[$i]['addr_2']);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$schoolList[$i]['tel']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$schoolList[$i]['status']);
			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$schoolList[$i]['contract_start_date']);
			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$schoolList[$i]['contract_end_date']);
			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$schoolList[$i]['memo']);
			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$schoolList[$i]['email']);
			$this->excel->getActiveSheet()->setCellValue('N'.($i+2),$schoolList[$i]['location']);
			$this->excel->getActiveSheet()->setCellValue('O'.($i+2),$schoolList[$i]['book_yn']);

		}

		$this->excel->setActiveSheetIndex(0);

		$title = "기관내역_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}
	
	//엑셀 다운로드
	public function userDownLoad()
	{

		$this->load->library('excel');

		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$searchUserStatus = $this->input->get('searchUserStatus');
		$searchRatePlan = $this->input->get('searchRatePlan');
		$keyword = $this->input->get('keyword');
		
		$excelType = $this->input->get('excelType');


		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		if($excelType != "")
		    $where .= "AND user_type = '{$excelType}'";
		else
		    $where .= "AND user_type = 'director'";
		


		
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
			"limit"			=>	""
		);
        //$list = array();
		$list = $this->user_model->getUserList($whereData);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

		}
 

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);
		if($excelType == "user") {

    		// A1의 내용을 입력
    		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
    		$this->excel->getActiveSheet()->setCellValue('B1', '소속명');
    		$this->excel->getActiveSheet()->setCellValue('C1', '이름');
    		$this->excel->getActiveSheet()->setCellValue('D1', '휴대폰번호');
    		$this->excel->getActiveSheet()->setCellValue('E1', '이메일');
    		$this->excel->getActiveSheet()->setCellValue('F1', '주소');
    		$this->excel->getActiveSheet()->setCellValue('G1', '학부모이름');
    		$this->excel->getActiveSheet()->setCellValue('H1', '학부모 연락처');
    		$this->excel->getActiveSheet()->setCellValue('I1', '학년');
    		$this->excel->getActiveSheet()->setCellValue('J1', '반');
    		$this->excel->getActiveSheet()->setCellValue('K1', '마케팅수신동의(1,3,C)');
    		$this->excel->getActiveSheet()->setCellValue('L1', '개인정보이용동의');
    		$this->excel->getActiveSheet()->setCellValue('M1', '상태');
    		$this->excel->getActiveSheet()->setCellValue('N1', '메모');


    		for($i=0; $i<count($list); $i++){
    		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$list[$i]['user_id']);
    			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['group_name']);
    			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['user_name']);
    			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['cell_no']);
    			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['email']);
    			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$list[$i]['address']);
    			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$list[$i]['parent_name']);
    			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$list[$i]['parent_cell']);
    			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$list[$i]['grade']);
    			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$list[$i]['class_name']);
    			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$list[$i]['marketing_yn']);
    			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$list[$i]['privacy_term']);
    			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$list[$i]['user_status']);
    			$this->excel->getActiveSheet()->setCellValue('N'.($i+2),$list[$i]['memo']);
    			

    		}

    		$this->excel->setActiveSheetIndex(0);

    		$title = "가맹점 원생_".date("Ymd").".xls";
        } else if($excelType == "master") {

    		// A1의 내용을 입력
    		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
    		$this->excel->getActiveSheet()->setCellValue('B1', '이름');
    		$this->excel->getActiveSheet()->setCellValue('C1', '휴대폰번호');
    		$this->excel->getActiveSheet()->setCellValue('D1', '이메일');
    		$this->excel->getActiveSheet()->setCellValue('E1', '주소');
    		$this->excel->getActiveSheet()->setCellValue('F1', '계약일');
    		$this->excel->getActiveSheet()->setCellValue('G1', '만료일');
    		$this->excel->getActiveSheet()->setCellValue('H1', '서비스시작일');
    		$this->excel->getActiveSheet()->setCellValue('I1', '서비스만료일');
    		$this->excel->getActiveSheet()->setCellValue('J1', '마케팅수신동의(1,3,C)');
    		$this->excel->getActiveSheet()->setCellValue('K1', '개인정보이용동의');
    		$this->excel->getActiveSheet()->setCellValue('L1', '상태');
    		$this->excel->getActiveSheet()->setCellValue('M1', '메모');


    		for($i=0; $i<count($list); $i++){
    		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$list[$i]['user_id']);
    			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['user_name']);
    			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['cell_no']);
    			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['email']);
    			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['address']);
    			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$list[$i]['start_date']);
    			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$list[$i]['end_date']);
    			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$list[$i]['service_start_date']);
    			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$list[$i]['service_end_date']);
    			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$list[$i]['marketing_yn']);
    			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$list[$i]['privacy_term']);
    			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$list[$i]['user_status']);
    			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$list[$i]['memo']);

    		}

    		$this->excel->setActiveSheetIndex(0);

    		$title = "마스터_".date("Ymd").".xls";    	            
    	} else {

    		// A1의 내용을 입력
    		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
    		$this->excel->getActiveSheet()->setCellValue('B1', '소속명');
    		$this->excel->getActiveSheet()->setCellValue('C1', '이름');
    		$this->excel->getActiveSheet()->setCellValue('D1', '휴대폰번호');
    		$this->excel->getActiveSheet()->setCellValue('E1', '이메일');
    		$this->excel->getActiveSheet()->setCellValue('F1', '주소');
    		$this->excel->getActiveSheet()->setCellValue('G1', '이용상품');
    		$this->excel->getActiveSheet()->setCellValue('H1', '이용금액');
    		$this->excel->getActiveSheet()->setCellValue('I1', '사업자번호');
    		$this->excel->getActiveSheet()->setCellValue('J1', '계약일');
    		$this->excel->getActiveSheet()->setCellValue('K1', '만료일');
    		$this->excel->getActiveSheet()->setCellValue('L1', '서비스시작일');
    		$this->excel->getActiveSheet()->setCellValue('M1', '서비스만료일');
    		$this->excel->getActiveSheet()->setCellValue('N1', '사용인원');
    		$this->excel->getActiveSheet()->setCellValue('O1', '마케팅수신동의(1,3,C)');
    		$this->excel->getActiveSheet()->setCellValue('P1', '개인정보이용동의');
    		$this->excel->getActiveSheet()->setCellValue('Q1', '상태');
    		$this->excel->getActiveSheet()->setCellValue('R1', '메모');


    		for($i=0; $i<count($list); $i++){
    		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$list[$i]['user_id']);
    			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['group_name']);
    			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['user_name']);
    			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['cell_no']);
    			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['email']);
    			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$list[$i]['address']);
    			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$list[$i]['pricing_plan']);
    			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$list[$i]['pricing_price']);
    			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$list[$i]['business_no']);
    			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$list[$i]['start_date']);
    			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$list[$i]['end_date']);
    			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$list[$i]['service_start_date']);
    			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$list[$i]['service_end_date']);
    			$this->excel->getActiveSheet()->setCellValue('N'.($i+2),$list[$i]['use_count']);
    			$this->excel->getActiveSheet()->setCellValue('O'.($i+2),$list[$i]['marketing_yn']);
    			$this->excel->getActiveSheet()->setCellValue('P'.($i+2),$list[$i]['privacy_term']);
    			$this->excel->getActiveSheet()->setCellValue('Q'.($i+2),$list[$i]['user_status']);
    			$this->excel->getActiveSheet()->setCellValue('R'.($i+2),$list[$i]['memo']);
    			

    		}

    		$this->excel->setActiveSheetIndex(0);

    		$title = "가맹점_".date("Ymd").".xls";    	    
    	}

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}	
	
	//엑셀 다운로드
	public function userTotalDownLoad()
	{

		$this->load->library('excel');

		$searchTermType = $this->input->post('searchTermType');
		$startDate = $this->input->post('startDate');
		$endDate = $this->input->post('endDate');
		$searchUserStatus = $this->input->post('searchUserStatus');
		$searchRatePlan = $this->input->post('searchRatePlan');
		$keyword = $this->input->post('keyword');
		
		$excelType = $this->input->post('excelType');


		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		$where .= "AND user_type = 'director'";
		

		
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
			"limit"			=>	""
		);
        //$list = array();
		$list = $this->user_model->getUserList($whereData);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

		}
 

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		
		$this->excel->getActiveSheet()->setCellValue('A1', '소속명');
		$this->excel->getActiveSheet()->setCellValue('B1', '아이디');
		$this->excel->getActiveSheet()->setCellValue('C1', '이름');
		$this->excel->getActiveSheet()->setCellValue('D1', '계정상태');
		$this->excel->getActiveSheet()->setCellValue('E1', '이용상품명');
		$this->excel->getActiveSheet()->setCellValue('F1', '등록원생수');
		$this->excel->getActiveSheet()->setCellValue('G1', '등록선생수');
		$this->excel->getActiveSheet()->setCellValue('H1', '계약일');
		$this->excel->getActiveSheet()->setCellValue('I1', '만료일');


		for($i=0; $i<count($list); $i++){
		    $totalCount = 0;
		    $teacherCount = 0;
            $where = " AND user_type = 'user' and group_name='".$list[$i]['group_name']."'";
    		$whereData = array(
    			"where"			=>	$where,
    		);
    		$totalCount = $this->user_model->getUserTotalCount($whereData);
    		
            $where = " AND user_type = 'teacher' and group_name='".$list[$i]['group_name']."'";
    		$whereData = array(
    			"where"			=>	$where,
    		);
    		$teacherCount = $this->user_model->getUserTotalCount($whereData);    		
		    
		    
			$this->excel->getActiveSheet()->setCellValue('A'.($i+2),$list[$i]['group_name']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['user_id']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['user_name']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['user_status']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['pricing_plan']);
			
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$totalCount."/".$list[$i]['use_count']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$teacherCount);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$list[$i]['start_date']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$list[$i]['end_date']);
		}

		$this->excel->setActiveSheetIndex(0);

		$title = "가맹점 사용현황_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}	
	
    public function partner_popup($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "가맹점관리";
		$sub_title = "가맹점 등록/조회";
			    
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
        switch($data['user_status']){
            case "Y":
                $data['user_status'] = "정상";
            break;
            case "N":
                $data['user_status'] = "정지";
            break;
        }		
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						
	    for($i=0;$i<count($planList);$i++) {
	        $planNewList[$planList[$i]['code_type']] = $planList[$i]['code_name'];
	    }   
	    $data['pricing_plan'] = $planNewList[$data['pricing_plan']];
		
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND group_name='{$data['group_name']}' and user_type='teacher'",
			"limit"			=>	""
		);
		$list_total = $this->user_model->getUserTotalCount($whereData);
		
        //$list = array();
		$list = $this->user_model->getUserList($whereData);		
		$list = $this->add_counting($list,$list_total,0);
		for($i = 0; $i < count($list); $i++)
		{
            switch($list[$i]['user_status']){
                case "Y":
                    $list[$i]['user_status'] = "정상";
                break;
                case "N":
                    $list[$i]['user_status'] = "정지";
                break;
            }
            switch($list[$i]['user_type']){
                case "director":
                    $list[$i]['user_type'] = "원장";
                break;
                case "teacher":
                    $list[$i]['user_type'] = "선생님";
                break;
                case "master":
                    $list[$i]['user_type'] = "마스터";
                break;
                case "user":
                    $list[$i]['user_type'] = "원생";
                break;
            }     
		} 
		$term_where ="";
		
		$where = " AND group_name='{$data['group_name']}' AND user_type='master'";
		$where1 = $where.$term_where;
		$where2 = $where1." AND user_status='L'";                
        
        $master = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        
        
		$where = " AND group_name='{$data['group_name']}' AND user_type='user'";
		$where1 = $where.$term_where;
		$where2 = $where1." AND user_status='L'";                
		
        $user = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        $where = array("where" => "");
        $where1 = array("where" => " AND b.group_name='{$data['group_name']}'");
        $book = array(
                        "total" => $this->book_model->getBookTotalCount($where),
                        "my" => $this->book_model->getBookTotalCount($where1),
                    );
        
		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
		$where=" AND b.group_name='{$data['group_name']}'";

		$days = date("t",strtotime($year."-".$month."-01"));
		        
        $book_quiz = array(
            "total"=>$this->quiz_model->getQuizInsightTotalGroup($year,$month,$where),
            "new"=>$this->quiz_model->getQuizInsightTotalGroup($year,$month,$where),
            "confirm"=>$this->quiz_model->getQuizInsightTotalGroup($year,$month,$where),
        );             
        
        $where=" AND b.group_name='{$data['group_name']}'";
        
        $book_quiz_confirm = array(
            "total"=>$this->quizHistory_model->getQuizHistoryInsightTotalGroup($year,$month,$where),
            "confirm"=>$this->quizHistory_model->getQuizHistoryInsightTotalGroup($year,$month,$where),
        );		
        
        
        //선호도 현황
		$whereData = array(
			"sort"			=>	" ORDER BY a.quiz_use_cnt DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 3"
		);
		$level_where = "";
		$where=" AND a.group_name='{$data['group_name']}'";

		$bookList = $this->book_model->getBookList($whereData);
		$where = $where.$level_where;
        
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
            "data" =>  $data,
            "list" =>  $list,
            "planList" => $planList,
			"user"	=>	$user,
			"book"	=>	$book,
			"book_quiz_confirm" => $book_quiz_confirm,
			"book_quiz" => $book_quiz,            
			"book_list" => $bookList,
			"user_list" => $userList,			
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/partner/partner-pop",$content_data);


	}	
	
    public function teacher_popup($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "가맹점관리";
		$sub_title = "가맹점 등록/조회";
			    
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
			"where"			=>	" AND group_name='{$data['group_name']}' AND class_name='{$data['class_name']}' and user_type='user'",
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
		$this->parser->parse("admin/partner/teacher-pop",$content_data);


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

		
		
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50");
		
		$planList = $this->code_model->getCodeList($whereData);						
	    for($i=0;$i<count($planList);$i++) {
	        $planNewList[$planList[$i]['code_type']] = $planList[$i]['code_name'];
	    }					
		
		$data['pricing_plan'] = $planNewList[$data['pricing_plan']];
		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	" AND group_name='{$data['group_name']}' AND user_type='user'",
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
		$this->parser->parse("admin/partner/user-pop",$content_data);


	}			
	
	//가맹점 등록 엑셀 저장
	public function partnerExcelProc()
	{
		$excel = load_controller('admin/excelAdm');
		$excel_file = $_FILES['excel']['tmp_name'];

		$objPHPExcel = PHPExcel_IOFactory::load($excel_file);
		$objPHPExcel->setActiveSheetIndex(0);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray(null,true,true,true);

		/*sheetData
		A = 아이디
		B = 비밀번호
		C = 소속명
		D = 이름
		E = 휴대폰번호
		F = 이메일
		G = 주소
		H = 이용상품
		I = 이용금액
		J = 사업자번호
		K = 계약일
		L = 만료일
		M = 서비스시작일
		N = 서비스만료일
		O = 사용인원
		P = 마케팅수신동의
		Q = 개인정보 이용동의
		R = 상태
		S = 메모
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
				$group_name = $sheetData[$i]['C'];
				$user_name = $sheetData[$i]['D'];
				$cell_no = $sheetData[$i]['E'];
				$email = $sheetData[$i]['F'];
				$address = $sheetData[$i]['G'];
				$pricing_plan = $sheetData[$i]['H'];
				$pricing_price = $sheetData[$i]['I'];
				$business_no = $sheetData[$i]['J'];
				$start_date = $sheetData[$i]['K'];
				$end_date = $sheetData[$i]['L'];
				$start_date = $this->dateChange($start_date);
				$end_date = $this->dateChange($end_date);
				
				$service_start_date = $sheetData[$i]['M'];
				$service_end_date = $sheetData[$i]['N'];
				
				$service_start_date = $this->dateChange($service_start_date);
				$service_end_date = $this->dateChange($service_end_date);
				
				$use_count = $sheetData[$i]['O'];
				$marketing_yn = $sheetData[$i]['P'];
				$privacy_term = $sheetData[$i]['Q'];
				$user_status = $sheetData[$i]['R'];
				$memo = $sheetData[$i]['S'];
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
				
				if(empty($group_name)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "소속명을 입력해야합니다.";
					$failed++;
					continue;
				}				
				
				if(empty($pricing_plan)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "이용상품을 입력해야합니다.";
					$failed++;
					continue;
				}								
				
				if(empty($pricing_price)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "이용금액을 입력해야합니다.";
					$failed++;
					continue;
				}							
				
				if(empty($use_count)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "사용인원을 입력해야합니다.";
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
				
        		$whereData = array(
        			"where"			=>	" AND group_name='$group_name'",
        		);        		    				
				
        		$directorData = $this->user_model->getDirectorData($whereData);
        		if($directorData['user_seq'] != "") {
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "중복된 학원명이 있습니다.";
					$failed++;
					continue;
				}						

				if($duplicateId==0){


					//등록진행
            		$data = array(
            		    "user_id"	=>	$user_id,
            		    "user_password"	=>	$this->encrypt("password",$password),
            			"user_name"	=>	$user_name,
            			"group_name"	=>	$group_name,
            			"user_type"	=>	"director",
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"pricing_plan"	=>	$pricing_plan,
            			"pricing_price"	=>	$pricing_price,
            			"business_no"	=>	$business_no,
            			"start_date"	=>	$start_date,
            			"end_date"	=>	$end_date,
            			"service_start_date"	=>	$service_start_date,
            			"service_end_date"	=>	$service_end_date,        			
            			"use_count"	=>	$use_count,
            			"privacy_term"	=>	$privacy_term,
            			"marketing_yn"	=>	$marketing_yn,
            			"user_status"	=>	$user_status,
            			"memo"	=>	$memo,
            			"reg_date" => $reg_date
            		);	

					$result = $this->user_model->insertUser($data);
					
		    		$data = array(
		    			"user_name"	=>	$user_name,
		    			"user_id"	=>	$user_id,		    
		    			"user_type"	=>	$user_type,
		    			"reg_date"	=>	$reg_date);
		    		$result = $this->userHistory_model->insertUserHistory($data);    		    
		    							
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
        $this->parser->parse("admin/partner/partner-excel-proc",$content_data);
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

	// ═══════════════════════════════════════════════════════════
	// 결제 관리 - 학원 원장(director) 전용
	// ═══════════════════════════════════════════════════════════

	/**
	 * 요금제 선택 및 결제 신청 페이지
	 * URL: /admin/partner/payment
	 * 접근: director 역할
	 */
	public function payment()
	{
		$depth1    = "partner";
		$depth2    = "payment";
		$title     = "결제 관리";
		$sub_title = "요금제 선택 및 결제";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		// 로그인한 학원(director) user_seq
		$user_seq = $this->session->userdata("user_seq");

		// 현재 유효한 구독 정보 조회
		$current_subscription = $this->payment_model->getCurrentSubscription($user_seq);

		// 만료일까지 남은 일수 계산
		$days_left = 0;
		if (!empty($current_subscription['end_date'])) {
			$today    = new DateTime();
			$end_date = new DateTime($current_subscription['end_date']);
			$diff     = $today->diff($end_date);
			// 만료일이 오늘 이후면 양수, 이미 지났으면 음수
			$days_left = $diff->invert ? -$diff->days : $diff->days;
		}

		$content_data = array(
			"depth1"               => $depth1,
			"title"                => $title,
			"sub_title"            => $sub_title,
			"current_subscription" => $current_subscription,
			"days_left"            => $days_left,
		);

		$this->parser->parse("admin/include/header",  $this->CONFIG_DATA);
		$this->parser->parse("admin/include/left",    $this->CONFIG_DATA);
		$this->parser->parse("admin/partner/payment", $content_data);
		$this->parser->parse("admin/include/footer",    $this->CONFIG_DATA);
		$this->parser->parse("admin/include/footer_js", $this->CONFIG_DATA);
	}

	/**
	 * 결제 신청 처리 (POST - AJAX)
	 * URL: /admin/partner/payment_proc
	 * PG사 연동 전: pending 상태로 저장
	 * PG사 연동 후: 이 메서드 내부에 PG SDK 호출 로직 추가
	 */
	public function payment_proc()
	{
		if ($this->input->method() !== 'post') {
			$this->goURL('/admin/partner/payment');
			return;
		}

		$plan_type  = $this->input->post('plan_type');
		$user_seq   = $this->session->userdata('user_seq');
		$user_id    = $this->session->userdata('admin_id');
		$group_name = $this->session->userdata('group_name');

		// 요금제별 금액 정의 (VAT 별도)
		$plan_info = array(
			'monthly' => array('amount' => 100000, 'months' => 1),
			'6month'  => array('amount' => 540000, 'months' => 6),
			'12month' => array('amount' => 960000, 'months' => 12),
		);

		if (!array_key_exists($plan_type, $plan_info)) {
			$this->jsonFail('잘못된 요금제입니다.');
		}

		$plan_amount  = $plan_info[$plan_type]['amount'];
		$vat_amount   = (int)($plan_amount * 0.1); // VAT 10%
		$total_amount = $plan_amount + $vat_amount;

		// 서비스 시작일/만료일 계산
		$start_date = date('Y-m-d');
		$end_date   = date('Y-m-d', strtotime("+{$plan_info[$plan_type]['months']} months"));

		// PG사 연동 전: pending 상태로 저장
		// TODO: PG사 계약 후 아래 payment_status를 'paid'로 변경하고 PG SDK 로직 추가
		$insert_data = array(
			'user_seq'       => $user_seq,
			'user_id'        => $user_id,
			'group_name'     => $group_name,
			'plan_type'      => $plan_type,
			'plan_amount'    => $plan_amount,
			'vat_amount'     => $vat_amount,
			'total_amount'   => $total_amount,
			'payment_status' => 'pending',
			'start_date'     => $start_date,
			'end_date'       => $end_date,
			'auto_renew'     => ($plan_type === 'monthly') ? 1 : 0,
		);

		$payment_seq = $this->payment_model->insertPayment($insert_data);

		if ($payment_seq) {
			$this->jsonSuccess([
				'msg'         => '결제 신청이 접수되었습니다. PG사 연동 후 자동 처리됩니다.',
				'payment_seq' => $payment_seq,
			]);
		} else {
			$this->jsonFail('결제 신청 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 학원 원장 본인 결제 내역 조회
	 * URL: /admin/partner/payment_history
	 */
	public function payment_history()
	{
		$depth1    = "partner";
		$depth2    = "paymentHistory";
		$title     = "결제 내역";
		$sub_title = "결제 내역 조회";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$user_seq = $this->session->userdata("user_seq");

		// 페이징 처리
		$num       = (int)($this->input->get('num') ?? 0);
		$page_size = 10;

		$list_total = $this->payment_model->getPaymentCountByUser($user_seq);
		$total_page = ceil($list_total / $page_size);

		$list = $this->payment_model->getPaymentListByUser(
			$user_seq,
			"LIMIT {$num},{$page_size}"
		);

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
		$paging = $this->make_paging2("payment_history", $start_page, $end_page, $page_size, $num, '', $total_page, '');

		$content_data = array(
			"depth1"     => $depth1,
			"title"      => $title,
			"sub_title"  => $sub_title,
			"list"       => $list,
			"list_total" => $list_total,
			"paging"     => $paging,
			"num"        => $num,
		);

		$this->parser->parse("admin/include/header",       $this->CONFIG_DATA);
		$this->parser->parse("admin/include/left",         $this->CONFIG_DATA);
		$this->parser->parse("admin/partner/payment-history", $content_data);
		$this->parser->parse("admin/include/footer",       $this->CONFIG_DATA);
		$this->parser->parse("admin/include/footer_js",    $this->CONFIG_DATA);
	}

}
