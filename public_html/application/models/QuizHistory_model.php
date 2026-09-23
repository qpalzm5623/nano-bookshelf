<?php
class QuizHistory_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //Code total count
    public function getQuizHistoryTotalCount($data)
    {
        $where = $data['where'];
        $query = "SELECT count(*) cnt 
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
               left join tb_book c
                      on a.book_no=c.book_no
               left join tb_quiz d
                      on a.book_no = c.book_no and a.quiz_seq=d.quiz_seq
                   WHERE 1=1 {$where}";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }

    //QuizHistory list
    public function getQuizHistoryList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT * 
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
                   WHERE 1=1 {$where} 
                ORDER BY a.book_no DESC {$limit}";
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }
    

    //Code total count
    public function getQuizHistoryPortfolioTotalCount($data)
    {
        $where = $data['where'];
        $query = "SELECT COUNT(*) cnt FROM (SELECT count(*) cnt 
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
                      
                   WHERE 1=1 {$where}
                   GROUP BY a.user_id
                   ) A";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }
    
    
    public function getQuizHistoryPortfolioList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT *, a.user_id, COUNT(DISTINCT a.book_no) use_book_cnt, SUM(d.quiz_cnt) use_quiz_cnt, sum(correct_cnt) correct_cnt, sum(score) score
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
               left join tb_book c
                      on a.book_no=c.book_no
               left join tb_quiz d
                      on a.book_no = c.book_no and a.quiz_seq=d.quiz_seq
                   WHERE 1=1 {$where} 
                GROUP BY a.user_id
                ORDER BY a.book_no DESC {$limit}";
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }    
    
    //QuizHistory list
    public function getQuizHistoryAdminList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT *, d.user_id setter, a.book_no, a.reg_date reg_date, a.user_id user_id, b.user_name user_name, c.book_name
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
               left join tb_book c
                      on a.book_no=c.book_no
               left join tb_quiz d
                      on a.book_no = c.book_no and a.quiz_seq=d.quiz_seq
                   WHERE 1=1 {$where} 
                ORDER BY a.reg_date DESC {$limit}";
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }    
    
    public function getQuizHistoryAdminGroupList($data)
    {
        $where = $data['where'];
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT *, d.user_id setter, a.book_no, a.reg_date reg_date
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
               left join tb_book c
                      on a.book_no=c.book_no
               left join tb_quiz d
                      on a.book_no = c.book_no and a.quiz_seq=d.quiz_seq
                   WHERE 1=1 {$where} 
                GROUP BY a.book_no
                ORDER BY a.book_no DESC {$limit}";
        //echo $query;
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }        
    
    //QuizHistory list
    public function getQuizHistoryAdmin($seq)
    {
        $query = "SELECT *, d.user_id setter, a.book_no, a.reg_date reg_date
                    FROM tb_quiz_history a
               left join tb_user b 
                      on a.user_id=b.user_id
               left join tb_book c
                      on a.book_no=c.book_no
               left join tb_quiz d
                      on a.book_no = c.book_no and a.quiz_seq=d.quiz_seq
                   WHERE 1=1 AND a.qh_seq='{$seq}'
                ";
        $result = $this->db->query($query)->row_array();
        
        return $result;
    }        

    //QuizHistory view
    public function getQuizHistory($data)
    {
        $book_no = $data['book_no'];
        $quiz_seq = $data['quiz_seq'];
        $qh_seq = $data['qh_seq'];
        
        $sql = "SELECT * FROM tb_quiz_history WHERE qh_seq='{$qh_seq}' and book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }
    
    public function getQuizHistoryCount($data)
    {
        $book_no = $data['book_no'];
        $quiz_seq = $data['quiz_seq'];
                
        $sql = "SELECT count(book_no) cnt FROM tb_quiz_history WHERE book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        //echo $sql;
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }    
    
    public function getQuizHistorySuccessCount($data)
    {
        $book_no = $data['book_no'];
        $quiz_seq = $data['quiz_seq'];
        $user_id = $data['user_id'];
                
        $sql = "SELECT count(book_no) cnt FROM tb_quiz_history WHERE book_no = '{$book_no}' and quiz_seq='{$quiz_seq}' and user_id='{$user_id}' and score >= 60";
        //echo $sql;
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }    

    // ─── 당일 인증 실패 횟수 조회 ───
    // 정책: 1권에 대해 하루 3번 인상 인증 실패(60점 미만) 시, 동일한 날 재도전 불가
    //       다음 날(자정 기준)부터 재도전 가능
    public function getQuizHistoryTodayFailCount($data)
    {
        $book_no = $data['book_no'];
        $quiz_seq = $data['quiz_seq'];
        $user_id  = $data['user_id'];

        // CURDATE() 기준 당일, 60점 미만 시도 횟수
        $sql = "SELECT count(*) cnt
                  FROM tb_quiz_history
                 WHERE book_no  = '{$book_no}'
                   AND quiz_seq = '{$quiz_seq}'
                   AND user_id  = '{$user_id}'
                   AND score    < 60
                   AND DATE(reg_date) = CURDATE()";
        $query = $this->db->query($sql)->row_array();

        return $query;
    }    
    


    //정보 입력
    public function insertQuizHistory($data)
    {
        $this->db->insert("tb_quiz_history",$data);
        $result = $this->db->insert_id();
        
        return $result;
    }

    //정보 수정
    public function updateQuizHistory($data,$seq)
    {
        $this->db->where("qh_seq",$seq);
        $this->db->update("tb_quiz_history",$data);
        $result = $this->db->affected_rows();
        
        return $result;
    } 
    
    public function deleteQuizHistory($seq)
    {
        $sql = "DELETE FROM tb_quiz_history WHERE qh_seq = '{$seq}'";
        $this->db->query($sql);
    }    
    
    public function getQuizHistoryInsight($year,$month,$where="")
    {
        if($month !="all") {
            $where .= "AND MONTH(reg_date) = '{$month}' ".$where;
        }        
        $sql = "SELECT DAY(reg_date) day,count(*) cnt 
                  FROM tb_quiz_history
                 WHERE YEAR(reg_date) = '{$year}' 
                       {$where} 
              GROUP BY DATE(reg_date) 
              ORDER BY DATE(reg_date) ASC";
        $total = $this->db->query($sql)->result_array();
        return $total;
    }    
    
    public function getQuizHistoryInsightTotal($year,$month,$where="")
    {
        if($month !="all") {
            $where .= "AND MONTH(a.reg_date) = '{$month}' ".$where;
        }
        $sql = "SELECT count(*) cnt
                  FROM tb_quiz_history a
              left join tb_user 
                     on a.user_id = tb_user.user_id
                 WHERE YEAR(a.reg_date) = '{$year}' 
                       {$where} 
                       AND score >= 60
              ";
              /*
        $sql = "SELECT count(*) cnt
                  FROM tb_quiz a
              left join tb_user 
                     on a.user_id = tb_user.user_id
                 WHERE YEAR(a.reg_date) = '{$year}' 
                       {$where} 
              ";
              */
        $total = $this->db->query($sql)->result_array();
        $total = $total[0]['cnt'];
        return $total;
    }            
    
    public function getQuizHistoryInsightTotalGroup($year,$month,$where="")
    {
        if($month !="all") {
            $where .= "AND MONTH(a.reg_date) = '{$month}' ".$where;
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
    
    public function getQuizHistoryGroup($data)
    {
        $user_id = $data['user_id'];
        $type = $data['type'];
        $start_date = @$data['start_date'];
        $end_date = @$data['end_date'];
        $where = "";
        if($start_date != "" && $end_date != "") {
            $where = " AND a.reg_date>='$start_date' AND a.reg_date<='$end_date 23:59:59' ";   
        }
        

        if($type == "category") {
            $sql = "   SELECT 
                            b.sub_category  subject, COUNT(DISTINCT a.book_no) cnt FROM tb_quiz_history a
                    LEFT JOIN tb_book b
                           ON  a.book_no=b.book_no
                        WHERE a.user_id='{$user_id}' AND a.score >= 60
                        {$where}
                     GROUP BY b.sub_category, b.sub_category";
        } else {
            $sql = "   SELECT 
                            b.subject, COUNT(DISTINCT a.book_no) cnt FROM tb_quiz_history a
                    LEFT JOIN tb_book b
                           ON  a.book_no=b.book_no
                        WHERE a.user_id='{$user_id}' AND a.score >= 60
                        {$where}
                     GROUP BY b.subject";            
        }
        
        //$sql = "SELECT * FROM tb_quiz_history WHERE qh_seq='{$qh_seq}' and book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        $query = $this->db->query($sql)->result_array();
        
        return $query;
    }    
    
    public function getQuizHistoryGroupListTotalCount($data)
    {
        $user_id = $data['user_id'];

        $sql = "   SELECT COUNT(DISTINCT a.book_no) cnt
                    FROM tb_quiz_history a 
               LEFT JOIN tb_book b ON a.book_no=b.book_no 
                    WHERE a.user_id='{$user_id}' and a.score >= 60
                    ";
        
        //echo $sql;
        //$sql = "SELECT * FROM tb_quiz_history WHERE qh_seq='{$qh_seq}' and book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }     
    
    public function getQuizHistoryGroupListTotalCountMypage($data)
    {
        $user_id = $data['user_id'];

        $sql = "   SELECT COUNT(DISTINCT a.book_no) cnt, (COUNT(a.book_no)) quiz_total
                    FROM tb_quiz_history a 
               LEFT JOIN tb_book b 
                     ON a.book_no=b.book_no 
               LEFT JOIN tb_quiz c 
                     ON a.quiz_seq=c.quiz_seq 
                    WHERE a.user_id='{$user_id}' ";
        
        //$sql = "SELECT * FROM tb_quiz_history WHERE qh_seq='{$qh_seq}' and book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }         
    
    public function getQuizHistoryGroupMypageTotalCountMypage($data)
    {
        $user_id = $data['user_id'];

        $sql = "   SELECT SUM(a.correct_cnt) quiz_total
                    FROM tb_quiz_history a 
               LEFT JOIN tb_book b 
                     ON a.book_no=b.book_no 
               LEFT JOIN tb_quiz c 
                     ON a.quiz_seq=c.quiz_seq 
                    WHERE a.user_id='{$user_id}' ";
        
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }             
    
    public function getQuizHistoryGroupList($data)
    {
        $user_id = $data['user_id'];

        $sql = "   SELECT DATE_FORMAT(a.reg_date, '%Y-%m-%d') date, b.*, c.*, d.*, a.qh_seq, a.book_no book_no, c.quiz_seq quiz_seq
                    FROM tb_quiz_history a 
               LEFT JOIN tb_book b ON a.book_no=b.book_no 
                inner join tb_quiz c 
                       on a.book_no=c.book_no
                left join tb_favorite_history d
                       on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                    WHERE a.user_id='{$user_id}' and a.score >= 60
                    GROUP BY DATE_FORMAT(a.reg_date, '%Y-%m-%d'), a.book_no
                    ";
        
        //echo $sql;
        //$sql = "SELECT * FROM tb_quiz_history WHERE qh_seq='{$qh_seq}' and book_no = '{$book_no}' and quiz_seq='{$quiz_seq}'";
        $query = $this->db->query($sql)->result_array();
        
        return $query;
    }        
}

?>
