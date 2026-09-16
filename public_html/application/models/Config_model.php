<?php
  class Config_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    public function getConfig($key)
    {
      $sql ="SELECT * FROM tb_config WHERE category = '{$key}' ORDER BY seq ASC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }



  }


?>
