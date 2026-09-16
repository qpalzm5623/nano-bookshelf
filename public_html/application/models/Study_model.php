<?php
  class Study_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    public function insertUnload($data)
    {
      $this->db->insert("unload_test",$data);
    }

  }
?>
