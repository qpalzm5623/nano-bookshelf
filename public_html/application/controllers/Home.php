<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Home extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
		/**
		* 언어셋 설정
		*/
		$this->load->config('gettext');
		$this->load->helper('gettext');
		$this->load->model("user_model");
		$this->load->model("board_model");
		$this->load->model("content_model");
		$this->load->model("code_model");
		$this->load->model("config_model");
		$this->load->model("banner_model");
		$this->load->model("school_model");
		$this->load->model("quizHistory_model");
		$this->load->model("book_model");
		$this->load->model("adm_model");
		$this->load->helper("string");
		$charset = array(
			$this->getChar()
		);

		$this->load->library(
            'gettext',
            array(
                'gettext_text_domain' => 'default',
                'gettext_locale' => $charset,
                'gettext_locale_dir' => 'language/locales'
            )
        );

		$this->skin = "basic";
		$this->CONFIG_DATA["skin"]	=	$this->skin;
		$this->CONFIG_DATA['og_url'] = "https://zero.themvp.kr/";
        $this->CONFIG_DATA['og_title'] = "나노의 책장";
        $this->CONFIG_DATA['og_desc'] = "나노의 책장.";

		$this->theme_url = $this->device.'/'.$this->skin;

	}

	public function index()
	{
		//login_check
		if($this->session->userdata("user_id")){
			$this->main();
		}else{
			//$this->intro();
			$this->login();
		}
		//page

	}

	public function login_proc()
	{
		$user_id = $this->input->post("user_id");
		$user_password = $this->input->post("user_password");
		$auto_login = $this->input->post("auto_login");
		$auto_login = empty($auto_login) ? "N":"Y";
		$app_key = $this->input->post("app_key");

		$userData = $this->user_model->getLoginData($user_id,$user_password);

		if( $userData["result"] == "success" ){
			$userData['group_name'] = empty($userData['group_name']) ? "" : $userData['group_name'];
			//session에 저장
			$this->session->set_userdata("user_id" , $user_id);
			$this->session->set_userdata("group_user_seq",$userData['group_user_seq']);
			$this->session->set_userdata("group_name",$userData['group_name']);

			$session_key = random_string("alnum",15);

			$loginData = array(
				"user_seq"	=>	$userData['user_seq'],
				"user_id"	=>	$user_id,
				"login_key"	=> $session_key,
				"user_ip"	=> $this->input->ip_address(),
				"reg_date"	=>	date("Y-m-d H:i:s"),
			);

			$this->session->set_userdata("login_key",$session_key);

			$this->user_model->deleteLogin($user_id);

			$this->user_model->insertLogin($loginData);

			$this->user_model->setAutoLogin($user_id,$auto_login);

			//appkey update
			$this->user_model->updateAppKey($user_id,$app_key);


			$value = $this->security->get_csrf_hash();

			echo '{ "result" : "success", "csrf" : "'.$value.'"}';
			exit;
		} else {
			$message = "";

			switch($userData["msg"]){
				case "user_id" :
					$message = "아이디를 확인해 주세요.";
				break;

				case "user_password":
					$message = "비밀번호가 일치하지 않습니다.";
				break;

				case "status_r":
					$message = "승인대기 상태입니다. 원장님께 문의주세요";
				break;

				case "status_l":
					$message = "탈퇴 상태입니다. 원장님께 문의주세요";
				break;

				case "status_d":
					$message = "삭제된 아이디입니다. 원장님께 문의주세요";
				break;

				case "sns":
					$message = "SNS로 가입한 아이디입니다. SNS로 로그인해주세요";
				break;

				case "school_end":
					$message = "학원에 문의하세요.";
				break;
			}



			echo '{ "result" : "failed" , "msg" : "'.$message.'" }';
			exit;
		}
	}

	public function logout()
	{
		$user_id = $this->session->userdata("user_id");

		$this->session->sess_destroy();

		$this->user_model->deleteLogin($user_id);
		$this->user_model->deleteAutoLogin($user_id);

		echo '{"result":"success"}';
		exit;
	}

	public function autoLoginCheck()
	{
		$app_key = $this->input->post("app_key");
		if(!empty($app_key)){
			$this->session->set_userdata("app_key",$app_key);
			$userData = $this->user_model->getAutoLoginCheck($app_key);

			if(is_array($userData)){
				$user_id = $userData['user_id'];
				//session에 저장
				$this->session->set_userdata("user_id" , $user_id);
				$this->session->set_userdata("school_seq",$userData['school_seq']);

				$session_key = random_string("alnum",15);

				$loginData = array(
					"user_seq"	=>	$userData['user_seq'],
					"user_id"	=>	$user_id,
					"login_key"	=> $session_key,
					"user_ip"	=> $this->input->ip_address(),
					"reg_date"	=>	date("Y-m-d H:i:s"),
				);

				$this->session->set_userdata("login_key",$session_key);

				$this->user_model->deleteLogin($user_id);

				$this->user_model->insertLogin($loginData);
				echo '{"result":"success"}';
				exit;
			}else{
				echo '{"result":"failed"}';
				exit;
			}
		}else{
			echo '{"result":"failed"}';
			exit;
		}


	}

	public function intro()
	{
		$sub = "landing";

		$depth1 = "landing";
		$depth2 = "landing";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;



		$kakao_apiURL = "https://kauth.kakao.com/oauth/authorize?client_id=".KAKAO_API_KEY."&response_type=code&redirect_uri=".urlencode(KAKAO_CALLBACK_URL);

		//$this->session->sess_destroy();

		// 네이버 로그인 접근토큰 요청 예제
		$naver_state = md5(microtime() . mt_rand());
		$this->session->set_userdata('naver_login_state',$naver_state);
		$naver_apiURL = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=".NAVER_CLIENT_ID."&redirect_uri=".urlencode(NAVER_CALLBACK_URL)."&state=".$naver_state;

		$facebook_state = bin2hex(openssl_random_pseudo_bytes(16));	//탈취 방지위한 랜덤문자열
		$this->session->set_userdata('facebook_login_state',$facebook_state);
		$appID = FACEBOOK_API_KEY;	//페이스북 앱 아이디
		$redirectUri = urlencode(FACEBOOK_CALLBACK_URL);	//로그인 요청 처리할 주소
		$permissions = urlencode('public_profile,email,user_birthday,user_gender');	//요청할 권한

		//로그인 주소 생성
		$facebook_apiURL = "https://www.facebook.com/v16.0/dialog/oauth?client_id=$appID&state=$facebook_state&redirect_uri=$redirectUri&scope=$permissions";

		$data = array(
			"naver_apiURL"	=>	$naver_apiURL,
			"kakao_apiURL"	=>	$kakao_apiURL,
			"facebook_apiURL"	=>	$facebook_apiURL
		);

		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('landing',$data);
	}

	public function login()
	{
		$sub = "login";
		$page_title = "로그인";

		$depth1 = "login";
		$depth2 = "login";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		$this->CONFIG_DATA["page_title"] = $page_title;

		$kakao_apiURL = "https://kauth.kakao.com/oauth/authorize?client_id=".KAKAO_API_KEY."&response_type=code&redirect_uri=".urlencode(KAKAO_CALLBACK_URL);

		//$this->session->sess_destroy();

		// 네이버 로그인 접근토큰 요청 예제
		$naver_state = md5(microtime() . mt_rand());
		$this->session->set_userdata('naver_login_state',$naver_state);
		$naver_apiURL = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=".NAVER_CLIENT_ID."&redirect_uri=".urlencode(NAVER_CALLBACK_URL)."&state=".$naver_state;

		$facebook_state = bin2hex(openssl_random_pseudo_bytes(16));	//탈취 방지위한 랜덤문자열
		$this->session->set_userdata('facebook_login_state',$facebook_state);
		$appID = FACEBOOK_API_KEY;	//페이스북 앱 아이디
		$redirectUri = urlencode(FACEBOOK_CALLBACK_URL);	//로그인 요청 처리할 주소
		$permissions = urlencode('public_profile,email,user_birthday,user_gender');	//요청할 권한

		//로그인 주소 생성
		$facebook_apiURL = "https://www.facebook.com/v16.0/dialog/oauth?client_id=$appID&state=$facebook_state&redirect_uri=$redirectUri&scope=$permissions";

		$data = array(
			"naver_apiURL"	=>	$naver_apiURL,
			"kakao_apiURL"	=>	$kakao_apiURL,
			"facebook_apiURL"	=>	$facebook_apiURL,
			"page_title"	=>	$page_title
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('member/login',$data);
	}

	public function main()
	{
		$this->loginCheck();

		$sub = "main";

		$depth1 = "home";
		$depth2 = "main";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;
		$this->CONFIG_DATA["is_main"]	=	"true";

		//$challengeList = $this->content_model->getChallengeDepth1();
		$userData = $this->CONFIG_DATA['userData'];
		
		$whereData = array("where" => " and group_name='".$userData['group_name']."' and class_name='".$userData['class_name']."'", "limit" => "limit 1", "group_name"=>$userData['group_name'], "class_name"=>$userData['class_name']);
		$teacherData = $this->user_model->getTeacherData($whereData);
		$userData['teacher_name'] = $teacherData['user_name'];
		$userData['complete_n_cnt'] =$userData['share_book_cnt'] - $userData['complete_cnt'];
		$userData['complete_y_cnt'] = $userData['complete_cnt'];
		
		// topic 리스트
		$whereData = array("where" => " and code_group='topic'", "limit" => "limit 50");
		$topicList = $this->code_model->getCodeList($whereData);
		$where ="";
				
		// 공지사항 리스트
		$where = "and group_name='".$this->session->userdata("group_name")."' and notice_display_yn='Y'";
		$whereData = array(
			"sort"			=>	"ORDER BY notice_seq DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 3"
		);

		$noticeList = $this->board_model->getNoticeAppList($whereData);		
		
		// topic 리스트
		$whereData = array("where" => " and status='Y'", "limit" => "limit 5");
		$bannerList = $this->banner_model->getBannerList($whereData);
		$where ="";		
		
		$topic = json_decode($userData['topic']);
		
		
		
		// 7일간 
		// 전체 두종류
		$topicBookList1 = array();
		$topicBookList2 = array();
		$topicBookList3 = array();
		if(@$topic[0] != "") {
    		$where = " AND (a.subject ='{$topic[0]}') AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
            $whereData = array("where"=>$where, "limit"=>"", "user_id" => $userData['user_id']);
            $topicBookList1 = $this->book_model->getBookUserList($whereData);				
        }
        if(@$topic[1] != "") {
    		$where = " AND (a.subject ='{$topic[1]}') AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
            $whereData = array("where"=>$where, "limit"=>"", "user_id" => $userData['user_id']);
            $topicBookList2 = $this->book_model->getBookUserList($whereData);				
        }
        if(@$topic[2] != "") {
		    $where = " AND (a.subject ='{$topic[2]}') AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
            $whereData = array("where"=>$where, "limit"=>"", "user_id" => $userData['user_id']);
            $topicBookList3 = $this->book_model->getBookUserList($whereData);
        }
        
        		
		$recentlyBookList = array();
	    $where = "";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'] , "order"=>"ORDER BY a.reg_date DESC");
        $recentlyBookList = $this->book_model->getBookUserList($whereData);
            		
		$group_prio = !empty($userData['group_name']) ? "CASE WHEN u.group_name = '{$userData['group_name']}' THEN 0 ELSE 1 END, " : "";

		$popularBook7List = array();
	    $where = " AND a.reg_date < DATE_SUB(NOW(), INTERVAL 7 DAY)  AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'], "order"=>" ORDER BY {$group_prio} quiz_use_cnt_7 desc");
        $popularBook7List = $this->book_model->getBookUserList($whereData);		
        
	    $where = "";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'], "order"=>" ORDER BY {$group_prio} quiz_use_cnt desc");
        $popularBookList = $this->book_model->getBookUserList($whereData);		        
        		
		$gradeBook7List = array();
	    $where = " and (a.recommend_class='".$userData['grade_org']."') AND a.reg_date < DATE_SUB(NOW(), INTERVAL 7 DAY)  AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'], "order"=>" ORDER BY {$group_prio} quiz_use_cnt_7 desc");
        $gradeBook7List = $this->book_model->getBookUserList($whereData);		
        
		$gradeBookList = array();
	    $where = " and (a.recommend_class='".$userData['grade_org']."')  AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'], "order"=>" ORDER BY {$group_prio} quiz_use_cnt desc");
        $gradeBookList = $this->book_model->getBookUserList($whereData);		        
		
		// 권장도서 (소속 학원 도서 우선 추천)
		$recommendBookList = array();
	    $where = " and (a.recommend_class='".$userData['grade_org']."') and (a.recommend_yn='Y')  AND ((c.status='Y' OR s.quiz_seq != NULL) OR (u.group_name = '{$userData['group_name']}'))";
        $whereData = array("where"=>$where, "limit"=>" limit 20", "user_id" => $userData['user_id'], "order"=>" ORDER BY {$group_prio} a.reg_date desc");
        $recommendBookList = $this->book_model->getBookUserList($whereData);		        		
		
		
		// 인증 완료 도서
		$where = array("user_id"=>$userData['user_id']);
        $confirm['confirmCnt'] =  @$this->quizHistory_model->getQuizHistoryGroupListTotalCount($where)['cnt'];		
        $confirm['assingmentCnt'] =  @$this->book_model->getBookUserAssignmentTotalCount($where)['cnt'];		


		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"confirm"   =>  $confirm,
			"noticeList" => $noticeList,
			"topicList"	=>	$topicList,
			"bannerList" => $bannerList,
			"userData"	=>	$userData,
			"topicBookList1" => $topicBookList1,
			"topicBookList2" => $topicBookList2,
			"topicBookList3" => $topicBookList3,
			"recentlyBookList" => $recentlyBookList,
			"popularBook7List" => $popularBook7List,
			"popularBookList" => $popularBookList,
			"gradeBook7List" => $gradeBook7List,
			"gradeBookList" => $gradeBookList,
			"recommendBookList" => $recommendBookList,
			"topic"	=>	json_decode($userData['topic']),
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/header',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('main',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
	}

	public function upload_test()
	{
		$data = array();
		$this->parser->parse('/test-upload',$data);
	}

	public function sendEmailAjax()
	{
		$from_email = $this->input->post("from_email");
		$title = $this->input->post("title");
		$content = $this->input->post("content");
		$user_id = $this->session->userdata("user_id");
		$userData = $this->user_model->getUser($user_id);
		$user_name = $userData['user_name'];

		//$academyData = $this->academi_model->getAcademy($this->session->userdata("academy_seq"));

		//$toEmail = $academyData['email'];
		$toEmail = "help@nanobook.kr";
		$toName = "나노의 책장 관리자";

		$result = $this->send_htmlmail($from_email, $user_name, $toEmail, $toName, "[문의] ".$title, $content);

		echo '{"result":"success"}';
		exit;
	}

	public function terms()
	{
		//$this->duplicateLoginCheck();

		$sub = "terms";

		$terms = $this->board_model->getTermsData();
		$terms = nl2br($terms['terms']);

		$data = array(
			"terms"	=>	$terms
		);

		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('/terms',$data);

	}

	public function privacy()
	{
		$sub = "terms";

		$privacy = $this->board_model->getTermsData();
		$privacy = nl2br($privacy['privacy']);

		$data = array(
			"privacy"	=>	$privacy
		);

		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('/privacy',$data);
	}

	public function privacy2()
	{
		$sub = "terms";

		$privacy = $this->board_model->getTermsData();
		$privacy = nl2br($privacy['privacy2']);

		$data = array(
			"privacy"	=>	$privacy
		);

		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('/privacy2',$data);
	}

	public function test_pass()
	{
		echo $this->encrypt("password","rhddb0613$$");
	}

	public function uploadTest()
	{
		$upload_dir = $_SERVER['DOCUMENT_ROOT']."/upload/";
		$img = $this->input->post("challenge_thumb");
		$img = str_replace('data:image/png;base64,', '', $img);
		$img = str_replace(' ', '+', $img);
		$data = base64_decode($img);
		$filename = mktime() . ".png";
		$file = $upload_dir . $filename;
		$success = file_put_contents($file, $data);

		//echo $file;
		echo '{"result":"success","imgUrl":"/upload/'.$filename.'"}';
		exit;
	}

	public function oauth_proc()
	{
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];
		if(empty($user_id)){
			echo '{"result":"failed"}';
			exit;
		}

		$user_name = $this->input->post("user_name");
		$birth_year = $this->input->post("birth_year");
		$birth_month = $this->input->post("birth_month");
		$birth_day = $this->input->post("birth_day");
		$gender = $this->input->post("gender");
		$phone = $this->input->post("phone");
		$email = $this->input->post("email");
		$location = $this->input->post("location");
		$school_name = $this->input->post("school_name");
		$user_ip = $this->input->ip_address();
		$reg_date = date("Y-m-d H:i:s");

		$data = array(
			"user_seq"	=>	$user_seq,
			"user_id"	=>	$user_id,
			"user_name"	=>	$user_name,
			"birth_year"	=>	$birth_year,
			"birth_month"	=>	$birth_month,
			"birth_day"	=>	$birth_day,
			"gender"	=>	$gender,
			"phone"	=>	$phone,
			"email"	=>	$email,
			"location"	=>	$location,
			"school_name"	=>	$school_name,
			"user_ip"	=>	$user_ip,
			"reg_date"	=>	$reg_date,
		);

		$this->user_model->insertOauth($data);

		echo '{"result":"success"}';
		exit;
	}

	public function testPush($token)
	{
		$appkey = $token;
		$app_title = "댓글";
		$app_content = "댓글이 달렸어요";
		$link = "/board/qnaList";
		$images = "https://zero.themvp.kr/images/member/login_logo.png";
		$ch = curl_init();


		putenv('GOOGLE_APPLICATION_CREDENTIALS='.FCPATH.'/fcm_auth.json');

        $scope = 'https://www.googleapis.com/auth/firebase.messaging';

        $client = new Google_Client();

        $client->useApplicationDefaultCredentials();


        $client->setScopes($scope);

		$auth_key = $client->fetchAccessTokenWithAssertion();





        //header 설정 후 삽입
        
        $headers = array
        (
            'Authorization: Bearer ' . $auth_key['access_token'],
            'Content-Type: application/json'
        );
        
        
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        curl_setopt($ch, CURLOPT_URL, PUSH_URL);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        
        $notification_opt = array (
            'title'         => $app_title,
            'body'          => $app_content,
            'image' => $images,
        );
        
        
        
        $datas = array (
            'title' =>  $app_title,
            'body'  =>  $app_content,
            'link_url'     => $link,
	    			'image' => $images,
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
	    	'data'	=>	$datas
        
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
        
        echo $result;
	}

	public function checkQuiz()
	{
		$whereData = array(
			"where"	=>	"",
			"limit"	=>	""
		);
		$quizData = $this->content_model->getQuizList($whereData);

		$check_quiz = "";

		for($i=0; $i<count($quizData); $i++){
			$this_time = date("Y-m-d H:i");
			$target_time = date("Y-m-d H:i",strtotime($quizData[$i]['quiz_view_datetime']));

			if($target_time==$this_time){
				$quiz_seq = $quizData[$i]['quiz_seq'];
				$this->content_model->updateQuizStatus($quiz_seq);

				$arr = array(
		      "send_id" =>  '',
		      "alarm_target"  =>  "all",
		      "alarm_type"  =>  "quiz",
		      "quiz_seq"  =>  $quiz_seq,
		      "to_id" =>  '',
		      "title" =>  "새로운 퀴즈가 등록됐습니다",
		      "link"  =>  "https://zero.themvp.kr/content/quiz/".$quiz_seq,
		      "reg_date"  =>  date("Y-m-d H:i:s"),
		    );
				$this->addAlarm($arr);
				$check_quiz = $quiz_seq;
				continue;
			}
		}

		echo ">>> quiz : ".$check_quiz." \n";
		echo date("Y-m-d H:i:s")." \n";
		exit;
	}





}
