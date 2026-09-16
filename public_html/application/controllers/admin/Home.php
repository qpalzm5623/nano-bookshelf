<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class Home extends MY_Controller {

	public function __construct()
	{
		parent::__construct();

		$this->load->model("board_model");
		$this->load->model("member_model");
		$this->load->model("academi_model");
		$this->load->model("content_model");
		$this->load->model("quiz_model");
		$this->load->model("book_model");
		$this->load->model("quizHistory_model");
		$this->load->library('excel');

		$this->load->helper('load_controller');
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
			$this->login();
		}else{
		    if($this->session->userdata("admin_level") == "0"){
			    $this->goURL("/admin/main");
			} else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){
			    $this->goURL("/admin/main");
			} else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){
			    $this->goURL("/admin/partner/write");
			} else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){
			    $this->goURL("/admin/partner/write");
			} 
		}

	}
	
	public function main()
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
		$level_where = "";
		$admin_group_name = $this->session->userdata("group_name");

		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
			$level_where .= "AND group_name = '{$admin_group_name}'";
		}

		// 선생님
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="teacher"){
		    $level_where .= "AND group_name = '{$admin_group_name}'";
			//$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}
		
		// Master
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="master"){
		    $level_where .= "AND group_name = '{$admin_group_name}'";
			//$where .= " AND users.school_seq = '{$admin_school_seq}' AND users.school_year = '{$admin_school_year}' AND users.school_class = '{$admin_school_class}'";
		}		
		
		$term_where = "";
		$all_term_where = "";
		if($year != "" && $month != "all") {
		    $term_where = " AND reg_date >='$year-$month-01' AND reg_date <= '$year-$month-$last_day'";
		    $all_term_where = " AND reg_date <= '$year-$month-$last_day'";
		} else {
		    $last_day = date("t", strtotime("$year-12-01"));
		    $all_term_where = " AND reg_date <= '$year-12-$last_day'";
		}
		
		
		
		$where = " AND user_type='director'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";

        $director = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );
        
		$where = " AND user_type='teacher'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";        
        
        $teacher = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );      
        
		$where = " AND user_type='master'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";                
        
        $master = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        
		$where = " AND user_type='user'".$level_where.$all_term_where;
		$where1 = $where.$level_where.$term_where;
		$where2 = $where1.$level_where." AND user_status='N'";                
        $user = array(
            "member_total"=>$this->member_model->getMemberTotal($where),
            "search_member_total"=>$this->member_model->getMemberTotal($where1),
            "search_leave_member_total"=>$this->member_model->getMemberTotal($where2),
        );     
        
		$year = empty($year) ? date("Y") : $year;
		$month = empty($month) ? date("m") : $month;
		$where="".$level_where;

		$days = date("t",strtotime($year."-".$month."-01"));
		        
        $book_quiz = array(
            "total"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
            "new"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
            "confirm"=>$this->quiz_model->getQuizInsightTotal($year,$month,$where),
        );             
        
        $where="".$level_where;
        
        $book_quiz_confirm = array(
            "total"=>$this->quizHistory_model->getQuizHistoryInsightTotal($year,$month,$where),
            "confirm"=>$this->quizHistory_model->getQuizHistoryInsightTotal($year,$month,$where),
        );
        
		// 가맹점 관리자
		if($this->session->userdata("admin_level")!="0"&&$this->session->userdata("admin_type")=="director"){
			$where .= "AND b.group_name = '{$admin_group_name}'";
		}        
        
        //선호도 현황
		$whereData = array(
			"sort"			=>	" ORDER BY a.quiz_use_cnt DESC",
			"where"			=>	$where,
			"limit"			=>	"LIMIT 3"
		);

		$bookList = $this->book_model->getBookList($whereData);
		$where = "".$level_where;
        
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
			"director"	=>	$director,
			"teacher"	=>	$teacher,
			"master"	=>	$master,
			"user"	=>	$user,
			"book_quiz_confirm" => $book_quiz_confirm,
			"book_quiz" => $book_quiz,
			
			"book_list" => $bookList,
			"user_list" => $userList,
			
			"member_total"	=>	@$member_total,
			"search_member_total"	=>	@$search_member_total,
			"search_leave_member_total"	=>	@$search_leave_member_total,
			"board_view_count_total"	=>	@$board_view_count_total,
			"challenge_total"	=>	@$challenge_total,
			"carbon_total"	=>	@$carbon_total,
			"oauth_total"	=>	@$oauth_total,
			"year"	=>	@$year,
			"month"	=>	@$month
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){
		    $this->parser->parse("admin/main-director",$content_data);
		} else 
		    $this->parser->parse("admin/main",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}	

	public function home()
	{
		$depth1 = "admin";
		$depth2 = "home";
		$title = "HOME";
		$sub_title = "대쉬보드";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$content_data = array(
			"title"	=>	$title,
			"sub_title"	=>	$sub_title
		);


		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/main",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}



	public function admMain()
	{
		$depth1 = "admin";
		$depth2 = "academiList";
		$title = "가맹점 관리";
		$sub_title = "가맹점 관리";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$content_data = array();

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/academi/academi-list",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	//login
	public function login()
	{
		$content_data = array(
			"base_url"	=>	$this->BASE_URL
		);

		$this->parser->parse("admin/login",$content_data);
	}

	//login ajax
	public function login_proc()
	{
		$admin_id = trim($this->input->post("admin_id"));
		$admin_password = trim($this->input->post("admin_password"));

		if( empty($admin_id) ){
			echo '{ "result" : "failed" , "message" : "아이디를 입력 해 주세요." }';
			exit;
		}

		if( empty($admin_password) ){
			echo '{ "result" : "failed" , "message" : "비밀번호를 입력 해 주세요." }';
			exit;
		}

		//db id check
		$result = $this->adm_model->login($admin_id,$admin_password);

		if( $result["result"] == "success" ){

			//session에 저장
			$this->session->set_userdata("admin_id" , $admin_id);
			$this->session->set_userdata("admin_type",$result['admin_type']);
			$this->session->set_userdata("admin_level","admin");
			$this->session->set_userdata("admin_seq",@$result['adminData']['user_seq']);
            
			if($result['admin_type'] == 'A'){
				$this->session->set_userdata("group_name","");
				$this->session->set_userdata("admin_level",0);
			}else{
				$this->session->set_userdata("group_name",$result['adminData']['group_name']);
				$this->session->set_userdata("admin_type",$result['admin_type']);
				$this->session->set_userdata("admin_level",$result['adminData']['user_type']);
				$this->session->set_userdata("admin_seq",@$result['adminData']['user_seq']);
				$this->session->set_userdata("group_name",@$result['adminData']['group_name']);

				$loginData = array(
					"admin_id"		=>	$admin_id,
					"last_login_time"	=>	date("Y-m-d H:i:s"),
					"login_ip"	=>	$this->input->ip_address()
				);

				$this->adm_model->updateLogin($loginData);
			}

			$value = $this->security->get_csrf_hash();

			echo '{ "result" : "success", "csrf" : "'.$value.'"}';
			exit;
		} else {
			$message = "";

			switch($result["message"]){
				case "admin_id" :
					$message = "아이디를 확인 해 주세요.";
				break;

				case "admin_password":
					$message = "비밀번호를 확인 해 주세요.";
				break;

				case "status_r":
					$message = "승인대기 상태입니다. 관리자에 문의주세요";
				break;

				case "status_l":
					$message = "탈퇴 상태입니다.관리자에 문의주세요";
				break;
				
				case "date1":
					$message = "로그인할 수 없는 계정입니다. 본사에 문의해 주세요.";
				break;				
				
				case "date2":
					$message = "로그인할 수 없는 계정입니다. 본사에 문의해 주세요.";
				break;								

				case "level":
					$message = "권한이 없습니다.";
				break;
				
			}
			if($message == "") {
			    $message= "정보가 없습니다.";
			}

//			echo '{ "result" : "failed" , "message" : "'.$message.$result["message"].'" }';
			echo '{ "result" : "failed" , "message" : "'.$message.'" }';
			exit;
		}
	}

	//logout
	public function logout(){
		session_destroy();
		echo '{ "result" : "success" }';
		exit;
	}

	public function terms()
	{
		$depth1 = "admin";
		$depth2 = "terms";
		$title = "이용약관";
		$sub_title = "이용약관";

		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$termsData = $this->adm_model->getTermPrivacy();


		$content_data = array(
			"depth1"		=>	$depth1,
			"title"			=>	$title,
			"sub_title"	=>	$sub_title,
			"termsData"	=>	$termsData
		);

		//header and css loads
		$this->parser->parse("admin/include/header",$this->CONFIG_DATA);

		//menu
		$this->parser->parse("admin/include/left",$this->CONFIG_DATA);
		//contents
		$this->parser->parse("admin/adm-terms",$content_data);

		//Footer
		$this->parser->parse("admin/include/footer",$this->CONFIG_DATA);
		//footer js files
		$this->parser->parse("admin/include/footer_js",$this->CONFIG_DATA);
	}

	public function termsWriteProc()
	{
		$terms = $this->input->post("terms");


		$data = array(
			"terms"	=>	$terms
		);

		$result = $this->adm_model->writeTerms($data);

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

	public function testPush($token)
	{
		$appkey = $token;
		$app_title = "댓글";
		$app_content = "댓글이 달렸어요";
		$link = "/board/qnaList";
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
            'title'                 => $app_title,
            'body'                    => $app_content
            // 'image' => 'http://sowonbyul.com/original/totalAdmin/images/Icon-512.png'
        );



        $datas = array (
            'title' =>    $app_title,
            'body'    =>    $app_content,
            'link_url'         => $link,
        );

        $android_opt = array (
            'notification' => array(
                'default_sound'                 => true
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

}
