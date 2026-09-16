<?php
class Book_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getBookTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt,(select count(*) from tb_quiz where a.book_no = book_no) quiz_cnt FROM tb_book a
                left join tb_user b 
                       on a.user_id=b.user_id
                WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();
      return $rows['cnt'];
    }

    //Book list
    public function getBookList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $sort = $data["sort"] == "" ? " ORDER BY a.book_no ASC" : $data["sort"];

      $query = "SELECT *, a.status status,a.reg_date reg_date,(select count(*) from tb_quiz where a.book_no = book_no) quiz_cnt, a.user_id user_id FROM tb_book a
                left join tb_user b 
                       on a.user_id=b.user_id
                 WHERE 1=1 {$where} {$sort} {$limit}";
      $result = $this->db->query($query)->result_array();
      return $result;
    }

    //Book view
    public function getBook($book_no)
    {
      $sql = "SELECT * FROM tb_book WHERE book_no = '{$book_no}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }
    
    //Book view
    public function getBookMax($book_no)
    {
      $sql = "SELECT MAX(book_no) book_no FROM tb_book WHERE book_no like '{$book_no}%'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }    

    //정보 입력
    public function insertBook($data)
    {
      $this->db->insert("tb_book",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateBook($data,$seq)
    {
      $this->db->where("book_no",$seq);
      $this->db->update("tb_book",$data);
      $result = $this->db->affected_rows();
      
      return $result;
    } 
    
    public function deleteBook($book_no)
    {
      $sql = "DELETE FROM tb_book WHERE book_no = '{$book_no}'";
      $this->db->query($sql);
    }    
    
    public function getBookFavoriteGradeList($book_no)
    {    
        $sql = "SELECT grade, COUNT(grade) cnt FROM tb_favorite_history WHERE book_no = '{$book_no}' GROUP BY grade";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }
    
    public function getBookFavoriteGenderList($book_no)
    {    
        $sql = "SELECT gender, COUNT(gender) cnt FROM tb_favorite_history WHERE book_no = '{$book_no}' GROUP BY gender";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }
    
    public function getBookLikeGradeList($book_no)
    {    
        $sql = "SELECT grade, COUNT(grade) cnt FROM tb_like_history WHERE book_no = '{$book_no}' GROUP BY grade";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }
    
    public function getBookLikeGenderList($book_no)
    {    
        $sql = "SELECT gender, COUNT(gender) cnt FROM tb_like_history WHERE book_no = '{$book_no}' GROUP BY gender";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }    
    
    public function getBookQuizGradeList($book_no)
    {    
        $sql = "SELECT grade, COUNT(grade) cnt FROM tb_quiz_history WHERE book_no = '{$book_no}' GROUP BY grade";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }
    
    public function getBookQuizGenderList($book_no)
    {    
        $sql = "SELECT gender, COUNT(gender) cnt FROM tb_quiz_history WHERE book_no = '{$book_no}' GROUP BY gender";
        $result = $this->db->query($sql)->result_array();
        return $result;        
    }        
    
    
    //Code total count
    public function getBookUserTotalCount($data)
    {
        $where = $data['where'];
        $query = "SELECT count(*) cnt FROM tb_book a
                  left join tb_user b 
                         on a.user_id=b.user_id
                  left join tb_quiz_share s
                         on a.book_no=s.book_no AND c.quiz_seq = s.quiz_seq 
                  left join tb_user u
                         on c.user_id=u.user_id
                  WHERE 1=1 {$where}
                  GROUP BY a.book_no
                  ";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }

    //Book list
    public function getBookUserList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        $order = @$data['order'] ?? "ORDER BY a.book_no DESC ";
        
        $query = "SELECT a.*, c.quiz_seq, d.fh_seq FROM tb_book a
                  inner join tb_quiz c 
                         on a.book_no=c.book_no
                  left join tb_favorite_history d
                         on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                  left join tb_quiz_share s
                         on a.book_no=s.book_no AND c.quiz_seq = s.quiz_seq 
                  left join tb_user u
                         on c.user_id=u.user_id
                   WHERE 1=1 {$where} 
                   GROUP BY a.book_no
                   {$order}
                   
                 {$limit}";
        $result = $this->db->query($query)->result_array();
        return $result;
    }    
    
    
    //Book list
    public function getBookUserAssignmentList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT a.*, c.quiz_seq, d.fh_seq,(SELECT IFNULL(MAX(score), 0) score FROM tb_quiz_history k WHERE book_no=q.book_no AND quiz_seq=q.quiz_seq and k.user_id = '{$data['user_id']}') score FROM tb_book a
                  inner join tb_book_assignment q 
                         on a.book_no=q.book_no
                  inner join tb_quiz c 
                         on a.book_no=c.book_no
                  left join tb_favorite_history d
                         on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                   WHERE 1=1 {$where} 
                ORDER BY a.book_no DESC {$limit}";
        //echo $query;
        $result = $this->db->query($query)->result_array();
        return $result;
    }        
    
    //Book list
    public function getBookUserAssignmentTotalCount($data)
    {
        $user_id= $data['user_id'];
        $query = "select count(*) cnt from (SELECT a.book_no,(SELECT IFNULL(MAX(score), 0) score FROM tb_quiz_history k WHERE k.book_no=q.book_no AND quiz_seq=q.quiz_seq and k.user_id = '{$user_id}') score   FROM tb_book a
                  inner join tb_book_assignment q 
                         on a.book_no=q.book_no
                   WHERE 1=1 and q.user_id = '{$user_id}' HAVING score < 60
                   ) aa
                ";
                //echo $query;
        $result = $this->db->query($query)->row_array();
        return $result;
    }            
    
    //Book list
    public function getBookUserDetail($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT a.*, c.quiz_seq, d.fh_seq FROM tb_book a
                  inner join tb_quiz c 
                         on a.book_no=c.book_no
                  left join tb_favorite_history d
                         on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                   WHERE 1=1 {$where} ORDER BY a.book_no DESC {$limit}";
        $result = $this->db->query($query)->row_array();
        return $result;
    }     
    
    //Book list
    public function getBookUserDetailList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT a.*, c.quiz_seq, d.fh_seq FROM tb_book a
                  inner join tb_quiz c 
                         on a.book_no=c.book_no
                  left join tb_favorite_history d
                         on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                   WHERE 1=1 {$where} ORDER BY a.book_no DESC {$limit}";
        $result = $this->db->query($query)->result_array();
        return $result;
    }         
    
    public function getBookUserQuizDetail($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT a.*, c.*, d.fh_seq FROM tb_book a
                  inner join tb_quiz c 
                         on a.book_no=c.book_no
                  left join tb_favorite_history d
                         on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                   WHERE 1=1 {$where} ORDER BY a.book_no DESC {$limit}";
        $result = $this->db->query($query)->result_array();
        return $result;
    }         
    
    public function updateQuizEnd($book_no)
    {
        $sql = "UPDATE tb_book SET quiz_use_cnt = quiz_use_cnt+1, quiz_use_cnt_7 = quiz_use_cnt_7+1 WHERE book_no= '{$book_no}'";
        $this->db->query($sql);
    }        
    
    public function updateFavorite($book_no, $type)
    {
        if($type == "+")
            $sql = "UPDATE tb_book SET favorite_cnt = favorite_cnt+1 WHERE book_no= '{$book_no}'";
        else
            $sql = "UPDATE tb_book SET favorite_cnt = favorite_cnt-1 WHERE book_no= '{$book_no}'";
        $this->db->query($sql);
    }            
    
    public function updateRecommend($book_no, $type)
    {
        if($type == "+")
            $sql = "UPDATE tb_book SET like_cnt = like_cnt+1 WHERE book_no= '{$book_no}'";
        else
            $sql = "UPDATE tb_book SET like_cnt = like_cnt-1 WHERE book_no= '{$book_no}'";
        $this->db->query($sql);
    }                
    
}
?>
