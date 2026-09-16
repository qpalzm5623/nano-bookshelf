<?php
  class Code_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getCodeTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_code WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //Code list
    public function getCodeList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $sort = @$data["sort"] == "" ? " ORDER BY code_seq ASC" : $data["sort"];

      $query = "SELECT * FROM tb_code WHERE 1=1 {$where} {$sort} {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //Code view
    public function getCode($code_seq)
    {
      $sql = "SELECT * FROM tb_code WHERE code_seq = '{$code_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //정보 입력
    public function insertCode($data)
    {
      $this->db->insert("tb_code",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateCode($data,$seq)
    {
      $this->db->where("code_seq",$seq);
      $this->db->update("tb_code",$data);
      $result = $this->db->affected_rows();

      return $result;
    } 
    
    public function updateTopicSort($sort_id,$seq)
    {
      $sql = "UPDATE tb_code SET code_sort_id = '$sort_id' WHERE code_seq = '{$seq}'";
      $this->db->query($sql);
      $result = $this->db->affected_rows();

      return $result;
    }     
    
    public function deleteCode($code_seq)
    {
      $sql = "DELETE FROM tb_code WHERE code_seq = '{$code_seq}'";
      $this->db->query($sql);
    }    
  }

?>
