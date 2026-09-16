<?php
ini_set('display_errors', '0');
defined('BASEPATH') OR exit('No direct script access allowed');

class ExcelAdm extends MY_Controller {

	public function __construct()
	{
		parent::__construct();
    $this->load->library('excel');

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
	}

    public function excel_read($excel_file)
    {
      $objPHPExcel = PHPExcel_IOFactory::load($excel_file);

      $sheetData = $objPHPExcel->getActiveSheet()->toArray(null,true,true,true);

      return $sheetData;
    }
}
