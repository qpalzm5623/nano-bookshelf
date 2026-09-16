<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class MY_Model extends CI_Model
{
    public function __construct()
    {
        parent::__construct();
        $this->load->library('encryption');
    }

    public function encrypt($type,$msg)
    {
      if( $type == "any" ){
          $key = $this->config->config['encryption_key'];
      }else if( $type == "password" ){
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
      if( $type == "any" ){
          $key = $this->config->config['encryption_key'];
      }else if( $type == "password" ){
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


}
