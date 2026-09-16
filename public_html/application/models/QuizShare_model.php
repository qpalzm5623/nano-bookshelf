<?php
  class QuizShare_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getQuizShareTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_quiz_share a 
                              left join tb_book b 
                                     on a.book_no = b.book_no
                               left join tb_user c 
                                      on a.user_id=c.user_id
                              left join tb_quiz d 
                                     on a.quiz_seq = d.quiz_seq
                                   WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }
    
    //Code total count
    public function getQuizShareGroupTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT COUNT(*) cnt FROM ( SELECT count(*) cnt FROM tb_quiz_share a 
                               left join tb_user c 
                                      on a.share_user_id=c.user_id
                                   WHERE 1=1 {$where}
                                   group by a.share_user_id) A
                                   ";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }    

    //Quiz list
    public function getQuizShareList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $sort = $data["sort"] == "" ? null : $data["sort"];

      $query = "select b.*, a.*, b.book_name, c.group_name, c.user_type, c.user_name, d.quiz_cnt, a.reg_date share_date FROM tb_quiz_share a 
                  inner join tb_book b 
                         on a.book_no = b.book_no
                  inner join tb_quiz d 
                         on a.quiz_seq = d.quiz_seq
                  left join tb_user c
                         on a.user_id = c.user_id
                      WHERE 1=1 {$where} 
                   {$sort} {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }
    
    //Quiz list
    public function getQuizShareGroupList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT b.*, a.*, c.group_name, c.user_type, c.user_name,c.cell_no, (select MAX(reg_date) reg_date from tb_quiz_share x where x.share_user_id=a.share_user_id) reg_date FROM tb_quiz_share a 
                  left join tb_book b 
                         on a.book_no = b.book_no
                  left join tb_user c
                         on a.share_user_id = c.user_id
                      WHERE 1=1 {$where} 
                   GROUP BY a.share_user_id
                   ORDER BY a.reg_date DESC {$limit}
                   ";
      $result = $this->db->query($query)->result_array();

      return $result;
    }    

    //Quiz view
    public function getQuizShare($seq, $book_no, $share_user_id)
    {
      $sql = "SELECT b.*, a.* FROM tb_quiz_share a 
                  left join tb_book b 
                         on a.book_no = b.book_no WHERE a.quiz_seq = '{$quiz_no}' and a.book_no='{$book_no}' and  a.share_user_id='{$share_user_id}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //정보 입력
    public function insertQuizShare($data)
    {
      $this->db->insert("tb_quiz_share",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    
    
    public function deleteQuizShare($data)
    {
      $seq = $data['quiz_seq'];
      $book_no = $data['book_no'];
      $share_user_id = $data['share_user_id'];
      $sql = "DELETE FROM tb_quiz_share WHERE quiz_seq = '{$seq}' and book_no='{$book_no}' and  share_user_id='{$share_user_id}'";
      $this->db->query($sql);
    }    
}
?>