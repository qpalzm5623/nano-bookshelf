<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class ConfigAdm extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("order_model");
		$this->load->model("category_model");
        //$this->load->model("course_model");
		$this->load->model("config_model");
		$this->load->model("terms_model");
		$uri = explode("/",uri_string());
		// login Check
        if( !$this->session->userdata("admin_id") ){
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
		$this->setting();
	}

  //courseList
  public function setting()
  {
  	$depth1 = "configAdm";
  	$depth2 = "setting";
  	$title = "환경설정";
  	$sub_title = "기본 환경설정";

  	$this->CONFIG_DATA["depth1"] = $depth1;
  	$this->CONFIG_DATA["depth2"] = $depth2;

  	$num = $this->input->get('num');
  	$srcN = $this->input->get('srcN');
  	$srcType = $this->input->get('srcType');

  	$num = $num ?? 0;

  	$srcN = $srcN ?? "";

  	$srcType = $srcType ?? "";

  	$where = "";

  	$page_size = 10;
  	$page_list_size = 10;
  	$reportData = array(
  		"where"			=>	$where,
  	);
  	$data = $this->config_model->getConfig();


  	$this->CONFIG_DATA["depth1"] = $depth1;
  	$this->CONFIG_DATA["depth2"] = $depth2;


  	$content_data = array(
  		"depth1"		=>	$depth1,
  		"title"			=>	$title,
  		"sub_title" 	=>	$sub_title,
  		"srcType"		=>	$srcType,
  		"srcN"			=>	$srcN,
  		"data"          =>  $data
  	);

  	//header and css loads
  	$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

  	//menu
  	$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
  	//contents
  	$this->parser->parse("admin/config/setting",$content_data);

  	//Footer
  	$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	//footer js files
  	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }


  //report 등록
  public function settingProc()
  {
      $seq = $this->input->post("seq");

      $site_name = $this->input->post("site_name");
      $site_eng_name = $this->input->post("site_eng_name");
      $site_businees_no = $this->input->post("site_businees_no");
      $company_name = $this->input->post("company_name");
      $ceo_name = $this->input->post("ceo_name");
      $publish_date = $this->input->post("publish_date");
      $tel_no = $this->input->post("tel_no");
      $as_no = $this->input->post("as_no");
      $fax_no = $this->input->post("fax_no");
      $email= $this->input->post("email");
      $information_officer= $this->input->post("information_officer");
      $business_report_number= $this->input->post("business_report_number");
      $industry= $this->input->post("industry");
      $condition= $this->input->post("condition");
      $zipcode= $this->input->post("zipcode");
      $address= $this->input->post("address");
      $address_detail= $this->input->post("address_detail");
      $domain= $this->input->post("domain");
      $captcha_id= $this->input->post("captcha_id");
      $otp_id= $this->input->post("otp_id");
      $cert_id= $this->input->post("cert_id");
      $cert_password= $this->input->post("cert_password");
      $ipin_id= $this->input->post("ipin_id");
      $ipin_password= $this->input->post("ipin_password");
      $payment_company_code= $this->input->post("payment_company_code");
      $payment_id= $this->input->post("payment_id");
      $payment_key= $this->input->post("payment_key");
      $payment_test_id= $this->input->post("payment_test_id");
      $payment_test_key= $this->input->post("payment_test_key");
      $payment_use_service= implode(",", $this->input->post("payment_use_service"));
      $bank_name= $this->input->post("bank_name");
      $bank_account= $this->input->post("bank_account");
      $bank_user_name= $this->input->post("bank_user_name");
      $seo_title= $this->input->post("seo_title");
      $seo_desc= $this->input->post("seo_desc");
      $hrdnet_id= $this->input->post("hrdnet_id");
      $license= $this->input->post("license");

      $logo_org= $this->input->post("logo_org");
      $banner_org= $this->input->post("banner_org");
      $logo_mo_org= $this->input->post("logo_mo_org");
      $banner_mo_org= $this->input->post("banner_mo_org");
      $business_license_org= $this->input->post("business_license_org");
      
      $meta_title = $this->input->post("meta_title");
      $meta_keywords = $this->input->post("meta_keywords");
      $meta_description = $this->input->post("meta_description");
      $meta_author = $this->input->post("meta_author");
      $meta_image = $this->input->post("meta_image");


      $reg_time = date("Y-m-d H:i:s");

	  	$logo = $_FILES['logo']['name'] ?? "";
	  	$banner = $_FILES['banner']['name'] ?? "";

	  	$logo_mo = $_FILES['logo_mo']['name'] ?? "";
	  	$banner_mo = $_FILES['banner_mo']['name'] ?? "";

	  	$business_license = $_FILES['business_license']['name'] ?? "";

	  	if( !empty($logo) ){
	  		//thumb file adding...
	  		$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/company/";

	  		if( !is_dir($upload_path) ){
	  			mkdir($upload_path,0777,true);
	  		}

	  		$ext = explode(".",$logo);

	  		$file_name = "logo_".date("YmdHis").".".end($ext);

	  		move_uploaded_file($_FILES["logo"]["tmp_name"],$upload_path.$file_name);
	  		$logo = $file_name;
	  	} else {
	  		$logo = $logo_org;
	  	}

	  	if( !empty($banner) ){
	  		//thumb file adding...
	  		$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/company/";

	  		if( !is_dir($upload_path) ){
	  			mkdir($upload_path,0777,true);
	  		}

	  		$ext = explode(".",$banner);

	  		$file_name = "banner_".date("YmdHis").".".end($ext);

	  		move_uploaded_file($_FILES["banner"]["tmp_name"],$upload_path.$file_name);
	  		$banner = $file_name;
	  	} else {
	  		$banner = $banner_org;
	  	}

	  	if( !empty($logo_mo) ){
	  		//thumb file adding...
	  		$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/company/";

	  		if( !is_dir($upload_path) ){
	  			mkdir($upload_path,0777,true);
	  		}

	  		$ext = explode(".",$logo_mo);

	  		$file_name = "logo_mo_".date("YmdHis").".".end($ext);

	  		move_uploaded_file($_FILES["logo_mo"]["tmp_name"],$upload_path.$file_name);
	  		$logo_mo = $file_name;
	  	} else {
	  		$logo_mo = $logo_mo_org;
	  	}

	  	if( !empty($banner_mo) ){
	  		//thumb file adding...
	  		$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/company/";

	  		if( !is_dir($upload_path) ){
	  			mkdir($upload_path,0777,true);
	  		}

	  		$ext = explode(".",$banner_mo);

	  		$file_name = "banner_mo_".date("YmdHis").".".end($ext);

	  		move_uploaded_file($_FILES["banner_mo"]["tmp_name"],$upload_path.$file_name);
	  		$banner_mo = $file_name;
	  	} else {
	  		$banner_mo = $banner_mo_org;
	  	}

	  	if( !empty($business_license) ){
	  		//thumb file adding...
	  		$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/company/";

	  		if( !is_dir($upload_path) ){
	  			mkdir($upload_path,0777,true);
	  		}

	  		$ext = explode(".",$business_license);

	  		$file_name = "business_license_".date("YmdHis").".".end($ext);

	  		move_uploaded_file($_FILES["business_license"]["tmp_name"],$upload_path.$file_name);
	  		$business_license = $file_name;
	  	} else {
	  		$business_license = $business_license_org;
	  	}


      $data = array(
        "site_name"                => $site_name,
        "site_eng_name"            => $site_eng_name,
        "site_businees_no"         => $site_businees_no,
        "company_name"             => $company_name,
        "ceo_name"                 => $ceo_name,
        "publish_date"             => $publish_date,
        "tel_no"                   => $tel_no,
        "as_no"                    => $as_no,
        "fax_no"                   => $fax_no,
        "email"                    => $email,
        "information_officer"      => $information_officer,
        "business_report_number"   => $business_report_number,
        "industry"                 => $industry,
        "`condition`"              => $condition,
        "zipcode"                  => $zipcode,
        "address"                  => $address,
        "address_detail"           => $address_detail,
        "site_logo"                => $logo,
        "mobile_logo"              => $logo_mo,
        "banner"                   => $banner,
        "mobile_banner"            => $banner_mo,
        "business_file"            => $business_license,
        "domain"                   => $domain,
        "captcha_id"               => $captcha_id,
        "otp_id"                   => $otp_id,
        "cert_id"                  => $cert_id,
        "cert_password"            => $cert_password,
        "ipin_id"                  => $ipin_id,
        "ipin_password"            => $ipin_password,
        "payment_company_code"     => $payment_company_code,
        "payment_id"               => $payment_id,
        "payment_key"              => $payment_key,
        "payment_test_id"          => $payment_test_id,
        "payment_test_key"         => $payment_test_key,
        "payment_use_service"      => $payment_use_service,
        "bank_name"                => $bank_name,
        "bank_account"             => $bank_account,
        "bank_user_name"           => $bank_user_name,
        "seo_title"                => $seo_title,
        "seo_desc"                 => $seo_desc,
        "hrdnet_id"                => $hrdnet_id,
        "license"                  => $license,
        
        "meta_title"                  => $meta_title,
        "meta_keywords"                  => $meta_keywords,
        "meta_description"                  => $meta_description,
        "meta_author"                  => $meta_author,
        "meta_image"                  => $meta_image,
      );
      
    


      $result = $this->config_model->updateSetting($data, $seq);

      $this->msg("정상적으로 등록되었습니다.");
      $this->goURL("/admin/configAdm/setting");
      exit;
  }


  //report write
  public function terms($mode)
  {
  	$depth1 = "configAdm";
  	$depth2 = "terms";
  	$title = "약관관리";
  	$sub_title = "약관 관리";

  	$this->CONFIG_DATA["depth1"] = $depth1;
  	$this->CONFIG_DATA["depth2"] = $depth2;

    $terms = $this->terms_model->getTerms();

    $contents = $terms[$mode];

  	$content_data = array(
  		"depth1"		=>	$depth1,
  		"title"			=>	$title,
  		"sub_title"	=>	$sub_title,
        "mode"=>$mode,
        "contents"=>$contents
    );

  	//header and css loads
    $this->parser->parse("admin/include/header",$this->CONFIG_DATA);

  	//menu
  	$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
    //footer js files
  	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  	//contents
    $this->parser->parse("admin/config/terms",$content_data);

  	//Footer
  	$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

  }

  //report 등록
  public function termsProc()
  {
      $mode = $this->input->post("mode");
      $contents = $this->input->post("contents");
      $reg_time = date("Y-m-d H:i:s");

      $data = array(
        "$mode"  =>  $contents,
      );

      $result = $this->terms_model->updateTerms($data);

      $this->msg("정상적으로 등록되었습니다.");
      $this->goURL("/admin/configAdm/terms/".$mode);
      exit;
  }

	//report 수정
  public function reportModifyProc()
  {
        $report_seq = $this->input->post("report_seq");
        $course_class = $this->input->post("course_class");
        $course_class_data = explode("|",$course_class);
        $course_code = $course_class_data[0];
        $class_code = $course_class_data[1];


        $contents_subject = $this->input->post("contents_subject");
        $contents_caution = $this->input->post("contents_caution");
        $contents_guide = $this->input->post("contents_guide");
        $contents_criteria = $this->input->post("contents_criteria");
        $reg_time = date("Y-m-d H:i:s");

		$report_ex_file_org = $this->input->post("report_ex_file_org");
		$report_answer_file_org = $this->input->post("report_answer_file_org");

		$report_ex_file = $_FILES['report_ex_file']['name'] ?? "";
		$report_answer_file = $_FILES['report_answer_file']['name'] ?? "";

		if( !empty($report_ex_file) ){
			//thumb file adding...
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/".$class_code."/";

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			$file_name = "report_ex_".$class_code."_".date("YmdHis")."_".$report_ex_file;

			move_uploaded_file($_FILES["report_ex_file"]["tmp_name"],$upload_path.$file_name);
			$report_ex_file = $file_name;

			@unlink($upload_path.$report_ex_file_org);
		} else {
			$report_ex_file = $report_ex_file_org;
		}

		if( !empty($report_answer_file) ){
			//thumb file adding...
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/files/".$class_code."/";

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			$file_name = "report_answer_".$class_code."_".date("YmdHis")."_".$report_answer_file;

			move_uploaded_file($_FILES["report_answer_file"]["tmp_name"],$upload_path.$file_name);
			$report_answer_file = $file_name;

			@unlink($upload_path.$report_answer_file_org);
		} else {
			$report_answer_file = $report_answer_file_org;
		}


      $reportData = array(
        "class_code"  =>  $class_code,
        "course_code"  =>  $course_code,
        "contents_subject"  =>  $contents_subject,
        "contents_caution"  =>  $contents_caution,
        "contents_guide"  =>  $contents_guide,
        "contents_criteria" =>  $contents_criteria,
	  	"report_ex_file"	=>	$report_ex_file,
	  	"report_answer_file"	=>	$report_answer_file,
        "reg_time"  =>  $reg_time
      );

      $result = $this->course_model->updateReport($reportData,$report_seq);

		if($result){
			$this->msg("정상적으로 수정되었습니다.");
	    $this->goURL("/admin/configAdm/reportList");
	    exit;
		}else{
			$this->msg("수정된 부분이 없습니다.");
	    $this->goBack();
	    exit;
		}


  }

	//survey list
  public function popupList()
  {
  	$depth1 = "configAdm";
  	$depth2 = "popupList";
  	$title = "팝업관리";
  	$sub_title = "팝업 리스트";


  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;

  	  $num = $this->input->get('num');
  	  $srcN = $this->input->get('srcN');
  	  $srcType = $this->input->get('srcType');

  	  $num = $num ?? 0;

  	  $srcN = $srcN ?? "";

  	  $srcType = $srcType ?? "";

  	  $where = "";

  	  $page_size = 10;
  	  $page_list_size = 10;
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  );
  	  $list_total = $this->config_model->getPopupTotalCount($contentData);

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

  	  $dataList = $this->config_model->getPopupList($contentData);

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

  	  $paging = $this->make_paging2("/admin/configAdm/popupList",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

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
  	  $this->parser->parse("admin/config/popup-list",$content_data);

  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }
	//survey write
  public function popupWrite($seq="")
  {
  	$depth1 = "configAdm";
  	$depth2 = "popupList";
  	$title = "팝업관리";
  	$sub_title = "팝업 등록";

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

      $data = $this->config_model->getPopup($seq);


  	  $content_data = array(
  		"depth1"		=>	$depth1,
  		"title"			=>	$title,
  		"sub_title"	=>	$sub_title,
		"seq"	=>	$seq,
		"data"	=>	$data
    );

  	//header and css loads
    $this->parser->parse("admin/include/header",$this->CONFIG_DATA);

  	//menu
  	$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
    //footer js files
  	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  	//contents
    $this->parser->parse("admin/config/popup-write",$content_data);

  	//Footer
  	$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

  }

	public function mainList()
  {
  	  $depth1 = "configAdm";
  	  $depth2 = "mainList";
  	  $title = "메인관리";
  	  $sub_title = "메인 관리";

  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;

  	  $num = $this->input->get('num');
  	  $srcN = $this->input->get('srcN');
  	  $srcType = $this->input->get('srcType');

  	  $num = $num ?? 0;

  	  $srcN = $srcN ?? "";

  	  $srcType = $srcType ?? "";

  	  $where = "";

  	  $page_size = 10;
  	  $page_list_size = 10;
  	  $contentData = array(
  	  	"where"			=>	$where,
  	  );
  	  $list_total = $this->config_model->getMainTotalCount($contentData);

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

  	  $dataList = $this->config_model->getMainList($contentData);

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

  	  $paging = $this->make_paging2("/admin/configAdm/mainList",$start_page,$end_page,$page_size,$num,$srcN,$total_page,$params);

  	  $this->CONFIG_DATA["depth1"] = $depth1;
  	  $this->CONFIG_DATA["depth2"] = $depth2;

  	  //customSetting
  	  for($i = 0; $i < count($dataList); $i++)
  	  {
  	      $dataList[$i]['reg_time'] = date("Y-m-d",strtotime($dataList[$i]['reg_time']));

					if($dataList[$i]['main_type'] == "RECOM"){
						$dataList[$i]['main_type'] = "추천 과정";
					}else{
						$dataList[$i]['main_type'] = "HOT 과정";
					}
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
  	  $this->parser->parse("admin/config/main-list",$content_data);

  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }

	//설문내용 등록화면
  public function mainWrite($seq="")
  {
      $depth1 = "configAdm";
      $depth2 = "mainList";
      $title = "메인관리";
      $sub_title = "메인 관리";

      $this->CONFIG_DATA["depth1"] = $depth1;
      $this->CONFIG_DATA["depth2"] = $depth2;

      $data = $this->config_model->getMain($seq);

			$class_course_data = $this->config_model->getClassCourseData();


  	  $content_data = array(
  		"depth1"		=>	$depth1,
  		"title"			=>	$title,
  		"sub_title"	=>	$sub_title,
			"mid"	=>	$seq,
			"class_course_data"	=>	$class_course_data,
			"data"	=>	$data
    );

  	//header and css loads
    $this->parser->parse("admin/include/header",$this->CONFIG_DATA);

  	//menu
  	$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
    //footer js files
  	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  	//contents
    $this->parser->parse("admin/config/main-write",$content_data);

  	//Footer
  	$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

  }

	//배너 등록
	public function mainWriteProc()
	{
		$mid = $this->input->post("mid");
		$title = $this->input->post("title");
		$class_code = $this->input->post("class_code");
		$course_code = $this->input->post("course_code");
		$url = $this->input->post("url");
		$main_type = $this->input->post("main_type");
		$main_category = $this->input->post("main_category");
		if(empty($main_category)){
			$main_category = "";
		}
		$sort_order = 1;
		$status = $this->input->post("status");
		$reg_time = date("Y-m-d H:i:s");

		$data = array(
			"mid"				=> $mid,
			"title"			=>	$title,
			"class_code"	=>	$class_code,
			"course_code"	=>	$course_code,
			"url"					=>	$url,
			"main_type"		=>	$main_type,
			"main_category"	=>	$main_category,
			"status"				=>	$status,
			"reg_time"	=>	$reg_time,
		);

        if($mid)
            $result = $this->config_model->updateMain($data);
        else
		    $result = $this->config_model->insertMain($data);

		$this->msg("정상적으로 등록되었습니다.");
		$this->goURL("/admin/configAdm/mainList");
		exit;
	}

  public function bannerList()
  {
  	  $depth1 = "configAdm";
  	  $depth2 = "bannerList";
  	  $title = "배너관리";
  	  $sub_title = "배너 관리";

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
  	  $this->parser->parse("admin/config/banner-list",$content_data);

  	  //Footer
  	  $this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
  	  //footer js files
  	  $this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  }

	//설문내용 등록화면
  public function bannerWrite($seq="")
  {
      $depth1 = "configAdm";
      $depth2 = "bannerList";
      $title = "배너관리";
      $sub_title = "배너 관리";

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

      $data = $this->config_model->getBanner($seq);


  	  $content_data = array(
  		"depth1"		=>	$depth1,
  		"title"			=>	$title,
  		"sub_title"	=>	$sub_title,
		"seq"	=>	$seq,
		"data"	=>	$data
    );

  	//header and css loads
    $this->parser->parse("admin/include/header",$this->CONFIG_DATA);

  	//menu
  	$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
    //footer js files
  	$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
  	//contents
    $this->parser->parse("admin/config/banner-write",$content_data);

  	//Footer
  	$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);

  }

	//배너 등록
	public function boardConfigWriteProc()
	{
		$seq = $this->input->post("seq");
		$board_name = $this->input->post("board_name");
		$board_title = $this->input->post("board_title");
		$board_type = $this->input->post("board_type");

		$board_read_level = $this->input->post("board_read_level");
		$board_write_level = $this->input->post("board_write_level");
		$board_delete_level = $this->input->post("board_reply_level");
		$board_category = $this->input->post("board_category");
		$board_course_yn = $this->input->post("board_course_yn");

		$board_state = $this->input->post("board_state");
		$sort_order = $this->input->post("sort_order");

		$admin_id = $this->input->post("admin_id");


		$reg_time = date("Y-m-d H:i:s");

		$data = array(
			"seq"	=>	$seq,
			"board_name"	=>	$board_name,
			"board_title"	=>	$board_title,
			"board_type"	=>	$board_type,
			"board_skin"	=>	$board_type,
			"board_read_level"	=>	$board_read_level,
			"board_write_level"	=>	$board_write_level,
			"board_delete_level"	=>	$board_delete_level,
			"board_category"	=>	$board_category,
			"board_course_yn"	=>	$board_course_yn,

			"board_state"	=>	$board_state,
			"sort_order"	=>	$sort_order,


			"admin_id"	=>	$admin_id,
			"reg_time"	=>	$reg_time,
		);

        if($seq)
            $result = $this->board_model->updateBoardConfig($data);
        else
		    $result = $this->board_model->insertBoardConfig($data);

		$this->msg("정상적으로 등록되었습니다.");
		$this->goURL("/admin/configAdm/bannerList");
		exit;
	}

	//설문내용 등록
	public function popupProc()
	{
		$popup_id = $this->input->post("seq");
		$popup_title = $this->input->post("popup_title");
		$popup_desc = $this->input->post("popup_desc");
		$popup_pos_top = $this->input->post("popup_pos_top");
		$popup_pos_left = $this->input->post("popup_pos_left");
		$popup_size_x = $this->input->post("popup_size_x");
		$popup_size_y = $this->input->post("popup_size_y");
		$popup_url = $this->input->post("popup_url");
		$popup_target = $this->input->post("popup_target");
		$contents = $this->input->post("contents");



		$start_date = $this->input->post("start_date");
		$end_date = $this->input->post("end_date");
		$display_yn = $this->input->post("display_yn");
		$admin_id = $this->input->post("admin_id");


		$reg_time = date("Y-m-d H:i:s");

		$data = array(
			"popup_id"	=>	$popup_id,
			"popup_title"	=>	$popup_title,
			"popup_desc"	=>	$popup_desc,
			"popup_pos_top"	=>	$popup_pos_top,
			"popup_pos_left"	=>	$popup_pos_left,

			"popup_size_x"	=>	$popup_size_x,
			"popup_size_y"	=>	$popup_size_y,
			"popup_url"	=>	$popup_url,
			"popup_target"	=>	$popup_target,

			"contents"	=>	$contents,
			"start_date"	=>	$start_date,
			"end_date"	=>	$end_date,
			"display_yn"	=>	$display_yn,
			"admin_id"	=>	$admin_id,
			"reg_time"	=>	$reg_time,
		);


        if($popup_id)
            $result = $this->config_model->updatePopup($data);
        else
		    $result = $this->config_model->insertPopup($data);

		$this->msg("정상적으로 등록되었습니다.");
		$this->goURL("/admin/configAdm/popupList");
		exit;
	}


	//설문내용 등록
	public function bannerProc()
	{
		$banner_id = $this->input->post("seq");
		$banner_title = $this->input->post("banner_title");
		$banner_pos = $this->input->post("banner_pos");
		$banner_url = $this->input->post("banner_url");
		$banner_target = $this->input->post("banner_target");
		$contents = $this->input->post("contents");



		$start_date = $this->input->post("start_date");
		$end_date = $this->input->post("end_date");
		$display_yn = $this->input->post("display_yn");
		$admin_id = $this->input->post("admin_id");
		$image_org = $this->input->post("image_org");
		$image = $_FILES['image']['name'] ?? "";

		if( !empty($image) ){
			//thumb file adding...
			$upload_path = $_SERVER['DOCUMENT_ROOT']."/upload/board/main/";

			if( !is_dir($upload_path) ){
				mkdir($upload_path,0777,true);
			}

			$file_name = $banner_pos."_".date("YmdHis")."_".$image;

			move_uploaded_file($_FILES["image"]["tmp_name"],$upload_path.$file_name);
			$image = $file_name;

			@unlink($upload_path.$image_org);
		} else {
			$image = $image_org;
		}

		$reg_time = date("Y-m-d H:i:s");

		$data = array(
			"banner_id"	=>	$banner_id,
			"banner_title"	=>	$banner_title,
			"banner_pos"	=>	$banner_pos,
			"banner_url"	=>	$banner_url,
			"banner_target"	=>	$banner_target,
			"image"	=>	$image,
			"contents"	=>	$contents,
			"start_date"	=>	$start_date,
			"end_date"	=>	$end_date,
			"display_yn"	=>	$display_yn,
			"admin_id"	=>	$admin_id,
			"reg_time"	=>	$reg_time,
		);


        if($banner_id)
            $result = $this->config_model->updateBanner($data);
        else
		    $result = $this->config_model->insertBanner($data);

		$this->msg("정상적으로 등록되었습니다.");
		$this->goURL("/admin/configAdm/bannerList");
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
