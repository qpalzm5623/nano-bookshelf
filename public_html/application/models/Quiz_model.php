<?php
  class Quiz_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getQuizTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_quiz a 
                              left join tb_book b 
                                     on a.book_no = b.book_no      
                               left join tb_user c 
                                      on a.user_id=c.user_id
                                   WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //Quiz list
    public function getQuizList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name, b.book_name FROM tb_quiz a 
                  inner join tb_book b 
                         on a.book_no = b.book_no
                  left join tb_user c
                         on a.user_id = c.user_id
                      WHERE 1=1 {$where} 
                   ORDER BY a.quiz_seq DESC {$limit}";
      
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //Quiz view
    public function getQuiz($seq)
    {
      $sql = "SELECT b.*, a.*, b.book_name FROM tb_quiz a 
                  left join tb_book b 
                         on a.book_no = b.book_no WHERE a.quiz_seq = '{$seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }
    
    //Quiz view
    public function getQuizBook($book_no)
    {
      $sql = "SELECT quiz_seq FROM tb_quiz WHERE book_no = '{$book_no}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }    

    //정보 입력
    public function insertQuiz($data)
    {
      $this->db->insert("tb_quiz",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateQuiz($data,$seq)
    {
      $this->db->where("quiz_seq",$seq);
      $this->db->update("tb_quiz",$data);
      $result = $this->db->affected_rows();

      return $result;
    } 
    
    public function deleteQuiz($seq)
    {
      $sql = "DELETE FROM tb_quiz WHERE quiz_seq = '{$quiz_no}'";
      $this->db->query($sql);
    }    
    
    public function getQuizInsight($year,$month,$where="")
    {
      if($month !="all") {
          $where .= "AND MONTH(a.reg_date) = '{$month}' ".$where;
      }        
      $sql = "SELECT DAY(a.reg_date) day,count(*) cnt 
                FROM tb_quiz a
                left join tb_user users
                       on a.user_id = users.user_id
               WHERE YEAR(a.reg_date) = '{$year}' 
                     {$where} 
            GROUP BY DATE(a.reg_date) 
            ORDER BY DATE(a.reg_date) ASC";
      $total = $this->db->query($sql)->result_array();
      return $total;
    }    
    
    public function getQuizInsightTotal($year,$month,$where="")
    {
      if($month !="all") {
          $where = "AND MONTH(a.reg_date) = '{$month}' ".$where;
      } else {
        
      }
      $sql = "SELECT count(*) cnt
                FROM tb_quiz a
            LEFT JOIN tb_user b
                   on a.user_id = b.user_id
               WHERE YEAR(a.reg_date) = '{$year}' 
                     {$where} 
            ";
      $total = $this->db->query($sql)->result_array();
      $total = $total[0]['cnt'];
      return $total;
    }        
    
    public function getQuizInsightTotalGroup($year,$month,$where="")
    {
      if($month !="all") {
          $where .= "AND MONTH(a.reg_date) = '{$month}' ".$where;
      }
      $sql = "SELECT count(*) cnt
                FROM tb_quiz a
           left join tb_user b
                  on a.user_id = b.user_id
               WHERE YEAR(a.reg_date) = '{$year}' 
                     {$where} 
            ";
      $total = $this->db->query($sql)->result_array();
      $total = $total[0]['cnt'];
      return $total;
    }            
}

?>
