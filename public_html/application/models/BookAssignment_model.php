<?php
  class BookAssignment_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getBookAssignmentTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_book_assignment a 
                               left join tb_user c 
                                      on a.user_id=c.user_id
                                   WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }
    
    //Code total count
    public function getBookAssignmentGroupTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt from (SELECT count(DISTINCT(a.user_id)) cnt FROM tb_book_assignment a 
                               left join tb_user c 
                                      on a.user_id=c.user_id
                                   WHERE 1=1 {$where}
                                   group by a.user_id, a.reg_date) A
                                   
                                   ";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }    

    //Quiz list
    public function getBookAssignmentList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name, a.reg_date share_date, c.class_name, c.grade
                      FROM tb_book_assignment a 
                  left join tb_book b 
                         on a.book_no = b.book_no
 
                  left join tb_user c
                         on a.user_id = c.user_id
                      WHERE 1=1 {$where} 
                   ORDER BY a.reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }
    
    public function getBookAssignmentHistoryList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
/*
      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name, a.reg_date share_date, c.class_name, c.grade, d.reg_date history_date, e.user_id setter
                      FROM tb_book_assignment a 
                  left join tb_book b 
                         on a.book_no = b.book_no
                  left join tb_user c
                         on a.user_id = c.user_id
                  left join tb_quiz_history d
                         on a.user_id = d.user_id and a.book_no=d.book_no  
                  left join tb_quiz e 
                         on a.quiz_seq = e.quiz_seq
                      WHERE 1=1 {$where} 
                   ORDER BY a.reg_date DESC {$limit}";
                   */
      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name, a.reg_date share_date, c.class_name, c.grade, e.user_id setter,
(select reg_date history_date FROM tb_quiz_history d WHERE a.user_id = d.user_id and a.book_no=d.book_no LIMIT 1) history_date
                      FROM tb_book_assignment a 
                  left join tb_book b 
                         on a.book_no = b.book_no
                  left join tb_user c
                         on a.user_id = c.user_id
                  left join tb_quiz e 
                         on a.quiz_seq = e.quiz_seq
                      WHERE 1=1 {$where} 
                   ORDER BY a.reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }    
    
    //Quiz list
    public function getBookAssignmentGroupList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name,c.cell_no,c.class_name, c.grade, count(a.reg_date)  book_count FROM tb_book_assignment a 
                  left join tb_book b 
                         on a.book_no = b.book_no
                  left join tb_user c
                         on a.user_id = c.user_id
                      WHERE 1=1 {$where} 
                   GROUP BY a.user_id, a.reg_date
                   ORDER BY a.reg_date DESC {$limit}
                   ";
      $result = $this->db->query($query)->result_array();

      return $result;
    }    

    //Quiz view
    public function getBookAssignment($seq, $book_no, $share_user_id)
    {
      $sql = "SELECT b.*, a.* FROM tb_book_assignment a 
                  left join tb_book b 
                         on a.book_no = b.book_no WHERE a.quiz_seq = '{$quiz_no}' and a.book_no='{$book_no}' and  a.share_user_id='{$share_user_id}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //정보 입력
    public function insertBookAssignment($data)
    {
      $this->db->insert("tb_book_assignment",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    
    
    public function deleteBookAssignment($data)
    {
      $user_id = $data['user_id'];
      $reg_date = $data['reg_date'];
      $sql = "DELETE FROM tb_book_assignment WHERE user_id='{$user_id}' and reg_date='$reg_date'";
      $result = $this->db->query($sql);
      
      return $result;
    }    
}
?>