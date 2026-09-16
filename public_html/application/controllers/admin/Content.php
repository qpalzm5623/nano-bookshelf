<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Content extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("user_model");
        $this->load->model("content_model");
        $this->load->model("code_model");
        $this->load->model("book_model");
        $this->load->model("quiz_model");
        $this->load->model("quizShare_model");
        $this->load->model("quizHistory_model");
        $this->load->model("pointHistory_model");
        
        $this->load->model("bookAssignment_model");
		$this->load->model("school_model");
		$this->load->model("config_model");
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
			$this->eduList();
		}

	}
	
	public function upload_file() 
	{
		$file = $_FILES['file']['name'];
		$file = empty($file) ? "" : $file;
    			    
        $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/quiz/";
        
		if(!empty($file)){
			$file_name = "quiz_".date("Ymdhis")."_".$file;

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

    //도서 리스트
	public function book_list()
	{
		$depth1 = "contents";
		$depth2 = "book_list";
		$title = "도서 등록/조회";
		$sub_title = "도서 등록/조회";

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
		$sort = $this->input->get('sort');
		
		$view_type = $this->input->get('view_type')??"list";
				

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}&searchTermType={$searchTermType}&view_type={$view_type}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&openYn={$openYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}&sort={$sort}";

		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);

		$where = "";
		
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			$where .= " and b.group_name='".$this->session->userdata("group_name")."'";
		}
		
		if($this->session->userdata("admin_level") !=  '0' && $this->session->userdata("admin_level") == "master"){
		    $where .= " and b.user_id='".$this->session->userdata("admin_id")."'";
		}		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($openYn != '') {
		    $where .= " AND a.open_yn='$openYn'";   
		}		
		
		if($subject != "")  {
		    $where .= " AND a.subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND a.recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.book_name like '%".$keyword."%' OR a.book_no like '%".$keyword."%' or a.author like '%".$keyword."%' or a.publisher like '%".$keyword."%'  or a.tags like '%".$keyword."%'  or a.award like '%".$keyword."%' or a.user_id like '%".$keyword."%')";   
		}		
		
		if($quizYn != "")  {
		    if($quizYn == "Y")
		        $where .= " having quiz_cnt > 0";   
		    else
		        $where .= " having quiz_cnt = 0";   
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

		$param = "?searchTermType={$searchTermType}&view_type={$view_type}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&openYn={$openYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}&sort={$sort}&num={$num}";
		$order = " order by a.reg_date desc";
		if($sort != "") {
		    switch($sort) {
		        case "favoriteAsc":
		            $order = " order by a.favorite_cnt asc";            
		        break;
		        case "favoriteDesc":
		            $order = " order by a.favorite_cnt desc";
		        break;		        
		        case "likeAsc":
		            $order = " order by a.like_cnt asc";
		        break;
		        case "likeDesc":
		            $order = " order by a.like_cnt desc";
		        break;		      
		        case "bookAsc":
		            $order = " order by a.quiz_use_cnt asc";
		        break;
		        case "bookDesc":
		            $order = " order by a.quiz_use_cnt desc";
		        break;		      		        
		    }
		}

		$whereData = array(
			"sort"			=>	$order,
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

		$params = "&searchTermType={$searchTermType}&view_type={$view_type}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&openYn={$openYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}&sort={$sort}";
		//$param = "?searchTermType={$searchTermType}&view_type={$view_type}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}&sort={$sort}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		//customSetting
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
			
			$list[$i]['book_cover'] = str_replace(".jpg", "", trim($list[$i]['book_cover'])).".jpg";
			
			switch($list[$i]['recommend_class']) {
			    case 0 :
			        $list[$i]['recommend_class'] = "미취학";
			    break;
			    case 1 :
			        $list[$i]['recommend_class'] = "초1";
			    break;
			    case 2 :
			        $list[$i]['recommend_class'] = "초2";
			    break;
			    case 3 :
			        $list[$i]['recommend_class'] = "초3";
			    break;		    		    
			    case 4 :
			        $list[$i]['recommend_class'] = "초4";
			    break;
			    case 5 :
			        $list[$i]['recommend_class'] = "초5";
			    break;		    		    
			    case 6 :
			        $list[$i]['recommend_class'] = "초6";
			    break;		    
			    case 7 :
			        $list[$i]['recommend_class'] = "중1";
			    break;		    
			    case 8 :
			        $list[$i]['recommend_class'] = "중2";
			    break;
			    case 9 :
			        $list[$i]['recommend_class'] = "중3";
			    break;		    
			}
			

		}
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
			"topicList"=>$topicList,
			"view_type" => $view_type,
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
		$this->parser->parse("admin/contents/book-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	//엑셀 다운로드
	public function bookDownload()
	{

		$this->load->library('excel');

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
		
		$where = "";
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			$where .= " and b.group_name='".$this->session->userdata("group_name")."'";
		}
		
		if($this->session->userdata("admin_level") !=  '0' && $this->session->userdata("admin_level") == "master"){
		    $where .= " and b.user_id='".$this->session->userdata("admin_id")."'";
		}		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($openYn != '') {
		    $where .= " AND a.open_yn='$openYn'";   
		}		
		
		if($subject != "")  {
		    $where .= " AND a.subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND a.recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.book_name like '%".$keyword."%' OR a.book_no like '%".$keyword."%' or a.author like '%".$keyword."%' or a.publisher like '%".$keyword."%'  or a.tags like '%".$keyword."%'  or a.award like '%".$keyword."%' or a.user_id like '%".$keyword."%')";   
		}		
		
		if($quizYn != "")  {
		    if($quizYn == "Y")
		        $where .= " having quiz_cnt > 0";   
		    else
		        $where .= " having quiz_cnt = 0";   
		}		

		$whereData = array(
			"where"			=>	$where,
		);

		$list_total = $this->book_model->getBookTotalCount($whereData);

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 0,".$list_total
		);

		$list = $this->book_model->getBookList($whereData);

		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			//switch($list[$i]['open_yn']){
			//	case "Y":
			//	$list[$i]['open_yn'] = "공개";
			//	break;
			//	case "N":
			//	$list[$i]['open_yn'] = "비공개";
			//	break;
			//}
			//
			//switch($list[$i]['recommend_class']) {
			//    case 0 :
			//        $list[$i]['recommend_class'] = "미취학";
			//    break;
			//    case 1 :
			//        $list[$i]['recommend_class'] = "초1";
			//    break;
			//    case 2 :
			//        $list[$i]['recommend_class'] = "초2";
			//    break;
			//    case 3 :
			//        $list[$i]['recommend_class'] = "초3";
			//    break;		    		    
			//    case 4 :
			//        $list[$i]['recommend_class'] = "초4";
			//    break;
			//    case 5 :
			//        $list[$i]['recommend_class'] = "초5";
			//    break;		    		    
			//    case 6 :
			//        $list[$i]['recommend_class'] = "초6";
			//    break;		    
			//    case 7 :
			//        $list[$i]['recommend_class'] = "중1";
			//    break;		    
			//    case 8 :
			//        $list[$i]['recommend_class'] = "중2";
			//    break;
			//    case 9 :
			//        $list[$i]['recommend_class'] = "중3";
			//    break;		    
			//}			

		}
 

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		
		$this->excel->getActiveSheet()->setCellValue('A1', '그룹명');
		$this->excel->getActiveSheet()->setCellValue('B1', 'BOOK NO');
		$this->excel->getActiveSheet()->setCellValue('C1', '책제목');
		$this->excel->getActiveSheet()->setCellValue('D1', '시리즈명(or 단권)');
		$this->excel->getActiveSheet()->setCellValue('E1', '지은이');
		$this->excel->getActiveSheet()->setCellValue('F1', '출판사');
		$this->excel->getActiveSheet()->setCellValue('G1', 'ISBN');
		$this->excel->getActiveSheet()->setCellValue('H1', '카테고리1');
		$this->excel->getActiveSheet()->setCellValue('I1', '카테고리2');
		$this->excel->getActiveSheet()->setCellValue('J1', '권장학년');
		$this->excel->getActiveSheet()->setCellValue('K1', '출제자');
		
		$this->excel->getActiveSheet()->setCellValue('L1', '주요주제');
		$this->excel->getActiveSheet()->setCellValue('M1', '관련주제');
		$this->excel->getActiveSheet()->setCellValue('N1', '어워드 및 추천');
		$this->excel->getActiveSheet()->setCellValue('O1', '제시질문(생각 꺼내기)');
		$this->excel->getActiveSheet()->setCellValue('P1', '생각담기 번호');
		$this->excel->getActiveSheet()->setCellValue('Q1', '생각담기 별도');
		$this->excel->getActiveSheet()->setCellValue('R1', '책표지');
		$this->excel->getActiveSheet()->setCellValue('S1', '워크시트');
		//$this->excel->getActiveSheet()->setCellValue('T1', '공개여부');


		for($i=0; $i<count($list); $i++){
			$this->excel->getActiveSheet()->setCellValue('A'.($i+2),"G30");
			$this->excel->getActiveSheet()->setCellValue('B'.($i+2),$list[$i]['book_no']);
			$this->excel->getActiveSheet()->setCellValue('C'.($i+2),$list[$i]['book_name']);
			$this->excel->getActiveSheet()->setCellValue('D'.($i+2),$list[$i]['serise']);
			$this->excel->getActiveSheet()->setCellValue('E'.($i+2),$list[$i]['author']);
			$this->excel->getActiveSheet()->setCellValue('F'.($i+2),$list[$i]['publisher']);
			$this->excel->getActiveSheet()->setCellValue('G'.($i+2),$list[$i]['isbn']);
			$this->excel->getActiveSheet()->setCellValue('H'.($i+2),$list[$i]['category']);
			$this->excel->getActiveSheet()->setCellValue('I'.($i+2),$list[$i]['sub_category']);
			$this->excel->getActiveSheet()->setCellValue('J'.($i+2),$list[$i]['recommend_class']);
			$this->excel->getActiveSheet()->setCellValue('K'.($i+2),$list[$i]['user_id']);
			
			$this->excel->getActiveSheet()->setCellValue('L'.($i+2),$list[$i]['subject']);
			$this->excel->getActiveSheet()->setCellValue('M'.($i+2),$list[$i]['tags']);
			$this->excel->getActiveSheet()->setCellValue('N'.($i+2),$list[$i]['award']);
			$this->excel->getActiveSheet()->setCellValue('O'.($i+2),$list[$i]['think_title']);
			$this->excel->getActiveSheet()->setCellValue('P'.($i+2),$list[$i]['think_quiz_seq']);
			
			$this->excel->getActiveSheet()->setCellValue('Q'.($i+2),$list[$i]['think_quiz']);			
			
			
			$this->excel->getActiveSheet()->setCellValue('R'.($i+2),$list[$i]['book_cover']);
			$this->excel->getActiveSheet()->setCellValue('S'.($i+2),$list[$i]['worksheet']);						
			//$this->excel->getActiveSheet()->setCellValue('T'.($i+2),$list[$i]['open_yn']);
		}

		$this->excel->setActiveSheetIndex(0);

		$title = "도서 리스트_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}		
	
	public function fileDownload($book_no)
	{	
        if($book_no == "") {
            echo '<script>alert("정보가 없습니다.");history.go(-1);</script>';
            exit;            
        }	    
	    $data = $this->book_model->getBook($book_no);
	    $file = $data['worksheet'];
	    $target_Dir = $_SERVER['DOCUMENT_ROOT']."/upload/book/";
        $down = $target_Dir.$file;

        $filesize = filesize($down);

        if(file_exists($down) == false){
            echo '<script>alert("파일이 없습니다.");history.go(-1);</script>';
            exit;            
        }
        if(strstr(strtolower($file),"pdf") == false) {
            echo '<script>alert("PDF만 가능합니다.");history.go(-1);</script>';
            exit;            
        }
                
        if(file_exists($down)){
            header("Content-Type:application/octet-stream");
            header("Content-Disposition:attachment;filename=$file");
            header("Content-Transfer-Encoding:binary");
            header("Content-Length:".filesize($target_Dir.$file));
            header("Cache-Control:cache,must-revalidate");
            header("Pragma:no-cache");
            header("Expires:0");
            if(is_file($down)){
                $fp = fopen($down,"r");
                while(!feof($fp)){
                  $buf = fread($fp,8096);
                  $read = strlen($buf);
                  print($buf);
                  flush();
                }
                fclose($fp);
            }
        } else{
            echo '<script>alert("존재하지 않는 파일입니다.");history.go(-1);</script>';
            exit;
        }
        $this->goURL("book_list");
        exit;
    }
	
    //퀴즈 리스트
	public function quiz_list()
	{
		$depth1 = "contents";
		$depth2 = "quiz_list";
		
		$confirm_yn = $this->input->get('confirm_yn')??"N";
		
		if($this->session->userdata("admin_level") !=  '0' &&$this->session->userdata("admin_level") == "master"){
		    if($confirm_yn == "N") {
		        $title = "심사 대기중";
		        $sub_title = "심사 대기중";
		    } else if($confirm_yn == "Y") {
		        $title = "승인 완료";
		        $sub_title = "승인 완료";
		    } else if($confirm_yn == "X") {
		        $title = "승인 거부";
		        $sub_title = "승인 거부";
		    } 
	    } else {
		    $title = "북퀴즈 등록/조회";
		    $sub_title = "북퀴즈 등록/조회";
	    }

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');
		$openYn = $this->input->get('openYn');
		$view_type = $this->input->get('view_type');
		
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

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}&srcN={$srcN}&category={$category}&confirm_yn={$confirm_yn}&status=&searchTermType={$searchTermType}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&openYn={$openYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}";

		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);

		$where = "";
		
		if(!empty($this->session->userdata("group_name"))){
		    if($view_type == "Y") {
    			$admin_group_name = $this->session->userdata("group_name");
    			$srcN = addslashes($srcN);
    			//$where .= "AND edu_title LIKE '%{$srcN}%'";
    			$where .= " and c.group_name='".$this->session->userdata("group_name")."'";
    		} else {
    		    $where .= " and (c.group_name='".$this->session->userdata("group_name")."' OR a.status='Y') ";
    		}
		}		
		
		if($this->session->userdata("admin_level") !=  '0' && $this->session->userdata("admin_level") == "master"){
		    $where .= " and a.user_id='".$this->session->userdata("admin_id")."'";
		        
		    $where .= " and a.confirm_yn='".$confirm_yn."'";
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($openYn != '') {
		    $where .= " AND b.open_yn='$openYn'";   
		}				
		
		if($subject != "")  {
		    $where .= " AND b.subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND b.recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (b.book_name like '%".$keyword."%' OR b.book_no like '%".$keyword."%' or b.author like '%".$keyword."%' or b.publisher like '%".$keyword."%'  or b.tags like '%".$keyword."%'  or b.award like '%".$keyword."%' or a.user_id like '%".$keyword."%' or c.user_name like '%".$keyword."%' or c.group_name like '%".$keyword."%' )";   
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

		$params = "&srcN={$srcN}&category={$category}&confirm_yn={$confirm_yn}&status=&searchTermType={$searchTermType}&startDate={$startDate}&endDate={$endDate}&quizYn={$quizYn}&openYn={$openYn}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
		
		//customSetting
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
                case "admin":
                    $list[$i]['user_type'] = "관리자";
                break;                
            }     			    

		}
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	@$list,
			"confirm_yn"=>$confirm_yn,
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
		if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){
		    $this->parser->parse("admin/contents/quiz-list-master",$content_data);
	    } else {
	        $this->parser->parse("admin/contents/quiz-list",$content_data);
	    }

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	

    //퀴즈 리스트
	public function quiz_share()
	{
		$depth1 = "contents";
		$depth2 = "quizShare";
		$title = "내 비공개 북퀴즈 공유하기";
		$sub_title = "내 비공개 북퀴즈 공유하기";
 
        $params = "";
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"depth2"		=>	$depth2,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"			=>	$params
		);
		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/quiz-share",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}			
		
    //퀴즈 리스트
	public function quiz_share_list()
	{
		$depth1 = "contents";
		$depth2 = "quizShare";
		$title = "내 비공개 북퀴즈 공유하기";
		$sub_title = "내 비공개 북퀴즈 공유하기";

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


		$where = "";
		
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			$where .= " and a.user_id='".$this->session->userdata("admin_id")."'";
		}		
 	
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (a.share_user_id like '%".$keyword."%' OR c.user_name like '%".$keyword."%' or c.cell_no like '%".$keyword."%' )";   
		}			

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizShare_model->getQuizShareGroupTotalCount($whereData);

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

		$list = $this->quizShare_model->getQuizShareGroupList($whereData);

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

		$params = "&srcN={$srcN}&keyword={$keyword}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
		
		//customSetting
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
		$this->parser->parse("admin/contents/quiz-share-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
	
    //퀴즈 리스트
	public function book_assign()
	{
		$depth1 = "contents";
		$depth2 = "bookAssign";
		$title = "도서 배정";
		$sub_title = "도서 배정";
 
        $params = "";
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"depth2"		=>	$depth2,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"			=>	$params
		);
		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/book-assign",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}				
	
	public function quiz_share_list_popup($user_id)
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

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		


		$where = " and a.user_id='".$this->session->userdata("admin_id")."' and a.share_user_id='$user_id'";

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizShare_model->getQuizShareTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	"order by a.reg_date desc",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$list = $this->quizShare_model->getQuizShareList($whereData);

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

			switch($list[$i]['open_yn']){
				case "Y":
				$list[$i]['open_yn'] = "공개";
				break;
				case "N":
				$list[$i]['open_yn'] = "비공개";
				break;
			}
			

			if($list[$i]['worksheet'] != "" )
			    $list[$i]['worksheet'] = "O";
			else 
			    $list[$i]['worksheet'] = "X";

		}
        $data = $this->user_model->getUserData($user_id);
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"data"	=>	$data,
			"list"	=>	$list,
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
		$this->parser->parse("admin/contents/quiz-share-list-pop",$content_data);

	}	

	public function book_assign_list_popup($user_id, $reg_date)
	{
		$depth1 = "content";
		$depth2 = "bookAssignList";
		$title = "도서 목록";
		$sub_title = "도서 목록";
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		$reg_date = urldecode($reg_date);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		


		$where = " AND a.user_id='$user_id' and a.reg_date='{$reg_date}'";

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->bookAssignment_model->getBookAssignmentTotalCount($whereData);

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

		$list = $this->bookAssignment_model->getBookAssignmentHistoryList($whereData);

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
			$list[$i]['quiz_reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			switch($list[$i]['open_yn']){
				case "Y":
				$list[$i]['open_yn'] = "공개";
				break;
				case "N":
				$list[$i]['open_yn'] = "비공개";
				break;
			}
			
			
			

			if($list[$i]['worksheet'] != "" )
			    $list[$i]['worksheet'] = "O";
			else 
			    $list[$i]['worksheet'] = "X";

		}
        $data = $this->user_model->getUserData($user_id);
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"data"	=>	$data,
			"list"	=>	$list,
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
		$this->parser->parse("admin/contents/book-assign-list-pop",$content_data);


	}	
		
	//퀴즈 리스트
	public function book_assign_list()
	{
		$depth1 = "contents";
		$depth2 = "bookAssignList";
		$title = "도서 배정 인증 현황";
		$sub_title = "도서 배정 인증 현황";

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
		
		$class = $this->input->get('class');
		
				

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";

		
		$where = "";
		$whereData = "";
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			$where .= " and a.group_name='".$this->session->userdata("group_name")."'";
			
			$whereData .= " and a.group_name='".$this->session->userdata("group_name")."'";
		}		
		
		$whereData = array("where" => $whereData);
		$classList = $this->user_model->getUserClassList($whereData);		
 	

		if($class != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND c.class_name = '".$class."' ";   
		}			
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND ( c.user_name like '%".$keyword."%' or c.user_id like '%".$keyword."%') ";   
		}			
		
		

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->bookAssignment_model->getBookAssignmentGroupTotalCount($whereData);

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

		$list = $this->bookAssignment_model->getBookAssignmentGroupList($whereData);

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
		
		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			//$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));
			$list[$i]['quiz_reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

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
			"list"	=>	@$list,
			"classList" => $classList,
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
		$this->parser->parse("admin/contents/book-assign-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
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
			    //case "10":
			    //    $data['grade'] = "고1";
			    //break;			    
			    //case "11":
			    //    $data['grade'] = "고2";
			    //break;			    
			    //case "12":
			    //    $data['grade'] = "고3";
			    //break;			    			    
			}		
		// 선생님 정보
		$teacherWhere = array(
		                    "group_name" => $data['group_name'],
		                    "class_name" => $data['class_name'],
		                );
		$teacherData = $this->user_model->getTeacherData($teacherWhere);
		// 선생님 정보
		$data['teacher_name'] = $teacherData['user_name'];
		
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
			    //case "10":
			    //    $list[$i]['grade'] = "고1";
			    //break;			    
			    //case "11":
			    //    $list[$i]['grade'] = "고2";
			    //break;			    
			    //case "12":
			    //    $list[$i]['grade'] = "고3";
			    //break;			    			    
			}

		}	
		for($i=0;$i <count($questionList);$i++) {
		    $questionCodeList[$questionList[$i]['code_type']] = $questionList[$i]['code_name'];
		}	
		 
		$topic = @json_decode($data['topic']);
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
            "data" =>  $data,
            "questionList" =>$questionCodeList,
            "info" =>  $info,
            "qh_seq"=>$seq,
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
		$this->parser->parse("admin/contents/quiz-result-pop",$content_data);


	}		
	
    public function quiz_portfolio_pop($user_id="")
	{
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
	    
		}		
		// 선생님 정보
		$teacherWhere = array(
		                    "group_name" => $data['group_name'],
		                    "class_name" => $data['class_name'],
		                );
		$teacherData = $this->user_model->getTeacherData($teacherWhere);
		// 선생님 정보
		$data['teacher_name'] = $teacherData['user_name'];
		
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
			    //case "10":
			    //    $list[$i]['grade'] = "고1";
			    //break;			    
			    //case "11":
			    //    $list[$i]['grade'] = "고2";
			    //break;			    
			    //case "12":
			    //    $list[$i]['grade'] = "고3";
			    //break;			    			    
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
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/contents/quiz-portfolio-pop",$content_data);


	}			
	
    //퀴즈 리스트
	public function quiz_share_mylist()
	{
		$depth1 = "contents";
		$depth2 = "quizShareMyList";
		$title = "내가 공유 받은 북퀴즈";
		$sub_title = "내가 공유 받은 북퀴즈";

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
		
		if(!empty($this->session->userdata("group_name"))){
			$admin_group_name = $this->session->userdata("group_name");
			$srcN = addslashes($srcN);
			//$where .= "AND edu_title LIKE '%{$srcN}%'";
			//$where .= " and c.group_name='".$this->session->userdata("group_name")."'";
			$where .= " and a.share_user_id='".$this->session->userdata("admin_id")."'";
		}		

		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($subject != "")  {
		    $where .= " AND b.subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND b.recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (b.book_name like '%".$keyword."%' OR b.book_no like '%".$keyword."%' or b.author like '%".$keyword."%' or b.publisher like '%".$keyword."%'  or b.tags like '%".$keyword."%'  or b.award like '%".$keyword."%' or d.user_id like '%".$keyword."%')";   
		}			

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizShare_model->getQuizShareTotalCount($whereData);

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

		$list = $this->quizShare_model->getQuizShareList($whereData);

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

		$params = "&searchTermType={$searchTermType}&startDate={$startDate}&endDate={$endDate}&subject={$subject}&recommendClass={$recommendClass}&keyword={$keyword}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
		
		//customSetting
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
			"list"	=>	@$list,
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
		$this->parser->parse("admin/contents/quiz-share-mylist",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
	
	//엑셀 다운로드
	public function quizDownload()
	{

		$this->load->library('excel');

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
		
		$where = "";
		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";

		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);

		$where = "";
/*
		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			$where .= "AND edu_title LIKE '%{$srcN}%'";
		}

		if($searchTermType == 'term') {
		    $where .= " AND reg_date>='$startDate' AND reg_date<='$endDate 23:59:59' ";   
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
		}		*/
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);

		$where = "";
		
		if(!empty($this->session->userdata("group_name"))){
		    if(@$view_type == "Y") {
    			$admin_group_name = $this->session->userdata("group_name");
    			$srcN = addslashes($srcN);
    			//$where .= "AND edu_title LIKE '%{$srcN}%'";
    			$where .= " and c.group_name='".$this->session->userdata("group_name")."'";
    		} else {
    		    $where .= " and (c.group_name='".$this->session->userdata("group_name")."' OR a.status='Y') ";
    		}
		}		
		
		if($this->session->userdata("admin_level") !=  '0' && $this->session->userdata("admin_level") == "master"){
		    $where .= " and a.user_id='".$this->session->userdata("admin_id")."'";
		        
		    $where .= " and a.confirm_yn='".$confirm_yn."'";
		}
		
		if($searchTermType == 'term') {
		    $where .= " AND a.reg_date>='$startDate' AND a.reg_date<='$endDate 23:59:59' ";   
		}
		
		if($openYn != '') {
		    $where .= " AND b.open_yn='$openYn'";   
		}				
		
		if($subject != "")  {
		    $where .= " AND b.subject='$subject'";   
		}		
		
		if($recommendClass != "")  {
		    $where .= " AND b.recommend_class='$recommendClass'";   
		}		
		
		if($keyword != "")  {
		    // 아이디, 이름, 휴대폰번호, 소속명
		    $where .= " AND (b.book_name like '%".$keyword."%' OR b.book_no like '%".$keyword."%' or b.author like '%".$keyword."%' or b.publisher like '%".$keyword."%'  or b.tags like '%".$keyword."%'  or b.award like '%".$keyword."%' or a.user_id like '%".$keyword."%' or c.user_name like '%".$keyword."%' or c.group_name like '%".$keyword."%' )";   
		}					

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quiz_model->getQuizTotalCount($whereData);
/*
		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );


		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$list = $this->quiz_model->getQuizList($whereData);		
		

		$whereData = array(
			"where"			=>	$where,
		);
		
		

		$list_total = $this->quiz_model->getQuizTotalCount($whereData);
*/
		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	""
		);

		$list = $this->quiz_model->getQuizList($whereData);		

		//customSetting
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
 

		// 워크시트 1번째는 활성화
		$this->excel->setActiveSheetIndex(0);

		// A1의 내용을 입력
		
		$this->excel->getActiveSheet()->setCellValue('A1', '그룹명');
		$this->excel->getActiveSheet()->setCellValue('B1', 'BOOK NO');
		$this->excel->getActiveSheet()->setCellValue('C1', '책제목');
		$this->excel->getActiveSheet()->setCellValue('D1', '문제');
		$this->excel->getActiveSheet()->setCellValue('E1', '보기1');
		$this->excel->getActiveSheet()->setCellValue('F1', '보기2');
		$this->excel->getActiveSheet()->setCellValue('G1', '보기3');
		$this->excel->getActiveSheet()->setCellValue('H1', '보기4');
		$this->excel->getActiveSheet()->setCellValue('I1', '보기5');
		$this->excel->getActiveSheet()->setCellValue('J1', '정답');
		$this->excel->getActiveSheet()->setCellValue('K1', '순번');
		
		$this->excel->getActiveSheet()->setCellValue('L1', '문제타입(C:객관식,S:주관식)');
		$this->excel->getActiveSheet()->setCellValue('M1', '문제수');
		$this->excel->getActiveSheet()->setCellValue('N1', '보기수');
		
		$rows = 0;
		for($i=0; $i<count($list); $i++){
		    $quiz = unserialize($list[$i]['quiz_contents']);
		    
		    for($j=1; $j<=$list[$i]['quiz_cnt']; $j++){
		        $bogi_cnt = 0;
		        if($quiz['c1'][$j] != "")  $bogi_cnt =1;
		        if($quiz['c2'][$j] != "")  $bogi_cnt =2;
		        if($quiz['c3'][$j] != "")  $bogi_cnt =3;
		        if($quiz['c4'][$j] != "")  $bogi_cnt =4;
		        if($quiz['c5'][$j] != "")  $bogi_cnt =5;
    			$this->excel->getActiveSheet()->setCellValue('A'.($rows+2),"G30");
    			$this->excel->getActiveSheet()->setCellValue('B'.($rows+2),$list[$i]['book_no']);
    			$this->excel->getActiveSheet()->setCellValue('C'.($rows+2),$list[$i]['book_name']);
    			
    			$this->excel->getActiveSheet()->setCellValue('D'.($rows+2),$quiz['q'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('E'.($rows+2),$quiz['c1'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('F'.($rows+2),$quiz['c2'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('G'.($rows+2),$quiz['c3'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('H'.($rows+2),$quiz['c4'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('I'.($rows+2),$quiz['c5'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('J'.($rows+2),$quiz['a'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('K'.($rows+2),$j);
    			
    			$this->excel->getActiveSheet()->setCellValue('L'.($rows+2),$quiz['type'][$j]);
    			$this->excel->getActiveSheet()->setCellValue('M'.($rows+2),$list[$i]['quiz_cnt']);
    			$this->excel->getActiveSheet()->setCellValue('N'.($rows+2),$bogi_cnt);
    			
    			
    			$rows++;
    		}
			
		}
		

		$this->excel->setActiveSheetIndex(0);

		$title = "퀴즈 리스트_".date("Ymd").".xls";

		$filename = iconv("UTF-8", "EUC-KR", $title); // 엑셀 파일 이름

		header('Content-Type: application/vnd.ms-excel'); //mime 타입
		header('Content-Disposition: attachment;filename="'.$filename.'"'); // 브라우저에서 받을 파일 이름
		header('Cache-Control: max-age=0'); //no cache


		// Excel5 포맷으로 저장 엑셀 2007 포맷으로 저장하고 싶은 경우 'Excel2007'로 변경합니다.
		$objWriter = PHPExcel_IOFactory::createWriter($this->excel, 'Excel5');
		// 서버에 파일을 쓰지 않고 바로 다운로드 받습니다.
		$objWriter->save('php://output');
	}			
	
    //퀴즈 결과 리스트
	public function quiz_result_list()
	{
		$depth1 = "contents";
		$depth2 = "quiz_result_list";
		$title = "북퀴즈 이력/결과";
		$sub_title = "북퀴즈 이력/결과";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		
		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');		
		$keyword = $this->input->get('keyword');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";


		$where = "";
		
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
		    $where .= " AND (b.user_id like '%".$keyword."%' OR b.group_name like '%".$keyword."%' or b.user_name like '%".$keyword."%' or c.book_name like '%".$keyword."%'  )";   
		}			

		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizHistory_model->getQuizHistoryTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$params = "&category={$category}&page_size={$page_size}&keyword={$keyword}&startDate={$startDate}&endDate={$endDate}&searchTermType={searchTermType}";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$list = $this->quizHistory_model->getQuizHistoryAdminList($whereData);

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

		$params = "&srcN={$srcN}&category={$category}&keyword={$keyword}&startDate={$startDate}&endDate={$endDate}&searchTermType={searchTermType}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
		
		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d H:i",strtotime($list[$i]['reg_date']));

			switch(@$list[$i]['status']){
				case "Y":
				    $list[$i]['status'] = "공개";
				break;
				case "N":
				    $list[$i]['status'] = "비공개";
				break;
			}
			
			if(@$list[$i]['worksheet'] != "" )
			    $list[$i]['worksheet'] = "O";
			else 
			    $list[$i]['worksheet'] = "X";
			    
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
                case "admin":
                    $list[$i]['user_type'] = "관리자";
                break;                
            } 			    

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
		$this->parser->parse("admin/contents/quiz_result_list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}		
	
    //퀴즈 결과 리스트
	public function quiz_portfolio()
	{
		$depth1 = "contents";
		$depth2 = "quiz_portfolio";
		$title = "북퀴즈 포트폴리오";
		$sub_title = "북퀴즈 포트폴리오";

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$searchTermType = $this->input->get('searchTermType');
		$startDate = $this->input->get('startDate');
		$endDate = $this->input->get('endDate');		
		$keyword = $this->input->get('keyword');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";


		$where = "";
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
		    $where .= " AND (b.user_name like '%".$keyword."%' or b.user_id like '%".$keyword."%' )";   
		}			

        $where .= " AND a.score >= 60";
		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizHistory_model->getQuizHistoryPortfolioTotalCount($whereData);

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

		$list = $this->quizHistory_model->getQuizHistoryPortfolioList($whereData);

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
		
		//customSetting
		for($i = 0; $i < count($list); $i++)
		{
			$list[$i]['reg_date'] = date("Y-m-d",strtotime($list[$i]['reg_date']));

			switch(@$list[$i]['status']){
				case "Y":
				$list[$i]['status'] = "공개";
				break;
				case "N":
				$list[$i]['status'] = "비공개";
				break;
			}
			
			if(@$list[$i]['worksheet'] != "" )
			    $list[$i]['worksheet'] = "O";
			else 
			    $list[$i]['worksheet'] = "X";

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
		$this->parser->parse("admin/contents/quiz_portfolio",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}			

	//상태변경
	public function updateEduDisplay()
	{
		$edu_display_yn = $this->input->post("edu_display_yn");
		$chk = $this->input->post("chk");

		for($i=0; $i<count($chk); $i++){
			$this->content_model->updateEduDisplay($chk[$i],$edu_display_yn);
		}

		echo '{"result":"success"}';
		exit;
	}

	//교육정보 작성
	public function book_write($book_no = "")
	{
		$depth1 = "contents";
		$depth2 = "book_list";
		$title = "도서 등록/조회";
		$sub_title = "도서 등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		
		$data = $this->book_model->getBook($book_no);

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);
		
		$whereData = array("where" => " and code_group='question'", "limit" => "limit 50");
		
		$questionList = $this->code_model->getCodeList($whereData);		

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,              
			"data"          =>  $data,
			"topicList"     =>  $topicList,
			"questionList"  => $questionList,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/book-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	// 알라딘 & 서지정보 API 연동 ISBN 도서정보 자동 조회
	public function searchIsbnAladin()
	{
		$isbn = trim($this->input->post("isbn"));
		$isbn = preg_replace("/[^0-9]/", "", $isbn);

		if(empty($isbn)){
			echo json_encode(array("result" => "failed", "msg" => "ISBN을 입력해 주세요."), JSON_UNESCAPED_UNICODE);
			exit;
		}

		// 알라딘 ItemLookUp Open API
		$ttbKey = "ttbkey_placeholder";
		$aladinUrl = "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=" . $ttbKey . "&itemIdType=ISBN13&ItemId=" . $isbn . "&output=js&Version=20131101&Cover=Big";

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $aladinUrl);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
		curl_setopt($ch, CURLOPT_TIMEOUT, 8);
		$response = curl_exec($ch);
		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		$bookData = null;
		if($response && $httpCode == 200){
			$json = json_decode($response, true);
			if(!empty($json['item'][0])){
				$item = $json['item'][0];
				$bookData = array(
					"book_name" => html_entity_decode(@$item['title'], ENT_QUOTES, 'UTF-8'),
					"author"    => html_entity_decode(@$item['author'], ENT_QUOTES, 'UTF-8'),
					"publisher" => html_entity_decode(@$item['publisher'], ENT_QUOTES, 'UTF-8'),
					"serise"    => html_entity_decode(@$item['seriesInfo']['seriesName'] ?? '', ENT_QUOTES, 'UTF-8'),
					"cover_url" => @$item['cover']
				);
			}
		}

		// 국립중앙도서관 서지정보 API fallback
		if(empty($bookData)){
			$nlUrl = "https://www.nl.go.kr/NL/search/openApi/search.do?key=f492211910cf93b0b75960010041a63c64c58cf3511eb0c8789d28e75294e637&apiType=json&srchTarget=total&kwd=" . $isbn;
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $nlUrl);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
			curl_setopt($ch, CURLOPT_TIMEOUT, 8);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			$nlResponse = curl_exec($ch);
			curl_close($ch);

			if($nlResponse){
				$nlJson = json_decode($nlResponse, true);
				if(!empty($nlJson['result'][0])){
					$item = $nlJson['result'][0];
					$bookData = array(
						"book_name" => @$item['titleInfo'],
						"author"    => @$item['authorInfo'],
						"publisher" => @$item['pubInfo'],
						"serise"    => "",
						"cover_url" => @$item['imageUrl']
					);
				}
			}
		}

		if(!empty($bookData)){
			$savedCoverName = "";
			if(!empty($bookData['cover_url'])){
				$upload_path = $_SERVER['DOCUMENT_ROOT'] . "/upload/book/";
				if(!is_dir($upload_path)){
					@mkdir($upload_path, 0777, true);
				}
				$imgData = @file_get_contents($bookData['cover_url']);
				if($imgData){
					$savedCoverName = "book_isbn_" . date("YmdHis") . "_" . $isbn . ".jpg";
					@file_put_contents($upload_path . $savedCoverName, $imgData);
				}
			}

			echo json_encode(array(
				"result"     => "success",
				"book_name"  => $bookData['book_name'],
				"author"     => $bookData['author'],
				"publisher"  => $bookData['publisher'],
				"serise"     => $bookData['serise'],
				"book_cover" => $savedCoverName
			), JSON_UNESCAPED_UNICODE);
			exit;
		}

		echo json_encode(array("result" => "failed", "msg" => "해당 ISBN의 도서 정보를 찾을 수 없습니다."), JSON_UNESCAPED_UNICODE);
		exit;
	}

	//교육자료 작성
	public function bookWriteProc()
	{
	    
	    //ci_csrf_token=1c8dc3b88850f10cdc8d8401f5a28dae
	    $mode=$this->input->post("mode");
	    $status=$this->input->post("status");
	    $book_no=$this->input->post("book_no");
	    $book_no_org=$this->input->post("book_no_org");
	    $book_name=$this->input->post("book_name");
	    $serise=$this->input->post("serise");
	    $author=$this->input->post("author");
	    $publisher=$this->input->post("publisher");
	    $isbn=$this->input->post("isbn");
	    $category=$this->input->post("category");
	    $sub_category=$this->input->post("sub_category");
	    $subject=$this->input->post("subject");
	    $tags=$this->input->post("tags");
	    $recommend_class=$this->input->post("recommend_class");
	    $recommend_yn=$this->input->post("recommend_yn");
	    $award=$this->input->post("award");
	    $think_title=$this->input->post("think_title");
	    $think_quiz_seq=$this->input->post("think_quiz_seq");
	    $think_quiz=$this->input->post("think_quiz");
	    
	    $think_quiz_direct=$this->input->post("think_quiz_direct");
	    $think_quiz_yn=$this->input->post("think_quiz_yn");
	    
	    $params=$this->input->post("params");
	    $copy=$this->input->post("copy");
	    $memo=$this->input->post("memo");
	    
	    if($mode == "INSERT") {
    	    
    		//중복 체크
    		$info = $this->book_model->getBook($book_no);	    
    		if($info != "") {
        		echo '{"result":"faild", "msg":"이미 중복된 데이터가 있습니다"}';
        		exit;    		    
    		}
    	    
    	    $book_cover_copy = $this->input->post("book_cover_copy");
    	    
    		$book_cover = $_FILES['book_cover']['name'];
    		$book_cover = empty($book_cover) ? "" : $book_cover;
    		
    		if(empty($book_cover) && !empty($book_cover_copy) ) $book_cover = $book_cover_copy;

    		// 표지 필수 검증: 표지 없으면 등록 불가
    		if(empty($book_cover)){
        		echo '{"result":"faild", "msg":"책 표지 이미지는 필수입니다. 표지 이미지를 등록해 주세요."}';
        		exit;
    		}
    		
    		$worksheet = $_FILES['worksheet']['name'];
    		$worksheet = empty($worksheet) ? "" : $worksheet;		
    		
            $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/book/";
            
    		if(!empty($book_cover)){
    			$file_name = "book_".date("Ymdhis")."_".$book_cover;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["book_cover"]["tmp_name"],$upload_path.$file_name);

    			$book_cover = $file_name;
    		}
    		
    		if(!empty($worksheet)){
    			$file_name = "book_".date("Ymdhis")."_".$worksheet;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["worksheet"]["tmp_name"],$upload_path.$file_name);

    			$worksheet = $file_name;
    		}		
    		$book_cover = $book_cover?$book_cover:$book_cover_copy;

    		$data = array(
    			"book_no" => $book_no,
    			"book_name" => $book_name,
    			"serise" => $serise,
    			"author" => $author,
    			"publisher" => $publisher,
    			"isbn" => $isbn,
    			"category" => $category,
    			"sub_category" => $sub_category,
    			"subject" => $subject,
    			"tags" => $tags,
    			"recommend_class" => $recommend_class,
    			"award" => $award,
    			"think_title" => $think_title,
    			"think_quiz_seq" => $think_quiz_seq,
    			"think_quiz" => $think_quiz,
    			"think_quiz_direct" => $think_quiz_direct,
    			"think_quiz_yn" => $think_quiz_yn,
    			"status"=>$status,
    			"favorite_cnt" => 0,
    			"like_cnt" => 0,
    			"quiz_use_cnt" => 0,
    			"open_yn" => $status,
    			"quiz_yn" => "N",
    			"recommend_yn"=>$recommend_yn,
    			"book_cover" => $book_cover,
    			"worksheet" => $worksheet,
    			"memo" => $memo,
    			"reg_date"	=> date("Y-m-d H:i:s"),
    			"user_id"	=>	$this->session->userdata("admin_id"),
    		);
    		


    		$result = $this->book_model->insertBook($data);
    		if($copy == "Y") {
    		    $this->msg("퀴즈 생성을 위해 동일한 책이 새롭게 등록되었습니다.");
    		}
    		$this->goURL("/admin/content/book_list");
    		exit;
    	} else {
    	    $info = $this->book_model->getBook($book_no);	    
    	    
    		$book_cover = $_FILES['book_cover']['name'];
    		$worksheet = $_FILES['worksheet']['name'];
    		$book_cover = empty($book_cover) ? "" : $book_cover;
    		$worksheet = empty($worksheet) ? "" : $worksheet;		
    		
            $upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/book/";
            
    		if(!empty($book_cover)){
    			$file_name = "book_".date("Ymdhis")."_".$book_cover;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["book_cover"]["tmp_name"],$upload_path.$file_name);

    			$book_cover = $file_name;
    		}
    		
    		if(!empty($worksheet)){
    			$file_name = "book_".date("Ymdhis")."_".$worksheet;

    			@unlink($upload_path.$file_name);

    			if( !is_dir($upload_path) ){
    				mkdir($upload_path,0777,true);
    			}

    			move_uploaded_file($_FILES["worksheet"]["tmp_name"],$upload_path.$file_name);

    			$worksheet = $file_name;
    		}		
    		$book_cover = empty($book_cover) ? $info['book_cover'] : $book_cover;
    		$worksheet = empty($worksheet) ? $info['worksheet'] : $worksheet;		    		

    	    $book_cover_copy = $this->input->post("book_cover_copy");
    		if(empty($book_cover) && !empty($book_cover_copy) ) $book_cover = $book_cover_copy;    		
    		//$book_cover = $book_cover?$book_cover:$book_cover_copy;

    		$data = array(
    			"book_name" => $book_name,
    			"serise" => $serise,
    			"author" => $author,
    			"publisher" => $publisher,
    			"isbn" => $isbn,
    			"category" => $category,
    			"sub_category" => $sub_category,
    			"subject" => $subject,
    			"status"=>$status,
    			"open_yn" => $status,
    			"tags" => $tags,
    			"recommend_class" => $recommend_class,
    			"recommend_yn"=>$recommend_yn,
    			"award" => $award,
    			"think_title" => $think_title,
    			"think_quiz_seq" => $think_quiz_seq,
    			"think_quiz" => $think_quiz,
    			"think_quiz_direct" => $think_quiz_direct,
    			"think_quiz_yn" => $think_quiz_yn,
    			"book_cover" => $book_cover,
    			"worksheet" => $worksheet,
    			"memo" => $memo,
    			"book_no"=>$book_no
    		);
    		
    		


    		$result = $this->book_model->updateBook($data, $book_no_org);
    		$this->goURL("/admin/content/book_list?".urldecode($params));
    		exit;
    	}

		exit;
	}
	
	//퀴즈정보 작성
	public function quiz_write($seq = "")
	{
		$depth1 = "contents";
		if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){
		    $depth2 = "quiz_write";
	    } else {
	        $depth2 = "quiz_list";    
	    }
		$title = "북퀴즈 등록/조회";
		$sub_title = "북퀴즈 등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		
		$data = $this->quiz_model->getQuiz($seq);

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);
		
		$whereData = array("where" => " and code_group='question'", "limit" => "limit 50");
		
		$questionList = $this->code_model->getCodeList($whereData);		

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,              
			"data"          =>  $data,
			"topicList"     =>  $topicList,
			"questionList"  => $questionList,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/quiz-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
	//퀴즈정보 작성
	public function quiz_popup($book_no="", $seq = "")
	{
		$depth1 = "contents";
		if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){
		    $depth2 = "quiz_write";
	    } else {
	        $depth2 = "quiz_list";    
	    }
		$title = "북퀴즈 등록/조회";
		$sub_title = "북퀴즈 등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		
		$data = $this->quiz_model->getQuiz($seq);

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";
		
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		
		$topicList = $this->code_model->getCodeList($whereData);
		
		$whereData = array("where" => " and code_group='question'", "limit" => "limit 50");
		
		$questionList = $this->code_model->getCodeList($whereData);		

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,              
			"data"          =>  $data,
			"topicList"     =>  $topicList,
			"questionList"  => $questionList,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/contents/quiz-popup",$content_data);


	}	
	
	public function bookNoGenProc()
	{
	    $category=@$this->input->post("category");
	    $sub_category=@$this->input->post("sub_category");
	    
	    $recommend_class = @$this->input->post("recommend_class");
	    $book_no = $category.$sub_category.$recommend_class;
	    
	    $result = $this->book_model->getBookMax($book_no);
	    if(@$result['book_no'] == "") {
	        $book_no = $book_no.sprintf("%05d", 1);
	    } else {
	        $book_no = $book_no.sprintf("%05d", (substr($result['book_no'], -5)*1)+1 );
	    }
	    
	    echo '{"result":"success", "msg":"완료.","book_no":"'.$book_no.'"}';   
	    exit;
	}
	
	//퀴즈자료 작성
	public function quizWriteProc()
	{
	    
	    //ci_csrf_token=1c8dc3b88850f10cdc8d8401f5a28dae
	    
	    $mode=@$this->input->post("mode");
	    $quiz_seq=@$this->input->post("quiz_seq");
	    $book_no=$this->input->post("book_no");
	    $book_name=$this->input->post("book_name");
	    $status=$this->input->post("status");
	    
	    $q=$this->input->post("q");
	    $cnt = count($q['type']);
	    $q = serialize($q);
	    
	    
	    
	    if($mode == "INSERT" || $mode == "") {
    	    
    		//중복 체크
    		if($book_no == "") {
        		echo '{"result":"faild", "msg":"정보를 입력해 주세요."}';
        		exit;    		    
    		}
    		if($this->session->userdata("admin_level") == "master") $confirm_yn = "N";
    		else $confirm_yn = "Y";
    		
			$info = $this->quiz_model->getQuizBook($book_no);
			if($info['quiz_seq'] != "") {
        		echo '{"result":"faild", "msg":"이미 등록된 퀴즈입니다."}';
        		exit;    		    			    
			}

    		$data = array(
    			"book_no" => $book_no,
    			"book_name" => $book_name,
    			"status" => $status,
    			"confirm_yn" => $confirm_yn,
    			"quiz_contents" => $q,
    			"quiz_cnt" => $cnt,
    			"reg_date"	=> date("Y-m-d H:i:s"),
    			"user_id"	=>	$this->session->userdata("admin_id"),
    		);
    		
    		$result = $this->quiz_model->insertQuiz($data);
    		
    		$data = array(
    			"quiz_yn" => "Y",
    		);					
			$this->book_model->updateBook($data, $book_no);    		
    		//$this->goURL("/admin/content/quiz_list");
    		echo '{"result":"success", "msg":"저장되었습니다.","book_no":"'.$book_no.'","quiz_seq":"'.$result.'"}';
    		exit;
    	} else {
    	    $info = $this->quiz_model->getQuiz($quiz_seq);	    
    	    
    		$data = array(
    			"book_no" => $book_no,
    			"book_name" => $book_name,
    			"quiz_contents" => $q,
    			"status" => $status,
    			"quiz_cnt" => $cnt,
    			"mod_date"	=> date("Y-m-d H:i:s"),
    			"mod_user_id"	=>	$this->session->userdata("admin_id"),
    		);
 
    		$result = $this->quiz_model->updateQuiz($data, $quiz_seq);
    		//$this->goURL("/admin/content/quiz_list");
    		echo '{"result":"success", "msg":"저장되었습니다.","book_no":"'.$book_no.'","quiz_seq":"'.$quiz_seq.'"}';
    		exit;
    	}

		exit;
	}	
 
	// 퀴즈 공유 등록
	public function quizShareProc()
	{
	    
		$user_id = $this->input->post("user_id");
		$title = $this->input->post("title");
		$user_seq = $this->input->post("user_seq");
		$quiz_seq = $this->input->post("quiz_seq");
		$book_no = $this->input->post("book_no");
		
		$group_name = $this->input->post("group_name");
		
		
		
		for($i=0; $i<count($user_id); $i++){
			//$this->content_model->deleteEdu($chk[$i]);
		    for($j=0; $j<count($quiz_seq); $j++){	
        		$data = array(
        			"quiz_seq" => $quiz_seq[$j],
        			"book_no" => $book_no[$j],
        			"title" => $title,
        			"user_id" => $this->session->userdata("admin_id"),
        			"share_user_id" => $user_id[$i],
        			"group_name" => $group_name[$i],
        			"reg_date"	=> date("Y-m-d H:i:s"),
        			"status"	=> "Y",
        		);

        		$this->quizShare_model->insertQuizShare($data);			
        	}
		}
			    
		$this->goURL("/admin/content/quiz_share_list");
		exit;	    
	}


	// 도서배정 등록
	public function bookAssignProc()
	{
		$user_id = $this->input->post("user_id");
		$book_no = $this->input->post("book_no");
		$quiz_seq = $this->input->post("quiz_seq");
		$group_name = $this->input->post("group_name");
		
		for($i=0; $i<count($book_no); $i++){
        		$data = array(
        			"book_no" => $book_no[$i],
        			"quiz_seq" => $quiz_seq[$i],
        			"user_id" => $user_id,
        			"group_name" => $group_name,
        			"reg_date"	=> date("Y-m-d H:i:s"),
        			"status"	=> "Y",
        		);
        		//print_R($data);

        		$this->bookAssignment_model->insertBookAssignment($data);			
		}
			    
		$this->goURL("/admin/content/book_assign_list");
		exit;	    
	}

	 

	//퀴즈 리스트
	public function quizList()
	{
		$depth1 = "admin";
		$depth2 = "quizList";
		$title = "퀴즈 리스트";
		$sub_title = "퀴즈 리스트";



		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$page_size = $this->input->get("page_size");

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}";


		$where = "";

		/*

		if(!empty($srcN)){
			$srcN = addslashes($srcN);
			if($srcType=="title"){
				$where .= "AND content.content_title LIKE '%{$srcN}%'";
			}else if($srcType=="code"){
				$where .= "AND content.content_code LIKE '%{$srcN}%'";
			}else{
				$where .= "AND (content.content_title LIKE '%{$srcN}%' OR content.content_code LIKE '%{$srcN}%')";
			}
		}

		if($category != 'all'){
			$where .= "AND content.content_category = '{$category}'";
		}

		if(!empty($this->session->userdata("academy_seq"))){
			$search_where = "1=1 ";
			if(!empty($srcN)){
				$srcN = addslashes($srcN);
				if($srcType=="title"){
					$search_where .= "AND content.content_title LIKE '%{$srcN}%'";
				}else if($srcType=="code"){
					$search_where .= "AND content.content_code LIKE '%{$srcN}%'";
				}else{
					$search_where .= "AND (content.content_title LIKE '%{$srcN}%' OR content.content_code LIKE '%{$srcN}%')";
				}
			}

			if($category != 'all'){
				$search_where .= "AND content.content_category = '{$category}'";
			}

			$academy_seq = $this->session->userdata("academy_seq");
			$where .= "AND content.content_sharing_yn = 'Y' OR ({$search_where} AND content.academy_seq = '{$academy_seq}' AND content.content_type = 'C')";


		}
		*/

		$page_list_size = 10;
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->content_model->getQuizTotalCount($whereData);

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

		$quizList = $this->content_model->getQuizList($whereData);

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
		$quizList = $this->add_counting($quizList,$list_total,$num);

		$params = "&page_size={$page_size}";

		$paging = $this->make_paging2($_SERVER['PATH_INFO'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;


		//customSetting
		for($i = 0; $i < count($quizList); $i++)
		{
			$quizList[$i]['reg_date'] = date("Y-m-d",strtotime($quizList[$i]['reg_date']));
			$quizList[$i]['quiz_title'] = stripslashes($quizList[$i]['quiz_title']);
		}

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"quizList"	=>	$quizList,
			"paging"		=>	$paging,
			"srcN"			=>	$srcN,
			"list_total"	=>	$list_total,
			"param"			=>	$param
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/quiz-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//퀴즈 작성
	public function quizWrite()
	{
		$depth1 = "order";
		$depth2 = "quizList";
		$title = "퀴즈컨텐츠 등록";
		$sub_title = "퀴즈컨텐츠 등록";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}";

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
		$this->parser->parse("admin/contents/quiz-write",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}
	
    public function favorite_popup($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "찜한수";
		$sub_title = "찜한수";
		
		$page = $this->input->get('page');
			    
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
		
		$data = $this->book_model->getBook($seq);
		
		$gradeList = $this->book_model->getBookFavoriteGradeList($seq);
		for($i = 0; $i < count($gradeList); $i++)
		{
			$data['grade'][$gradeList[$i]['grade']] = $gradeList[$i]['cnt'];
		}		
		for($i= 1 ;$i<=9;$i++ ){
		    @$data['grade'][$i] = @$data['grade'][$i]?$data['grade'][$i]:0;
		}
		
		$genderList = $this->book_model->getBookFavoriteGenderList($seq);
		for($i = 0; $i < count($genderList); $i++)
		{
			$data['gender'][$genderList[$i]['gender']] = $genderList[$i]['cnt'];
		}		
		for($i= 1 ;$i<=2;$i++ ){
		    if($i == 1) $gender = 'M';
		    else  $gender = 'F';
		    @$data['gender'][$gender] = @$data['gender'][$gender]?$data['gender'][$gender]:0;
		}	
 
		$term_where ="";
		
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
		$this->parser->parse("admin/contents/".$page."-pop",$content_data);


	}		
	
    public function like_popup($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "추천수";
		$sub_title = "추천수";
		
		$page = $this->input->get('page');
			    
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
		
		$data = $this->book_model->getBook($seq);
		
		$gradeList = $this->book_model->getBookLikeGradeList($seq);
		for($i = 0; $i < count($gradeList); $i++)
		{
			$data['grade'][$gradeList[$i]['grade']] = $gradeList[$i]['cnt'];
		}		
		for($i= 0 ;$i<=9;$i++ ){
		    @$data['grade'][$i] = @$data['grade'][$i]?$data['grade'][$i]:0;
		}
		
		$genderList = $this->book_model->getBookLikeGenderList($seq);
		for($i = 0; $i < count($gradeList); $i++)
		{
			$data['grade'][$gradeList[$i]['gender']] = $genderList[$i]['cnt'];
		}		
		for($i= 1 ;$i<=2;$i++ ){
		    if($i == 1) $gender = 'M';
		    else  $gender = 'F';
		    @$data['gender'][$gender] = @$data['gender'][$gender]?$data['gender'][$gender]:0;
		}		
 
		$term_where ="";
		
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
		$this->parser->parse("admin/contents/".$page."-pop",$content_data);
	}
	
    public function quiz_use_popup($seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "북퀴즈 인증 수";
		$sub_title = "북퀴즈 인증 수";
		
		$page = $this->input->get('page');
			    
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
		
		$data = $this->book_model->getBook($seq);
		
		$gradeList = $this->book_model->getBookQuizGradeList($seq);
		for($i = 0; $i < count($gradeList); $i++)
		{
			$data['grade'][$gradeList[$i]['grade']] = $gradeList[$i]['cnt'];
		}		
		for($i= 0 ;$i<=9;$i++ ){
		    @$data['grade'][$i] = @$data['grade'][$i]?$data['grade'][$i]:0;
		}
		
		$genderList = $this->book_model->getBookQuizGenderList($seq);
		for($i = 0; $i < count($genderList); $i++)
		{
			$data['gender'][$genderList[$i]['gender']] = $genderList[$i]['cnt'];
		}		
		for($i= 1 ;$i<=2;$i++ ){
		    if($i == 1) $gender = 'M';
		    else  $gender = 'F';
		    @$data['gender'][$gender] = @$data['gender'][$gender]?$data['gender'][$gender]:0;
		}		
 
		$term_where ="";
		
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
		$this->parser->parse("admin/contents/".$page."-pop",$content_data);
	}	

 

	//퀴즈 수정
	public function quizModify($quiz_seq)
	{
		$depth1 = "order";
		$depth2 = "quizList";
		$title = "퀴즈컨텐츠 수정";
		$sub_title = "퀴즈컨텐츠 수정";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$page_size = $this->input->get('page_size');

		$param = "?num={$num}&srcN={$srcN}&page_size={$page_size}";

		$quizData = $this->content_model->getQuizData($quiz_seq);

		$quiz = unserialize($quizData['quiz_contents']);

		for($i=0; $i<count($quiz); $i++){
			$quiz[$i]['q'] = stripslashes($quiz[$i]['q']);
			$quiz[$i]['a'] = stripslashes($quiz[$i]['a']);
			$quiz[$i]['d'] = stripslashes($quiz[$i]['d']);
			if(!empty($quiz[$i]['ex'])){
				foreach($quiz[$i]['ex'] as $key => $value){
					$quiz[$i]['ex'][$key] = stripslashes($value);
				}
			}
			if(empty($quiz[$i]['n1'])){
				$quiz[$i]['n1'] = "";
			}else{
				$quiz[$i]['n1'] = stripslashes($quiz[$i]['n1']);
			}
			if(empty($quiz[$i]['n2'])){
				$quiz[$i]['n2'] = "";
			}else{
				$quiz[$i]['n2'] = stripslashes($quiz[$i]['n2']);
			}
		}

		$quiz_view_datetime = date("Y-m-d",strtotime($quizData['quiz_view_datetime']));;
		$quiz_view_hour = date("H",strtotime($quizData['quiz_view_datetime']));
		$quiz_view_min = date("i",strtotime($quizData['quiz_view_datetime']));

		$quizData['quiz_title'] = stripslashes($quizData['quiz_title']);
		$quizData['quiz_view_datetime'] = $quiz_view_datetime;
		$quizData['quiz_view_hour'] = $quiz_view_hour;
		$quizData['quiz_view_min'] = $quiz_view_min;

		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"param"	=>	$param,
			"quizData"	=>	$quizData,
			"quiz"	=>	$quiz
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/quiz-modify",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//퀴즈수정
	public function quizModifyProc()
	{
		$quiz_seq = $this->input->post("quiz_seq");
		$quiz_title = $this->input->post("quiz_title");
		$quiz_view_datetime = $this->input->post("quiz_view_datetime");
		$quiz_view_hour = $this->input->post("quiz_view_hour");
		$quiz_view_min = $this->input->post("quiz_view_min");
		$status = $this->input->post("status");

		$quiz_title = addslashes($quiz_title);

		$status = empty($status)?"N":$status;

		$quiz_view_datetime = $quiz_view_datetime." ".$quiz_view_hour.":".$quiz_view_min.":"."00";

		$quizArr = array();

		for($i=0; $i<10; $i++){
			$type = $this->input->post("quiz_".($i+1)."_type");
			if($type=="type1"){
				$type = "t1";
			}else{
				$type = "t2";
			}

			$question = $this->input->post("quiz_".($i+1)."_".$type."_q");
			$answer = $this->input->post("quiz_".($i+1)."_".$type."_a");
			$discription = $this->input->post("quiz_".($i+1)."_".$type."_discription");

			$quizArr[$i]['type'] = $type;
			$quizArr[$i]['q'] = addslashes($question);
			$quizArr[$i]['a'] = addslashes($answer);
			$quizArr[$i]['d'] = addslashes($discription);
			if($type=="t1"){
				$quizArr[$i]['n1'] = $this->input->post("quiz_".($i+1)."_".$type."_n1");
				$quizArr[$i]['n2'] = $this->input->post("quiz_".($i+1)."_".$type."_n2");
				$quizArr[$i]['ex'] = array();
				$quizArr[$i]['ex'][0] = $answer;
				$quizArr[$i]['ex'][1] = $this->input->post("quiz_".($i+1)."_".$type."_n1");
				$quizArr[$i]['ex'][2] = $this->input->post("quiz_".($i+1)."_".$type."_n2");
				shuffle($quizArr[$i]['ex']);
			}
		}

		$quiz_contents = serialize($quizArr);

		$data = array(
			"quiz_title"	=> $quiz_title,
			"quiz_total"	=>	10,
			"quiz_contents"	=>	$quiz_contents,
			"quiz_view_datetime"	=>	$quiz_view_datetime,
			"status"	=>	$status,
			"update_time"	=>	date("Y-m-d H:i:s")
		);

		$result = $this->content_model->updateQuiz($quiz_seq,$data);

		echo '{"result":"success"}';
		exit;
	}

	//퀴즈 상태변경
	public function quizChangeStatus()
	{
		$status = $this->input->post("status");
		$chk = $this->input->post("chk");

        for($i=0;$i<count($chk);$i++) {
    		$data = array(
    			"status" => $status,
    		);
 
    		$result = $this->quiz_model->updateQuiz($data, $chk[$i]);

        }
		echo '{"result":"success"}';
		exit;
	}
	

	//퀴즈삭제
	public function deleteBookAssign()
	{
		$chk = $this->input->post("chk");
		for($i=0;$i<count($chk);$i++) {
		    $row = explode(",", $chk[$i]);
		    $data = array("user_id"=>$row[0],
		                  "reg_date"=>$row[1]
		    );
		    $this->bookAssignment_model->deleteBookAssignment($data);
		}
		//$this->content_model->deleteQuiz($quiz_seq);
		echo '{"result":"success"}';
		exit;
	}	
	
	//퀴즈삭제
	public function deleteBookProc()
	{
		$book_no = $this->input->post("book_no");
		$this->book_model->deleteBook($book_no);
		echo '{"result":"success"}';
		exit;
	}	

	//퀴즈삭제
	public function deleteQuiz()
	{
		$quiz_seq = $this->input->post("quiz_seq");
		$this->content_model->deleteQuiz($quiz_seq);
		echo '{"result":"success"}';
		exit;
	}
	
	//퀴즈삭제
	public function deleteQuizListProc()
	{
		$chk = $this->input->post("chk");
		for($i=0;$i<count($chk);$i++) {
		    $quiz_seq = $chk[$i];
		    $this->content_model->deleteQuiz($quiz_seq);
		}
		echo '{"result":"success"}';
		exit;
	}	
	
	//퀴즈삭제
	public function deleteQuizHistroy()
	{
		$quiz_seq = $this->input->post("qh_seq");
		// 정보가 있는지 확인
		$info = $this->quizHistory_model->getQuizHistoryAdmin($quiz_seq);
		if($info['book_no'] == "") {
		    exit;
		}
		
		$pointInfo = $this->pointHistory_model->getPointHistory($quiz_seq);
		//포인트 삭제
		if($pointInfo['ph_seq'] != "") {
		    $point = "-".$pointInfo['point'];
		    $user_id = $pointInfo['user_id'];
		    // 회원 총합 마이너스
		    $this->user_model->updatePoint($user_id,$point);
		    
		    // 포인트 삭제
		    $this->pointHistory_model->deletePointHistory($quiz_seq);
		}
		
		$this->quizHistory_model->deleteQuizHistory($quiz_seq);
		// 포인트 삭제.
		//echo '{"result":"success"}';
		$this->goURL("/admin/content/quiz_result_list");
		exit;
	}	
	
	//퀴즈삭제
	public function deleteQuizShareProc()
	{
		$quiz_seq = $this->input->post("quiz_seq");
		$book_no = $this->input->post("book_no");
		$share_user_id = $this->input->post("share_user_id");
		$user_id = $this->session->userdata("admin_id");
		$data = array(
		        "quiz_seq" => $quiz_seq,
		        "book_no" => $book_no,
		        "share_user_id" => $share_user_id,
		        "user_id" => $user_id
		        );
		        //print_r($data);
		      $this->quizShare_model->deleteQuizShare($data);
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
		$keyword = $this->input->get('keyword');
		$category = $this->input->get('category');
		$page_size = $this->input->get('page_size');
		$book_no = $this->input->get('book_no');

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$num = empty($num) ? 0 : $num;

		$srcN = empty($srcN) ? "" : $srcN;

		$category = $category=="" ? "all" : $category;

		$page_size = empty($page_size) ? 20 : $page_size;

		$param = "?num={$num}&srcN={$srcN}&category={$category}&page_size={$page_size}";


		$where = "";

		if(!empty($keyword)){
			$srcN = addslashes($keyword);
			$where .= "AND book_name LIKE '%{$keyword}%'";
		}
		
		if($this->session->userdata("admin_type") == "director"  && $book_no == "Y") {
		    $where .= "AND b.group_name ='".$this->session->userdata("group_name")."'";
		}
		
		if($this->session->userdata("admin_type") == "master" && $book_no == "Y") {
		    $where .= "AND b.user_id ='".$this->session->userdata("admin_id")."'";
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
		//$list = $this->quiz_model->getQuizList($whereData);
		
		//getQuizList

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

		$params = "&srcN={$srcN}&category={$category}&book_no={$book_no}&keyword={$keyword}";

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
			
			
			$info = $this->quiz_model->getQuizBook($list[$i]['book_no']);
			$list[$i]['quiz_seq'] = $info['quiz_seq'];
			if($list[$i]['quiz_seq'] != "")
			    $list[$i]['quiz_yn'] ="O";
			else
			    $list[$i]['quiz_yn'] ="X"; 

		}
        
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"list"	=>	$list,
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
		$this->parser->parse("admin/contents/book-list-pop",$content_data);


	}

	// 대량 파일 업로드 팝업 (FTP 대체)
	public function batchUploadPop()
	{
		$sub_title = "대량 파일 일괄 업로드 (FTP 대체)";
		$depth1 = "";
		$depth2 = "";

		$this->CONFIG_DATA['depth1'] = $depth1;
		$this->CONFIG_DATA['depth2'] = $depth2;

		$content_data = array(
			"base_url"   => $this->BASE_URL,
			"sub_title"  => $sub_title,
			"depth1"     => $depth1
		);

		//header and css loads
		$this->parser->parse("admin/include/pop-header", $this->CONFIG_DATA);

		//footer js files
		$this->parser->parse("admin/include/footer_js", $this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/contents/batch-upload-pop", $content_data);
	}

	// 대량 파일 업로드 AJAX 비동기 처리
	public function batchUploadProc()
	{
		header('Content-Type: application/json; charset=utf-8');

		if (!$this->session->userdata("admin_id")) {
			echo json_encode(array("result" => "fail", "msg" => "관리자 로그인이 필요합니다."));
			exit;
		}

		$upload_type = $this->input->post("upload_type"); // 'cover' or 'sheet'
		$match_type = $this->input->post("match_type");   // 'book_no', 'isbn', 'name'
		$auto_open = $this->input->post("auto_open");     // 'Y' or 'N' (표지 등록 시 자동 공개 여부)

		if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
			echo json_encode(array("result" => "fail", "msg" => "업로드된 파일이 유효하지 않습니다."));
			exit;
		}

		$orig_name = $_FILES['file']['name'];
		$tmp_name = $_FILES['file']['tmp_name'];
		$file_ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
		$raw_key = pathinfo($orig_name, PATHINFO_FILENAME);
		$key = trim($raw_key);

		// 허용 확장자 검사
		if ($upload_type == "cover") {
			$allowed = array("jpg", "jpeg", "png", "gif", "webp");
			if (!in_array($file_ext, $allowed)) {
				echo json_encode(array("result" => "fail", "msg" => "이미지 파일(jpg, png, gif, webp)만 업로드 가능합니다.", "fileName" => $orig_name));
				exit;
			}
		} else { // sheet
			$allowed = array("pdf", "pptx", "ppt", "doc", "docx", "hwp", "hwpx", "zip");
			if (!in_array($file_ext, $allowed)) {
				echo json_encode(array("result" => "fail", "msg" => "문서 파일(pdf, pptx, docx, hwp 등)만 업로드 가능합니다.", "fileName" => $orig_name));
				exit;
			}
		}

		// 도서 매칭 탐색
		$book = null;
		if ($match_type == "isbn") {
			$book = $this->db->get_where('tb_book', array('isbn' => $key))->row_array();
		} else if ($match_type == "name") {
			$book = $this->db->get_where('tb_book', array('book_name' => $key))->row_array();
		} else { // 기본: book_no
			$book = $this->book_model->getBook($key);
			if (empty($book) || !is_array($book)) {
				// 파일명에 _ 또는 - 가 포함된 경우 앞부분 번호로 재시도 (예: 1004_cover.jpg -> 1004)
				$parts = preg_split('/[_-]/', $key);
				if (!empty($parts[0])) {
					$book = $this->book_model->getBook(trim($parts[0]));
				}
			}
		}

		// 저장 디렉토리 확인 및 생성
		$upload_path = $_SERVER['DOCUMENT_ROOT'] . "/upload/book/";
		if (!is_dir($upload_path)) {
			@mkdir($upload_path, 0777, true);
		}

		// 고유 파일명 생성
		$save_name = "batch_" . date("YmdHis") . "_" . $orig_name;
		$dest = $upload_path . $save_name;

		if (!move_uploaded_file($tmp_name, $dest)) {
			echo json_encode(array("result" => "fail", "msg" => "파일 저장에 실패했습니다.", "fileName" => $orig_name));
			exit;
		}

		if (!empty($book) && is_array($book) && !empty($book['book_no'])) {
			$target_book_no = $book['book_no'];
			$update_data = array();

			if ($upload_type == "cover") {
				$update_data['book_cover'] = $save_name;
				if ($auto_open === "Y" || empty($auto_open)) {
					$update_data['open_yn'] = 'Y';
					$update_data['status'] = 'Y';
				}
			} else { // sheet
				$update_data['worksheet'] = $save_name;
			}

			$this->book_model->updateBook($update_data, $target_book_no);

			echo json_encode(array(
				"result" => "success",
				"msg" => "매칭 및 저장 완료",
				"fileName" => $orig_name,
				"savedName" => $save_name,
				"bookNo" => $target_book_no,
				"bookName" => $book['book_name'],
				"matched" => true
			));
			exit;
		} else {
			// 매칭 도서 없음 (파일은 저장됨)
			echo json_encode(array(
				"result" => "partial",
				"msg" => "서버에 파일은 업로드되었으나 매칭되는 도서를 찾지 못했습니다.",
				"fileName" => $orig_name,
				"savedName" => $save_name,
				"bookNo" => "-",
				"bookName" => "매칭 실패",
				"matched" => false
			));
			exit;
		}
	}

	public function bookExcel()
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
        $this->parser->parse("admin/contents/book-excel-pop",$content_data);
	}	
	
	//회원 등록 엑셀 저장
	public function bookExcelProc()
	{
		$excel = load_controller('admin/excelAdm');
		$excel_file = $_FILES['excel']['tmp_name'];
		$orig_name = $_FILES['excel']['name'] ?? '';
		$ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));

		try {
			if($ext == "xlsx") {
				$objReader = PHPExcel_IOFactory::createReader('Excel2007');
			} else {
				$objReader = PHPExcel_IOFactory::createReader('Excel5');
			}
			$objReader->setReadDataOnly(true);
			$objPHPExcel = $objReader->load($excel_file);
		} catch(Exception $e) {
			$objPHPExcel = PHPExcel_IOFactory::load($excel_file);
		}
		$objPHPExcel->setActiveSheetIndex(0);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray(null,true,true,true);

		/*sheetData
        A = 그룹명
        B = Book No
        C = 책제목 
        D = 시리즈명 (or 단권)
        E = 지은이
        F = 출판사
        G = ISBN
        H = Type1(국내/국외/구분 없음)
        I = Type2(카테고리)
        J = 권장학년
        K = 확보
        L = 출제자
        M = 선호도(M/F/N)
        N = 주요 주제(구분 #)
        O = 관련주제(구분 #)
        P = Award/Recommended
        Q = 제시 질문 (생각 꺼내기)
        R = 생각담기 번호별도일경우 0
        S = 생각담기별도
        T = 책표지
        U = 활동지
        V = Memo
        W = 공개 비공개
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
				$group_name = trim($sheetData[$i]['A'] ?? '');
				$book_no = trim($sheetData[$i]['B'] ?? '');
				$book_name = trim($sheetData[$i]['C'] ?? '');
				$serise = trim($sheetData[$i]['D'] ?? '');
				if(empty($serise)) $serise = "단권";
				$author = trim($sheetData[$i]['E'] ?? '');
				$publisher = trim($sheetData[$i]['F'] ?? '');
				$isbn = trim(preg_replace("/[^0-9]/", "", $sheetData[$i]['G'] ?? ''));
				$category = strtoupper(trim($sheetData[$i]['H'] ?? 'K'));
				if(!in_array($category, array('K', 'F'))) $category = 'K';
				$sub_category = strtoupper(trim($sheetData[$i]['I'] ?? 'C'));
				if(!in_array($sub_category, array('A', 'B', 'C'))) $sub_category = 'C';
				$recommend_class = trim($sheetData[$i]['J'] ?? "0");
				if($recommend_class === "") $recommend_class = "0";
				$has_yn = strtoupper(trim($sheetData[$i]['K'] ?? 'Y'));
				$user_id = trim($sheetData[$i]['L'] ?? '');
				if(empty($user_id)) $user_id = $this->session->userdata("admin_id");
				$preference = strtoupper(trim($sheetData[$i]['M'] ?? 'N'));
				$subject = trim($sheetData[$i]['N'] ?? '');
				$tags = trim($sheetData[$i]['O'] ?? '');
				
				$award = trim($sheetData[$i]['P'] ?? '');
				$think_title = trim($sheetData[$i]['Q'] ?? '');
				if(empty($think_title)) $think_title = "이 책을 읽고 어떤 생각이 들었나요?";
				$think_quiz_seq = trim($sheetData[$i]['R'] ?? '0');
				$think_quiz = trim($sheetData[$i]['S'] ?? '');
				if(empty($think_quiz_seq) && empty($think_quiz)) {
					$think_quiz_seq = '0';
					$think_quiz = "책을 읽고 가장 인상 깊었던 부분을 적어보세요.";
				}
				$think_quiz_direct = ($think_quiz_seq === '0' || $think_quiz_seq === 0) ? "Y" : ""; 
				$think_quiz_yn = "N";
				$book_cover = trim($sheetData[$i]['T'] ?? '');
				$worksheet = trim($sheetData[$i]['U'] ?? '');
				$memo = trim($sheetData[$i]['V'] ?? '');
				
				// 표지가 없으면 공개되지 않도록 정책 반영 (사용자 요청 3번)
				$open_yn = !empty($book_cover) ? "Y" : "N";
				
				if(empty($book_no)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "책번호가 누락되었습니다.";
					$failed++;
					continue;
				}

				if(empty($book_name)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "책이름이 누락되었습니다.";
					$failed++;
					continue;
				}
				
				if(empty($author)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "지은이가 누락되었습니다.";
					$failed++;
					continue;
				}							
				
				if(empty($publisher)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "출판사가 누락되었습니다.";
					$failed++;
					continue;
				}					
				
				if(empty($isbn)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "ISBN이 누락되었습니다.";
					$failed++;
					continue;
				}		

				//등록여부
				$duplicateId = $this->book_model->getBook($book_no);

				if(is_array($duplicateId) === false && $book_no != ""){
				    $subject = trim(str_replace("#", "", $subject));
				    if(!empty($tags) && substr($tags, 0, 1) === "#") {
				        $tags = substr($tags, 1);
				    }
				    $tags = trim(str_replace("#", ",", $tags));
				    if(!empty($book_cover) && strstr($book_cover, ".jpg") == false && strstr($book_cover, ".png") == false) {
				        $book_cover = trim($book_cover).".jpg";
				    }
				    if(!empty($worksheet) && strstr($worksheet, ".pdf") == false) {
				        $worksheet = trim($worksheet).".pdf";
				    }				    

            		$data = array(
            			"book_no" => $book_no,
            			"book_name" => $book_name,
            			"serise" => $serise,
            			"author" => $author,
            			"publisher" => $publisher,
            			"isbn" => $isbn,
            			"category" => $category,
            			"sub_category" => $sub_category,
            			"subject" => $subject,
            			"tags" => $tags,
            			"recommend_class" => $recommend_class,
            			"award" => $award,
            			"think_title" => $think_title,
            			"think_quiz_seq" => $think_quiz_seq,
            			"think_quiz" => $think_quiz,
            			"think_quiz_direct" => $think_quiz_direct,
            			"think_quiz_yn" => $think_quiz_yn,
            			"open_yn" => $open_yn,
            			"status" => $open_yn,
            			"quiz_yn" => "N",            			
            			"book_cover" => $book_cover,
            			"worksheet" => $worksheet,
            			"reg_date"	=> date("Y-m-d H:i:s"),
            			"user_id"	=>	$user_id,
            		);
            		if(strstr("jpg", $book_cover) === false && $book_cover != "") $book_cover = $book_cover.".jpg";
            		if(strstr("pdf", $worksheet) === false && $worksheet != "") $worksheet = $worksheet.".pdf";

					$result = $this->book_model->insertBook($data);
					$success++;
				}else{
					$errorArr[$failed]['user_id'] = $user_id;
					$errorArr[$failed]['error_msg'] = "{$user_id}는 이미 등록된 책입니다.".$i."===".$book_no."==".$think_quiz_seq;
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
        $this->parser->parse("admin/contents/book-excel-proc",$content_data);
	}			 
	
	public function quizExcel()
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
        $this->parser->parse("admin/contents/quiz-excel-pop",$content_data);
	}	
	
	//회원 등록 엑셀 저장
	public function quizExcelProc()
	{
		$excel = load_controller('admin/excelAdm');
		$excel_file = $_FILES['excel']['tmp_name'];
		$orig_name = $_FILES['excel']['name'] ?? '';
		$ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));

		try {
			if($ext == "xlsx") {
				$objReader = PHPExcel_IOFactory::createReader('Excel2007');
			} else {
				$objReader = PHPExcel_IOFactory::createReader('Excel5');
			}
			$objReader->setReadDataOnly(true);
			$objPHPExcel = $objReader->load($excel_file);
		} catch(Exception $e) {
			$objPHPExcel = PHPExcel_IOFactory::load($excel_file);
		}
		$objPHPExcel->setActiveSheetIndex(0);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray(null,true,true,true);

		/*sheetData
        A = 그룹명
        B = Book No
        C = 책제목 
        D = 문제
        E = 보기1
        F = 보기2
        G = 보기3
        H = 보기4
        I = 보기5
        J = 정답
        K = 순서
        L = 문제타입
        M = 문항수
        N = 보기수
		*/

		//엑셀 제목 삭제
		array_shift($sheetData);

		//에러 정리 array
		$errorArr = array();

		if( count($sheetData) > 0 ){
			$errorArr['noData'] = true;
			$success = 0;
			$failed = 0;
			$cnt = 0;
			for( $i = 0; $i < count($sheetData); $i++ ){
				$group_name = trim($sheetData[$i]['A'] ?? '');
				$book_no = trim($sheetData[$i]['B'] ?? '');
				$book_name = trim($sheetData[$i]['C'] ?? '');
				$q = trim($sheetData[$i]['D'] ?? '');
				$c1 = trim($sheetData[$i]['E'] ?? '');
				$c2 = trim($sheetData[$i]['F'] ?? '');
				$c3 = trim($sheetData[$i]['G'] ?? '');
				$c4 = trim($sheetData[$i]['H'] ?? '');
				$c5 = trim($sheetData[$i]['I'] ?? '');
				$a = trim($sheetData[$i]['J'] ?? '');
				$sort = trim($sheetData[$i]['K'] ?? '');
				$type = strtoupper(trim($sheetData[$i]['L'] ?? 'C'));
				if(empty($type)) $type = "C";
				$quiz_cnt = trim($sheetData[$i]['M'] ?? '10');
				if(empty($quiz_cnt)) $quiz_cnt = "10";
				
				// 보기 수 자동 계산 (비어있으면 채워진 보기 수로)
				$bogi_cnt = trim($sheetData[$i]['N'] ?? '');
				if(empty($bogi_cnt)){
					$bogi_cnt = 0;
					if($c1 !== '') $bogi_cnt++;
					if($c2 !== '') $bogi_cnt++;
					if($c3 !== '') $bogi_cnt++;
					if($c4 !== '') $bogi_cnt++;
					if($c5 !== '') $bogi_cnt++;
				}
				
				$reg_date = date("Y-m-d H:i:s");

				if(empty($book_no)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "책번호가 누락되었습니다.";
					$failed++;
					continue;
				}

				if(empty($book_name)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "책이름이 누락되었습니다.";
					$failed++;
					continue;
				}
				
				if(empty($q)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "문제가 누락되었습니다.";
					$failed++;
					continue;
				}				
				
				if(empty($a)){
					$errorArr[$failed]['user_id'] = ($i+1)."번 행";
					$errorArr[$failed]['error_msg'] = "정답이 누락되었습니다.";
					$failed++;
					continue;
				}							

				//등록여부
				$duplicateId = $this->quiz_model->getQuiz($book_no);
                $cnt++;
                $quiz['q'][$cnt] = $q;
                $quiz['a'][$cnt] = $a;
                $quiz['c1'][$cnt] = $c1;
                $quiz['c2'][$cnt] = $c2;
                $quiz['c3'][$cnt] = $c3;
                $quiz['c4'][$cnt] = $c4;
                $quiz['c5'][$cnt] = $c5;
                $quiz['ext'][$cnt] = "";
                $quiz['type'][$cnt] = $type;
                $quiz['sort'][$cnt] = $sort ?: $cnt;
                if($cnt == $quiz_cnt) {
                    $q = serialize($quiz);
            		$data = array(
            			"book_no" => $book_no,
            			"book_name" => $book_name,
            			"status" => "Y",
            			"quiz_contents" => $q,
            			"quiz_cnt" => $quiz_cnt,
            			"reg_date"	=> date("Y-m-d H:i:s"),
            			"user_id"	=>	$this->session->userdata("admin_id"),
            		);

					$result = $this->quiz_model->insertQuiz($data);

            		$data = array(
            			"quiz_yn" => "Y",
            		);					
					$result = $this->book_model->updateBook($data, $book_no);
					$success++;
					$quiz = array();
					                    
                    $cnt = 0;
                } else {
                    
                }
				//if(is_array($duplicateId) === false){


				//}else{
				//	$errorArr[$failed]['user_id'] = $user_id;
				//	$errorArr[$failed]['error_msg'] = "{$user_id}는 이미 등록된 책입니다.";
				//	$failed++;
				//	continue;
				//}
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
        $this->parser->parse("admin/contents/quiz-excel-proc",$content_data);
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
            $pageArr[]['no'] = '<li><a class="page-link" href="'.$url.'?num='.((($end_page*20)-10)+10).'&srcN='.$srcN.$params.'">></a></li>';
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
    
	public function user_popup($user_id="")
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
		
		$data = $this->user_model->getUserData($user_id);
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
	    for($i=0;$i<count($planList);$i++) {
	        $planNewList[$planList[$i]['code_type']] = $planList[$i]['code_name'];
	    }	
	    		
		$data['pricing_plan'] = @$planNewList[$data['pricing_plan']];
		
 
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
		$this->parser->parse("admin/contents/user-pop",$content_data);


	}	   
	
	public function history_popup($book_no="", $quiz_seq="")
	{
		$depth1 = "partner";
		$depth2 = "list";
		$title = "원생관리";
		$sub_title = "원생관리";
			    
		$num = $this->input->get('num');
		$srcN = $this->input->get('srcN');
		$srcType = $this->input->get('srcType');
		$status = $this->input->get('status');
		$quiz_seq = $this->input->get('quiz_seq');
		$book_no = $this->input->get('book_no');
		

		$num = $num ?? 0;

		$srcN = $srcN ?? "";

		$srcType = $srcType ?? "all";

		$status = $status ?? "all";

		$where = "";
		$page_size = empty($page_size) ? 20 : $page_size;
		$page_list_size = 10;
		
		$whereData = array(
			"where"			=>	$where,
		);
		$list_total = $this->quizHistory_model->getQuizHistoryTotalCount($whereData);

		if( $list_total <= 0 )
		{
			$list_total = 0;
		}

		$total_page = ceil( $list_total / $page_size );

		$param = $params = "&quiz_seq={$quiz_seq}&book_no={$book_no}&page_size={$page_size}";

		$whereData = array(
			"sort"			=>	"",
			"where"			=>	$where,
			"limit"			=>	"LIMIT ".$num.",".$page_size
		);

		$list = $this->quizHistory_model->getQuizHistoryAdminList($whereData);

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
			$list[$i]['reg_date'] = date("Y-m-d H:i",strtotime($list[$i]['reg_date']));

		}
		$data = $this->book_model->getBook($book_no);
		
		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"data"			=>	$data,
			"sub_title"	=>	$sub_title,
			"list"	=>	@$list,
			"paging"		=>	@$paging,
			"srcN"			=>	$srcN,
			"list_total"	=>	@$list_total,
			"page_size"	=>	@$page_size,
			"param"			=>	$param
		);
		//header and css loads
		$this->parser->parse("admin/include/pop-header",$this->CONFIG_DATA);

		//contents
		$this->parser->parse("admin/contents/history-pop",$content_data);


	}	   	 
	
	public function  kakao(){
		$quiz_seq = $this->input->post('quiz_seq');
		$book_no = $this->input->post('book_no');
		$user_id = $this->input->post('user_id');
		$mode = $this->input->post('mode');
		$start_date = $this->input->post('start_date')??"";
		$end_date = $this->input->post('end_date')??"";
		
		$data = $this->user_model->getUserData($user_id);
			    
        $_apiURL    =	'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
        $_hostInfo  =	parse_url($_apiURL);
        $_port      =	(strtolower($_hostInfo['scheme']) == 'https') ? 443 : 80;
        $cell_no = $data['parent_cell'];
        //$cell_no = "01064326003";
        $name = $data['user_name'];
        if($start_date == "") 
            $start_date = substr($data['reg_date'],0,10);
            
        if($end_date == "") 
            $end_date = date("Y-m-d");
        
        if($mode == "portfolio") {
            $count = $this->input->post('count');    
            
            $msg = "{$name} 학생이, {$start_date}부터 {$end_date}까지 총 {$count}의 책을 읽고 인증을 완료하였어요. 세상과 한뼘씩 다가서고 있는 중입니다~ 책읽기 마무리 활동은 나노의 책장에서!";
            $btn = '{"button":[{"name":"포트폴리오 확인","linkType":"WL","linkP":"http://app.nanosbookshelf.com/report/quiz_portfolio_pop/'.$user_id.'?searchTermType=&startDate='.$start_date.'&endDate='.$end_date.'&keyword=", "linkM": "http://app.nanosbookshelf.com/report/quiz_portfolio_pop/'.$user_id.'?searchTermType=&startDate='.$start_date.'&endDate='.$end_date.'&keyword="}]}';
            
            $_variables =	array(
                'apikey'      => 'ypjr7m6tjjjhri2dsz3fz9sdancwcsro', 
                'userid'      => 'min5k', 
                'senderkey'   => 'f1aa2df93adcc25d366d0089499d8b27a7a5ef27', 
                'tpl_code'    => 'TT_4290',
                'sender'      => '01071414186',
                'senddate'    => '',
                'receiver_1'  => $cell_no,
                'recvname_1'  => $name,
                'subject_1'   => '포트폴리오 발송',
                'message_1'   => $msg,
                'button_1'    => $btn, // 템플릿에 버튼이 없는경우 제거하시기 바랍니다.
                //'receiver_2'  => $cell_no,
                //'recvname_2'  => '엄수용',
                //'subject_2'   => '포트폴리오 발송',
                //'message_2'   => $msg,
                //'button_2'    => $btn 
            );        
                        
        } 
        if($mode == "quiz") {
            $qh_seq = $this->input->post('qh_seq');    
            $info = $this->quizHistory_model->getQuizHistoryAdmin($qh_seq);
            $book_name = $info['book_name'];
            
            $msg = "{$name} 학생이, ${book_name} 를 읽고, 인증을 완료하였어요~ 책읽기 마무리 활동은 나노의 책장에서!";
            $btn = '{"button":[{"name":"북퀴즈결과 확인","linkType":"WL","linkP":"http://app.nanosbookshelf.com/report/quiz_result_pop/'.$qh_seq.'", "linkM": "http://app.nanosbookshelf.com/report/quiz_result_pop/'.$qh_seq.'"}]}';
            $_variables =	array(
                'apikey'      => 'ypjr7m6tjjjhri2dsz3fz9sdancwcsro', 
                'userid'      => 'min5k', 
                'senderkey'   => 'f1aa2df93adcc25d366d0089499d8b27a7a5ef27', 
                'tpl_code'    => 'TT_4291',
                'sender'      => '01071414186',
                'senddate'    => '',
                'receiver_1'  => $cell_no,
                'recvname_1'  => $name,
                'subject_1'   => '북퀴즈결과 발송',
                'message_1'   => $msg,
                'button_1'    => $btn,
                //'receiver_2'  => $cell_no,
                //'recvname_2'  => $name,
                //'subject_2'   => '북퀴즈결과 발송',
                //'message_2'   => $msg,
                //'button_2'    => $btn
            );
        }         
        $ret = '';
        
        if($mode != "" ) {
            $oCurl = curl_init();
            curl_setopt($oCurl, CURLOPT_PORT, $_port);
            curl_setopt($oCurl, CURLOPT_URL, $_apiURL);
            curl_setopt($oCurl, CURLOPT_POST, 1);
            curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($oCurl, CURLOPT_POSTFIELDS, http_build_query($_variables));
            curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, FALSE);

            $ret = curl_exec($oCurl);
            $error_msg = curl_error($oCurl);
            curl_close($oCurl);
        }

        // JSON 문자열 배열 변환
        $retArr = json_decode($ret);        
	    
	}

}
