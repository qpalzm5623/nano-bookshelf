<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Member extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("user_model");
		$this->load->model("school_model");
		$this->load->model("config_model");
		$this->load->model("code_model");
		$this->load->model("adm_model");
		$this->load->model("quizHistory_model");
		$this->load->model("userHistory_model");
		$this->load->helper('load_controller');
		$this->load->library('excel');

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
			$this->memberList();
		}

	}

  public function list()
	{
		$depth1 = "partner";
		$depth2 = "memberList";
		$title = "가맹점 원생리스트";
		$sub_title = "가맹점 원생리스트";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$srcSchool = $this->input->get('srcSchool');
		$srcStatus = $this->input->get("srcStatus");
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$searchUserStatus = $this->input->get('searchUserStatus');
		$searchRatePlan = $this->input->get('searchRatePlan');
		$keyword = $this->input->get('keyword');		
		
        $status = $this->input->get('status')?? "";		
        $group_name = $this->input->get('group_name')?? "";		

        $srcSchool = $srcSchool ?? "";
        $srcStatus = $srcStatus ?? "";

		$num = $num ?? 0;
		

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";
		
		

		$where = "";
		$where .= "AND user_type = 'user'";
		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
            $admin_group_name =  $this->session->userdata("group_name");
			$where .= "AND group_name = '{$admin_group_name}'";
		}

		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate 23:59:59' ";   
		}
		
		if($searchUserStatus != '') {
		    $where .= " AND user_status='$searchUserStatus'";   
		}			
		
		if($status != '') {
		    $where .= " AND user_status='$status'";   
		}					
		if($group_name != '' && $group_name != 'all') {
		    $where .= " AND group_name='$group_name'";   
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

		$params = "searchTermType={$searchTermType}&searchUserStatus={$searchUserStatus}&status={$status}&group_name={$group_name}&keyword={$keyword}&startDate={$startDate}&endDate={$endDate}";

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

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
            switch($list[$i]['user_status']){
                case "Y":
                    $list[$i]['user_status'] = "재원";
                break;
                case "S":
                    $list[$i]['user_status'] = "휴원";
                break;
                case "N":
                    $list[$i]['user_status'] = "비원";
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

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND school.school_seq = '{$admin_school_seq}'";
		}



		//기관리스트
		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);


		$classList = array();
		$param = "";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"schoolList"	=>	$schoolList,
			"classList"		=>	$classList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"page_size"		=>	$page_size,
			"num"				=>	$num,
            "list_total"  =>  $list_total,
			"param"	=>	$param
		);
		
		


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/member/list",$content_data);
		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	
  public function history_list()
	{
		$depth1 = "partner";
		$depth2 = "historyList";
		$title = "계정 생성 이력";
		$sub_title = "계정 생성 이력";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$srcSchool = $this->input->get('srcSchool');
		$srcStatus = $this->input->get("srcStatus");
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$searchUserStatus = $this->input->get('searchUserStatus');
		$searchRatePlan = $this->input->get('searchRatePlan');
		$keyword = $this->input->get('keyword');		
		
        $status = $this->input->get('status')?? "";		
        $group_name = $this->input->get('group_name')?? "";		

        $srcSchool = $srcSchool ?? "";
        $srcStatus = $srcStatus ?? "";

		$num = $num ?? 0;
		

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";
		
		

		$where = "";
		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
            $admin_group_name =  $this->session->userdata("group_name");
			$where .= "AND group_name = '{$admin_group_name}'";
		}

		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate 23:59:59' ";   
		}
		
		if($searchUserStatus != '') {
		    $where .= " AND user_status='$searchUserStatus'";   
		}			
		
		if($status != '') {
		    $where .= " AND user_status='$status'";   
		}					
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (user_id like '%".$keyword."%'     or user_name like '%".$keyword."%' )";   
		}				

		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		$list_total = $this->userHistory_model->getUserHistoryTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "searchTermType={$searchTermType}&searchUserStatus={$searchUserStatus}&status={$status}&group_name={$group_name}&keyword={$keyword}&startDate={$startDate}&endDate={$endDate}";

		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);
        //$list = array();
		$list = $this->userHistory_model->getUserHistoryList($whereData);
		
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

		$paging = $this->make_paging2("history_list",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
            switch($list[$i]['user_status']){
                case "Y":
                    $list[$i]['user_status'] = "재원";
                break;
                case "S":
                    $list[$i]['user_status'] = "휴원";
                break;
                case "N":
                    $list[$i]['user_status'] = "비원";
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

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND school.school_seq = '{$admin_school_seq}'";
		}



		//기관리스트
		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);


		$classList = array();
		$param = "";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"schoolList"	=>	$schoolList,
			"classList"		=>	$classList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"page_size"		=>	$page_size,
			"num"				=>	$num,
            "list_total"  =>  $list_total,
			"param"	=>	$param
		);
		
		


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/member/member-history-list",$content_data);
		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
    public function user_list_popup()
	{
		$depth1 = "partner";
		$depth2 = "memberList";
		$title = "다른 학원 원장 리스트";
		$sub_title = "다른 학원 원장 리스트";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$keyword = $this->input->get('keyword');
		$srcStatus = $this->input->get("srcStatus");


        $srcSchool = $srcSchool ?? "";
        $srcStatus = $srcStatus ?? "";

		$num = $num ?? 0;
		

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";
		
		

		$where = "";
		$where .= "AND user_type = 'director'";
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
            //$admin_group_name =  $this->session->userdata("group_name");
			//$where .= "AND group_name = '{$admin_group_name}'";
		}
		
		 
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (user_id like '".$keyword."%')";   
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

		$params = "&keyword={$keyword}";

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

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

		} 

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND school.school_seq = '{$admin_school_seq}'";
		}



		//기관리스트
		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);


		$classList = array();
		$param = "";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"schoolList"	=>	$schoolList,
			"classList"		=>	$classList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"page_size"		=>	$page_size,
			"num"				=>	$num,
            "list_total"  =>  $list_total,
			"param"	=>	$param
		);
		

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/member/user-list-pop",$content_data);
	}	
	
  public function inuser_list_popup()
	{
		$depth1 = "partner";
		$depth2 = "memberList";
		$title = "회원리스트";
		$sub_title = "회원리스트";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$keyword = $this->input->get('keyword');
		$srcStatus = $this->input->get("srcStatus");


        $srcSchool = $srcSchool ?? "";
        $srcStatus = $srcStatus ?? "";

		$num = $num ?? 0;
		

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";
		
		

		$where = "";
		$where .= "AND user_type = 'user'";
		if($this->session->userdata("admin_level")!="0"&&($this->session->userdata("admin_type")=="director"||$this->session->userdata("admin_type")=="teacher")){
            $admin_group_name =  $this->session->userdata("group_name");
			$where .= "AND group_name = '{$admin_group_name}'";
		}
		 
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (user_id like '%".$keyword."%' or user_name like '%".$keyword."%')";
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

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

		} 

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= "AND school.school_seq = '{$admin_school_seq}'";
		}



		//기관리스트
		$whereData = array(
            "sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);


		$classList = array();
		$param = "";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"schoolList"	=>	$schoolList,
			"classList"		=>	$classList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"page_size"		=>	$page_size,
			"num"				=>	$num,
            "list_total"  =>  $list_total,
			"param"	=>	$param
		);
		

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/member/inuser-list-pop",$content_data);
	}		
	
	public function classList()
	{
	    $group_name = $this->input->post('group_name');
		$whereData = array(
			"sort"			=>	" order by class_name asc",
			"where"			=>	" AND user_type='teacher' AND group_name='{$group_name}' and group_name is not null",
			"limit"			=>	""
		);		
		$classList = $this->user_model->getUserClassList($whereData);	    
		$return['result'] = "success";
		$return['data'] = $classList;
		echo json_encode($return);
		exit;
	    
	}	
	
	
    public function write($seq="")
	{
		$depth1 = "partner";
		$depth2 = "memberList";
		$title = "가맹점 원생관리";
		$sub_title = "원생 등록/조회";
			    
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
		
		$schoolList = $this->user_model->getUserGradeList();
		
		$data = $this->user_model->getUserSeq($seq);
		
		$where ="";
		/*
		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);		
		$classList = $this->user_model->getClassList($whereData);
		*/
		$classList = array();
		if(!empty($data)) {
    	    $group_name = $data['group_name'];
    		$whereData = array(
    			"sort"			=>	" order by class_name asc",
    			"where"			=>	" AND user_type='teacher' AND group_name='{$group_name}' and group_name is not null",
    			"limit"			=>	""
    		);		
    		$classList = $this->user_model->getUserClassList($whereData);	    		
    	}
    	if($this->session->userdata("admin_level")!="0"&&($this->session->userdata("admin_type")=="director" || $this->session->userdata("admin_type")=="teacher")){
    	    $group_name = $this->session->userdata("group_name");
    		$whereData = array(
    			"sort"			=>	" order by class_name asc",
    			"where"			=>	" AND user_type='teacher' AND group_name='{$group_name}' and group_name is not null",
    			"limit"			=>	""
    		);		
    		$classList = $this->user_model->getUserClassList($whereData);	    		    	    
    	}
		

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "schoolList" =>$schoolList,
            "classList" =>$classList,
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
		$this->parser->parse("admin/member/write",$content_data);

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
	    $service_start_date=$this->input->post("service_start_date");
	    $service_end_date=$this->input->post("service_end_date");	    
	    $use_count=$this->input->post("use_count");
	    $sms_yn=$this->input->post("sms_yn");
	    $marketing_yn=$this->input->post("marketing_yn");
	    $user_status=$this->input->post("user_status");
	    $stop_term=$this->input->post("stop_term");
	    $stop_reason=$this->input->post("stop_reason");
	    
	    $parent_name = $this->input->post("parent_name");
	    $parent_cell = $this->input->post("parent_cell");
	    $grade = $this->input->post("grade");
	    $class_name = $this->input->post("class_name");
	    $memo=$this->input->post("memo");
	    $gender=$this->input->post("gender");
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
        			
        			"parent_name"	=>	@$parent_name,
        			"parent_cell"	=>	@$parent_cell,
        			"email"	=>	$email,
        			"address"	=>	$address,

        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			
        			"start_date"	=>	@$start_date,
        			"end_date"	=>	@$end_date,
        			"service_start_date"	=>	@$service_start_date,
        			"service_end_date"	=>	@$service_end_date,        			
        			
        			"memo"	=>	$memo,
        			"gender"	=>	@$gender,
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
        			"parent_name"	=>	@$parent_name,
        			"parent_cell"	=>	@$parent_cell,
    			    "grade"	=>	@$grade,
        			"class_name"	=>	@$class_name,
        			"sms_yn"	=>	$sms_yn,
        			"marketing_yn"	=>	$marketing_yn,
        			"user_status"	=>	$user_status,
        			"stop_term"	=>	$stop_term,
        			"stop_reason"	=>	$stop_reason,
        			"start_date"	=>	@$start_date,
        			"end_date"	=>	@$end_date,
        			"service_start_date"	=>	@$service_start_date,
        			"service_end_date"	=>	@$service_end_date,        			        			
        			"memo"	=>	$memo,
        			"gender"	=>	@$gender,
        			"mod_date" => $reg_date
        		);		
        	}
    		            
            $result = $this->user_model->updateUser($user_seq, $data);
        } else { 
            // 신규회원
    		$duplicateId = $this->user_model->getDuplicateUserId($user_id);

    		if($duplicateId>0){
    			echo '{"result":"failed","msg":"중복된 아이디가 있습니다."}';
    			exit;
    		}
    		
    		$whereData = array(
    			"where"			=>	" AND group_name='$group_name' AND user_type='user'",
    		);
    		// 인원수 체크
    		$userCnt = $this->user_model->getUserTotalCount($whereData);
    		
    		// 학원 원장 계정 정보
    		$whereData = array(
    			"where"			=>	" AND group_name='$group_name'",
    		);
    		if($user_type != "master") {
        		// 인원수 체크
        		$directorData = $this->user_model->getDirectorData($whereData);    		
        		if($userCnt >= $directorData['use_count']) {
        			echo '{"result":"failed","msg":"인원이 초과하였습니다."}';
        			exit;    		    
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
    			"parent_name"	=>	@$parent_name,
    			"parent_cell"	=>	@$parent_cell,    			
			    "grade"	=>	@$grade,
    			"class_name"	=>	@$class_name,
    			"sms_yn"	=>	$sms_yn,
    			"marketing_yn"	=>	$marketing_yn,
    			"user_status"	=>	$user_status,
    			"stop_term"	=>	$stop_term,
    			"stop_reason"	=>	$stop_reason,
        	"start_date"	=>	@$start_date,
        	"end_date"	=>	@$end_date,
        	"service_start_date"	=>	@$service_start_date,
        	"service_end_date"	=>	@$service_end_date,        			    			
    			"memo"	=>	$memo,
    			"gender"	=>	@$gender,
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

		echo '{"result":"success"}';
		exit;
	}	

	//회원수정
	public function memberModify($user_seq)
	{
		$depth1 = "order";
		$depth2 = "memberList";
		$title = "회원관리";
		$sub_title = "회원관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcLevel = $this->input->get('srcLevel');
		$srcClass = $this->input->get('srcClass');
		$srcSchool = $this->input->get('srcSchool');
		$srcYear = $this->input->get('srcYear');
		$srcStatus = $this->input->get('srcStatus');
		$page_size = $this->input->get('page_size');

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$srcLevel = $srcLevel=="" ? "all" : $srcLevel;

		$srcClass = empty($srcClass) ? "all" : $srcClass;

		$srcSchool = empty($srcSchool) ? "all" : $srcSchool;

		$srcYear = empty($srcYear) ? "all" : $srcYear;

		$srcStatus = empty($srcStatus) ? "all" : $srcStatus;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&srcLevel={$srcLevel}&srcClass={$srcClass}&srcSchool={$srcSchool}&srcYear={$srcYear}&srcStatus={$srcStatus}&page_size={$page_size}";

		$userData = $this->member_model->getMember($user_seq);
		$contractData = $this->school_model->getContractList();

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);
		$classList = $this->school_model->getClassList($whereData);

		$locationData = $this->config_model->getConfig('location');

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"userData"	=>	$userData,
			"contractData"	=> $contractData,
			"classList"	=>	$classList,
			"locationData"	=>	$locationData,
			"param"	=>	$param,
			"user_seq"	=>	$user_seq
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/member/member-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function memberModifyProc()
	{
		$user_seq = $this->input->post("user_seq");
		$school_seq = $this->input->post("school_seq");
		$user_id = $this->input->post("user_id");
		$user_password = $this->input->post("user_password");
		$user_name = $this->input->post("user_name");
		$birthday = $this->input->post("birthday");
		$email = $this->input->post("email");
		$user_level = $this->input->post("user_level");
		$school_name = $this->input->post("school_name");
		$school_year = $this->input->post("school_year");
		$school_class = $this->input->post("school_class");
		$parent_name = $this->input->post("parent_name");
		$parent_phone = $this->input->post("parent_phone");
		$parent_email = $this->input->post("parent_email");
		$parent_zipcode = $this->input->post("parent_zipcode");
		$parent_addr1 = $this->input->post("parent_addr1");
		$parent_addr2 = $this->input->post("parent_addr2");
		$user_status = $this->input->post("user_status");
		$location = $this->input->post("location");


		$this->member_model->updateSchoolClassMember($user_seq,$school_seq,$school_name,$school_year,$school_class);


		$data = array(
			"school_seq"	=>	$school_seq,
			"user_id"	=>	$user_id,
			"user_name"	=>	$user_name,
			"birthday"	=>	$birthday,
			"email"	=>	$email,
			"user_level"	=>	$user_level,
			"school_name"	=>	$school_name,
			"school_year"	=>	$school_year,
			"school_class"	=>	$school_class,
			"parent_name"	=>	$parent_name,
			"parent_phone"	=>	$parent_phone,
			"parent_email"	=>	$parent_email,
			"parent_zipcode"	=>	$parent_zipcode,
			"parent_addr1"	=>	$parent_addr1,
			"parent_addr2"	=>	$parent_addr2,
			"user_status"		=>	$user_status,
			"location"	=>	$location,
			"update_time"	=>	date("Y-m-d H:i:s")
		);

		if(!empty($user_password)){
			$user_password = $this->encrypt("password",$user_password);
			$data["user_password"] = $user_password;
		}

		if($user_level==1){
			//기관관리자
			$result = $this->school_model->updateSchoolAdmin($user_seq,$school_seq);
			if($result==false){
				echo '{"result":"failed"}';
				exit;
			}
		}

		$result = $this->member_model->updateMember($data,$user_seq);

		echo '{"result":"success"}';
		exit;
	}

	//회원 엑셀 다운로드
	public function memberDownLoad()
	{

		$this->load->library('excel');

		$srcN = $this->input->get('srcN_excel');
		$srcLevel = $this->input->get('srcLevel_excel');
		$srcClass = $this->input->get('srcClass_excel');
		$srcSchool = $this->input->get('srcSchool_excel');
		$srcYear = $this->input->get('srcYear_excel');
		$srcStatus = $this->input->get('srcStatus_excel');

		$srcN = empty($srcN) ? "" : $srcN;

		$srcLevel = $srcLevel=="" ? "all" : $srcLevel;

		$srcClass = empty($srcClass) ? "all" : $srcClass;

		$srcSchool = empty($srcSchool) ? "all" : $srcSchool;

		$srcYear = empty($srcYear) ? "all" : $srcYear;

		$srcStatus = empty($srcStatus) ? "all" : $srcStatus;

		$where = "";

		if(!empty($srcN)){
			$where .= "AND (users.user_name LIKE '%{$srcN}%' OR users.user_id LIKE '%{$srcN}%')";
		}

		if($srcSchool != 'all'){
			if($srcSchool == "None"){
				$where .= "AND school.school_seq = ''";
			}else{
				$where .= "AND school.school_seq = '{$srcSchool}'";
			}

		}

		if($srcYear != 'all'){
			if($srcYear=="None"){
				$where .= "AND users.school_year = '{$srcYear}'";
			}else{
				$where .= "AND users.school_year = ''";
			}

		}

		if($srcClass != 'all'){
			$where .= "AND users.school_class = '{$srcClass}'";
		}

		if($srcLevel != 'all'){
			$where .= "AND users.user_level = '{$srcLevel}'";
		}

		if($srcStatus != 'all'){
			$where .= "AND users.user_status = '{$srcStatus}'";
		}

		//기관관리자 접근
		if($this->session->userdata("admin_level")==1){
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}'";
		}
		//학급관리자 접근
		if($this->session->userdata("admin_level")==2){
			$admin_school_year = $this->session->userdata("school_year");
			$admin_school_class = $this->session->userdata("school_class");
			$admin_school_seq = $this->session->userdata("school_seq");
			$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}

		$params = "";

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$memberList = $this->member_model->getMemberList($whereData);

		//customSetting
		for($i = 0; $i < count($memberList); $i++)
		{
			$memberList[$i]['reg_date'] = date("Y-m-d",strtotime($memberList[$i]['reg_date']));
			if(empty($memberList[$i]['last_login_time'])){
				$memberList[$i]['last_login_time'] = "-";
			}else{
				$memberList[$i]['last_login_time'] = date("Y-m-d",strtotime($memberList[$i]['last_login_time']));
			}


      switch($memberList[$i]['user_level']){
        case "0":
        $memberList[$i]['user_level'] = "본사관리자";
        break;
				case "1":
        $memberList[$i]['user_level'] = "기관관리자";
        break;
				case "2":
        $memberList[$i]['user_level'] = "학급관리자";
        break;
				case "6":
        $memberList[$i]['user_level'] = "학생회원";
        break;
				case "7":
        $memberList[$i]['user_level'] = "일반회원";
        break;
      }

			switch($memberList[$i]['user_status']){
        case "C":
        $memberList[$i]['user_status'] = "승인";
        break;
				case "L":
        $memberList[$i]['user_status'] = "탈퇴";
        break;
				case "D":
        $memberList[$i]['user_status'] = "삭제";
        break;
      }

			if(empty($memberList[$i]['school_year'])){
				$memberList[$i]['school_year'] = "-";
			}
			if(empty($memberList[$i]['school_class'])){
				$memberList[$i]['school_class'] = "-";
			}
		}

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
		$this->excel->getActiveSheet()->setCellValue('B1', '이름');
		$this->excel->getActiveSheet()->setCellValue('C1', '생년월일');
		$this->excel->getActiveSheet()->setCellValue('D1', '이메일');
		$this->excel->getActiveSheet()->setCellValue('E1', '등급');
		$this->excel->getActiveSheet()->setCellValue('F1', '지역');
		$this->excel->getActiveSheet()->setCellValue('G1', '기관명');
		$this->excel->getActiveSheet()->setCellValue('H1', '학년');
		$this->excel->getActiveSheet()->setCellValue('I1', '반');
		$this->excel->getActiveSheet()->setCellValue('J1', '학부모이름');
		$this->excel->getActiveSheet()->setCellValue('K1', '학부모생년월일');
		$this->excel->getActiveSheet()->setCellValue('L1', '학부모휴대전화');
		$this->excel->getActiveSheet()->setCellValue('M1', '학부모이메일');
		$this->excel->getActiveSheet()->setCellValue('N1', '학부모우편번호');
		$this->excel->getActiveSheet()->setCellValue('O1', '학부모주소1');
		$this->excel->getActiveSheet()->setCellValue('P1', '학부모주소2');
		$this->excel->getActiveSheet()->setCellValue('Q1', '가입일');
		$this->excel->getActiveSheet()->setCellValue('R1', '최종접속일');
		$this->excel->getActiveSheet()->setCellValue('S1', '상태');


		for($i=0; $i<count($memberList); $i++){
		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$memberList[$i]['user_id']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$memberList[$i]['user_name']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$memberList[$i]['birthday']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$memberList[$i]['email']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$memberList[$i]['user_level']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$memberList[$i]['location']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$memberList[$i]['school_name_org']);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$memberList[$i]['school_year']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$memberList[$i]['school_class']);
			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$memberList[$i]['parent_name']);
			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$memberList[$i]['parent_birthday']);
			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$memberList[$i]['parent_phone']);
			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$memberList[$i]['parent_email']);
			$this->excel->getActiveSheet()->setCellValue('N'.($i+2),$memberList[$i]['parent_zipcode']);
			$this->excel->getActiveSheet()->setCellValue('O'.($i+2),$memberList[$i]['parent_addr1']);
			$this->excel->getActiveSheet()->setCellValue('P'.($i+2),$memberList[$i]['parent_addr2']);
			$this->excel->getActiveSheet()->setCellValue('Q'.($i+2),$memberList[$i]['reg_date']);
			$this->excel->getActiveSheet()->setCellValue('R'.($i+2),$memberList[$i]['last_login_time']);
			$this->excel->getActiveSheet()->setCellValue('S'.($i+2),$memberList[$i]['user_status']);

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

	//회원삭제
	public function deleteUsers()
	{
		$chk = $this->input->post("chk");

		for($i=0; $i<count($chk); $i++){
			$this->member_model->deleteUser($chk[$i]);
		}

		echo '{"result":"success"}';
		exit;
	}

	public function deleteUser()
	{
		$user_seq = $this->input->post("user_seq");
		$this->member_model->deleteuser($user_seq);

		echo '{"result":"success"}';
		exit;
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
		
		$teacherWhere = array(
		                    "group_name" => $data['group_name'],
		                    "class_name" => $data['class_name'],
		                );
		$teacherData = $this->user_model->getTeacherData($teacherWhere);
		// 선생님 정보
		$data['teacher_name'] = $teacherData['user_name'];
		
		$whereData = array("where" => " and code_group='rate_plan'", "limit" => "limit 50" );
		
		$planList = $this->code_model->getCodeList($whereData);						
		 
		$topic = @json_decode($data['topic']);
		
		$where = " AND a.user_id='{$data['user_id']}'";
		
        $whereData = array(
			"where"	=>	$where,
			"limit"	=>	""
		);
		
		
		$list = $this->quizHistory_model->getQuizHistoryAdminGroupList($whereData);
				
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "topic" =>  $topic,
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
	
	public function memberExcel()
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
        $this->parser->parse("admin/member/user-excel-pop",$content_data);
	}		
	
	//회원 등록 엑셀 저장
	public function memberExcelProc()
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
		H = 학부모 이름
		I = 학부모 연락처
		J = 학년
		K = 반
		L = 마케팅수신동의
		M = 개인정보 이용동의
		N = 상태
		O = 메모
		P = 성별
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
				if($this->session->userdata("admin_type") == "director") {
					$group_name = $this->session->userdata("group_name");
				}
				$user_name = $sheetData[$i]['D'];
				$cell_no = $sheetData[$i]['E'];
				$email = $sheetData[$i]['F'];
				$address = $sheetData[$i]['G'];
				
				$parent_name = $sheetData[$i]['H'];
				$parent_cell = $sheetData[$i]['I'];
				$grade = $sheetData[$i]['J'];
				$class_name = $sheetData[$i]['K'];
				$marketing_yn = $sheetData[$i]['L'];
				$privacy_term = $sheetData[$i]['M'];
				$user_status = $sheetData[$i]['N'];
				$memo = $sheetData[$i]['O'];
				$gender = $sheetData[$i]['P'];
				
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
				
				if(empty($grade)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "학년을 입력해야합니다.";
					$failed++;
					continue;
				}
				
				if(empty($class_name)){
					$errorArr[$failed]['user_id'] = ($i+1)."번";
					$errorArr[$failed]['error_msg'] = "반을 입력해야합니다.";
					$failed++;
					continue;
				}				
				

				//등록여부
				$duplicateId = $this->user_model->getDuplicateUserId($user_id);

				if($duplicateId==0){

                    if($gender == "남") $gender = "M";
                    else $gender = "F";
					//등록진행
            		$data = array(
            		    "user_id"	=>	$user_id,
            		    "user_password"	=>	$this->encrypt("password",$password),
            			"user_name"	=>	$user_name,
            			"group_name"	=>	$group_name,
            			"user_type"	=>	"user",
            			"cell_no"	=>	$cell_no,
            			"email"	=>	$email,
            			"address"	=>	$address,
            			"parent_name"	=>	$parent_name,
            			"parent_cell"	=>	$parent_cell,            			
            			"grade"	=>	$grade,
            			"class_name"	=>	$class_name,
            			"privacy_term"	=>	$privacy_term,
            			"marketing_yn"	=>	$marketing_yn,
            			"user_status"	=>	$user_status,
            			"memo"	=>	$memo,
            			"gender"	=>	$gender,
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
        $this->parser->parse("admin/member/user-excel-proc",$content_data);
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
