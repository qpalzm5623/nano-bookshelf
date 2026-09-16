<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Board extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
		/**
		* 언어셋 설정
		*/
		$this->load->config('gettext');
		$this->load->helper('gettext');
		$this->load->model("member_model");
		$this->load->model("board_model");
		$this->load->model("academi_model");
		$this->load->model("content_model");
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
				$this->loginCheck();
	}

	public function index()
	{

	}

  public function notice()
  {
		$sub = "board";

		$depth1 = "notice";
		$depth2 = "notice";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
			"where"	=>	" AND notice_read_type = 0 AND notice_display_yn = 'Y'",
			"sort"	=>	"ORDER BY notice_reg_datetime DESC",
			"limit"	=>	""
		);

		$noticeList = $this->board_model->getNoticeList($whereData);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"noticeList"	=>	$noticeList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('board/notice',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

	public function noticeReadProc()
	{
		$notice_seq = $this->input->post("notice_seq");
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$this->board_model->insertNoticeHist($notice_seq,$user_id);

		echo '{"result":"success"}';
		exit;
	}

	//자주하는질문
	public function faq()
  {
		$sub = "board";

		$depth1 = "faq";
		$depth2 = "faq";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$whereData = array(
			"where"	=>	"",
			"sort"	=>	"ORDER BY faq_reg_datetime DESC",
			"limit"	=>	""
		);

		$faqList = $this->board_model->getFaqList($whereData);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"faqList"	=>	$faqList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('board/faq',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
  }

	//1대1 작성
	public function qnaWrite()
	{
		$sub = "board";

		$depth1 = "qnaWrite";
		$depth2 = "qnaWrite";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('board/qna-write',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
	}

	public function qnaWriteProc()
	{
		$user_id = $this->CONFIG_DATA['userData']['user_id'];
		$user_seq = $this->CONFIG_DATA['userData']['user_seq'];
		$qna_title = $this->input->post("qna_title");
		$qna_contents = $this->input->post("qna_contents");
		$qna_category = "ETC";
		$qna_reg_datetime = date("Y-m-d H:i:s");

		$data = array(
			"user_id"	=>	$user_id,
			"user_seq"	=>	$user_seq,
			"qna_title"	=>	$qna_title,
			"qna_contents"	=>	$qna_contents,
			"qna_category"	=>	$qna_category,
			"qna_reg_datetime"	=>	$qna_reg_datetime,
		);

		$this->board_model->insertQna($data);

		echo '{"result":"success"}';
		exit;
	}

	//1대1 리스트
	public function qnaList()
	{
		$sub = "board";

		$depth1 = "qnaList";
		$depth2 = "qnaList";


		$this->CONFIG_DATA["depth1"] = $depth1;
		$this->CONFIG_DATA["depth2"] = $depth2;

		$user_id = $this->CONFIG_DATA['userData']['user_id'];

		$whereData = array(
			"where"	=>	" AND qna.user_id = '{$user_id}'",
			"sort"	=>	"ORDER BY qna.qna_reg_datetime DESC",
			"limit"	=>	""
		);

		$qnaList = $this->board_model->getQnaList($whereData);

		$data = array(
			"depth1"	=>	$depth1,
			"depth2"	=>	$depth2,
			"qnaList"	=>	$qnaList
		);


		$this->CONFIG_DATA["sub"] = $sub;
		$this->parser->parse('include/head',$this->CONFIG_DATA);
		$this->parser->parse('include/aside',$this->CONFIG_DATA);
		$this->parser->parse('board/qna-list',$data);
		$this->parser->parse('include/footer',$this->CONFIG_DATA);
	}

}
