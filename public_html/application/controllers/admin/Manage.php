<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Manage extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("user_model");
		$this->load->model("banner_model");
		$this->load->model("book_model");
		$this->load->model("quiz_model");
		$this->load->model("pointHistory_model");
		$this->load->model("quizHistory_model");
		$this->load->model("code_model");
		$this->load->model("adm_model");
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
	
  //숙재배정 리스트
	public function banner_list()
	{
		$depth1 = "manage";
		$depth2 = "banner_list";
		$title = "배너관리";
		$sub_title = "배너관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');		

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND academy_seq = '{$academy_seq}'";
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate 23:59:59' ";   
		}		

		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		$list_total = $this->banner_model->getBannerTotalCount($whereData);

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
		$list = $this->banner_model->getBannerList($whereData);

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


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
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
		$this->parser->parse("admin/manage/banner_list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	 
	 
    //토픽 리스트
	public function topic_list()
	{
		$depth1 = "manage";
		$depth2 = "topic_list";
		$title = "책주제관리";
		$sub_title = "책주제관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "";

		$where = "";
		$where .= "AND code_group = 'topic'";
		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			
		}

		$page_size = 50;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		$list_total = $this->code_model->getCodeTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "";

		$whereData = array(
			"sort"			=>	"ORDER BY code_sort_id ASC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);
        $list = array();
		$list = $this->code_model->getCodeList($whereData);

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


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
			$list[$i]['code_count'] = 0;
            switch(@$list[$i]['code_status']){
                case "Y":
                    $list[$i]['code_status'] = "노출";
                break;
                case "N":
                    $list[$i]['code_status'] = "비노출";
                break;
            }
            			
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list_total"	=>	$list_total,
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
		$this->parser->parse("admin/manage/topic_list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	 
	
    //토픽 리스트
	public function ranking()
	{
		$depth1 = "manage";
		$depth2 = "ranking";
		$title = "랭킹 조회";
		$sub_title = "랭킹 조회";

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
		$where .= "AND user_type = 'user' and user_status='Y'";
		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
			//$academy_seq = $this->session->userdata("user_type");
			$where .= "and a.group_name='".$this->session->userdata("group_name")."'";
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($searchGroupName != '') {
		    $where .= " AND a.group_name='$searchGroupName'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.user_id like '".$keyword."' OR a.user_name like '".$keyword."' or a.cell_no like '".$keyword."' or a.group_name like '%$keyword%')";   
		}		
				

		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		if($searchTermType == 'term' || $keyword != "") {
		    $list_total = $this->user_model->getUserPointTotalCount($whereData);
		} else {
		    $list_total = $this->user_model->getUserTotalCount($whereData);
		}

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
        if($searchTermType == 'term' || $keyword != "") {
            
		    
		    
    		$where = "";
    		$where .= "AND user_type = 'user' and user_status='Y'";
    		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
    			//$academy_seq = $this->session->userdata("user_type");
    			$where .= "and a.group_name='".$this->session->userdata("group_name")."'";
    		}
    		
    		if($searchTermType == 'term') {
    		    $where .= " AND b.reg_date>='$startDate' AND b.reg_date<='$endDate 23:59:59' ";   
    		}
    		
    		if($searchGroupName != '') {
    		    $where .= " AND a.group_name='$searchGroupName'";   
    		}			    
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.user_id like '".$keyword."' OR a.user_name like '".$keyword."' or a.cell_no like '".$keyword."' or a.group_name like '%$keyword%')";   
		}		
    		$whereData = array(
    			"order"			=>	"ORDER BY point DESC",
    			"where"			=>	$where,
    			"limit"			=>	""
    		);    		
    		$list = $this->user_model->getUserPointList($whereData);
            $allList = $this->user_model->getAllUserPointList($whereData);		    
            $rank = 0;
            $prev_total = NULL;
            $prev_rank = 0;            
    		for($i = 0; $i < count($allList); $i++)
    		{            
    		    $row = $allList[$i];
                $user_id = $row["user_id"];
                $total_points = $row["total_points"];
                // 순위 계산
                if ($prev_total === $total_points) {
                    $ranking = $prev_rank;
                } else {
                    $rank++;
                    $ranking = $rank;
                    $prev_rank = $ranking;
                }            
                $user_rank[$row["user_id"]] = $ranking;
                $prev_total = $total_points;
            }            
		} else {
		    $list = $this->user_model->getUserList($whereData);
		    
    		$where = "";
    		$where .= "AND user_type = 'user' and user_status='Y'";
    		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
    			//$academy_seq = $this->session->userdata("user_type");
    			$where .= "and a.group_name='".$this->session->userdata("group_name")."'";
    		}
    		
    		if($searchTermType == 'term') {
    		    $where .= " AND b.reg_date>='$startDate' AND b.reg_date<='$endDate 23:59:59' ";   
    		}
    		
    		if($searchGroupName != '') {
    		    $where .= " AND a.group_name='$searchGroupName'";   
    		}			    
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.user_id like '".$keyword."' OR a.user_name like '".$keyword."' or a.cell_no like '".$keyword."' or a.group_name like '%$keyword%')";   
		}		
    		$whereData = array(
    			"order"			=>	"ORDER BY point DESC",
    			"where"			=>	$where,
    			"limit"			=>	""
    		);    		
            $allList = $this->user_model->getAllUserPointList($whereData);				    
            $rank = 0;
            $prev_total = NULL;
            $prev_rank = 0;            
    		for($i = 0; $i < count($allList); $i++)
    		{            
    		    $row = $allList[$i];
                $user_id = $row["user_id"];
                $total_points = $row["total_points"];
                
                // 순위 계산
                if ($prev_total === $total_points) {
                    $ranking = $prev_rank;
                } else {
                    $rank++;
                    $ranking = $rank;
                    $prev_rank = $ranking;
                }            
                $user_rank[$row["user_id"]] = $ranking;
                $prev_total = $total_points;
            }
		    
		}
		
		$groupList = $this->user_model->getUserGroupList();

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
			$list[$i]['point'] = number_format($list[$i]['point']);
			$list[$i]['ranking'] = $i+1+$num;
			$list[$i]['ranking'] = @$user_rank[$list[$i]['user_id']];

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
		$this->parser->parse("admin/manage/ranking",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	 	
	
	//회원 엑셀 다운로드
	public function rankingDownLoad()
	{

		$this->load->library('excel');

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
		$where .= "AND user_type = 'user' and user_status='Y'";
		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
			//$academy_seq = $this->session->userdata("user_type");
			$where .= "and a.group_name='".$this->session->userdata("group_name")."'";
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($searchGroupName != '') {
		    $where .= " AND a.group_name='$searchGroupName'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.user_id like '%".$keyword."%' OR a.group_name like '%".$keyword."%' or a.user_name like '%".$keyword."%' or a.cell_no like '%".$keyword."%')";   
		}		
				

		$page_size = 100;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total =0;
		if($searchTermType == 'term' || $keyword != "") {
		    $list_total = $this->user_model->getUserPointTotalCount($whereData);
		} else {
		    $list_total = $this->user_model->getUserTotalCount($whereData);
		}

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
        if($searchTermType == 'term' || $keyword != "") {
		    $list = $this->user_model->getUserPointList($whereData);
		} else {
		    $list = $this->user_model->getUserList($whereData);
		    
		}
		
		$groupList = $this->user_model->getUserGroupList();

		//넘버링
		$current_page = ceil ( ($num + 1) / $page_size );

		$start_page = floor ( ($current_page - 1) / $page_list_size ) * $page_list_size + 1;
		$end_page = $start_page + $page_list_size - 1;

		if ($total_page < $end_page)
		{
		    $end_page = $total_page;
		}


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
			$list[$i]['point'] = number_format($list[$i]['point']);
			$list[$i]['ranking'] = $i+1+$num;

		}
		
		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		$this->excel->getActiveSheet()->setCellValue('A1', '순위');
		$this->excel->getActiveSheet()->setCellValue('B1', '이름');
		$this->excel->getActiveSheet()->setCellValue('C1', '아이디');
		$this->excel->getActiveSheet()->setCellValue('D1', '소속');
		$this->excel->getActiveSheet()->setCellValue('E1', '학년');
		$this->excel->getActiveSheet()->setCellValue('F1', '포인트');

		for($i=0; $i<count($list); $i++){
		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$list[$i]['ranking']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['user_name']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['user_id']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['group_name']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['grade']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$list[$i]['point']);

		}

		$this->excel->setActiveSheetIndex(0);

		$title = "랭킹_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}	
 
    public function banner_write($seq = "")
	{
		$depth1 = "manage";
		$depth2 = "banner_list";
		$title = "배너관리";
		$sub_title = "배너관리";
			    
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
 
 
		
		$data = $this->banner_model->getBanner($seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"data"	=>	$data,
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
		$this->parser->parse("admin/manage/banner_write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function topic_write($seq = "")
	{
		$depth1 = "manage";
		$depth2 = "topic_list";
		$title = "책 주제 등록";
		$sub_title = "책 주제 등록";
			    
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
		
		$data = $this->code_model->getCode($seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"data"	=>	$data,
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
		$this->parser->parse("admin/manage/topic_write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	//토픽 작성
	public function topicWriteProc()
	{
		$title = $this->input->post("title");
		$code_group = $this->input->post("code_group");
		$code_name = $this->input->post("code_name");
		$code_tags = $this->input->post("code_tags");
		$code_desc = $this->input->post("code_desc");
		
		$code_seq = @$this->input->post("code_seq");
		$code_status = $this->input->post("code_status");

		$code_image = $_FILES['code_image']['name'];
		$code_image = empty($code_image) ? "" : $code_image;
		
		if($code_seq != "") {
    		if(!empty($code_image)){
    			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/code/";

    			$file_name = "code_thumb_".date("Ymdhis")."_".$code_image;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["code_image"]["tmp_name"],$upload_path.$file_name);

    			$code_image = $file_name;
        		$data = array(
        			"code_group" => $code_group,
        			"code_type" => $code_name,
        			"code_name" => $code_name,
        			"code_tags" => $code_tags,
        			"code_desc" => $code_desc,
        			"code_image" => $code_image,
        			"code_status" => $code_status
        		);    			
    		} else {
        		$data = array(
        			"code_group" => $code_group,
        			"code_type" => $code_name,
        			"code_name" => $code_name,
        			"code_tags" => $code_tags,
        			"code_desc" => $code_desc,
        			"code_status" => $code_status
        		);    			    		    
    		}


    		$result = $this->code_model->updateCode($data, $code_seq);
    		
		} else {

    		if(!empty($code_image)){
    			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/code/";

    			$file_name = "code_thumb_".date("Ymdhis")."_".$code_image;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["code_image"]["tmp_name"],$upload_path.$file_name);

    			$code_image = $file_name;
    		}

    		$data = array(
    			"code_group" => $code_group,
    			"code_type" => $code_name,
    			"code_name" => $code_name,
    			"code_tags" => $code_tags,
    			"code_seq" => $code_seq,
    			"code_desc" => $code_desc,
    			"code_image" => $code_image,
    			"code_status" => $code_status,
    			"reg_date"	=> date("Y-m-d H:i:s")
    		);

    		$result = $this->code_model->insertCode($data);
    	}

		echo "<script>location='topic_list';</script>";
		exit;
	}	
	
	public function  updateToic() {
	    $code_seq = $this->input->post("code_seq");
	    for($i=0;$i<count($code_seq);$i++) {
	        $this->code_model->updateTopicSort($i, $code_seq[$i]);    
	    }
		echo '{"result":"success"}';
		exit;
	}
	
	//삭제하기
	public function deleteTopicProc()
	{
	    $code_seq = $this->input->post("code_seq");
		$this->code_model->deleteCode($code_seq);

		echo '{"result":"success"}';
		exit;
	}
	
	//삭제하기
	public function deleteBanner($seq = "")
	{
	    $seq = $this->input->post("banner_seq");
		$this->banner_model->deleteBanner($seq);

		echo '{"result":"success"}';
		exit;
	}	
	
	public function bannerChangeStatus()
	{
	    
		$seq = $this->input->post("banner_seq");
		$status = $this->input->post("status");	    
		$data = array(
		    "status"=>$status
		);
		$this->banner_model->updateBanner($data, $seq);

		echo '{"result":"success"}';
		exit;
	}	
	
	public function book_list_popup()
	{
		$depth1 = "content";
		$depth2 = "bookListPop";
		$title = "도서 목록";
		$sub_title = "도서 목록";
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;
		
		
		$subject = empty(@$this->input->get('subject')) ? "" : $this->input->get('subject');
		$grade = empty(@$this->input->get('grade')) ? "" : $this->input->get('grade');
		$openYn = empty(@$this->input->get('openYn')) ? "" : $this->input->get('openYn');
		$keyword = empty(@$this->input->get('keyword')) ? "" : $this->input->get('keyword');

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";


		$where = "";

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= "AND edu_title LIKE '%{$srcN}%'";
		}

		if($category != 'all'){
			$where .= "AND edu_type = '{$category}'";
		}
		
		if($subject != ''){
			$where .= "AND subject = '{$subject}'";
		}		
		
		if($grade != ''){
			//$where .= "AND grade = '{$grade}'";
			$where .= "AND recommend_class = '{$grade}'";
		}			
		
		if($openYn!= ''){
			//$where .= "AND grade = '{$grade}'";
			$where .= "AND open_yn = '{$openYn}'";
		}					
		
		if($keyword != ''){
			$where .= "AND book_name like '%{$keyword}%'";
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
			"sort"			=>	"",
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

		$params = "&keyword={$keyword}&subject={$subject}&grade={$grade}&openYn={$openYn}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
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
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50","sort"=>"ORDER BY code_sort_id asc");
		
		$topicList = $this->code_model->getCodeList($whereData);		
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"topicList" => $topicList,
			"paging"		=>	@$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		

		//contents
		$this->parser->parse("admin/manage/book-list-pop",$content_data);


	}	
	
	public function quiz_list_popup()
	{
		$depth1 = "content";
		$depth2 = "bookListPop";
		$title = "도서 목록";
		$sub_title = "도서 목록";
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;
		
		
		$subject = empty(@$this->input->get('subject')) ? "" : $this->input->get('subject');
		$grade = empty(@$this->input->get('grade')) ? "" : $this->input->get('grade');
		$openYn = empty(@$this->input->get('openYn')) ? "" : $this->input->get('openYn');
		$keyword = empty(@$this->input->get('keyword')) ? "" : $this->input->get('keyword');

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}&subject=$subject&keyword=$keyword&grade=$grade";


		$where = "";

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= "AND edu_title LIKE '%{$srcN}%'";
		}

		if($category != 'all'){
			$where .= "AND edu_type = '{$category}'";
		}
		
		if($subject != ''){
			$where .= "AND subject = '{$subject}'";
		}		
		
		if($grade != ''){
			//$where .= "AND grade = '{$grade}'";
			$where .= "AND recommend_class = '{$grade}'";
		}			
		
		if($openYn!= ''){
			//$where .= "AND grade = '{$grade}'";
			$where .= "AND open_yn = '{$openYn}'";
		}					
		
		if($keyword != ''){
			$where .= "AND b.book_name like '%{$keyword}%'";
		}		

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quiz_model->getQuizTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}&subject=$subject&keyword=$keyword&grade=$grade";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

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

		$params = "&keyword={$keyword}&subject={$subject}&grade={$grade}&openYn={$openYn}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
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
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50","sort"=>"ORDER BY code_sort_id asc");
		
		$topicList = $this->code_model->getCodeList($whereData);		
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"topicList" => $topicList,
			"paging"		=>	@$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		

		//contents
		$this->parser->parse("admin/manage/quiz-list-pop",$content_data);


	}		
	
	public function book_list_share_popup()
	{
		$depth1 = "content";
		$depth2 = "bookListPop";
		$title = "도서 목록";
		$sub_title = "도서 목록";
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		
		$subject = $this->input->get('subject');
		$grade = $this->input->get('grade');
		$keyword = $this->input->get('keyword');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";

		$where = "";

		if($subject != "")  {
		    $where .= " AND b.subject='$subject'";   
		}	
		
		if($grade != "")  {
		    $where .= " AND b.recommend_class='$grade'";   
		}				
		
		$where .= " AND a.user_id='".$this->session->userdata("admin_id")."' AND a.status = 'N'";
		
		if($keyword != "")  {
		    $where .= " AND (b.book_name like '%{$keyword}%' or b.book_no like '%{$keyword}%' or b.author like '%{$keyword}%' or b.publisher like '%{$keyword}%'  or b.tags like '%{$keyword}%'  or b.award like '%{$keyword}%')";   
		}					

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quiz_model->getQuizTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

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

		$params = "&subject={$subject}&grade={$grade}&keyword={$keyword}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			switch($list[$i]['open_yn']){
				case "Y":
				$list[$i]['status'] = "공개";
				break;
				case "N":
				$list[$i]['status'] = "비공개";
				break;
			}
			
			$list[$i]['worksheet'] = $list[$i]['worksheet']?"O":"X";


		}
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50","sort"=>"ORDER BY code_sort_id asc");
		
		$topicList = $this->code_model->getCodeList($whereData);		
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"topicList" => $topicList,
			"paging"		=>	@$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		

		//contents
		$this->parser->parse("admin/manage/book-list-share-pop",$content_data);


	}		
	
	public function point_popup($seq)
	{
		$depth1 = "content";
		$depth2 = "bookListPop";
		$title = "포인트 상세 내역";
		$sub_title = "포인트 상세 내역";
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		$data = $this->user_model->getUserSeq($seq);

		$where = " AND a.user_id='{$data['user_id']}'";


		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
			"user_id"=>	$data['user_id'],
		);
		//$list_total = $this->quizHistory_model->getQuizHistoryTotalCount($whereData);
		$list_total = $this->pointHistory_model->getPointHistoryTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"user_id"=>	$data['user_id'],
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		//$list = $this->quizHistory_model->getQuizHistoryList($whereData);
		$list = $this->pointHistory_model->getPointHistoryList($whereData);

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

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
/*
			switch($list[$i]['open_yn']){
				case "Y":
				$list[$i]['open_yn'] = "공개";
				break;
				case "N":
				$list[$i]['open_yn'] = "비공개";
				break;
			}
*/

		}
		
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"data"	=>	$data,
			"paging"		=>	@$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);
		//footer js files
		

		//contents
		$this->parser->parse("admin/manage/point-pop",$content_data);


	}		


	//Banner 작성
	public function bannerWriteProc()
	{
	    
	    $banner_seq=@$this->input->post("banner_seq");
	    $title=$this->input->post("title");
	    $banner_contents=$this->input->post("banner_contents");
	    $status=$this->input->post("status");
	    
	    if($banner_seq == "") {
	        
    		$banner_image = $_FILES['banner_image']['name'];
    		$banner_image = empty($banner_image) ? "" : $banner_image;
    		
            $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/banner/";
                
    		if(!empty($banner_image)){
    			$file_name = "book_".date("Ymdhis")."_".$banner_image;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["banner_image"]["tmp_name"],$upload_path.$file_name);

    			$banner_image = $file_name;
    		}	    
	        

    		$data = array(
    			"title" => $title,
    			"banner_contents" => $banner_contents,
    			"status" => $status,
    			"banner_image" => $banner_image,
    			"reg_date"	=> date("Y-m-d H:i:s")
    		);
    		


    		$result = $this->banner_model->insertBanner($data);
    		$this->goURL("/admin/manage/banner_list");
    		exit;
    	} else {
    	    $info = $this->banner_model->getBanner($banner_seq);	    
    	    
    		$banner_image = $_FILES['banner_image']['name'];
    		if($banner_image != "") {
        		$banner_image = empty($banner_image) ? "" : $banner_image;
        		
                $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/banner/";
                    
        		if(!empty($banner_image)){
        			$file_name = "book_".date("Ymdhis")."_".$banner_image;

        			@unlink($upload_path.$file_name);

        			if( !is_dir($upload_path) ){
        				mkdir($upload_path,0777,true);
        			}

        			move_uploaded_file($_FILES["banner_image"]["tmp_name"],$upload_path.$file_name);

        			$banner_image = $file_name;
        		}	    
        	} else {
        	    $banner_image = $info['banner_image'];
        	}
    	    

    		$data = array(
    			"title" => $title,
    			"banner_contents" => $banner_contents,
    			"status" => $status,
    			"banner_image" => $banner_image 
    		);
    		


    		$result = $this->banner_model->updateBanner($data, $banner_seq);
    		$this->goURL("/admin/manage/banner_list");
    		exit;
    	}

		exit;
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
