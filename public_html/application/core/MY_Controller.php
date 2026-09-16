<?php
ini_set('display_errors','1');
date_default_timezone_set('Asia/Seoul');

class MY_Controller extends CI_Controller
{

  function __construct()
  {
      parent::__construct();
      
      if(empty($this->session->userdata('CHAR'))){
        $this->setChar('en_US');
      }
      
      $this->BASE_URL = $this->config->config['base_url'];
      
      $this->load->model('adm_model');
      $this->load->model('user_model');
      $this->load->model('category_model');
      $this->load->model('academi_model');
      $this->load->model('sms_model');
      
      
      $this->load->library('encryption');
      $this->load->library('parser');
      $this->load->helper('url');
      $this->load->helper('form');
      $this->load->helper('cookie');
      $this->load->library('user_agent');
      $this->load->library('session');
      $this->load->library('getID3/Getid3');
      $this->load->database();
      
      // board skin folder check
      $this->load->helper("directory");
      
	  $map = directory_map('./application/views/board/skin/');
      $this->boardSkin = array();
      
      if($this->agent->is_mobile()){
        $this->device = "mobile";
      }else{
        $this->device = "web";
      }
      
      $this->CONFIG_DATA = array(
        "base_url"  =>  $this->BASE_URL,
        //"board_list"  =>  $this->BOARDS,
        "device"     => $this->device,
        "is_main"   =>  "false"
      );
      
      
      if(!empty($this->session->userdata("user_id"))){
        $this->duplicateLoginCheck();
      }
      

      $this->CONFIG_DATA['og_url'] = "https://nanobook.themvp.kr/";
      $this->CONFIG_DATA['og_title'] = "나노의 책장";
      $this->CONFIG_DATA['og_desc'] = "나노의 책장입니다.";
      $this->CONFIG_DATA['og_image'] = "";

      if(!empty($this->session->userdata("user_id"))){
          $this->CONFIG_DATA['userData'] = $this->user_model->getUserData($this->session->userdata("user_id"));
          $this->CONFIG_DATA['userData']['grade_org'] = $this->CONFIG_DATA['userData']['grade'];
          switch($this->CONFIG_DATA['userData']['grade']) {
              case "0" :
                $this->CONFIG_DATA['userData']['grade'] = "미취학";
              break;
              case "1" :
                $this->CONFIG_DATA['userData']['grade'] = "초1";
              break;
              case "2" :
                $this->CONFIG_DATA['userData']['grade'] = "초2";
              break;
              case "3" :
                $this->CONFIG_DATA['userData']['grade'] = "초3";
              break;
              case "4" :
                $this->CONFIG_DATA['userData']['grade'] = "초4";
              break;
              case "5" :
                $this->CONFIG_DATA['userData']['grade'] = "초5";
              break;
              case "6" :
                $this->CONFIG_DATA['userData']['grade'] = "초6";
              break;
              case "7" :
                $this->CONFIG_DATA['userData']['grade'] = "중1";
              break;
              case "8" :
                $this->CONFIG_DATA['userData']['grade'] = "중2";
              break;
              case "9" :
                $this->CONFIG_DATA['userData']['grade'] = "중3";
              break;  
              case "10" :
                $this->CONFIG_DATA['userData']['grade'] = "고1";
              break;  
              case "11" :
                $this->CONFIG_DATA['userData']['grade'] = "고2";
              break;   
              case "12" :
                $this->CONFIG_DATA['userData']['grade'] = "고3";
              break;       
          }
 
	  	  //$this->CONFIG_DATA['locationData'] = $this->config_model->getConfig('location');
          //$this->CONFIG_DATA['total_like'] = $this->user_model->getTotalLike($this->session->userdata("user_id"));
          //$this->CONFIG_DATA['total_comment'] = $this->user_model->getTotalComment($this->session->userdata("user_id"));
          //$this->CONFIG_DATA['alarmData'] = $this->user_model->getAlarm($this->session->userdata("user_id"));
  	  	  //$this->CONFIG_DATA['notice_yn'] = $this->user_model->getNoticeHistory($this->session->userdata("user_id"));
      
          $this->duplicateLoginCheck();
	  }

      if(!empty($this->session->userdata("admin_id"))){
          $this->CONFIG_DATA['userData'] = array(
            "user_id" =>  'admin',
            'user_seq'  =>  0,
            'oauth_yn'  =>  'N'
          );
          $this->CONFIG_DATA['total_like'] = 0;
          $this->CONFIG_DATA['total_comment'] = 0;
      }




      if(is_array($map)){
          foreach($map as $key=>$value){
  	  		array_push($this->boardSkin,array("name" => str_replace('/','',$key)));
  	  	}
      }

      //if(!empty($this->session->userdata("academy_seq"))){
      //    //$infoData = $this->academi_model->getMainInfoData();
      //    $this->CONFIG_DATA['infoData'] = $infoData;
      //}
     
      /*
      카테고리 세팅
      @menu array
      [
      "seq",
      "category_code",
      "category_name_kor",
      "category_name_eng",
      "category_name_chn",
      "view_num",
      "view_yn"
      ]
      @return array menu[0]["depth2"][0]
      */
      //$this->menuSetting();
     
      //사이트설정 불러오기
      //$this->CONFIG_DATA['site_config'] = $this->adm_model->getSiteConfig();
     
      //terms / privacy 불러오기
      //$termPrivacy = $this->adm_model->getTermPrivacy();
     
      //$this->CONFIG_DATA['terms'] = $termPrivacy['terms'];
      //$this->CONFIG_DATA['privacy'] = $termPrivacy['privacy'];
      //$this->CONFIG_DATA['exam'] = $termPrivacy['exam'];
  }

  public function loginCheck()
  {
      if(empty($this->session->userdata("user_id"))){
          $this->msg2("로그인해주세요","/login");
          //$this->goURL("/login");
          exit;
      }
  }

  public function setChar($str)
  {
      $this->session->set_userdata('CHAR',$str);
  }

  public function getChar()
  {
      return $this->session->userdata('CHAR');
  }

  public function msg($str)
  {
    //echo '<meta property="og:url" content="'.$this->CONFIG_DATA['og_url'].'">';
    //echo '<meta property="og:title" content="'.$this->CONFIG_DATA['og_title'].'">';
    echo '<meta property="og:type" content="website">';
    //echo '<meta property="og:image" content="'.$this->CONFIG_DATA['og_image'].'">';
    //echo '<meta property="og:description" content="'.$this->CONFIG_DATA['og_desc'].'">';
    echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
    echo "<script>alert('".$str."');</script>";
  }

  public function msg2($str,$url)
  {
    echo '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />';
    //echo '<meta property="og:url" content="'.$this->CONFIG_DATA['og_url'].'">';
    //echo '<meta property="og:title" content="'.$this->CONFIG_DATA['og_title'].'">';
    echo '<meta property="og:type" content="website">';
//    echo '<meta property="og:image" content="'.$this->CONFIG_DATA['og_image'].'">';
    //echo '<meta property="og:description" content="'.$this->CONFIG_DATA['og_desc'].'">';
    echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
    echo '<script src="/js/jquery-3.6.0.min.js"></script>';
    echo '<script src="/js/jquery.slider.min.js"></script>';
    echo '<script src="/js/swiper-bundle.min.js"></script>';
    echo '<script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>';
    echo '<script>';
    echo '$(function(){';
    echo 'swal("'.$str.'")';
    echo '.then((value)=>{';
    echo 'location.href="'.$url.'"';
    echo '})';
    echo '});';
    echo '</script>';

  }

  public function msg3($str)
  {
    echo '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />';
    //echo '<meta property="og:url" content="'.$this->CONFIG_DATA['og_url'].'">';
    //echo '<meta property="og:title" content="'.$this->CONFIG_DATA['og_title'].'">';
    echo '<meta property="og:type" content="website">';
    //echo '<meta property="og:image" content="'.$this->CONFIG_DATA['og_image'].'">';
    //echo '<meta property="og:description" content="'.$this->CONFIG_DATA['og_desc'].'">';
    echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
    echo '<script src="/js/jquery-3.6.0.min.js"></script>';
    echo '<script src="/js/jquery.slider.min.js"></script>';
    echo '<script src="/js/swiper-bundle.min.js"></script>';
    echo '<script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>';
    echo '<script>';
    echo '$(function(){';
    echo 'swal("'.$str.'")';
    echo '.then((value)=>{';
    echo 'window.close();';
    echo '})';
    echo '});';
    echo '</script>';

  }

  public function goBack()
  {
    echo "<script>history.back();</script>";
  }

  public function goURL($url)
  {
    echo "<script>location.href=\"".$url."\"</script>";
  }

  //check auth controll / 메뉴접근 권한 체크
  public function authChk($checkStr)
  {
    $adminUserAuth = $this->session->auth_control;
    $val = in_array($checkStr,$adminUserAuth);

    return $val;
  }

  // send html mail
  public function send_htmlmail($fromEmail, $fromName, $toEmail, $toName, $subject, $message){

   $charset='utf-8'; // 문자셋 : UTF-8
   $body = iconv('utf-8', 'euc-kr', $message);  //본문 내용 UTF-8화
   $encoded_subject="=?".$charset."?B?".base64_encode($subject)."?=\n"; // 인코딩된 제목
   $to= "\"=?".$charset."?B?".base64_encode($toName)."?=\" <".$toEmail.">" ; // 인코딩된 받는이
   $from= "\"=?".$charset."?B?".base64_encode($fromName)."?=\" <".$fromEmail.">" ; // 인코딩된 보내는이

   $headers="MIME-Version: 1.0\n".
   "Content-Type: text/html; charset=euc-kr; format=flowed\n".
   "To: ". $to ."\n".
   "From: ".$from."\n".
   "Return-Path: ".$from."\n".
   "urn:content-classes:message\n".
   "Content-Transfer-Encoding: 8bit\n"; // 헤더 설정

   //send the email
   $mail_sent = @mail( $to, $encoded_subject, $body, $headers );
   //if the message is sent successfully print "Mail sent". Otherwise print "Mail failed"

   return $mail_sent;
  }

  // 파일 압축 메소드
  public function compress_image($source, $destination, $quality) {
      $info = getimagesize($source);
      if ($info['mime'] == 'image/jpeg')
          $image = imagecreatefromjpeg($source);
      elseif ($info['mime'] == 'image/gif')
          $image = imagecreatefromgif($source);
      elseif ($info['mime'] == 'image/png')
          $image = imagecreatefrompng($source);

   elseif ($info['mime'] == 'image/x-ms-bmp')
    $image = imagecreatefrombmp($source);

      imagejpeg($image, $destination, $quality);
      return $destination;
  }



  public function imagecreatefrombmp($p_sFile) {
    $file = fopen($p_sFile, "rb");
    $read = fread($file, 10);
    while (!feof($file) && ($read <> ""))
        $read .= fread($file, 1024);
    $temp = unpack("H*", $read);
    $hex = $temp[1];
    $header = substr($hex, 0, 108);
    if (substr($header, 0, 4) == "424d") {
        $header_parts = str_split($header, 2);
        $width = hexdec($header_parts[19] . $header_parts[18]);
        $height = hexdec($header_parts[23] . $header_parts[22]);
        unset($header_parts);
    }
    $x = 0;
    $y = 1;
    $image = imagecreatetruecolor($width, $height);
    $body = substr($hex, 108);
    $body_size = (strlen($body) / 2);
    $header_size = ($width * $height);
    $usePadding = ($body_size > ($header_size * 3) + 4);
    for ($i = 0; $i < $body_size; $i+=3) {
        if ($x >= $width) {
            if ($usePadding)
                $i += $width % 4;
            $x = 0;
            $y++;
            if ($y > $height)
                break;
        }
        $i_pos = $i * 2;
        $r = hexdec($body[$i_pos + 4] . $body[$i_pos + 5]);
        $g = hexdec($body[$i_pos + 2] . $body[$i_pos + 3]);
        $b = hexdec($body[$i_pos] . $body[$i_pos + 1]);
        $color = imagecolorallocate($image, $r, $g, $b);
        imagesetpixel($image, $x, $height - $y, $color);
        $x++;
    }
    unset($body);
    return $image;
  }

  public function encrypt($type,$msg)
  {
    $key = $this->config->config['encryption_key'];
    if( $type == "password" ){
      $key = $this->config->config['password_key'];
    }

    $this->encryption->initialize(
        array(
                'cipher' => 'aes-256'       //  암호화 알고리즘
                ,'key'   =>  $key           //  암호화 키
                ,'mode'  =>  'ctr'          //  암호화 모드
                )
    );

    return $this->encryption->encrypt($msg);
  }

  public function decrypt($type,$msg)
  {

    $key = $this->config->config['encryption_key'];
    if( $type == "password" ){
      $key = $this->config->config['password_key'];
    }

    $this->encryption->initialize(
        array(
                'cipher' => 'aes-256'       //  암호화 알고리즘
                ,'key'   =>  $key           //  암호화 키
                ,'mode'  =>  'ctr'          //  암호화 모드
                )
    );

    return $this->encryption->decrypt($msg);
  }

  public function getFullURL()
  {
    return base_url().uri_string()."?".$_SERVER["QUERY_STRING"];
  }

  public function menuSetting()
  {
    $depth1 = $this->category_model->getDepth1();
    $this->CONFIG_DATA["menu"] = $depth1;
    for($i = 0; $i < count($depth1); $i++){
      $category_num = $depth1[$i]['category_code'];
      $depth2 = $this->category_model->getDepthCategoryList($category_num);
      if(count($depth2) > 0){
        $this->CONFIG_DATA["menu"][$i]["depth2"] = $depth2;
      }
    }
  }

  //수료체크
  /*
  array(
    class_code,
    course_code,
    user_id
  )
  */
  public function isPassCheckUpdate($arr)
  {
    $class_code = $arr['class_code'];
    $course_code = $arr['course_code'];
    $user_id = $arr['user_id'];
    $exam_type = "LAST";

    $examData = array(
      "class_code"    =>  $class_code,
      "course_code"   =>  $course_code,
      "user_id"       =>  $user_id,
      "exam_type"     =>  $exam_type
    );

    //코스에서 조건 체크
    $courseData = $this->course_model->getCourseCode($course_code);

    //학생시험데이터
    $userExamData = $this->exam_model->getUserExam($examData);

  }

  //핸드폰 하이픈
  public function add_hyphen($tel)
  {
    $tel = preg_replace("/[^0-9]*/s","",$tel); //숫자이외 제거
    return preg_replace("/([0-9]{3})([0-9]{3,4})([0-9]{4})$/","\\1-\\2-\\3" ,$tel);
  }

  //배열 그룹화
  public function array_group_by(array $array, $key)
	{
		if (!is_string($key) && !is_int($key) && !is_float($key) && !is_callable($key) ) {
			trigger_error('array_group_by(): The key should be a string, an integer, or a callback', E_USER_ERROR);
			return null;
		}

		$func = (!is_string($key) && is_callable($key) ? $key : null);
		$_key = $key;

		// Load the new array, splitting by the target key
		$grouped = [];
		foreach ($array as $value) {
			$key = null;

			if (is_callable($func)) {
				$key = call_user_func($func, $value);
			} elseif (is_object($value) && property_exists($value, $_key)) {
				$key = $value->{$_key};
			} elseif (isset($value[$_key])) {
				$key = $value[$_key];
			}

			if ($key === null) {
				continue;
			}

			$grouped[$key][] = $value;
		}

		// Recursively build a nested grouping if more parameters are supplied
		// Each grouped array value is grouped according to the next sequential key
		if (func_num_args() > 2) {
			$args = func_get_args();

			foreach ($grouped as $key => $value) {
				$params = array_merge([ $value ], array_slice($args, 2, func_num_args()));
				$grouped[$key] = call_user_func_array('array_group_by', $params);
			}
		}

		return $grouped;
	}

  public function get_client_ip()
  {
      $ipaddress = '';
      if (getenv('HTTP_CLIENT_IP'))
          $ipaddress = getenv('HTTP_CLIENT_IP');
      else if(getenv('HTTP_X_FORWARDED_FOR'))
          $ipaddress = getenv('HTTP_X_FORWARDED_FOR');
      else if(getenv('HTTP_X_FORWARDED'))
          $ipaddress = getenv('HTTP_X_FORWARDED');
      else if(getenv('HTTP_FORWARDED_FOR'))
          $ipaddress = getenv('HTTP_FORWARDED_FOR');
      else if(getenv('HTTP_FORWARDED'))
          $ipaddress = getenv('HTTP_FORWARDED');
      else if(getenv('REMOTE_ADDR'))
          $ipaddress = getenv('REMOTE_ADDR');
      else
          $ipaddress = 'UNKNOWN';
      return $ipaddress;
  }

  //sms 전송
  /*
  $receiver = 받는번호
  $title = 제목
  $msg = 내용
  $send_date = 예약일(없으면 즉시)
  $send_time = 예약시간(없으면 즉시)
  $user_name = 받는사람 이름
  $sms_type = D: 직접발송,A: 자동발송
  */
  public function send_sms($receiver,$title,$msg,$send_date,$send_time,$user_name,$sms_type)
  {
    /**************** 문자전송하기 예제 필독항목 ******************/
    /* 동일내용의 문자내용을 다수에게 동시 전송하실 수 있습니다
    /* 대량전송시에는 반드시 컴마분기하여 1천건씩 설정 후 이용하시기 바랍니다. (1건씩 반복하여 전송하시면 초당 10~20건정도 발송되며 컨텍팅이 지연될 수 있습니다.)
    /* 전화번호별 내용이 각각 다른 문자를 다수에게 보내실 경우에는 send 가 아닌 send_mass(예제:curl_send_mass.html)를 이용하시기 바랍니다.

    /****************** 인증정보 시작 ******************/
    $sms_url = "https://apis.aligo.in/send/"; // 전송요청 URL
    $sms['user_id'] = $this->config->config['sms_id']; // SMS 아이디
    $sms['key'] = $this->config->config['sms_key'];//인증키
    /****************** 인증정보 끝 ********************/

    /****************** 전송정보 설정시작 ****************/
    $_POST['msg'] = '%고객명%님. 안녕하세요. API TEST SEND'; // 메세지 내용 : euc-kr로 치환이 가능한 문자열만 사용하실 수 있습니다. (이모지 사용불가능)
    //$_POST['receiver'] = ''; // 수신번호
    $destination = $receiver."|".$user_name; // 수신인 %고객명% 치환
    $sender ="010-7141-4186"; // 발신번호
    //$_POST['rdate'] = ''; // 예약일자 - 20161004 : 2016-10-04일기준
    //$_POST['rtime'] = ''; // 예약시간 - 1930 : 오후 7시30분
    //$_POST['testmode_yn'] = 'Y'; // Y 인경우 실제문자 전송X , 자동취소(환불) 처리
    //$_POST['subject'] = $title; //  LMS, MMS 제목 (미입력시 본문중 44Byte 또는 엔터 구분자 첫라인)
    // $_POST['image'] = '/tmp/pic_57f358af08cf7_sms_.jpg'; // MMS 이미지 파일 위치 (저장된 경로)
    //$_POST['msg_type'] = ''; //  SMS, LMS, MMS등 메세지 타입을 지정
    // ※ msg_type 미지정시 글자수/그림유무가 판단되어 자동변환됩니다. 단, 개행문자/특수문자등이 2Byte로 처리되어 SMS 가 LMS로 처리될 가능성이 존재하므로 반드시 msg_type을 지정하여 사용하시기 바랍니다.
    /****************** 전송정보 설정끝 ***************/

    $sms['msg'] = stripslashes($msg);
    $sms['receiver'] = $receiver;
    $sms['destination'] = $destination;
    $sms['sender'] = $sender;
    $sms['rdate'] = $send_date;
    $sms['rtime'] = $send_time;
    $sms['testmode_yn'] = '';
    $sms['title'] = $title;
    $sms['msg_type'] = '';
    // 만일 $_FILES 로 직접 Request POST된 파일을 사용하시는 경우 move_uploaded_file 로 저장 후 저장된 경로를 사용하셔야 합니다.
    /*
    if(!empty($_FILES['image']['tmp_name'])) {
    	$tmp_filetype = mime_content_type($_FILES['image']['tmp_name']);
    	if($tmp_filetype != 'image/png' && $tmp_filetype != 'image/jpg' && $tmp_filetype != 'image/jpeg') $_POST['image'] = '';
    	else {
    		$_savePath = "./".uniqid(); // PHP의 권한이 허용된 디렉토리를 지정
    		if(move_uploaded_file($_FILES['file']['tmp_name'], $_savePath)) {
    			$_POST['image'] = $_savePath;
    		}
    	}
    }
    // 이미지 전송 설정
    if(!empty($_POST['image'])) {
    	if(file_exists($_POST['image'])) {
    		$tmpFile = explode('/',$_POST['image']);
    		$str_filename = $tmpFile[sizeof($tmpFile)-1];
    		$tmp_filetype = mime_content_type($_POST['image']);
    		if ((version_compare(PHP_VERSION, '5.5') >= 0)) { // PHP 5.5버전 이상부터 적용
    			$sms['image'] = new CURLFile($_POST['image'], $tmp_filetype, $str_filename);
    			curl_setopt($oCurl, CURLOPT_SAFE_UPLOAD, true);
    		} else {
    			$sms['image'] = '@'.$_POST['image'].';filename='.$str_filename. ';type='.$tmp_filetype;
    		}
    	}
    }
    */
    /*****/
    $host_info = explode("/", $sms_url);
    $port = $host_info[0] == 'https:' ? 443 : 80;

    $oCurl = curl_init();
    curl_setopt($oCurl, CURLOPT_PORT, $port);
    curl_setopt($oCurl, CURLOPT_URL, $sms_url);
    curl_setopt($oCurl, CURLOPT_POST, 1);
    curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($oCurl, CURLOPT_POSTFIELDS, $sms);
    curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, FALSE);
    $ret = curl_exec($oCurl);
    curl_close($oCurl);

    $retArr = json_decode($ret); // 결과배열
    //print_r($retArr); // Response 출력 (연동작업시 확인용)

    /**** Response 항목 안내 ****
    // result_code : 전송성공유무 (성공:1 / 실패: -100 부터 -999)
    // message : success (성공시) / reserved (예약성공시) / 그외 (실패상세사유가 포함됩니다)
    // msg_id : 메세지 고유ID = 고유값을 반드시 기록해 놓으셔야 sms_list API를 통해 전화번호별 성공/실패 유무를 확인하실 수 있습니다
    // error_cnt : 에러갯수 = receiver 에 포함된 전화번호중 문자전송이 실패한 갯수
    // success_cnt : 성공갯수 = 이동통신사에 전송요청된 갯수
    // msg_type : 전송된 메세지 타입 = SMS / LMS / MMS (보내신 타입과 다른경우 로그로 기록하여 확인하셔야 합니다)
    /**** Response 예문 끝 ****/

    if($retArr->result_code!=1){
      $msg_id = "";
      $msg_type = "ERR";
    }else{
      $msg_id = $retArr->msg_id;
      $msg_type = $retArr->msg_type;
    }


      $insertData = array(
        "user_name" =>  $user_name,
        "receiver"  =>  $receiver,
        "sender"    =>  $sender,
        "title"     =>  $title,
        "msg"       =>  stripslashes($msg),
        "r_date"    =>  $send_date,
        "r_time"    =>  $send_time,
        "result_code" =>  $retArr->result_code,
        "message"     =>  $retArr->message,
        "msg_id"      =>  $msg_id,
        "msg_type"    =>  $msg_type,
        "sms_type"    =>  $sms_type,
        "reg_datetime"  =>  date("Y-m-d H:i:s")
      );

      $this->sms_model->insertSmsLog($insertData);



  }

  // 'HH:mm:ss' 형태의 시간을 초로 환산
  public function getSeconds($HMS)
  {
      $tmp = explode(':', $HMS);
      $std = mktime(0,0,0,date('n'),date('j'),date('Y'));
      $scd = mktime(intval($tmp[0]), intval($tmp[1]), intval($tmp[2]));

      return intval($scd-$std);
  }

  // 초를 'HH:mm:ss' 형태로 환산
  public function getTimeFromSeconds($seconds)
  {
      $h = sprintf("%02d", intval($seconds) / 3600);
      $tmp = $seconds % 3600;
      $m = sprintf("%02d", $tmp / 60);
      $s = sprintf("%02d", $tmp % 60);

      return $h.':'.$m.':'.$s;
  }

  //폴더용량 체크
  public function dirsize($dir){
       $size = 0;
       $cnt = 0;

       if(is_dir($dir)){
         $fp = opendir($dir);
         while(false !== ($entry = readdir($fp))){
               if(($entry != ".") && ($entry != "..")){
                    if(is_dir($dir.'/'.$entry)){
                         clearstatcache();
                         $this->dirsize($dir.'/'.$entry);
                    } else if(is_file($dir.'/'.$entry)){
                         $size += filesize($dir.'/'.$entry);
                         clearstatcache();
                         $cnt++;
                    }
               }
         }
        closedir($fp);
       }

      return $size;
 }

 //단위변환
 public function convertFileSize($size,$unit)
 {
   if($unit == "KB")
   {
    return $fileSize = round($size / 1024,2) . 'KB';
   }
   if($unit == "MB")
   {
    return $fileSize = round($size / 1024 / 1024,2) . 'MB';
   }
   if($unit == "GB")
   {
    return $fileSize = round($size / 1024 / 1024 / 1024,2) . 'GB';
   }
 }

 public function getAudioTime($audio_url)
 {
   $audio_url = $_SERVER['DOCUMENT_ROOT'].$audio_url;
   $getID3 = new getID3;
   $file_info = $getID3->analyze($audio_url);
   $play_time = $this->getTimeFromSeconds($file_info['playtime_seconds']);

   return $play_time;

 }

 public function duplicateLoginCheck()
 {
   $user_id = $this->session->userdata("user_id");
   $session_key = $this->session->userdata("login_key");

   $loginData = $this->user_model->getDuplicateLoginCheck($user_id,$session_key);

   if(!is_array($loginData)){
     $this->session->sess_destroy();
     $this->msg2("다른곳에서 로그인하여 로그아웃 합니다.","/");
     exit;
   }
 }

 public function duplicateLoginCheckAjax()
 {
   $user_id = $this->session->userdata("user_id");
   $session_key = $this->session->userdata("login_key");

   $loginData = $this->user_model->getDuplicateLoginCheck($user_id,$session_key);

   if(is_array($loginData)){
     $returnData = "N";
   }else{
     $returnData = "Y";
     $this->session->sess_destroy();
   }

   return $returnData;
 }

 //글자뒤 ... 표시
 public function short_text($string,$limit_length,$last_text)
 {
   $return_str = "";
   if(mb_strlen($string,'utf-8') > $limit_length){
    $return_str = mb_substr($string,0,$limit_length,'utf-8');
    $return_str = $return_str.$last_text;
  }else{
    $return_str = $string;
  }

  return $return_str;
 }

 public function passwordGenerator( $length=12 ){

    $counter = ceil($length/4);
    // 0보다 작으면 안된다.
    $counter = $counter > 0 ? $counter : 1;

    $charList = array(
                    array("0", "1", "2", "3", "4", "5","6", "7", "8", "9", "0"),
                    array("a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"),
                    array("!", "@", "#", "%", "^", "&", "*")
                );
    $password = "";
    for($i = 0; $i < $counter; $i++)
    {
        $strArr = array();
        for($j = 0; $j < count($charList); $j++)
        {
            $list = $charList[$j];

            $char = $list[array_rand($list)];
            $pattern = '/^[a-z]$/';
            // a-z 일 경우에는 새로운 문자를 하나 선택 후 배열에 넣는다.
            if( preg_match($pattern, $char) ) array_push($strArr, strtoupper($list[array_rand($list)]));
            array_push($strArr, $char);
        }
        // 배열의 순서를 바꿔준다.
        shuffle( $strArr );

        // password에 붙인다.
        for($j = 0; $j < count($strArr); $j++) $password .= $strArr[$j];
    }
    // 길이 조정
    return substr($password, 0, $length);
  }

  public function secToString($datetime)
  {
    $sec = time() - strtotime($datetime);
    if ($sec < 60) {
        $sec_str = $sec."초 전";
    } else if ($sec > 60 && $sec < 3600) {
        $f = floor($sec / 60);
        $sec_str = $f."분 전";
    } else if ($sec > 3600 && $sec < 86400) {
        $f = floor($sec / 3600);
        $sec_str = $f."시간 전";
    } else {
        $sec_str = substr($datetime, 0, 10);
    }

    return $sec_str;
  }

  //알람넣기
  public function addAlarm($data)
  {
    $send_id = $data['send_id'];
    $alarm_target = $data['alarm_target'];
    $alarm_type = $data['alarm_type'];
    $school_seq = empty($data['school_seq']) ? 0:$data['school_seq'];
    $school_class_seq = empty($data['school_class_seq']) ? 0 : $data['school_class_seq'];
    $feed_seq = empty($data['feed_seq']) ? 0 : $data['feed_seq'];
    $quiz_seq = empty($data['quiz_seq']) ? 0 : $data['quiz_seq'];
    $to_id = empty($data['to_id']) ? "" : $data['to_id'];
    $title = $data['title'];
    $link = empty($data['link']) ? "" : $data['link'];
    $reg_date = date("Y-m-d H:i:s");

    $arr = array(
      "send_id" =>  $send_id,
      "alarm_target"  =>  $alarm_target,
      "alarm_type"  =>  $alarm_type,
      "school_seq"  =>  $school_seq,
      "school_class_seq"  =>  $school_class_seq,
      "feed_seq"  =>  $feed_seq,
      "quiz_seq"  =>  $quiz_seq,
      "to_id" =>  $to_id,
      "title" =>  $title,
      "link"  =>  $link,
      "reg_date"  =>  $reg_date,
    );

    putenv('GOOGLE_APPLICATION_CREDENTIALS='.FCPATH.'/fcm_auth.json');

    $scope = 'https://www.googleapis.com/auth/firebase.messaging';

    $client = new Google_Client();

    $client->useApplicationDefaultCredentials();

    $client->setScopes($scope);

		$auth_key = $client->fetchAccessTokenWithAssertion();

		$access_token = $auth_key['access_token'];

    //푸시 보내는 소스
    if($alarm_target=="all"){
      $userData = $this->user_model->getPushAllUser();
      for($i=0; $i<count($userData); $i++){
        $appkey = $userData[$i]['app_key'];
        $app_title = '퀴즈등록';
        $app_content = $title;
        $link_url = $link;
        $this->appPush($appkey,$app_title,$app_content,$link_url,$access_token);
      }
    }else if($alarm_target=="user"){
      switch($alarm_type){
        case "comment":
        $app_title = "댓글";
        break;
        case "like":
        $app_title = "좋아요";
        break;
        case "feed":
        $app_title = "피드등록";
        break;
        case "carbon":
        $app_title = "탄소절감";
        break;
        case "qna":
        $app_title = "문의답글";
        break;
        case "delete":
        $app_title = "피드삭제";
        break;
      }
      $userData = $this->user_model->getPushUser($to_id,$alarm_type);

      if(is_array($userData)){
        $appkey = $userData['app_key'];
        $app_content = $title;
        $this->appPush($appkey,$app_title,$app_content,$link,$access_token);
      }
    }else if($alarm_target=="school_class"){
      $userData = $this->user_model->getPushSchoolClassUser($send_id,$school_seq,$school_class_seq);
      for($i=0; $i<count($userData); $i++){
        $appkey = $userData[$i]['app_key'];
        $app_title = '피드등록';
        $app_content = '같은 학급에서 새로운 피드를 등록했습니다';
        $link_url = '/feed/feedView/'.$feed_seq;
        $this->appPush($appkey,$app_title,$app_content,$link_url,$access_token);
      }
    }


    $this->user_model->insertAlarm($arr);
  }

  //알람빼기
  public function removeAlarm($data)
  {
    $send_id = $data['send_id'];
    $alarm_target = $data['alarm_target'];
    $alarm_type = $data['alarm_type'];
    $school_seq = empty($data['school_seq']) ? 0:$data['school_seq'];
    $school_class_seq = empty($data['school_class_seq']) ? 0 : $data['school_class_seq'];
    $feed_seq = empty($data['feed_seq']) ? 0 : $data['feed_seq'];
    $quiz_seq = empty($data['quiz_seq']) ? 0 : $data['quiz_seq'];
    $to_id = empty($data['to_id']) ? "" : $data['to_id'];
    $title = $data['title'];
    $link = empty($data['link']) ? "" : $data['link'];
    $reg_date = date("Y-m-d H:i:s");

    $arr = array(
      "send_id" =>  $send_id,
      "alarm_target"  =>  $alarm_target,
      "alarm_type"  =>  $alarm_type,
      "school_seq"  =>  $school_seq,
      "school_class_seq"  =>  $school_class_seq,
      "feed_seq"  =>  $feed_seq,
      "quiz_seq"  =>  $quiz_seq,
      "to_id" =>  $to_id,
      "title" =>  $title,
      "link"  =>  $link
    );

    $this->user_model->deleteAlarm($arr);
  }

  //푸시보내기
  /*
    appkey = 사용자 앱 키(토큰)
    title = 알람제목
    content = 내용
    link_url = 링크주소
  */
  public function appPush($appkey,$title,$content,$link_url,$access_token)
  {
		$ch = curl_init();



    //header 설정 후 삽입

    $headers = array
    (
        'Authorization: Bearer ' . $access_token,
        'Content-Type: application/json'
    );


    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    curl_setopt($ch, CURLOPT_URL, PUSH_URL);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

    $notification_opt = array (
        'title'         => $title,
        'body'          => $content
        // 'image' => 'http://sowonbyul.com/original/totalAdmin/images/Icon-512.png'
    );



    $datas = array (
        'title' =>  $title,
        'body'  =>  $content,
        'link_url'     => $link_url,
    );

    $android_opt = array (
        'notification' => array(
            'default_sound'         => true
        )
    );

    $message = array
    (
        'token' => $appkey,
        'notification' => $notification_opt,
        'android' => $android_opt,
        'data'  =>  $datas
    );

    $last_msg = array (
        "message" => $message
    );

    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode($last_msg));
    $result = curl_exec($ch);

    if($result === FALSE){
      // die('FCM Send Error: ' . curl_error($ch));
        printf("cUrl error (#%d): %s<br>\n",
        curl_errno($ch),
        htmlspecialchars(curl_error($ch)));
    }

    //echo $result;
  }
  
  
    public function dateChange($date) {

        $date_parts = date_parse_from_format('n/j/Y', $date);
        if ($date_parts['error_count'] === 0 && $date_parts['warning_count'] === 0) {
            // 월, 일, 년도 추출
            $year = $date_parts['year'];
            $month = str_pad($date_parts['month'], 2, '0', STR_PAD_LEFT); // 두 자리 숫자로 포맷
            $day = str_pad($date_parts['day'], 2, '0', STR_PAD_LEFT); // 두 자리 숫자로 포맷

            // 새로운 형식의 날짜 문자열 생성
            $formatted_date = "$year-$month-$day";

            // 결과 출력
            return $formatted_date;
        } else 
            return $date;
    }
}

?>
