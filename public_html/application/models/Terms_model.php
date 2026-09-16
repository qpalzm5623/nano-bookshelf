<?php
  class Terms_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }


    public function getTerms()
    {
      $sql = "SELECT * FROM terms limit 1";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param array $updateCourseContentsData
    @return int
    */
    public function updateTerms($data)
    {
      $this->db->update("terms",$data);
      $result = $this->db->affected_rows();

      return $result;
    }
  }


?>
