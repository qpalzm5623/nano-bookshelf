<?php
ini_set( "display_errors", 0 );
defined('BASEPATH') OR exit('No direct script access allowed');

class Cron extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
		/**
		* 언어셋 설정
		*/
		$this->load->config('gettext');
		$this->load->helper('gettext');
		$this->load->model("member_model");

		$this->load->helper("string");
		$charset = array(
			$this->getChar()
		);

	}

	public function grade()
	{
        // 필드 값을 업데이트
        $result = $this->user_model->updateGrade();
        
        if ($result) {
            echo "Field incremented successfully.";
        } else {
            echo "Failed to increment field.";
        }
        exit;
                
	}
	
	public function test()
	{
        if ($result) {
            echo "test.";
        } else {
            echo "Failed to test.";
        }
        exit;
                
	}	

}
