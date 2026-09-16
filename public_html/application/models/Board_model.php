<?php
  class Board_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    public function getNoticeTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt FROM tb_notice WHERE 1=1 $where";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getNoticeList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT * FROM tb_notice WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }
    
    public function getNoticeAppTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt FROM tb_notice_app WHERE 1=1 $where";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getNoticeAppList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT * FROM tb_notice_app WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }    

    public function getTermsData()
    {
      $sql = "SELECT * FROM tb_terms";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function updateTemrs($data)
    {
      $this->db->update("tb_terms",$data);
    }

    public function insertNoticeHist($notice_seq,$user_id)
    {
      $sql = "SELECT * FROM tb_notice_history WHERE notice_seq = '{$notice_seq}' AND user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();
      if(!is_array($result)){
        $sql = "INSERT INTO tb_notice_history (notice_seq,user_id,reg_date) VALUES ('{$notice_seq}','{$user_id}',NOW())";
        $this->db->query($sql);

        $sql = "UPDATE tb_notice SET notice_read_cnt = notice_read_cnt+1 WHERE notice_seq = '{$notice_seq}'";
        $this->db->query($sql);
      }
    }

    public function getNoticeData($notice_seq)
    {
      $sql = "SELECT * FROM tb_notice WHERE notice_seq = '{$notice_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertNotice($data)
    {
      $this->db->insert("tb_notice",$data);
      $result = $this->db->affected_rows();

      return $result;
    }
    
    public function getNoticeAppData($notice_seq)
    {
      $sql = "SELECT * FROM tb_notice_app WHERE notice_seq = '{$notice_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertNoticeApp($data)
    {
      $this->db->insert("tb_notice_app",$data);
      $result = $this->db->affected_rows();

      return $result;
    }    

    public function insertFaq($data)
    {
      $this->db->insert("tb_board_faq",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateFaq($faq_seq,$data)
    {
      $this->db->where("faq_seq",$faq_seq);
      $this->db->update("tb_board_faq",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function insertBook($data)
    {
      $this->db->insert("tb_book",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateBook($book_seq,$data)
    {
      $this->db->where("book_seq",$book_seq);
      $this->db->update("tb_book",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateNotice($notice_seq,$data)
    {
      $this->db->where("notice_seq",$notice_seq);
      $this->db->update("tb_notice",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateNoticeDisplay($notice_seq,$notice_read_type)
    {
      $sql = "UPDATE tb_notice SET notice_read_type = '{$notice_read_type}' WHERE notice_seq = '{$notice_seq}'";
      $this->db->query($sql);
    }

    public function deleteNotice($notice_seq)
    {
      $sql = "DELETE FROM tb_notice WHERE notice_seq = '{$notice_seq}'";
      $this->db->query($sql);
    }


    public function updateNoticeApp($notice_seq,$data)
    {
      $this->db->where("notice_seq",$notice_seq);
      $this->db->update("tb_notice_app",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateNoticeAppDisplay($notice_seq,$notice_read_type)
    {
      $sql = "UPDATE tb_notice_app SET notice_read_type = '{$notice_read_type}' WHERE notice_seq = '{$notice_seq}'";
      $this->db->query($sql);
    }

    public function deleteNoticeApp($notice_seq)
    {
      $sql = "DELETE FROM tb_notice_app WHERE notice_seq = '{$notice_seq}'";
      $this->db->query($sql);
    }

    public function getFaqTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt FROM (SELECT *
               FROM tb_board_faq
              WHERE 1=1 $where) a";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getFaqList($data)
    {
      $where = $data['where'];
      $sort = $data['sort']??" ORDER BY faq_reg_datetime DESC";
      $limit = $data['limit'];

      $sql = "SELECT * FROM tb_board_faq
              WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getFaqData($faq_seq)
    {
      $sql = "SELECT * FROM tb_board_faq
              WHERE faq_seq = '{$faq_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function deleteFaq($faq_seq)
    {
      $sql = "DELETE FROM tb_board_faq WHERE faq_seq = '{$faq_seq}'";
      $this->db->query($sql);
    }

    public function getBookTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt FROM (SELECT *
               FROM tb_book
              WHERE 1=1 $where) a";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getBookList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT *,(SELECT COUNT(*) FROM tb_quiz WHERE book_no = tb_book.book_no) cnt  FROM tb_book WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getBookData($book_seq)
    {
      $sql = "SELECT * FROM tb_book
              WHERE book_seq = '{$book_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function deleteBook($book_seq)
    {
      $sql = "DELETE FROM tb_book WHERE book_seq = '{$faq_seq}'";
      $this->db->query($sql);
    }

    public function getQnaTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt
               FROM tb_board_qna qna
              INNER JOIN tb_user users
              ON users.user_seq = qna.user_seq
              WHERE 1=1 $where";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getQnaList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT qna.*,
              users.group_name,
              users.user_name,
              users.user_type
               FROM tb_board_qna qna
              INNER JOIN tb_user users
              ON users.user_seq = qna.user_seq
              WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getQnaData($qna_seq)
    {
      $sql = "SELECT qna.*,users.user_id,users.user_name FROM tb_board_qna qna
              INNER JOIN tb_user users
              ON users.user_seq = qna.user_seq
              WHERE qna_seq = '{$qna_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function qnaCommentWrite($qna_seq,$data)
    {
      $this->db->where("qna_seq",$qna_seq);
      $this->db->update("tb_board_qna",$data);
    }

    public function deleteQna($qna_seq)
    {
      $sql = "DELETE FROM tb_board_qna WHERE qna_seq = '{$qna_seq}'";
      $this->db->query($sql);
    }

    public function insertQna($data)
    {
      $this->db->insert("tb_board_qna",$data);
    }



    public function getOauthTotalCount($data)
  	{
      $where = $data['where'];
  		$sql = "SELECT count(*) cnt FROM (SELECT users.*
              FROM tb_user users
              LEFT JOIN tb_oauth oauth
              ON oauth.user_seq = users.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE 1=1 $where) a";
  		$result = $this->db->query($sql)->row_array();

  		return $result['cnt'];
  	}

    public function getOauthData($oauth_seq)
    {
      $sql = "SELECT users.*,
              school.school_name,
              oauth.oauth_seq,
              IF(oauth.oauth_seq is NOT NULL,'Y','N') AS oauth_yn,
              oauth.reg_date AS oauth_reg_date
              FROM tb_user users
              LEFT JOIN tb_oauth oauth
              ON oauth.user_seq = users.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE oauth.oauth_seq = '{$oauth_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getOauthList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT users.*,
              school.school_name,
              oauth.oauth_seq,
              IF(oauth.oauth_seq is NOT NULL,'Y','N') AS oauth_yn,
              oauth.reg_date AS oauth_reg_date
              FROM tb_user users
              LEFT JOIN tb_oauth oauth
              ON oauth.user_seq = users.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getExcelOauthList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data['limit'];

      $sql = "SELECT users.*,
              school.school_name,
              oauth.oauth_seq,
              IF(oauth.oauth_seq is NOT NULL,'Y','N') AS oauth_yn,
              oauth.reg_date AS oauth_reg_date,
              oauth.birth_year,
              oauth.birth_month,
              oauth.birth_day,
              oauth.gender,
              oauth.phone,
              oauth.email
              FROM tb_user users
              LEFT JOIN tb_oauth oauth
              ON oauth.user_seq = users.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getBoardViewCountTotal($year,$month,$where="")
    {
      if($month=="all"){
        $month_sql = "";
      }else{
        $month_sql = "AND MONTH(history.reg_date) = '{$month}'";
      }

      $sql = "SELECT count(*) cnt FROM tb_edu_board_history history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id
              WHERE history.edu_type = 'news' AND YEAR(history.reg_date) = '{$year}' {$month_sql} {$where}";
      $news_total = $this->db->query($sql)->row_array();
      $news_total = $news_total['cnt'];

      $sql = "SELECT count(*) cnt FROM tb_edu_board_history history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id WHERE history.edu_type = 'movie' AND YEAR(history.reg_date) = '{$year}' {$month_sql} {$where}";
      $movie_total = $this->db->query($sql)->row_array();
      $movie_total = $movie_total['cnt'];

      $sql = "SELECT count(*) cnt FROM tb_edu_board_history history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id
              WHERE history.edu_type = 'webtoon' AND YEAR(history.reg_date) = '{$year}' {$month_sql} {$where}";
      $webtoon_total = $this->db->query($sql)->row_array();
      $webtoon_total = $webtoon_total['cnt'];

      $returnArr = array(
        "news_total"  =>  $news_total,
        "movie_total" =>  $movie_total,
        "webtoon_total" =>  $webtoon_total
      );

      return $returnArr;
    }

    public function getOauthLocationTotal($year,$month,$limit="3",$where="")
    {
      if($month=="all"){
        $month_sql = "";
      }else{
        $month_sql = "AND MONTH(oauth.reg_date) = '{$month}'";
      }
      $sql = "SELECT count(*) cnt FROM tb_oauth oauth
              INNER JOIN tb_user users
              ON users.user_seq = oauth.user_seq
              WHERE YEAR(oauth.reg_date) = '{$year}' {$month_sql} {$where}";
      $result = $this->db->query($sql)->row_array();
      $location_total = $result['cnt'];

      $sql = "SELECT oauth.location,count(oauth.location) total FROM tb_oauth oauth
              INNER JOIN tb_user users
              ON users.user_seq = oauth.user_seq
              WHERE YEAR(oauth.reg_date) = '{$year}' {$month_sql} {$where} GROUP BY oauth.location ORDER BY total DESC LIMIT {$limit}";
      $result = $this->db->query($sql)->result_array();

      $returnArr = array(
        "location_total"  =>  $location_total,
        "locationArr" =>  $result
      );

      return $returnArr;
    }

    public function getDayPlayInsight($year,$month,$school_seq,$location,$type,$where="")
    {
      $school_sql = "";
      $location_sql = "";

      if($school_seq != "all"){
        $school_sql = " AND users.school_seq = '{$school_seq}'";
      }

      if($location != "all"){
        $location_sql = " AND users.location = '{$location}'";
      }

      $sql = "SELECT DAY(history.reg_date) day,count(*) cnt FROM tb_edu_board_history history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id
              WHERE YEAR(history.reg_date) = '{$year}' AND MONTH(history.reg_date) = '{$month}' AND history.edu_type = '{$type}' {$school_sql} {$location_sql} {$where} GROUP BY DATE(history.reg_date) ORDER BY DATE(history.reg_date) ASC";
      $total = $this->db->query($sql)->result_array();
      return $total;
    }

    public function getDayGameInsight($year,$month,$school_seq,$location,$where="")
    {
      $school_sql = "";
      $location_sql = "";

      if($school_seq != "all"){
        $school_sql = " AND users.school_seq = '{$school_seq}'";
      }

      if($location != "all"){
        $location_sql = " AND users.location = '{$location}'";
      }

      $sql = "SELECT DAY(history.reg_date) day,count(*) cnt FROM tb_game_history history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id
              WHERE YEAR(history.reg_date) = '{$year}' AND MONTH(history.reg_date) = '{$month}' {$school_sql} {$location_sql} {$where} GROUP BY DATE(history.reg_date) ORDER BY DATE(history.reg_date) ASC";

      $total = $this->db->query($sql)->result_array();
      return $total;
    }

    public function getDayQuizInsight($year,$month,$school_seq,$location,$where="")
    {
      $school_sql = "";
      $location_sql = "";

      if($school_seq != "all"){
        $school_sql = " AND users.school_seq = '{$school_seq}'";
      }

      if($location != "all"){
        $location_sql = " AND users.location = '{$location}'";
      }

      $sql = "SELECT DAY(history.reg_date) day,count(*) cnt FROM tb_quiz_hist history
              INNER JOIN tb_user users
              ON users.user_id = history.user_id
              WHERE YEAR(history.reg_date) = '{$year}' AND MONTH(history.reg_date) = '{$month}' {$school_sql} {$location_sql} {$where} GROUP BY DATE(history.reg_date) ORDER BY DATE(history.reg_date) ASC";

      $total = $this->db->query($sql)->result_array();
      return $total;
    }

  }
?>
