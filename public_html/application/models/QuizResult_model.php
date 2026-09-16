<?php
  class QuizResult_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getQuizResultTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_quiz WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //QuizResult list
    public function getQuizResultList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_book WHERE 1=1 {$where} ORDER BY book_no DESC {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //QuizResult view
    public function getQuizResult($seq)
    {
      $sql = "SELECT * FROM tb_book WHERE book_no = '{$book_no}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //정보 입력
    public function insertQuizResult($data)
    {
      $this->db->insert("tb_book",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateQuizResult($data,$seq)
    {
      $this->db->where("book_no",$seq);
      $this->db->update("tb_book",$data);
      $result = $this->db->affected_rows();

      return $result;
    } 
    
    public function deleteQuizResult($seq)
    {
      $sql = "DELETE FROM tb_book WHERE book_no = '{$book_no}'";
      $this->db->query($sql);
    }    
    
    public function getQuizResultInsight($year,$month,$where="")
    {
      $sql = "SELECT DAY(a.reg_date) day,count(*) cnt 
                FROM tb_quiz_history a
                LEFT JOIN tb_user users
                       ON a.user_id = users.user_id
               WHERE YEAR(a.reg_date) = '{$year}' 
                 AND MONTH(a.reg_date) = '{$month}' 
                     {$where} 
                     AND score>=60
            GROUP BY DATE(a.reg_date) 
            ORDER BY DATE(a.reg_date) ASC";
      $total = $this->db->query($sql)->result_array();
      return $total;
    }  
  
}

?>
