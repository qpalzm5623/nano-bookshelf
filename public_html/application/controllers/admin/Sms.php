<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Sms extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("order_model");
		$this->load->model("category_model");
        //$this->load->model("course_model");
		$this->load->model("config_model");
		$this->load->model("sms_model");
		$uri = explode("/",uri_string());
		// login Check
        if( !$this->session->userdata("admin_id") ){	public function studentListPop()
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
            if( $uri[count($uri)-1] != "login" && $uri[count($uri)-1] != "login_proc" ){
                $this->msg("로그인 해주시기 바랍니다.");
                $this->goURL(base_url("admin/login"));
                exit;
            }
		}


	}

	public function index()
	{
		//login page redirect
		$this->main();
	}

  //courseList
  public function main()
  {
  	  $depth1 = "smsAdm";
  	  $depth2 = "";
  	  $title = "문자 발송";
  	  $sub_title = "문자 발송";
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
  	  $num = $this->input->get('num');
  	  $srcN = $this->input->get('srcN');
  	  $srcType = $this->input->get('srcType');
      
 
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
      
  	  $content_data = array(
  	  	"depth1"		=>	$depth1,
  	  	"title"			=>	$title,
  	  	"sub_title" 	=>	$sub_title,
  	  	"srcType"		=>	$srcType,
  	  	"srcN"			=>	$srcN,
  	  );
      
  	  //header and css loads
  	  $this->parser->parse("admin/include/header",$this->CONFIG_DATA);
      
  	  //menu
  	  $this->parser->parse("admin/include/left",$this->CONFIG_DATA);
  	  //contents
  	  $this->parser->parse("admin/sms/main",$content_data);
      
  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }
   

  public function smsMgr()
  {
  	  $depth1 = "smsAdm";
  	  $depth2 = "smsMgr";
  	  $title = "문자문구관리";
  	  $sub_title = "문자문구관리";
      
      /*
  	  $auth = "company";
      
  	  if(!$this->authChk($auth)){
  	  	$this->msg("권한이 없습니다.");
  	  	$this->goBack();
  	  	return;
  	  }
      */
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
  	  $num = $this->input->get('num');
  	  $srcN = $this->input->get('srcN');
  	  $srcType = $this->input->get('srcType');
      
  	  $num = $num ?? 0;
      
  	  $srcN = $srcN ?? "";
      
  	  $srcType = $srcType ?? "";
  	  
  	  $where = "";
      
  	  //$where = "AND survey_seq = '{$seq}' ";
      
      /*
  	  if( !empty($srcN) ){
  	  	if( $srcType == "" || $srcType == "all" ){
  	  		$where .="AND course_name LIKE '%$srcN%' OR course_code LIKE '%$srcN%' ";
  	  	}else if($srcType == "name" ){
  	  		$where .="AND course_name LIKE '%$srcN%' ";
  	  	}else if($srcType == "code"){
  	  		$where .="AND course_code LIKE '%$srcN%' ";
  	  	}
  	  }
      */
      
  	  $page_size = 10;
  	  $page_list_size = 10;
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  );
  	  $list_total = $this->config_model->getBannerTotalCount($contentData);
      
  	  if( $list_total <= 0 )
  	  {
  	  	$list_total = 0;
  	  }
      
  	  $total_page = ceil( $list_total / $page_size );
      
      $params = "";
      
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  	"limit"			=>	"LIMIT ".$num.",".$page_size
  	  );
      
  	  $dataList = $this->config_model->getBannerList($contentData);
      
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
  	  $dataList = $this->add_counting($dataList,$list_total,$num);
      
  	  $paging = $this->make_paging2("/admin/configAdm/bannerList",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
  	  //customSetting
  	  for($i = 0; $i < count($dataList); $i++)
  	  {
  	      $dataList[$i]['reg_time'] = date("Y-m-d",strtotime($dataList[$i]['reg_time']));
  	  }
      
  	  $content_data = array(
  	  	"depth1"		=>	$depth1,
  	  	"title"			=>	$title,
  	  	"sub_title"	=>	$sub_title,
  	  	"dataList"	=>	$dataList,
  	  	"paging"		=>	$paging,
  	  	"srcType"		=>	$srcType,
  	  	"srcN"			=>	$srcN
  	  );
      
  	  //header and css loads
  	  $this->parser->parse("admin/include/header",$this->CONFIG_DATA);
      
  	  //menu
  	  $this->parser->parse("admin/include/left",$this->CONFIG_DATA);
  	  //contents
  	  $this->parser->parse("admin/sms/sms-manager",$content_data);
      
  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }
  

  public function schedule($keyword="")
  {
  	  $depth1 = "smsAdm";
  	  $depth2 = "schedule";
  	  $title = "문자문구관리";
  	  $sub_title = "문자문구관리";
      
      /*
  	  $auth = "company";
      
  	  if(!$this->authChk($auth)){
  	  	$this->msg("권한이 없습니다.");
  	  	$this->goBack();
  	  	return;
  	  }
      */
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
  	  $num = $this->input->get('num');
  	  $srcN = $this->input->get('srcN');
  	  $srcType = $this->input->get('srcType');
      
  	  $num = $num ?? 0;
      
  	  $srcN = $srcN ?? "";
      
  	  $srcType = $srcType ?? "";
  	  
  	  $where = "";
      
  	  //$where = "AND survey_seq = '{$seq}' ";
      
      /*
  	  if( !empty($srcN) ){
  	  	if( $srcType == "" || $srcType == "all" ){
  	  		$where .="AND course_name LIKE '%$srcN%' OR course_code LIKE '%$srcN%' ";
  	  	}else if($srcType == "name" ){
  	  		$where .="AND course_name LIKE '%$srcN%' ";
  	  	}else if($srcType == "code"){
  	  		$where .="AND course_code LIKE '%$srcN%' ";
  	  	}
  	  }
      */
      
  	  $page_size = 10;
  	  $page_list_size = 10;
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  );
  	  $list_total = $this->sms_model->getSmsTotalCount($contentData);
      
  	  if( $list_total <= 0 )
  	  {
  	  	$list_total = 0;
  	  }
      
  	  $total_page = ceil( $list_total / $page_size );
      
      $params = "";
      
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  	"limit"			=>	"LIMIT ".$num.",".$page_size
  	  );
      
  	  $dataList = $this->sms_model->getSmsList($contentData);
      
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
  	  $dataList = $this->add_counting($dataList,$list_total,$num);
  	  
      
  	  $paging = $this->make_paging2($_SERVER['REQUEST_URI'],$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);
      
  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;
      
  	  //customSetting
  	  for($i = 0; $i < count($dataList); $i++)
  	  {
  	      $dataList[$i]['reg_time'] = date("Y-m-d",strtotime($dataList[$i]['reg_time']));
  	  }
      
  	  $content_data = array(
  	  "base_url"		=>	$this->BASE_URL,
  	  	"depth1"		=>	$depth1,
  	  	"title"			=>	$title,
  	  	"sub_title"	=>	$sub_title,
  	  	"dataList"	=>	$dataList,
  	  	"paging"		=>	$paging,
  	  	"srcType"		=>	$srcType,
  	  	"srcN"			=>	$srcN
  	  );
      
  	  //header and css loads
  	  $this->parser->parse("admin/include/header",$this->CONFIG_DATA);
      
  	  //menu
  	  $this->parser->parse("admin/include/left",$this->CONFIG_DATA);
  	  //contents
  	  $this->parser->parse("admin/sms/schedule",$content_data);
      
  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }
  
  
  public function scheduleWrite($seq="")
  {
      $depth1 = "smsAdm";
      $depth2 = "schedule";
      $title = "자동문자문구관리";
      $sub_title = "자동문자문구관리";
      
      /*
      $auth = "company";
      
      if(!$this->authChk($auth)){
      	$this->msg("권한이 없습니다.");
      	$this->goBack();
      	return;
      }
      */
      
      $this->CONFIG_DATA["depth1"] = $depth1;
      $this->CONFIG_DATA["depth2"] = $depth2;
      
      $num = $this->input->get('num');
      $srcN = $this->input->get('srcN');
      $srcType = $this->input->get('srcType');
      
      $num = $num ?? 0;
      
      $srcN = $srcN ?? "";
      
      $srcType = $srcType ?? "";
      
      $where = "";
      
      $data = $this->sms_model->getSmsInfo($seq);
      
      $content_data = array(
        "base_url"		=>	$this->BASE_URL,
      	"depth1"		=>	$depth1,
      	"title"			=>	$title,
      	"sub_title"	    =>	$sub_title,
      	"data"	        =>	$data,
      	"srcType"		=>	$srcType,
      	"srcN"			=>	$srcN
      );
      
      //header and css loads
      $this->parser->parse("admin/include/header",$this->CONFIG_DATA);
      
      //menu
      $this->parser->parse("admin/include/left",$this->CONFIG_DATA);
      //contents
      $this->parser->parse("admin/sms/schedule-write",$content_data);
      
      //Footer
      $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
      //footer js files
      $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }
  

	//설문내용 등록
	public function scheduleProc()
	{
		$sms_seq = $this->input->post("sms_seq");
		$sms_auto_type = $this->input->post("sms_auto_type");
		$sms_type = $this->input->post("sms_type");
		$sms_type_tag   = $this->input->post("sms_type_tag");
		
		$title = $this->input->post("title");
		$contents = $this->input->post("contents");
		$admin_id = $this->input->post("admin_id");
		
		$reg_time = date("Y-m-d H:i:s");

		$data = array(
			"sms_seq"	=>	$sms_seq,
			"sms_auto_type"	=>	$sms_auto_type,
			"sms_type"	=>	$sms_type,
			"sms_type_tag"	=>	$sms_type_tag,
			"title"	=>	$title,
			"contents"	=>	$contents,
			"admin_id"	=>	$admin_id,
			"reg_time"	=>	$reg_time,
		);
		
        if($sms_seq)
            $result = $this->sms_model->updateSms($data);
        else
		    $result = $this->sms_model->insertSms($data);

		//$this->msg("정상적으로 등록되었습니다.");
		//$this->goURL("/admin/boardAdm/boardConfigList");
		echo '{"result":"success","msg":"정상적으로 등록되었습니다."}';
		exit;
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
    
    //make paging2
	public function make_paging2($url,$start_page,$end_page,$page_size,$num,$srcN="",$total_page)
	{
	    $pageArr[]['no'] = '<li><a class="page-link" href="'.$url.'?num=0&srcN='.$srcN.'"><</a></li>';
		if( $end_page <= 0 )
	    {
	        $pageArr[]['no'] = '<li class="page-item"><a class="page-link" href="#">1</a></li>';
	    }

	    for( $i = $start_page; $i <= $end_page; $i++ )
	    {
	        $page = ( $i - 1 ) * $page_size;
	        if( $num != $page )
	        {
	            $pageArr[$i]['no'] = '<li class="page-item"><a class="page-link" href="'.$url.'?num='.$page.'&srcN='.$srcN.'">'.$i.'</a></li>';
	        }
	        else
	        {
	            $pageArr[$i]['no'] = '<li><a class="page-link" href="#">'.$i.'</a></li>';
	        }
	    }

        if($total_page> $end_page)
            $pageArr[]['no'] = '<li><a class="page-link" href="'.$url.'?num='.((($end_page*10)-10)+10).'&srcN='.$srcN.$params.'">></a></li>';
        else
            $pageArr[]['no'] = '<li><a class="page-link" href="#">></a></li>';

	    return $pageArr;
	}    
}
