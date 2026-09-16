<?php
  class Message_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getMessageSenderTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_message a
                left join tb_user b 
                       on a.sender_id=b.user_id
                WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //Book list
    public function getMessageSenderList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT *, a.reg_date reg_date FROM tb_message a
                left join tb_user b 
                       on a.sender_id=b.user_id
                 WHERE 1=1 {$where} ORDER BY a.message_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();
      return $result;
    }
    
    //Code total count
    public function getMessageReceiveTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_message a
                left join tb_user b 
                       on a.receive_id=b.user_id
                WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //Book list
    public function getMessageReceiveList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT *, a.reg_date reg_date FROM tb_message a
                left join tb_user b 
                       on a.receive_id=b.user_id
                 WHERE 1=1 {$where} ORDER BY a.message_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();
      return $result;
    }    

    //Book view
    public function getMessage($seq)
    {
      $sql = "SELECT * FROM tb_message WHERE message_seq = '{$seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //정보 입력
    public function insertMessage($data)
    {
      $this->db->insert("tb_message",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateMessage($data,$seq)
    {
      $this->db->where("message_seq",$seq);
      $this->db->update("tb_message",$data);
      $result = $this->db->affected_rows();

      return $result;
    } 
    
    public function deleteMessage($seq)
    {
      $sql = "DELETE FROM tb_message WHERE message_seq = '{$seq}'";
      $this->db->query($sql);
    }    
        
}
?>
