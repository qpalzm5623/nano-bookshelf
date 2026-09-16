<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Etc extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("academi_model");
        $this->load->model("content_model");
        $this->load->model("message_model");
		$this->load->model("school_model");
		$this->load->model("quiz_model");
		$this->load->model("config_model");
		$this->load->model("user_model");
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
			$this->noticeList();
		}

	}


	public function terms()
	{
		$depth1 = "admin";
		$depth2 = "academiInfo";
		$title = "이용안내";
		$sub_title = "이용안내";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$where = "";
		if(!empty($this->session->userdata("academy_seq"))){
			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND academy_seq = '{$academy_seq}'";
		}else{
			$where = "AND info_type = 'A'";
		}

		$infoData = $this->academi_model->getInfoData($where);


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"infoData"	=>	$infoData
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/info/academi-info",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function infoWriteProc()
	{
		$info_seq = $this->input->post("info_seq");
		$info_type = $this->input->post("info_type");
		$info_manual = $this->input->post("info_manual");
		$info_movie = $this->input->post("info_movie");
		$info_blog = $this->input->post("info_blog");
		$manual_target = $this->input->post("manual_target");
		$movie_target = $this->input->post("movie_target");
		$blog_target = $this->input->post("blog_target");

		$data = array(
			"info_seq"	=>	$info_seq,
			"info_type"	=>	$info_type,
			"info_manual"	=>	$info_manual,
			"info_movie"	=>	$info_movie,
			"info_blog"	=>	$info_blog,
			"manual_target"	=>	$manual_target,
			"movie_target"	=>	$movie_target,
			"blog_target"	=>	$blog_target,
		);

		$result = $this->adm_model->writeInfo($data);

		echo '{"result":"success"}';
		exit;
	}


  //공지사항 리스트
	public function noticeList()
	{
		$depth1 = "admin";
		$depth2 = "noticeList";
		
		if($this->session->userdata("admin_level") == "0") {
		    $title = "공지사항 (본사 → 가맹점/마스터)";
		    $sub_title = "공지사항 (본사 → 가맹점/마스터)";
		}  else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ 
		    $title = "본사 공지사항";
		    $sub_title = "본사 공지사항";
		}
		    

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');
		$notice_read_type = $this->input->get('notice_read_type');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$keyword = $this->input->get('keyword');		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&notice_read_type={$notice_read_type}&page_size={$page_size}";


		$where = "";

		if($searchTermType == 'term') {
		    $where .= " AND notice_reg_datetime>='$startDate' AND notice_reg_datetime<='$endDate 23:59:59' ";   
		}
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (notice_title like '%".$keyword."%' )";   
		}			

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getNoticeTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&notice_read_type={$notice_read_type}&page_size={$page_size}";

		$whereData = array(
				"sort"			=>	"ORDER BY notice_seq DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$noticeList = $this->board_model->getNoticeList($whereData);

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
		$noticeList = $this->add_counting($noticeList,$list_total,$num);

		$params = "&notice_read_type={$notice_read_type}&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($noticeList); $i++)
		{
			$noticeList[$i]['notice_reg_datetime'] = date("Y-m-d",strtotime($noticeList[$i]['notice_reg_datetime']));

			switch($noticeList[$i]['notice_display_yn']){
				case "Y":
				$noticeList[$i]['notice_display_yn'] = "공개";
				break;
				case "N":
				$noticeList[$i]['notice_display_yn'] = "비공개";
				break;
			}

			switch($noticeList[$i]['notice_read_type']){
				case "0":
				$noticeList[$i]['notice_read_type'] = "전체";
				break;
				case "1":
				$noticeList[$i]['notice_read_type'] = "기관관리자";
				break;
				case "2":
				$noticeList[$i]['notice_read_type'] = "학급관리자";
				break;
			}
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"noticeList"	=>	$noticeList,
			"paging"		=>	$paging,
			"notice_read_type"	=>	$notice_read_type,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}


    //공지사항 리스트
	public function noticeAppList()
	{
		$depth1 = "admin";
		$depth2 = "noticeAppList";
		
		if($this->session->userdata("admin_level") == "0") {
		    $title = "학원 공지사항";
		    $sub_title = "학원공지사항";
		}  else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ 
		    $title = "학원 공지사항";
		    $sub_title = "학원공지사항";
		}  else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){ 
		    $title = "학원 공지사항";
		    $sub_title = "학원공지사항";
		}
		    

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');
		$notice_read_type = $this->input->get('notice_read_type');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$keyword = $this->input->get('keyword');		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&notice_read_type={$notice_read_type}&page_size={$page_size}";


		$where = "";
		
		if($this->session->userdata("admin_type") != "A" && ($this->session->userdata("admin_level") == "director" || $this->session->userdata("admin_level") == "teacher")){
			$where .= "and group_name='".$this->session->userdata("group_name")."'";
		}		

		if($searchTermType == 'term') {
		    $where .= " AND notice_reg_datetime>='$startDate' AND notice_reg_datetime<='$endDate 23:59:59' ";   
		}
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (notice_title like '%".$keyword."%' )";   
		}			

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getNoticeAppTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&notice_read_type={$notice_read_type}&page_size={$page_size}";

		$whereData = array(
				"sort"			=>	"ORDER BY notice_seq DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$noticeList = $this->board_model->getNoticeAppList($whereData);

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
		$noticeList = $this->add_counting($noticeList,$list_total,$num);

		$params = "&notice_read_type={$notice_read_type}&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($noticeList); $i++)
		{
			$noticeList[$i]['notice_reg_datetime'] = date("Y-m-d",strtotime($noticeList[$i]['notice_reg_datetime']));

			switch($noticeList[$i]['notice_display_yn']){
				case "Y":
				$noticeList[$i]['notice_display_yn'] = "공개";
				break;
				case "N":
				$noticeList[$i]['notice_display_yn'] = "비공개";
				break;
			}

			switch($noticeList[$i]['notice_read_type']){
				case "0":
				$noticeList[$i]['notice_read_type'] = "전체";
				break;
				case "1":
				$noticeList[$i]['notice_read_type'] = "기관관리자";
				break;
				case "2":
				$noticeList[$i]['notice_read_type'] = "학급관리자";
				break;
			}
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	@$title,
			"sub_title"	=>	$sub_title,
			"noticeList"	=>	$noticeList,
			"paging"		=>	$paging,
			"notice_read_type"	=>	$notice_read_type,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-app-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	

	//공지사항 작성
	public function noticeWrite()
	{
		$depth1 = "order";
		$depth2 = "noticeList";
		$title = "공지사항등록";
		$sub_title = "공지사항등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 작성
	public function noticeWriteProc()
	{
		$notice_read_type = $this->input->post("notice_read_type");
		$notice_title = $this->input->post("notice_title");
		$notice_display_yn = $this->input->post("notice_display_yn");
		$notice_contents = $this->input->post("notice_contents");

		$data = array(
			"notice_read_type" => $notice_read_type,
			"notice_title" => $notice_title,
			"notice_display_yn" => $notice_display_yn,
			"notice_contents" => $notice_contents,
			"notice_reg_datetime"	=> date("Y-m-d H:i:s"),
			"notice_writer_id"	=>	$this->session->userdata("admin_id"),
		);

		$result = $this->board_model->insertNotice($data);

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 수정
	public function noticeModify($notice_seq)
	{
		$depth1 = "order";
		$depth2 = "noticeList";
		$title = "공지사항수정";
		$sub_title = "공지사항등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$noticeData = $this->board_model->getNoticeData($notice_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"notice_seq"	=>	$notice_seq,
			"noticeData"	=>	$noticeData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 보기
	public function noticeView($notice_seq)
	{
		$depth1 = "order";
		$depth2 = "noticeList";
		$title = "공지사항";
		$sub_title = "공지사항";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$noticeData = $this->board_model->getNoticeData($notice_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"notice_seq"	=>	$notice_seq,
			"noticeData"	=>	$noticeData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-view",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 수정
	public function noticeModifyProc()
	{

		$notice_seq = $this->input->post("notice_seq");
		$notice_read_type = $this->input->post("notice_read_type");
		$notice_title = $this->input->post("notice_title");
		$notice_display_yn = $this->input->post("notice_display_yn");
		$notice_contents = $this->input->post("notice_contents");

		$data = array(
			"notice_read_type" => $notice_read_type,
			"notice_title" => $notice_title,
			"notice_display_yn" => $notice_display_yn,
			"notice_contents" => $notice_contents,
			"notice_mod_datetime"	=> date("Y-m-d H:i:s")
		);

		$result = $this->board_model->updateNotice($notice_seq,$data);

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 공개변경
	public function updateNoticeDisplay()
	{
		$chk = $this->input->post("chk");
		$notice_read_type = $this->input->post("notice_read_type");

		for($i=0; $i<count($chk); $i++){
			$this->board_model->updateNoticeDisplay($chk[$i],$notice_read_type);
		}

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 삭제
	public function deleteNotice($notice_seq="")
	{
		if(!empty($notice_seq)){
			$this->board_model->deleteNotice($notice_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/noticeList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteNotice($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}


	//공지사항 작성
	public function noticeAppWrite()
	{
		$depth1 = "order";
		$depth2 = "noticeAppList";
		$title = "공지사항등록";
		$sub_title = "공지사항등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-app-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 작성
	public function noticeAppWriteProc()
	{
		$notice_read_type = 0;
		$notice_title = $this->input->post("notice_title");
		$notice_display_yn = $this->input->post("notice_display_yn");
		$notice_contents = $this->input->post("notice_contents");
        
		$data = array(
			"notice_read_type" => $notice_read_type,
			"notice_title" => $notice_title,
			"notice_display_yn" => $notice_display_yn,
			"notice_contents" => $notice_contents,
			"group_name" => $this->session->userdata("group_name"),
			"notice_reg_datetime"	=> date("Y-m-d H:i:s"),
			"notice_writer_id"	=>	$this->session->userdata("admin_id"),
			
		);

		$result = $this->board_model->insertNoticeApp($data);

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 수정
	public function noticeAppModify($notice_seq)
	{
		$depth1 = "order";
		$depth2 = "noticeAppList";
		$title = "학원공지사항";
		$sub_title = "학원공지사항";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$noticeData = $this->board_model->getNoticeAppData($notice_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"notice_seq"	=>	$notice_seq,
			"noticeData"	=>	$noticeData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-app-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 보기
	public function noticeAppView($notice_seq)
	{
		$depth1 = "order";
		$depth2 = "noticeList";
		$title = "공지사항";
		$sub_title = "공지사항";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$noticeData = $this->board_model->getNoticeAppData($notice_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"notice_seq"	=>	$notice_seq,
			"noticeData"	=>	$noticeData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/notice-app-view",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//공지사항 수정
	public function noticeAppModifyProc()
	{

		$notice_seq = $this->input->post("notice_seq");
		$notice_read_type = $this->input->post("notice_read_type");
		$notice_title = $this->input->post("notice_title");
		$notice_display_yn = $this->input->post("notice_display_yn");
		$notice_contents = $this->input->post("notice_contents");

		$data = array(
			"notice_read_type" => $notice_read_type,
			"notice_title" => $notice_title,
			"notice_display_yn" => $notice_display_yn,
			"notice_contents" => $notice_contents,
			"notice_mod_datetime"	=> date("Y-m-d H:i:s")
		);

		$result = $this->board_model->updateNoticeApp($notice_seq,$data);

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 공개변경
	public function updateNoticeAppDisplay()
	{
		$chk = $this->input->post("chk");
		$notice_read_type = $this->input->post("notice_read_type");

		for($i=0; $i<count($chk); $i++){
			$this->board_model->updateNoticeAppDisplay($chk[$i],$notice_read_type);
		}

		echo '{"result":"success"}';
		exit;
	}

	//공지사항 삭제
	public function deleteNoticeApp($notice_seq="")
	{
		if(!empty($notice_seq)){
			$this->board_model->deleteNoticeApp($notice_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/noticeAppList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteNoticeApp($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}


	//자주묻는질문 리스트
	public function faqList()
	{
		$depth1 = "admin";
		$depth2 = "faqList";
		$title = "자주묻는질문 리스트";
		$sub_title = "자주묻는질문 리스트";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}";


		$where = "";

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getFaqTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&page_size={$page_size}";

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$faqList = $this->board_model->getFaqList($whereData);

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
		$faqList = $this->add_counting($faqList,$list_total,$num);

		$params = "&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($faqList); $i++)
		{
			$faqList[$i]['faq_reg_datetime'] = date("Y-m-d",strtotime($faqList[$i]['faq_reg_datetime']));
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"faqList"	=>	$faqList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/faq-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//faq 작성
	public function faqWrite()
	{
		$depth1 = "order";
		$depth2 = "faqList";
		$title = "자주묻는질문등록";
		$sub_title = "자주묻는질문등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/faq-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//faq 작성
	public function faqWriteProc()
	{
		$faq_title = $this->input->post("faq_title");
		$faq_contents = $this->input->post("faq_contents");

		$data = array(
			"faq_title" => $faq_title,
			"faq_contents" => $faq_contents,
			"faq_reg_datetime"	=> date("Y-m-d H:i:s"),
		);

		$result = $this->board_model->insertFaq($data);

		echo '{"result":"success"}';
		exit;
	}

	//faq 수정
	public function faqModify($faq_seq)
	{
		$depth1 = "order";
		$depth2 = "faqList";
		$title = "자주묻는질문 수정";
		$sub_title = "자주묻는질문 수정";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$faqData = $this->board_model->getFaqData($faq_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"faq_seq"	=>	$faq_seq,
			"faqData"	=>	$faqData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/faq-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//faq 보기
	public function faqView($faq_seq)
	{
		$depth1 = "order";
		$depth2 = "faqList";
		$title = "자주묻는질문 보기";
		$sub_title = "자주묻는질문 보기";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$faqData = $this->board_model->getFaqData($faq_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"faq_seq"	=>	$faq_seq,
			"faqData"	=>	$faqData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/faq-view",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//자주묻는질문 수정
	public function faqModifyProc()
	{

		$faq_seq = $this->input->post("faq_seq");
		$faq_title = $this->input->post("faq_title");
		$faq_contents = $this->input->post("faq_contents");

		$data = array(
			"faq_title" => $faq_title,
			"faq_contents" => $faq_contents
		);

		$result = $this->board_model->updateFaq($faq_seq,$data);

		echo '{"result":"success"}';
		exit;
	}

	//문의 삭제
	public function deleteFaq($faq_seq="")
	{
		if(!empty($faq_seq)){
			$this->board_model->deleteFaq($faq_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/faqList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteFaq($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}

	//문의사항 리스트
	public function qnaList()
	{
		$depth1 = "admin";
		$depth2 = "qnaList";
		$title = "앱 문의사항";
		$sub_title = "앱 문의사항";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$user_level = $this->input->get('user_level');
		$comment_yn = $this->input->get('comment_yn');
		$page_size = $this->input->get('page_size');
		
        $status = $this->input->get('status');
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');			

		$where = "";
        
			

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&school_seq={$school_seq}&user_level={$user_level}&school_year={$school_year}&school_class={$school_class}&comment_yn={$comment_yn}&category={$category}&page_size={$page_size}";


		$where = "";
        $where .=" AND qna.qna_type='user'";
    	if($this->session->userdata("admin_level")!="0"&&($this->session->userdata("admin_type")=="director" || $this->session->userdata("admin_type")=="teacher")){
    	    $group_name = $this->session->userdata("group_name");
    	    $where .= " AND users.group_name = '".$group_name."'";
    	}        
		if($searchTermType == 'term') {
		    $where .= " AND qna.reg_date>='$startDate' AND qna.reg_date<='$endDate 23:59:59' ";   
		}
		if($status != '') {
		    if($status == "Y") {
		        $where .= " AND qna.reply_date is not null ";       
		    } else if($status == "N") {
		        $where .= " AND qna.reply_date is null ";       
		    }
		}		

				
		

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getQnaTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&school_seq={$school_seq}&user_level={$user_level}&school_year={$school_year}&school_class={$school_class}&comment_yn={$comment_yn}&category={$category}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$qnaList = $this->board_model->getQnaList($whereData);

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
		$qnaList = $this->add_counting($qnaList,$list_total,$num);

		$params = "&searchTermType={$searchTermType}&startDate={$startDate}&endDate={$endDate}&status={$status}page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($qnaList); $i++)
		{
			$qnaList[$i]['reg_date'] = date("Y-m-d",strtotime($qnaList[$i]['reg_date']));

			switch($qnaList[$i]['qna_category']){
				case "PROGRAM":
				$qnaList[$i]['qna_category'] = "프로그램 문의";
				break;
				case "ERROR":
				$qnaList[$i]['qna_category'] = "오류 문의";
				break;
				case "ACCOUNT":
				$qnaList[$i]['qna_category'] = "계정 문의";
				break;
				case "POINT":
				$qnaList[$i]['qna_category'] = "포인트 문의";
				break;
				case "ETC":
				$qnaList[$i]['qna_category'] = "기타";
				break;
			}

			switch($qnaList[$i]['user_type']){
                case "director":
                $qnaList[$i]['user_type'] = "본사관리자";
                break;
        		case "master":
                $qnaList[$i]['user_type'] = "마스터";
                break;
        		case "teacher":
                $qnaList[$i]['user_type'] = "선생님";
                break;
        		case "user":
                $qnaList[$i]['user_type'] = "학생";
                break;
              }

			if(empty($qnaList[$i]['reply_user_id'])){
				$qnaList[$i]['comment_yn'] = "답변대기";
			}else{
				$qnaList[$i]['comment_yn'] = "답변완료";
			}

			if(empty($qnaList[$i]['school_name'])){
				$qnaList[$i]['school_name'] = "-";
			}
			if(empty($qnaList[$i]['school_year'])){
				$qnaList[$i]['school_year'] = "-";
			}
			if(empty($qnaList[$i]['school_class'])){
				$qnaList[$i]['school_class'] = "-";
			}
		}

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);
        $schoolList = array();
		//$schoolList = $this->school_model->getSchoolList($whereData);
        $classList = array();
		//$classList = $this->school_model->getClassList($whereData);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"qnaList"	=>	$qnaList,
			"paging"		=>	$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"school_seq"	=>	$school_seq,
			"school_year"	=>	$school_year,
			"school_class"	=>	$school_class,
			"comment_yn"	=>	$comment_yn,
			"user_level"	=>	$user_level,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"schoolList"	=>	$schoolList,
			"classList"	=>	$classList,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/qna-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//문의 수정
	public function qnaView($qna_seq)
	{
		$depth1 = "order";
		$depth2 = "qnaList";
		$title = "앱 문의사항";
		$sub_title = "앱 문의사항";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$user_level = $this->input->get('user_level');
		$comment_yn = $this->input->get('comment_yn');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$school_seq = $school_seq=="" ? "all" : $school_seq;
		$school_year = $school_year=="" ? "all" : $school_year;
		$school_class = $school_class=="" ? "all" : $school_class;
		$comment_yn = $comment_yn=="" ? "all" : $comment_yn;
		$user_level = $user_level=="" ? "all" : $user_level;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&school_seq={$school_seq}&user_level={$user_level}&school_year={$school_year}&school_class={$school_class}&comment_yn={$comment_yn}&category={$category}&page_size={$page_size}";


		$qnaData = $this->board_model->getQnaData($qna_seq);
 
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"qna_seq"	=>	$qna_seq,
			"qnaData"	=>	$qnaData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/qna-view",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	
	//문의사항 리스트
	public function adminQnaList()
	{
		$depth1 = "admin";
		$depth2 = "adminQnaList";
		$title = "관리자 문의사항";
		$sub_title = "관리자 문의사항";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$user_level = $this->input->get('user_level');
		$comment_yn = $this->input->get('comment_yn');
		$page_size = $this->input->get('page_size');
		
		$status = $this->input->get('status');
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');		

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;


		$where = "";
        $where .=" AND qna.qna_type='director'";
        if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ 
            $where .= " AND qna.user_id='".$this->session->userdata("admin_id")."'";   
        }
		if($searchTermType == 'term') {
		    $where .= " AND qna.reg_date>='$startDate' AND qna.reg_date<='$endDate 23:59:59' ";   
		}
		if($status != '') {
		    if($status == "Y") {
		        $where .= " AND qna.reply_date is not null ";       
		    } else if($status == "N") {
		        $where .= " AND qna.reply_date is null ";       
		    }
		    
		}		
		

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getQnaTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );
        $param = $params = "&searchTermType={$searchTermType}&startDate={$startDate}&endDate={$endDate}&status={$status}page_size={$page_size}";     

		$whereData = array(
				"sort"			=>	"ORDER BY reg_date DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$qnaList = $this->board_model->getQnaList($whereData);

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
		$qnaList = $this->add_counting($qnaList,$list_total,$num);

		$params = "&school_seq={$school_seq}&user_level={$user_level}&school_year={$school_year}&school_class={$school_class}&comment_yn={$comment_yn}&category={$category}&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($qnaList); $i++)
		{
			$qnaList[$i]['reg_date'] = date("Y-m-d",strtotime($qnaList[$i]['reg_date']));

			switch($qnaList[$i]['user_type']){
                case "director":
                $qnaList[$i]['user_type'] = "본사관리자";
                break;
        		case "master":
                $qnaList[$i]['user_type'] = "마스터";
                break;
        		case "teacher":
                $qnaList[$i]['user_type'] = "선생님";
                break;
        		case "user":
                $qnaList[$i]['user_type'] = "학생";
                break;
              }

			if(empty($qnaList[$i]['reply_user_id'])){
				$qnaList[$i]['comment_yn'] = "답변대기";
			}else{
				$qnaList[$i]['comment_yn'] = "답변완료";
			}

			if(empty($qnaList[$i]['school_name'])){
				$qnaList[$i]['school_name'] = "-";
			}
			if(empty($qnaList[$i]['school_year'])){
				$qnaList[$i]['school_year'] = "-";
			}
			if(empty($qnaList[$i]['school_class'])){
				$qnaList[$i]['school_class'] = "-";
			}
		}

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);
        $schoolList = array();
		//$schoolList = $this->school_model->getSchoolList($whereData);
        $classList = array();
		//$classList = $this->school_model->getClassList($whereData);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"qnaList"	=>	$qnaList,
			"paging"		=>	$paging,
			"category"		=>	$category,
			"srcN"			=>	$srcN,
			"school_seq"	=>	$school_seq,
			"school_year"	=>	$school_year,
			"school_class"	=>	$school_class,
			"comment_yn"	=>	$comment_yn,
			"user_level"	=>	$user_level,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"schoolList"	=>	$schoolList,
			"classList"	=>	$classList,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/admin-qna-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//문의 수정
	public function adminQnaView($qna_seq)
	{
		$depth1 = "order";
		$depth2 = "adminQnaList";
		$title = "관리자 문의사항";
		$sub_title = "관리자 문의사항";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$user_level = $this->input->get('user_level');
		$comment_yn = $this->input->get('comment_yn');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$school_seq = $school_seq=="" ? "all" : $school_seq;
		$school_year = $school_year=="" ? "all" : $school_year;
		$school_class = $school_class=="" ? "all" : $school_class;
		$comment_yn = $comment_yn=="" ? "all" : $comment_yn;
		$user_level = $user_level=="" ? "all" : $user_level;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&school_seq={$school_seq}&user_level={$user_level}&school_year={$school_year}&school_class={$school_class}&comment_yn={$comment_yn}&category={$category}&page_size={$page_size}";


		$qnaData = $this->board_model->getQnaData($qna_seq);

		switch($qnaData['qna_category']){
			case "PROGRAM":
			$qnaData['qna_category'] = "프로그램 문의";
			break;
			case "ERROR":
			$qnaData['qna_category'] = "오류 문의";
			break;
			case "ACCOUNT":
			$qnaData['qna_category'] = "계정 문의";
			break;
			case "POINT":
			$qnaData['qna_category'] = "포인트 문의";
			break;
			case "ETC":
			$qnaData['qna_category'] = "기타";
			break;
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"qna_seq"	=>	$qna_seq,
			"qnaData"	=>	$qnaData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/admin-qna-view",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	

	//문의 답변등록
	public function qnaCommentWriteProc()
	{
		$qna_seq = $this->input->post("qna_seq");
		$reply_contents = $this->input->post("reply_contents");
		$reply_user_id = $this->session->userdata("admin_id");
		$reg_date = date("Y-m-d H:i:s");

		$data = array(
			"reply_contents"	=>	$reply_contents,
			"reply_user_id"	=>	$reply_user_id,
			"reply_date"	=>	$reg_date,
		);

		$this->board_model->qnaCommentWrite($qna_seq,$data);

		//$qnaData = $this->board_model->getQnaData($qna_seq);

		//알람
		/*
		$send_id = "amdin";
    $alarm_target = "user";
    $alarm_type = "comment";
    $to_id = $qnaData['user_id'];
    $title = "문의사항에 답변이 달렸습니다";
    $link = "/board/qnaList";
    $reg_date = date("Y-m-d H:i:s");

    $arr = array(
      "send_id" =>  $send_id,
      "alarm_target"  =>  $alarm_target,
      "alarm_type"  =>  $alarm_type,
      "to_id" =>  $to_id,
      "title" =>  $title,
      "link"  =>  $link,
      "reg_date"  =>  $reg_date,
    );

		$this->addAlarm($arr);
		*/

		echo '{"result":"success"}';
		exit;
	}

	//문의 삭제
	public function deleteQna($qna_seq="")
	{
		if(!empty($qna_seq)){
			$this->board_model->deleteQna($qna_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/qnaList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteQna($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}
	
	
	//문의 삭제
	public function adminDeleteQna($qna_seq="")
	{
		if(!empty($qna_seq)){
			$this->board_model->deleteQna($qna_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/adminQnaList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteQna($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}	
	

	//서약서 리스트
	public function oauthList()
	{
		$depth1 = "admin";
		$depth2 = "oauthList";
		$title = "서약서 리스트";
		$sub_title = "서약서 리스트";


		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$oauth_yn = $this->input->get('oauth_yn');
		$location = $this->input->get('location');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$school_seq = $school_seq=="" ? "all" : $school_seq;
		$school_year = $school_year=="" ? "all" : $school_year;
		$school_class = $school_class=="" ? "all" : $school_class;
		$oauth_yn = $oauth_yn=="" ? "all" : $oauth_yn;
		$location = $location=="" ? "all" : $location;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&school_seq={$school_seq}&location={$location}&school_year={$school_year}&school_class={$school_class}&oauth_yn={$oauth_yn}&page_size={$page_size}";


		$where = " AND users.user_status = 'C'";

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= " AND (users.user_id LIKE '%{$srcN}%' OR users.user_name LIKE '%{$srcN}%')";
		}

		if($school_seq != 'all'){
			$where .= " AND users.school_seq = '{$school_seq}'";
		}
		if($school_year != 'all'){
			$where .= " AND users.school_year = '{$school_year}'";
		}
		if($school_class != 'all'){
			$where .= " AND users.school_class = '{$school_class}'";
		}
		if($oauth_yn != 'all'){
			if($oauth_yn == "Y"){
				$where .= " AND oauth.oauth_seq is NOT NULL";
			}else{
				$where .= " AND oauth.oauth_seq is NULL";
			}
		}
		if($location != 'all'){
			$where .= " AND users.location = '{$location}'";
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



		$page_size = 10;
		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getOauthTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&school_seq={$school_seq}&location={$location}&school_year={$school_year}&school_class={$school_class}&oauth_yn={$oauth_yn}&page_size={$page_size}";

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$oauthList = $this->board_model->getOauthList($whereData);

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
		$oauthList = $this->add_counting($oauthList,$list_total,$num);

		$params = "&school_seq={$school_seq}&location={$location}&school_year={$school_year}&school_class={$school_class}&oauth_yn={$oauth_yn}&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($oauthList); $i++)
		{
			if(!empty($oauthList[$i]['oauth_reg_date'])){
				$oauthList[$i]['oauth_reg_date'] = date("Y-m-d",strtotime($oauthList[$i]['oauth_reg_date']));
			}else{
				$oauthList[$i]['oauth_reg_date'] = "-";
			}
			$oauthList[$i]['school_year'] = empty($oauthList[$i]['school_year']) ? "-" : $oauthList[$i]['school_year']."학년";
			$oauthList[$i]['school_class'] = empty($oauthList[$i]['school_class']) ? "-" : $oauthList[$i]['school_class'];
			$oauthList[$i]['oauth_yn_txt'] = $oauthList[$i]['oauth_yn']=="Y" ? "서약" : "미서약";

		}

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$schoolList = $this->school_model->getSchoolList($whereData);

		$classList = $this->school_model->getClassList($whereData);

		$locationData = $this->config_model->getConfig('location');

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"oauthList"	=>	$oauthList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"school_seq"	=>	$school_seq,
			"school_year"	=>	$school_year,
			"school_class"	=>	$school_class,
			"oauth_yn"	=>	$oauth_yn,
			"location"	=>	$location,
			"schoolList"	=>	$schoolList,
			"classList"	=>	$classList,
			"locationData"	=>	$locationData,
			"list_total"	=>	$list_total,
			"param"	=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/oauth-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//서약서 상세보기
	public function oauthPrintPop($oauth_seq="")
	{
		$oauthData = $this->board_model->getOauthData($oauth_seq);
		$content_data = array(
			"oauthData"	=>	$oauthData
		);
		$this->parser->parse("admin/board/oauth-print",$content_data);
	}

	//서약서 엑셀 다운로드
	public function oauthDownLoad()
	{
		$this->load->library('excel');

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$school_seq = $this->input->get('school_seq');
		$school_year = $this->input->get('school_year');
		$school_class = $this->input->get('school_class');
		$oauth_yn = $this->input->get('oauth_yn');
		$location = $this->input->get('location');
		$page_size = $this->input->get('page_size');

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$school_seq = $school_seq=="" ? "all" : $school_seq;
		$school_year = $school_year=="" ? "all" : $school_year;
		$school_class = $school_class=="" ? "all" : $school_class;
		$oauth_yn = $oauth_yn=="" ? "all" : $oauth_yn;
		$location = $location=="" ? "all" : $location;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&school_seq={$school_seq}&location={$location}&school_year={$school_year}&school_class={$school_class}&oauth_yn={$oauth_yn}&page_size={$page_size}";


		$where = "";

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= "AND (users.user_id LIKE '%{$srcN}%' OR users.user_name LIKE '%{$srcN}%')";
		}

		if($school_seq != 'all'){
			$where .= "AND users.school_seq = '{$school_seq}'";
		}
		if($school_year != 'all'){
			$where .= "AND users.school_year = '{$school_year}'";
		}
		if($school_class != 'all'){
			$where .= "AND users.school_class = '{$school_class}'";
		}
		if($oauth_yn != 'all'){
			if($oauth_yn == "Y"){
				$where .= "AND oauth.oauth_seq is NOT NULL";
			}else{
				$where .= "AND oauth.oauth_seq is NULL";
			}
		}
		if($location != 'all'){
			$where .= "AND users.location = '{$location}'";
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

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$oauthList = $this->board_model->getExcelOauthList($whereData);

		//customSetting
		for($i = 0; $i < count($oauthList); $i++)
		{
			if(!empty($oauthList[$i]['oauth_reg_date'])){
				$oauthList[$i]['oauth_reg_date'] = date("Y-m-d",strtotime($oauthList[$i]['oauth_reg_date']));
			}else{
				$oauthList[$i]['oauth_reg_date'] = "-";
			}
			$oauthList[$i]['school_year'] = empty($oauthList[$i]['school_year']) ? "-" : $oauthList[$i]['school_year']."학년";
			$oauthList[$i]['school_class'] = empty($oauthList[$i]['school_class']) ? "-" : $oauthList[$i]['school_class'];
			$oauthList[$i]['oauth_yn_txt'] = $oauthList[$i]['oauth_yn']=="Y" ? "서약" : "미서약";
			$oauthList[$i]['gender'] = $oauthList[$i]['gender']=="M" ? "남자" : "여자";

		}

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		$this->excel->getActiveSheet()->setCellValue('A1', '아이디');
		$this->excel->getActiveSheet()->setCellValue('B1', '이름');
		$this->excel->getActiveSheet()->setCellValue('C1', '태어난 년도');
		$this->excel->getActiveSheet()->setCellValue('D1', '태어난 월');
		$this->excel->getActiveSheet()->setCellValue('E1', '태어난 일');
		$this->excel->getActiveSheet()->setCellValue('F1', '성별');
		$this->excel->getActiveSheet()->setCellValue('G1', '연락처');
		$this->excel->getActiveSheet()->setCellValue('H1', '이메일');
		$this->excel->getActiveSheet()->setCellValue('I1', '지역');
		$this->excel->getActiveSheet()->setCellValue('J1', '학교이름');
		$this->excel->getActiveSheet()->setCellValue('K1', '서약여부');
		$this->excel->getActiveSheet()->setCellValue('L1', '서약일');

		for($i=0; $i<count($oauthList); $i++){
		  $this->excel->getActiveSheet()->setCellValue('A'.($i+2),$oauthList[$i]['user_id']);
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$oauthList[$i]['user_name']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$oauthList[$i]['birth_year']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$oauthList[$i]['birth_month']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$oauthList[$i]['birth_day']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$oauthList[$i]['gender']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$oauthList[$i]['phone']);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$oauthList[$i]['email']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$oauthList[$i]['location']);
			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$oauthList[$i]['school_name']);
			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$oauthList[$i]['oauth_yn_txt']);
			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$oauthList[$i]['oauth_reg_date']);

		}

		$this->excel->setActiveSheetIndex(0);

		$title = "탄소서약내역_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}

	//인사이트 메인
	public function insightMain()
	{
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

		//보드 뷰카운트
		$board_view_count_total = $this->board_model->getBoardViewCountTotal($year,$month,$where);

		//챌린지 현황
		$challenge_total = $this->content_model->getChallengeFeedTotal($year,$month,"3",$where);

		//총 탄소절감량
		$carbon_total = $this->content_model->getCarbonTotal($year,$month,$where);
		/*
		$carbon_total = $this->content_model->getDayCarbonInsight($year,$month,"all","all",$where);
		$carbon_total = $carbon_total['carbon_total']['carbon_total'];
		*/
		//탄소절감 서약서
		$oauth_total = $this->board_model->getOauthLocationTotal($year,$month,"3",$where);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"member_total"	=>	$member_total,
			"search_member_total"	=>	$search_member_total,
			"search_leave_member_total"	=>	$search_leave_member_total,
			"board_view_count_total"	=>	$board_view_count_total,
			"challenge_total"	=>	$challenge_total,
			"carbon_total"	=>	$carbon_total,
			"oauth_total"	=>	$oauth_total,
			"year"	=>	$year,
			"month"	=>	$month
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-main",$content_data);

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

	public function loadMemberInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");

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

		$dayMemberInsight = $this->member_model->getDayMemberInsight($year,$month,$where);


		echo '{"result":"success","data":'.json_encode($dayMemberInsight).'}';
		exit;
	}

	//인사이트 활동
	public function insightPlay()
	{
		$depth1 = "insight";
		$depth2 = "playInsight";
		$title = "활동 현황";
		$sub_title = "활동 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$schoolList = $this->school_model->getSchoolList($whereData);

		$locationData = $this->config_model->getConfig('location');

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"schoolList"	=>	$schoolList,
			"locationData"	=>	$locationData
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-play",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

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

	//인사이트 챌린지
	public function insightChallenge()
	{
		$depth1 = "insight";
		$depth2 = "challengeInsight";
		$title = "챌린지 현황";
		$sub_title = "챌린지 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$schoolList = $this->school_model->getSchoolList($whereData);

		$locationData = $this->config_model->getConfig('location');

		$challengeList = $this->content_model->getChallengeDepth1();

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"schoolList"	=>	$schoolList,
			"locationData"	=>	$locationData,
			"challengeList"	=>	$challengeList
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-challenge",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

	}

	public function loadChallengeInsight()
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

		$challenge_total = $this->content_model->getChallengeInsight($year,$month,$school_seq,$location,$where);

		$challengeList = $this->content_model->getChallengeDepth1();

		$returnArr = array(
			"challenge_total"	=>	$challenge_total,
			"challengeList"	=>	$challengeList
		);


		echo '{"result":"success","data":'.json_encode($returnArr).'}';
		exit;
	}

	//인사이트 탄소절감
	public function insightCarbon()
	{
		$depth1 = "insight";
		$depth2 = "carbonInsight";
		$title = "탄소 절감량 추이";
		$sub_title = "탄소 절감량 추이";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	"",
			"limit"			=>	""
		);

		$schoolList = $this->school_model->getSchoolList($whereData);

		$locationData = $this->config_model->getConfig('location');


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"schoolList"	=>	$schoolList,
			"locationData"	=>	$locationData,
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-carbon",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

	}

	public function loadCarbonInsight()
	{
		$year = $this->input->post("year");
		$month = $this->input->post("month");

		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
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

		$dayCarbonInsight = $this->content_model->getDayCarbonInsight($year,$month,$school_seq,$location,$where);

		$sum_num = 0;
		$per_num = 0;
		for($i=0; $i<count($dayCarbonInsight['carbon_data']); $i++){
			$sum_num += $dayCarbonInsight['carbon_data'][$i]['cnt'];
		}

		if(count($dayCarbonInsight['carbon_data'])>0 && $sum_num > 0){
			$per_num =  $sum_num / count($dayCarbonInsight['carbon_data']);
		}


		$dayCarbonInsight['per_num'] = number_format($per_num,2);


		echo '{"result":"success","data":'.json_encode($dayCarbonInsight).'}';
		exit;
	}

	//인사이트 탄소절감 서약서
	public function insightOauth()
	{
		$depth1 = "insight";
		$depth2 = "oauthInsight";
		$title = "실천서약 현황";
		$sub_title = "실천서약 현황";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$where = "";

		//기관관리자 접근
		if($this->session->userdata("admin_level")==2){
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

		$oauthData = $this->member_model->getOauthInsight($where);

		for($i=0; $i<count($oauthData['oauthList']); $i++)
		{
			$oauthData['oauthList'][$i]['per'] = ($oauthData['oauthList'][$i]['cnt'] / $oauthData['oauthTotal']) * 100;
		}


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"oauthData"	=>	$oauthData
		);



		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/insight/insight-oauth",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

	}

	//도서 리스트
	public function bookList()
	{
		$depth1 = "admin";
		$depth2 = "bookList";
		$title = "도서 리스트";
		$sub_title = "도서 리스트";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$page_size = $this->input->get('page_size');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}";


		$where = "";

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->board_model->getBookTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&page_size={$page_size}";

		$whereData = array(
				"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$bookList = $this->board_model->getBookList($whereData);

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
		$bookList = $this->add_counting($bookList,$list_total,$num);

		$params = "&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($bookList); $i++)
		{
			$bookList[$i]['book_reg_datetime'] = date("Y-m-d",strtotime($bookList[$i]['book_reg_datetime']));
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"bookList"	=>	$bookList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"list_total"	=>	$list_total,
			"page_size"	=>	$page_size,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/book-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//book 작성
	public function bookWrite()
	{
		$depth1 = "order";
		$depth2 = "bookList";
		$title = "도서 등록";
		$sub_title = "도서 등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/book-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//book 작성
	public function bookWriteProc()
	{
		$book_title = $this->input->post("book_title");
		$book_file = $_FILES['book_file']['name'];
		$book_thumb = $_FILES['book_thumb']['name'];


		if(!empty($book_file)){
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/board/";

			$file_name = "book_".date("YmdHis")."_".$book_file;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["book_file"]["tmp_name"],$upload_path.$file_name);

			$book_file = $file_name;
		}

		if(!empty($book_thumb)){
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/board/";

			$file_name = "book_thumb_".date("YmdHis")."_".$book_thumb;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["book_thumb"]["tmp_name"],$upload_path.$file_name);

			$book_thumb = $file_name;
		}

		$data = array(
			"book_title" => $book_title,
			"book_file" => $book_file,
			"book_thumb"	=>	$book_thumb,
			"book_reg_datetime"	=> date("Y-m-d H:i:s"),
		);

		$result = $this->board_model->insertBook($data);

		echo '{"result":"success"}';
		exit;
	}

	//book 수정
	public function bookModify($book_seq)
	{
		$depth1 = "order";
		$depth2 = "bookList";
		$title = "도서 수정";
		$sub_title = "도서 수정";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&page_size={$page_size}";

		$bookData = $this->board_model->getBookData($book_seq);

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"book_seq"	=>	$book_seq,
			"bookData"	=>	$bookData,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/book-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//북 수정
	public function bookModifyProc()
	{

		$book_seq = $this->input->post("book_seq");
		$book_title = $this->input->post("book_title");
		$book_file_org = $this->input->post("book_file_org");
		$book_thumb_org = $this->input->post("book_thumb_org");

		$book_file = $_FILES['book_file']['name'];
		$book_thumb = $_FILES['book_thumb']['name'];

		if(!empty($book_file)){
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/board/";

			$file_name = "book_".date("YmdHis")."_".$book_file;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["book_file"]["tmp_name"],$upload_path.$file_name);

			$book_file = $file_name;
		}else{
			$book_file = $book_file_org;
		}

		if(!empty($book_thumb)){
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/board/";

			$file_name = "book_thumb_".date("YmdHis")."_".$book_thumb;

			@unlink($upload_path.$file_name);

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			move_uploaded_file($_FILES["book_thumb"]["tmp_name"],$upload_path.$file_name);

			$book_thumb = $file_name;
		}else{
			$book_thumb = $book_thumb_org;
		}

		$data = array(
			"book_title" => $book_title,
			"book_file"	=>	$book_file,
			"book_thumb"	=>	$book_thumb,
		);

		$result = $this->board_model->updateBook($book_seq,$data);

		echo '{"result":"success"}';
		exit;
	}

	//북 삭제
	public function deleteBook($book_seq="")
	{
		if(!empty($book_seq)){
			$this->board_model->deleteBook($book_seq);
			$param = $this->input->get("param");
			$this->goURL("/admin/etc/bookList".$param);
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->board_model->deleteBook($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}

	//약관
	public function termsWrite()
	{
		$depth1 = "order";
		$depth2 = "termsWrite";
		$title = "이용약관및개인정보취급방침";
		$sub_title = "이용약관및개인정보취급방침";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$termsData = $this->board_model->getTermsData();

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"termsData"	=>	$termsData,
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/terms-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function termsWriteProc()
	{
		$terms = $this->input->post("terms");
		$privacy = $this->input->post("privacy");
		$privacy2 = $this->input->post("privacy2");

		$data = array(
			"terms"	=>	$terms,
			"privacy"	=>	$privacy,
			"privacy2"	=>	$privacy2
		);

		$this->board_model->updateTemrs($data);

		echo '{"result":"success"}';
		exit;
	}
	
	//퀴즈 리스트
	public function message_list()
	{
		$depth1 = "etc";
		$depth2 = "messageList";
		$title = "쪽지함";
		$sub_title = "쪽지함";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		$type = $this->input->get('type');
		$keyword = $this->input->get('keyword');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}&type={$type}";

		
		$where = "";
		$whereData = "";
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			//$where .= " and a.group_name='".$this->session->userdata("group_name")."'";
			
			//$whereData .= " and a.group_name='".$this->session->userdata("group_name")."'";
		}		
 	
 
		

		$page_list_size = 10;
		
		
		if($type=="send") {
		    $where = " AND sender_id='".$this->session->userdata("admin_id")."'";
		    
		    if($keyword !="") {
		        $where .= " AND receive_id like '%".$keyword."%'";
		    }
		    
            $whereData = array(
    			"where"			=>	$where,
    		);		    
		    $list_total = $this->message_model->getMessageSenderTotalCount($whereData);
		} else {
		    $where = " AND receive_id='".$this->session->userdata("admin_id")."'";
		    if($keyword !="") {
		        $where .= " AND sender_id like '%".$keyword."%'";
		    }
		    
            $whereData = array(
    			"where"			=>	$where,
    		);		    		    
		    $list_total = $this->message_model->getMessageReceiveTotalCount($whereData);
		}

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}&type={$type}";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);
        if($type=="send")
    		$list = $this->message_model->getMessageSenderList($whereData);
		else 
		    $list = $this->message_model->getMessageReceiveList($whereData);

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

		$paging = $this->make_paging2($_SERVER['REQUEST_URI'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
		
		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
		}
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	@$list,
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
		$this->parser->parse("admin/board/message-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
		
    public function message_popup($seq="")
	{
		$depth1 = "message";
		$depth2 = "message";
		$title = "쪽지함";
		$sub_title = "쪽지함 등록/조회";
			    
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');
		$receive_id = $this->input->get('receive_id');
		

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
		
		
		$data = $this->message_model->getMessage($seq);
		if(empty($data) && $receive_id != "") $data['receive_id'] = $receive_id;
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
			"srcType"		=>	$srcType,
			"srcN"			=>	$srcN,
			"status"		=>	$status,
			"num"				=>	$num,
			"param"			=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/board/message-pop",$content_data);


	}		
	
	
	//공지사항 삭제
	public function deleteMessage($message_seq="")
	{
		if(!empty($message_seq)){
			$this->message_model->deleteMessage($message_seq_seq);
			$param = $this->input->get("param");
			//$this->goURL("/admin/etc/message_list?".$param);
			echo '{"result":"success"}';
			exit;
		}else{
			$chk = $this->input->post("chk");

			for($i=0; $i<count($chk); $i++){
				$this->message_model->deleteMessage($chk[$i]);
			}

			echo '{"result":"success"}';
			exit;
		}
	}
	
    public function messageProc()
	{
		$receive_id = $this->input->post("receive_id");
		$sender_id = $this->session->userdata("admin_id");
		$subject = $this->input->post("subject");
		$contents = $this->input->post("contents");
		$reg_date = date("Y-m-d H:i:s");
		
        if( !$this->session->userdata("admin_id") ){
            $this->goURL(base_url("admin/login"));
            exit;
		}
		
		if($subject == "") {
		    $this->msg("제목이 없습니다.");
		    $this->goBack();
		    exit;
		}		
		
		if($contents == "") {
		    $this->msg("내용이 없습니다.");
		    $this->goBack();
		    exit;
		}		
		
		$receive_data = $this->user_model->getUserData($receive_id);
		if($receive_data['user_id'] == "") {
		    $this->msg("받는사람 아이디를 확인 해주시기 바랍니다.");
		    $this->goBack();
		    exit;
		}
		
		
		
		$data = array(
			"receive_id"	=>	$receive_id,
			"sender_id"	=>	$sender_id,
			"subject"	=>	$subject,
			"contents"	=>	$contents,
			"reg_date"	=>	$reg_date
		);

		$result = $this->message_model->insertMessage($data);

		echo '{"result":"success"}';
		exit;
	}

	//약관
	public function adminQnaWrite()
	{
		$depth1 = "etc";
		$depth2 = "adminQnaList";
		$title = "관리자 고객센터";
		$sub_title = "관리자 고객센터";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		
		$book_no = $this->input->get("book_no");
		$quiz_seq = $this->input->get("quiz_seq");		
		
		$info = $this->quiz_model->getQuiz($quiz_seq);
		
		$data['contents'] = "";
		
		if($book_no) {
$data['contents'] = "북퀴즈 관련 문의 및 신고 시 아래 내용을 반드시 기입해 주세요.
 
도서명 : ".$info['book_name']."
출제자 아이디 : ".$info['user_id']." ";
        }

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"data" => $data
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/board/admin-qna-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	
	
	public function adminQnaWriteProc()
	{
		$qna_category = $this->input->post("qna_category");
		$title = $this->input->post("title");
		$contents = $this->input->post("contents");
		$reg_date = date("Y-m-d H:i:s");
		$qna_type= $this->session->userdata("admin_level");

		$data = array(
			"qna_type"	=>	$qna_type,
			"qna_category"	=>	$qna_category,
			"title"	=>	$title,
			"contents"	=>	$contents,
			"reg_date"	=>	$reg_date,
			"status"	=>	"Y",
			"user_id"	=>	$this->session->userdata("admin_id"),
			"user_seq"	=>	$this->session->userdata("admin_seq"),
		);

		$result = $this->board_model->insertQna($data);

		echo '{"result":"success"}';
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
