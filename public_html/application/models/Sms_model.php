<?php
  class Sms_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    //board list
    public function getSmsList($data)
    {
      $where = $data["where"] == "" ? null : $data["where"];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $sort = @$data["sort"] == "" ? "ORDER BY sms_seq DESC" : $data["sort"];

      $query = "SELECT * FROM tb_sms_info WHERE 1=1 {$where} {$sort} {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //board all list
    public function getSmsTotalCount($data)
    {

      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_sms_info WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $cnt = $query['cnt'];

      return $cnt;
    }

    //get board contents
    public function getSmsInfo($seq)
    {
      $query = "SELECT * FROM tb_sms_info WHERE sms_seq = '{$seq}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }

    /*
    @param array $insertContentsPageData
    @return int
    */
    public function insertSms($data)
    {
      $this->db->insert("tb_sms_info",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $updateCourseContentsData
    @return int
    */
    public function updateSms($data)
    {
      $this->db->where("sms_seq",$data['sms_seq']);
      $this->db->update("tb_sms_info",$data);
      $result = $this->db->affected_rows();

      return $result;
    }


    /*
    문자발송 내역저장
    */
    public function insertSmsLog($data)
    {
      $this->db->insert("sms_log",$data);
      $result = $this->db->insert_id();

      return $result;
    }

  }
?>
