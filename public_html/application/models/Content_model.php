<?php
  class Content_Model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    public function getEduTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_edu_board WHERE 1=1 $where";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getEduList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_edu_board WHERE 1=1 {$where} ORDER BY edu_reg_datetime DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function insertEduTemp($data)
    {
      $this->db->insert("tb_edu_board_temp",$data);
    }

    public function getCarbornPdf($book_seq)
    {
      $sql = "SELECT book_file FROM tb_book WHERE book_seq = '{$book_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['book_file'];
    }

    public function getEduTempList()
    {
      $sql = "SELECT * FROM tb_edu_board_temp ORDER BY edu_seq DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getEduTemp($edu_seq)
    {
      $sql = "SELECT * FROM tb_edu_board_temp WHERE edu_seq = '{$edu_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getEduData($edu_seq)
    {
      $sql = "SELECT * FROM tb_edu_board WHERE edu_seq = '{$edu_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function updateEduDisplay($edu_seq,$edu_display_yn)
    {
      $sql = "UPDATE tb_edu_board SET edu_display_yn = '{$edu_display_yn}' WHERE edu_seq = '{$edu_seq}'";
      $this->db->query($sql);
    }

    public function insertEdu($data)
    {
      $this->db->insert("tb_edu_board",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateEdu($data,$edu_seq)
    {
      $this->db->where("edu_seq",$edu_seq);
      $this->db->update("tb_edu_board",$data);

      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteEdu($edu_seq)
    {
      $sql = "DELETE FROM tb_edu_board WHERE edu_seq = '{$edu_seq}'";
      $this->db->query($sql);
    }

    public function deleteEduTemp($edu_seq)
    {
      $sql = "DELETE FROM tb_edu_board_temp WHERE edu_seq = '{$edu_seq}'";
      $this->db->query($sql);
    }

    public function getQuizTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_quiz WHERE 1=1 $where";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getQuizList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_quiz WHERE 1=1 {$where} ORDER BY reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getQuizData($quiz_seq)
    {
      $sql = "SELECT * FROM tb_quiz WHERE quiz_seq = '{$quiz_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertQuiz($data)
    {
      $this->db->insert("tb_quiz",$data);
      $result = $this->db->affected_rows();

      $sql = "SELECT MAX(quiz_seq) quiz_seq FROM tb_quiz";
      $result = $this->db->query($sql)->row_array();

      if($data['status']=="Y"){
        $quiz_seq = $result['quiz_seq'];
        $sql = "UPDATE tb_quiz SET status = 'N'";
        $this->db->query($sql);

        $sql = "UPDATE tb_quiz SET status = 'Y' WHERE quiz_seq = '{$quiz_seq}'";
        $this->db->query($sql);
      }

      return $result;
    }

    public function updateQuiz($quiz_seq,$data)
    {
      $this->db->where("quiz_seq",$quiz_seq);
      $this->db->update("tb_quiz",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteQuiz($quiz_seq)
    {
      $sql = "DELETE FROM tb_quiz WHERE quiz_seq = '{$quiz_seq}'";
      $this->db->query($sql);
    }

    public function getQuizViewCount()
    {
      $sql = "SELECT count(*) cnt FROM tb_quiz WHERE status = 'Y'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function updateQuizStatus($quiz_seq)
    {
      $sql = "UPDATE tb_quiz SET status = 'N'";
      $this->db->query($sql);

      $sql = "UPDATE tb_quiz SET status = 'Y' WHERE quiz_seq = '{$quiz_seq}'";
      $this->db->query($sql);
    }

    public function getChallengeCategory()
    {
      $query = "SELECT * FROM tb_challenge ORDER BY sort_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getChallengeDepth1()
    {
      $sql = "SELECT * FROM tb_challenge WHERE challenge_depth = '1' ORDER BY sort_num ASC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getChallenge($challenge_seq)
    {
      $sql = "SELECT * FROM tb_challenge WHERE challenge_seq = '{$challenge_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getDayDuplicate($feed_challenge_seq,$user_seq)
    {
      $sql = "SELECT MAX(feed_seq) feed_seq FROM tb_feed WHERE user_seq = '{$user_seq}' AND feed_challenge_seq = '{$feed_challenge_seq}'";
      $result = $this->db->query($sql)->row_array();
      $returnArr = array();
      $returnArr['bool'] = true;
      if(empty($result['feed_seq'])){
        $returnArr['bool'] = true;
      }else{
        $feed_seq = $result['feed_seq'];
        $sql = "SELECT limit_day FROM tb_challenge WHERE challenge_seq = '{$feed_challenge_seq}'";
        $rows = $this->db->query($sql)->row_array();
        $limit_day = $rows['limit_day'];

        $sql = "SELECT DATEDIFF(NOW(),reg_date) as days_diff FROM tb_feed WHERE feed_seq = '{$feed_seq}'";
        $day_diff = $this->db->query($sql)->row_array();

        if($limit_day>$day_diff['days_diff']){
          $returnArr['bool'] = false;
          $returnArr['limit'] = $limit_day;
        }
      }



      return $returnArr;

    }

    public function getChallengeNode($id)
    {
      $sql = "SELECT * FROM tb_challenge WHERE challenge_cate_id = '{$id}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertChallenge($data)
    {
      $this->db->insert("tb_challenge",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateChallenge($challenge_seq,$data)
    {
      $this->db->where("challenge_seq",$challenge_seq);
      $this->db->update("tb_challenge",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteChallenge($challenge_seq)
    {
      $sql = "SELECT * FROM tb_challenge WHERE challenge_seq = '{$challenge_seq}'";
      $result = $this->db->query($sql)->row_array();

      $challenge_cate_id = $result['challenge_cate_id'];

      $sql = "DELETE FROM tb_challenge WHERE challenge_seq = '{$challenge_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_challenge WHERE challenge_parent_cate_id = '{$challenge_cate_id}'";
      $this->db->query($sql);
    }

    public function getChallengeListTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT feed.* FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              LEFT JOIN tb_school_class class
              ON class.school_seq = users.school_seq AND class.school_year = users.school_year AND class.school_class = users.school_class
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_challenge_seq
              WHERE 1=1 {$where} AND feed.status = 'Y') a";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getChallengeList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $sql = "SELECT feed.*,
              school.school_name,
              users.school_year,
              users.school_class,
              users.user_name,
              users.user_id,
              challenge.challenge_title ,
              (SELECT challenge_title FROM tb_challenge WHERE challenge_seq = feed.feed_parent_challenge_seq) parent_title,
              challenge.challenge_carbon_point FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              LEFT JOIN tb_school_class class
              ON class.school_seq = users.school_seq AND class.school_year = users.school_year AND class.school_class = users.school_class
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_challenge_seq
              WHERE 1=1 {$where} AND feed.status = 'Y' ORDER BY feed.reg_date DESC {$limit}";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getFindParentChallenge($challenge_seq)
    {
      $sql = "SELECT * FROM tb_challenge WHERE challenge_seq = '{$challenge_seq}'";
      $result = $this->db->query($sql)->row_array();

      $challenge_parent_cate_id = $result['challenge_parent_cate_id'];
      $sql = "SELECT * FROM tb_challenge WHERE challenge_cate_id = '{$challenge_parent_cate_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getChallengeDepth2($parent_seq)
    {
      $sql = "SELECT challenge_cate_id FROM tb_challenge WHERE challenge_seq = '{$parent_seq}'";
      $cate_id = $this->db->query($sql)->row_array();
      $cate_id = $cate_id['challenge_cate_id'];
      $sql = "SELECT * FROM tb_challenge WHERE challenge_parent_cate_id = '{$cate_id}' ORDER BY sort_num ASC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getFeedTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt
                 FROM (SELECT feed.* FROM tb_feed feed
                INNER JOIN tb_user users
                ON users.user_seq = feed.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = users.school_seq
                INNER JOIN tb_challenge challenge
                ON challenge.challenge_seq = feed.feed_challenge_seq
                LEFT JOIN tb_feed_report report
                ON report.feed_seq = feed.feed_seq
                WHERE 1=1 {$where} ) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getFeedList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $query = "SELECT feed.*,
                challenge.challenge_title,
                school.school_name,
                users.user_id,
                users.user_name,
                users.profile_img,
                (SELECT count(*) FROM tb_feed_like WHERE feed_seq = feed.feed_seq) like_total,
                (SELECT count(*) FROM tb_feed_comment WHERE feed_seq = feed.feed_seq) comment_total,
                (SELECT count(*) FROM tb_feed_report WHERE feed_seq = feed.feed_seq) report_total
                 FROM tb_feed feed
                INNER JOIN tb_user users
                ON users.user_seq = feed.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = users.school_seq
                INNER JOIN tb_challenge challenge
                ON challenge.challenge_seq = feed.feed_challenge_seq
                LEFT JOIN tb_feed_report report
                ON report.feed_seq = feed.feed_seq
                WHERE 1=1 {$where} ORDER BY reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getAdFeedList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $query = "SELECT ad.*,
                challenge.challenge_title,
                school.school_name,
                users.user_id,
                users.user_name,
                users.profile_img,
                (SELECT count(*) FROM tb_feed_like WHERE feed_seq = feed.feed_seq) like_total,
                (SELECT count(*) FROM tb_feed_comment WHERE feed_seq = feed.feed_seq) comment_total,
                (SELECT count(*) FROM tb_feed_report WHERE feed_seq = feed.feed_seq) report_total
                 FROM tb_feed feed
                INNER JOIN tb_user users
                ON users.user_seq = feed.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = users.school_seq
                INNER JOIN tb_challenge challenge
                ON challenge.challenge_seq = feed.feed_challenge_seq
                LEFT JOIN tb_feed_report report
                ON report.feed_seq = feed.feed_seq
                WHERE 1=1 {$where} ORDER BY reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getUserChallengeCount($user_seq)
    {
      $sql = "SELECT challenge.challenge_seq,
                      challenge.challenge_title,
                      challenge.challenge_icon,
                      (select count(*) from tb_feed WHERE feed_parent_challenge_seq = challenge.challenge_seq AND user_seq = '{$user_seq}' AND status = 'Y') total
                      FROM tb_challenge challenge WHERE challenge_depth = 1 ORDER BY total DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getReportList($feed_seq)
    {
      $sql = "SELECT report.*,users.user_id FROM tb_feed_report report
              INNER JOIN tb_user users
              ON users.user_seq = report.user_seq
              WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function updateStatusFeed($feed_seq)
    {
      $sql = "UPDATE tb_feed SET status = 'Y',del_txt = '',update_time = NOW() WHERE feed_seq = '{$feed_seq}'";
      $this->db->query($sql);
    }

    public function amdinDeleteFeed($feed_seq,$del_txt)
    {
      $sql = "UPDATE tb_feed SET del_txt='{$del_txt}', status = 'D',update_time = NOW() WHERE feed_seq = '{$feed_seq}'";
      $this->db->query($sql);

      $sql = "SELECT feed.*,users.user_name,users.user_id FROm tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();
      return $result;
    }

    public function insertFeed($data)
    {
      $this->db->insert("tb_feed",$data);
      $feed_seq = $this->db->insert_id();

      $challenge_seq = $data['feed_challenge_seq'];
      $user_seq = $data['user_seq'];
      $sql = "SELECT * FROM tb_user WHERE user_seq = '{$user_seq}'";
      $userData = $this->db->query($sql)->row_array();
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];
      $school_seq = $userData['school_seq'];
      $school_year = $userData['school_year'];
      $school_class = $userData['school_class'];

      $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_year = '{$school_year}' AND school_class = '{$school_class}' AND school_seq = '{$school_seq}'";
      $schoolClassData = $this->db->query($sql)->row_array();

      if(!is_array($schoolClassData)){
        $school_class_seq = 0;
      }else{
        $school_class_seq = $schoolClassData['school_class_seq'];
      }


      $sql = "SELECT challenge_carbon_point FROM tb_challenge WHERE challenge_seq = '{$challenge_seq}'";
      $carbon_point = $this->db->query($sql)->row_array();
      $carbon_point = $carbon_point['challenge_carbon_point'];
      $point = $carbon_point * 10;
      $carbon_point = $carbon_point;
      $carbon_type = "C";
      $carbon_year = date("Y");
      $carbon_month = date("m");
      $point_year = date("Y");
      $point_month = date("m");

      $data = array(
        "school_seq"  =>  $school_seq,
        "school_class_seq" => $school_class_seq,
        "user_seq"  =>  $user_seq,
        "user_id" =>  $user_id,
        "user_name" =>  $user_name,
        "carbon_type" =>  $carbon_type,
        "challenge_seq" =>  $challenge_seq,
        "carbon_year" =>  $carbon_year,
        "carbon_month"  =>  $carbon_month,
        "point_year"  =>  $point_year,
        "point_month" =>  $point_month,
        "carbon"  =>  $carbon_point,
        "point" =>  $point,
        "reg_date"  =>  date("Y-m-d H:i:s")
      );

      $this->db->insert("tb_point_hist",$data);

      $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
      $pointResult = $this->db->query($sql)->row_array();

      if(is_array($pointResult)){
        $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
        $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
        $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $this->db->query($sql);
      }else{
        $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                VALUES ('{$carbon_year}','{$carbon_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
        $this->db->query($sql);
      }

      return $feed_seq;
    }

    public function getCarbonUserTotal($user_seq)
    {
      $sql = "SELECT carbon FROM tb_point_hist_static WHERE user_seq = '{$user_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['carbon'];
    }

    public function updateFeed($feed_seq,$data)
    {
      $this->db->where("feed_seq",$feed_seq);
      $this->db->update("tb_feed",$data);
    }

    public function deleteFeed($feed_seq)
    {
      $sql = "UPDATE tb_feed SET del_txt='사용자삭제', status = 'D',update_time = NOW() WHERE feed_seq = '{$feed_seq}'";
      $this->db->query($sql);

      $sql = "SELECT users.* FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE feed_seq = '{$feed_seq}'";
      $userData = $this->db->query($sql)->row_array();
      $user_seq = $userData['user_seq'];
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];
      $school_seq = $userData['school_seq'];
      $school_year = $userData['school_year'];
      $school_class = $userData['school_class'];

      $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_year = '{$school_year}' AND school_class = '{$school_class}' AND school_seq = '{$school_seq}'";
      $schoolClassData = $this->db->query($sql)->row_array();

      if(!is_array($schoolClassData)){
        $school_class_seq = 0;
      }else{
        $school_class_seq = $schoolClassData['school_class_seq'];
      }





      //포인트 차감
      $sql = "SELECT * FROM tb_challenge challenge
              INNER JOIN tb_feed feed
              ON feed.feed_challenge_seq = challenge.challenge_seq
              WHERE feed.feed_seq = '{$feed_seq}'";
      $challengeData = $this->db->query($sql)->row_array();
      $challenge_seq = $challengeData['challenge_seq'];
      $carbon_point = $challengeData['challenge_carbon_point'];
      $point = -($carbon_point * 10);
      $carbon_point = -$carbon_point;
      $carbon_type = "C";
      $carbon_year = date("Y");
      $carbon_month = date("m");
      $point_year = date("Y");
      $point_month = date("m");

      $data = array(
        "school_seq"  =>  $school_seq,
        "school_class_seq" => $school_class_seq,
        "user_seq"  =>  $user_seq,
        "user_id" =>  $user_id,
        "user_name" =>  $user_name,
        "carbon_type" =>  $carbon_type,
        "challenge_seq" =>  $challenge_seq,
        "carbon_year" =>  $carbon_year,
        "carbon_month"  =>  $carbon_month,
        "point_year"  =>  $point_year,
        "point_month" =>  $point_month,
        "carbon"  =>  $carbon_point,
        "point" =>  $point,
        "reg_date"  =>  date("Y-m-d H:i:s")
      );

      $this->db->insert("tb_point_hist",$data);

      $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
      $pointResult = $this->db->query($sql)->row_array();

      if(is_array($pointResult)){
        $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
        $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
        $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $this->db->query($sql);
      }else{
        $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                VALUES ('{$carbon_year}','{$carbon_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
        $this->db->query($sql);
      }
    }

    public function getAdTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_adv ad WHERE 1=1 $where";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getAdList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT ad.*,(SELECT count(*) FROM tb_adv_hist WHERE adv_seq = ad.adv_seq) AS adv_view FROM tb_adv ad
                WHERE 1=1 {$where} ORDER BY ad.reg_date DESC {$limit}";
      $result = $this->db->query($query)->result_array();


      return $result;
    }

    public function getAdSchool($adv_seq)
    {
      $sql = "SELECT school_seq FROM tb_adv WHERE adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['school_seq'];
    }

    public function insertAd($data)
    {
      $this->db->insert("tb_adv",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateAd($adv_seq,$data)
    {
      $this->db->where("adv_seq",$adv_seq);
      $this->db->update("tb_adv",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteAd($adv_seq)
    {
      $sql = "DELETE FROM tb_adv WHERE adv_seq = '{$adv_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_adv_hist WHERE adv_seq = '{$adv_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_adv_like WHERE adv_seq = '{$adv_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_adv_comment WHERE adv_seq = '{$adv_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_adv_link_hist WHERE adv_seq = '{$adv_seq}'";
      $this->db->query($sql);
    }

    public function getAdData($adv_seq)
    {
      $sql = "SELECT * FROM tb_adv WHERE adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    //노출통계
    public function getAdViewTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_hist hist
              INNER JOIN tb_user users
              ON users.user_seq= hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    //링크통계
    public function getAdLinkTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_link_hist hist
              INNER JOIN tb_user users
              ON users.user_seq= hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    //좋아요통계
    public function getAdLikeTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_like hist
              INNER JOIN tb_user users
              ON users.user_id= hist.user_id
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    //댓글통계
    public function getAdCommentTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment comment
              INNER JOIN tb_user users
              ON users.user_id= comment.user_id
              WHERE comment.adv_seq = '{$adv_seq}' AND users.user_status = 'C'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    //날짜별 총 통계
    public function getAdAllViewData($adv_seq)
    {
      $sql = "SELECT
              date_format(a.reg_date,'%Y-%m-%d') reg_date,
              a.view_total,
              (SELECT count(*) FROM tb_adv_like WHERE adv_seq = a.adv_seq AND date_format(reg_date,'%Y-%m-%d') = date_format(a.reg_date,'%Y-%m-%d')) like_total,
              (SELECT count(*) FROM tb_adv_link_hist WHERE adv_seq = a.adv_seq AND date_format(reg_date,'%Y-%m-%d') = date_format(a.reg_date,'%Y-%m-%d')) link_total,
              (SELECT count(*) FROM tb_adv_comment WHERE adv_seq = a.adv_seq AND date_format(reg_date,'%Y-%m-%d') = date_format(a.reg_date,'%Y-%m-%d')) comment_total
               FROM (SELECT date_format(hist.reg_date,'%Y-%m-%d') reg_date,adv_seq,count(*) view_total FROM tb_adv_hist hist
               INNER JOIN tb_user users
               ON users.user_seq = hist.user_seq
               WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C'
              GROUP BY date_format(hist.reg_date,'%Y-%m-%d')) a";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //지역별 총 통계
    public function getAdLocationViewData($adv_seq)
    {
      $sql = "SELECT users.location,count(*) view_total FROM tb_adv_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C' GROUP BY users.location ORDER BY view_total DESC LIMIT 5";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //학교별 총 통계
    public function getAdSchoolViewData($adv_seq)
    {
      $sql = "SELECT IF(users.school_name='','개인',users.school_name) school_name,count(*) view_total FROM tb_adv_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C' GROUP BY users.school_seq ORDER BY view_total DESC LIMIT 5";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //성별 총 통계
    public function getAdGenderViewData($adv_seq)
    {
      $sql = "SELECT users.gender,count(*) view_total FROM tb_adv_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C' GROUP BY users.gender ORDER BY view_total DESC LIMIT 5";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //나이별 총 통계
    public function getAdAgeViewData($adv_seq)
    {
      $sql = "SELECT YEAR(NOW())-LEFT(users.birthday,4) +1 AS age,count(*) view_total FROM tb_adv_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.adv_seq = '{$adv_seq}' AND users.user_status = 'C' GROUP BY age ORDER BY view_total DESC LIMIT 5";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }


    public function getBookTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_book WHERE 1=1 $where";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getBookList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_book WHERE 1=1 {$where} ORDER BY book_reg_datetime DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getChallengeFeedTotal($year,$month,$limit="3",$where="")
    {
      if($month=="all"){
        $month_sql = "";
      }else{
        $month_sql = " AND MONTH(feed.reg_date) = '{$month}'";
      }

      /*
      $sql = "SELECT count(feed.feed_challenge_seq) challenge_total, feed.feed_challenge_title FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE YEAR(feed.reg_date) = '{$year}' {$month_sql} {$where} GROUP BY feed.feed_challenge_seq ORDER BY challenge_total DESC LIMIT {$limit}";
      */
      $sql = "SELECT count(*) challenge_total,challenge.challenge_title FROM tb_feed feed
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_parent_challenge_seq
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE YEAR(feed.reg_date) = '{$year}' {$month_sql} {$where}
              GROUP BY feed.feed_parent_challenge_seq
              ORDER BY challenge.sort_num ASC LIMIT 3";

      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getCarbonTotal($year,$month,$where="")
    {
      if($month=="all"){
        $month_sql = "";
      }else{
        $month_sql = "AND hist.carbon_month = '{$month}'";
      }

      $sql = "SELECT SUM(hist.carbon) carbon_total FROM tb_point_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.carbon_year = '{$year}' {$month_sql} {$where}";
      $result = $this->db->query($sql)->row_array();
      return $result['carbon_total'];
    }

    public function getChallengeInsight($year,$month,$school_seq,$location,$where="")
    {
      $school_sql = "";
      $location_sql = "";

      if($school_seq != "all"){
        $school_sql = " AND users.school_seq = '{$school_seq}'";
      }

      if($location != "all"){
        $location_sql = " AND users.location = '{$location}'";
      }

      $sql = "SELECT DAY(feed.reg_date) day,count(*) cnt,challenge.challenge_title FROM tb_feed feed
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_parent_challenge_seq
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE YEAR(feed.reg_date) = '{$year}' AND MONTH(feed.reg_date) = '{$month}' {$school_sql} {$location_sql} {$where}
              GROUP BY feed.feed_parent_challenge_seq,DATE(feed.reg_date)
              ORDER BY challenge.sort_num ASC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getDayCarbonInsight($year,$month,$school_seq,$location,$where="")
    {
      $school_sql = "";
      $location_sql = "";
      $month_sql = "";

      if($school_seq != "all"){
        $school_sql = " AND users.school_seq = '{$school_seq}'";
      }

      if($location != "all"){
        $location_sql = " AND users.location = '{$location}'";
      }

      if(!empty($month) && $month != "all"){
        $month_sql = " AND hist.carbon_month = '{$month}'";
      }

      /*
      $sql = "SELECT DAY(feed.reg_date) day,IF(SUM(challenge.challenge_carbon_point) is NULL,0,SUM(challenge.challenge_carbon_point)) cnt FROM tb_feed feed
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_challenge_seq
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE YEAR(feed.reg_date) = '{$year}' AND feed.status = 'Y' {$month_sql} {$school_sql} {$location_sql} {$where}
              GROUP BY DATE(feed.reg_date)
              ORDER BY DATE(feed.reg_date) ASC";
      */
      $sql = "SELECT DAY(hist.reg_date) day,SUM(hist.carbon) cnt FROM tb_point_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.carbon_year = '{$year}' {$month_sql} {$school_sql} {$location_sql} {$where}
              GROUP BY DATE(hist.reg_date)
              ORDER BY DATE(hist.reg_date) ASC";
      $carbon_data = $this->db->query($sql)->result_array();

      /*
      $sql = "SELECT IF(SUM(challenge.challenge_carbon_point) is NULL,0,SUM(challenge.challenge_carbon_point)) carbon_total FROM tb_feed feed
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = feed.feed_challenge_seq
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE YEAR(feed.reg_date) = '{$year}' AND feed.status = 'Y' {$month_sql} {$school_sql} {$location_sql} {$where}
              ORDER BY DATE(feed.reg_date) ASC";
      */
      $sql = "SELECT DAY(hist.reg_date) day,SUM(hist.carbon) carbon_total FROM tb_point_hist hist
              INNER JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE hist.carbon_year = '{$year}' {$month_sql} {$school_sql} {$location_sql} {$where}
              ORDER BY DATE(hist.reg_date) ASC";
      $carbon_total = $this->db->query($sql)->row_array();

      $returnArr = array(
        "carbon_data" =>  $carbon_data,
        "carbon_total"  =>  $carbon_total
      );

      return $returnArr;
    }

    public function getFeedComment($feed_seq)
    {
      $sql = "SELECT comment.*,users.profile_img,school.school_name FROM tb_feed_comment comment
              INNER JOIN tb_user users
              ON users.user_id = comment.user_id
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE feed_seq = '{$feed_seq}' AND comment_seq = 0 ORDER BY reg_date DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getAdFeedComment($adv_seq)
    {
      $sql = "SELECT comment.*,users.profile_img,school.school_name FROM tb_adv_comment comment
              INNER JOIN tb_user users
              ON users.user_id = comment.user_id
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE comment.adv_seq = '{$adv_seq}' AND comment.comment_seq = 0 ORDER BY reg_date DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getFeedCommentTotal($feed_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_comment WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAdFeedCommentTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment WHERE adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function addCommentLike($comment_seq,$user_id,$user_name)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $commentLikeData = $this->db->query($sql)->row_array();
      if($commentLikeData['cnt']==0){
        $sql = "INSERT INTO tb_feed_comment_like (comment_seq,user_id,user_name,reg_date) VALUES ('{$comment_seq}','{$user_id}','{$user_name}',NOW())";
        $this->db->query($sql);
      }

      $sql = "SELECT user_id,feed_seq FROM tb_feed_comment WHERE feed_comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;

    }

    public function addAdCommentLike($comment_seq,$user_id,$user_name)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $commentLikeData = $this->db->query($sql)->row_array();
      if($commentLikeData['cnt']==0){
        $sql = "INSERT INTO tb_adv_comment_like (comment_seq,user_id,user_name,reg_date) VALUES ('{$comment_seq}','{$user_id}','{$user_name}',NOW())";
        $this->db->query($sql);
      }

      $sql = "SELECT user_id,adv_seq FROM tb_adv_comment WHERE adv_comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;

    }

    public function removeCommentLike($comment_seq,$user_id,$user_name)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $commentLikeData = $this->db->query($sql)->row_array();

      if($commentLikeData['cnt']>0){
        $sql = "DELETE FROM tb_feed_comment_like WHERE comment_seq='{$comment_seq}' AND user_id = '{$user_id}'";
        $this->db->query($sql);
      }

      $sql = "SELECT user_id,feed_seq FROM tb_feed_comment WHERE comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function removeAdCommentLike($comment_seq,$user_id,$user_name)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $commentLikeData = $this->db->query($sql)->row_array();

      if($commentLikeData['cnt']>0){
        $sql = "DELETE FROM tb_adv_comment_like WHERE comment_seq='{$comment_seq}' AND user_id = '{$user_id}'";
        $this->db->query($sql);
      }

      $sql = "SELECT user_id,adv_seq FROM tb_adv_comment WHERE adv_comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertComment($data)
    {
      $feed_seq = $data['feed_seq'];
      $data['reg_date'] = date("Y-m-d H:i:s");
      $this->db->insert("tb_feed_comment",$data);

      $sql = "SELECT users.* FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertAdComment($data)
    {
      $adv_seq = $data['adv_seq'];
      $data['reg_date'] = date("Y-m-d H:i:s");
      $this->db->insert("tb_adv_comment",$data);

    }

    public function getFeedLikeTotal($feed_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_like WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAdFeedLikeTotal($adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_like WHERE adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getFeedCommentToComment($comment_seq)
    {
      $sql = "SELECT comment.*,users.profile_img,school.school_name FROM tb_feed_comment comment
              INNER JOIN tb_user users
              ON users.user_id = comment.user_id
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE comment_seq = '{$comment_seq}' ORDER BY reg_date DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getAdFeedCommentToComment($comment_seq)
    {
      $sql = "SELECT comment.*,users.profile_img,school.school_name FROM tb_adv_comment comment
              INNER JOIN tb_user users
              ON users.user_id = comment.user_id
              LEFT JOIN tb_school school
              ON school.school_seq = users.school_seq
              WHERE comment.comment_seq = '{$comment_seq}' ORDER BY reg_date DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getCommentTotalLike($comment_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_comment_like WHERE comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAdCommentTotalLike($comment_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment_like WHERE comment_seq = '{$comment_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getLikeFeed($user_id,$feed_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_like WHERE user_id = '{$user_id}' AND feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAdLikeFeed($user_id,$adv_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_like WHERE user_id = '{$user_id}' AND adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getMyFeed($user_seq,$feed_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed WHERE user_seq = '{$user_seq}' AND feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function insertFeedLike($feed_seq,$userData)
    {
      $user_seq = $userData['user_seq'];
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];

      $reg_date = date("Y-m-d H:i:s");

      $sql = "INSERT INTO tb_feed_like (feed_seq,user_id,user_name,read_yn,reg_date) VALUES ('{$feed_seq}','{$user_id}','{$user_name}','N','{$reg_date}')";
      $this->db->query($sql);
    }

    public function deleteFeedLike($feed_seq,$userData)
    {
      $user_seq = $userData['user_seq'];
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];

      $reg_date = date("Y-m-d H:i:s");

      $sql = "DELETE FROM tb_feed_like WHERE feed_seq = '{$feed_seq}' AND user_id = '{$user_id}'";
      $this->db->query($sql);
    }

    public function insertAdLike($adv_seq,$userData)
    {
      $user_seq = $userData['user_seq'];
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];

      $reg_date = date("Y-m-d H:i:s");

      $sql = "INSERT INTO tb_adv_like (adv_seq,user_id,user_name,reg_date) VALUES ('{$adv_seq}','{$user_id}','{$user_name}','{$reg_date}')";
      $this->db->query($sql);
    }

    public function deleteAdLike($adv_seq,$userData)
    {
      $user_seq = $userData['user_seq'];
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];

      $reg_date = date("Y-m-d H:i:s");

      $sql = "DELETE FROM tb_adv_like WHERE adv_seq = '{$adv_seq}' AND user_id = '{$user_id}'";
      $this->db->query($sql);
    }

    public function getFeedUser($feed_seq)
    {
      $sql = "SELECT users.user_id FROM tb_feed feed
              INNER JOIN tb_user users
              ON users.user_seq = feed.user_seq
              WHERE feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getFeed($feed_seq)
    {
      $sql = "SELECT feed.*,
                challenge.challenge_title,
                challenge.challenge_seq,
                school.school_name,
                users.user_seq,
                users.user_id,
                users.user_name,
                users.profile_img
                 FROM tb_feed feed
                INNER JOIN tb_user users
                ON users.user_seq = feed.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = users.school_seq
                INNER JOIN tb_challenge challenge
                ON challenge.challenge_seq = feed.feed_challenge_seq
                LEFT JOIN tb_feed_report report
                ON report.feed_seq = feed.feed_seq
                WHERE feed.feed_seq = '{$feed_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getCommentIsLike($comment_seq,$user_id)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAdCommentIsLike($comment_seq,$user_id)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_comment_like WHERE comment_seq = '{$comment_seq}' AND user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getFeedReport($feed_seq,$user_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_feed_report WHERE feed_seq = '{$feed_seq}' AND user_seq = '{$user_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function insertFeedReport($data)
    {
      $this->db->insert("tb_feed_report",$data);
    }

    public function getEduBoardList($type)
    {
      $sql = "SELECT * FROM tb_edu_board WHERE edu_type = '{$type}' AND edu_display_yn = 'Y' ORDER BY edu_reg_datetime DESC";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getEduBoardView($edu_seq)
    {
      $sql = "SELECT * FROM tb_edu_board WHERE edu_seq = '{$edu_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getGameHistory($data)
    {
      $user_id = $data['user_id'];

      $sql = "SELECT * FROM tb_game_history WHERE user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      if(!is_array($result)){
        $sql = "INSERT INTO tb_game_history (user_id,reg_date) VALUES ('{$user_id}',NOW())";
        $this->db->query($sql);

        //포인트 삽입
        $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}'";
        $userData = $this->db->query($sql)->row_array();
        $user_id = $userData['user_id'];
        $user_seq = $userData['user_seq'];
        $user_name = $userData['user_name'];
        $school_seq = $userData['school_seq'];
        $school_year = $userData['school_year'];
        $school_class = $userData['school_class'];

        $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_year = '{$school_year}' AND school_class = '{$school_class}' AND school_seq = '{$school_seq}'";
        $schoolClassData = $this->db->query($sql)->row_array();

        if(!is_array($schoolClassData)){
          $school_class_seq = 0;
        }else{
          $school_class_seq = $schoolClassData['school_class_seq'];
        }

        $point = 10;
        $carbon_point = 0;
        $carbon_type = "B";
        $point_year = date("Y");
        $point_month = date("m");
        $carbon_year = date("Y");
        $carbon_month = date("m");

        $pointData = array(
          "user_id" =>  $user_id,
          "user_seq"  =>  $user_seq,
          "user_name" =>  $user_name,
          "school_seq"  =>  $school_seq,
          "school_class_seq"  =>  $school_class_seq,
          "point" =>  $point,
          "carbon_type" =>  $carbon_type,
          "point_year"  =>  $point_year,
          "point_month" =>  $point_month,
          "reg_date"  =>  date("Y-m-d H:i:s")
        );

        $this->db->insert("tb_point_hist",$pointData);

        $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $pointResult = $this->db->query($sql)->row_array();

        if(is_array($pointResult)){
          $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
          $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
          $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
          $this->db->query($sql);
        }else{
          $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                  VALUES ('{$point_year}','{$point_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
          $this->db->query($sql);
        }
      }
    }

    public function getEduHistory($data)
    {
      $user_id = $data['user_id'];
      $edu_seq = $data['edu_seq'];
      $type = $data['type'];

      $sql = "SELECT * FROM tb_edu_board_history WHERE edu_seq = '{$edu_seq}' AND edu_type = '{$type}' AND user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      if(!is_array($result)){
        $sql = "INSERT INTO tb_edu_board_history (edu_seq,edu_type,user_id,reg_date) VALUES ('{$edu_seq}','{$type}','{$user_id}',NOW())";
        $this->db->query($sql);

        //포인트 삽입
        $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}'";
        $userData = $this->db->query($sql)->row_array();
        $user_id = $userData['user_id'];
        $user_seq = $userData['user_seq'];
        $user_name = $userData['user_name'];
        $school_seq = $userData['school_seq'];
        $school_year = $userData['school_year'];
        $school_class = $userData['school_class'];

        $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_year = '{$school_year}' AND school_class = '{$school_class}' AND school_seq = '{$school_seq}'";
        $schoolClassData = $this->db->query($sql)->row_array();

        if(!is_array($schoolClassData)){
          $school_class_seq = 0;
        }else{
          $school_class_seq = $schoolClassData['school_class_seq'];
        }

        $point = 10;
        $carbon_point = 0;
        $carbon_type = "B";
        $point_year = date("Y");
        $point_month = date("m");

        $pointData = array(
          "user_id" =>  $user_id,
          "user_seq"  =>  $user_seq,
          "user_name" =>  $user_name,
          "school_seq"  =>  $school_seq,
          "school_class_seq"  =>  $school_class_seq,
          "point" =>  $point,
          "carbon_type" =>  $carbon_type,
          "point_year"  =>  $point_year,
          "point_month" =>  $point_month,
          "reg_date"  =>  date("Y-m-d H:i:s")
        );

        $this->db->insert("tb_point_hist",$pointData);

        $carbon_year = date("Y");
        $carbon_month = date("m");

        $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $pointResult = $this->db->query($sql)->row_array();

        if(is_array($pointResult)){
          $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
          $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
          $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
          $this->db->query($sql);
        }else{
          $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                  VALUES ('{$point_year}','{$point_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
          $this->db->query($sql);
        }
      }
    }

    public function getAdFeed($user_seq)
    {
      $sql = "SELECT * FROM tb_user WHERE user_seq = '{$user_seq}'";
      $userData = $this->db->query($sql)->row_array();
      //나이구하기
      $user_age = date('Y',strtotime($userData['birthday']));
      $age = date('Y')-$user_age + 1;

      $gender = $userData['gender'];
      $location = $userData['location'];
      $school_seq = $userData['school_seq'];

      $adList = array();

      $sql = "SELECT ad.*,
                    count(ad_hist.adv_seq) view_total,
                    sum(IF(DATE_FORMAT(ad_hist.reg_date,'%Y-%m-%d')=DATE_FORMAT(NOW(),'%Y-%m-%d'),1,0)) day_total
              FROM tb_adv ad
              LEFT JOIN tb_adv_hist ad_hist
              ON ad_hist.adv_seq = ad.adv_seq
              WHERE status = 'Y'
              GROUP BY ad_hist.adv_seq";
      $advResult = $this->db->query($sql)->result_array();



      for($i=0; $i<count($advResult); $i++){
        $adv_bool = true;

        if(!empty($advResult[$i]['adv_location'])){
          if($advResult[$i]['adv_location']==$location){

          }else{
            $adv_bool = false;

          }
        }
        if(!empty($advResult[$i]['adv_gender'])){
          $adv_gender = explode("|",$advResult[$i]['adv_gender']);
          $gender_match = false;
          for($j=0; $j<count($adv_gender); $j++){

            if($adv_gender[$j]==$gender){
              $gender_match = true;
            }

          }
          $adv_bool = $gender_match;
        }
        if(!empty($advResult[$i]['school_seq'])){

          $schoolArr = explode(",",$advResult[$i]['school_seq']);
          $school_bool = false;
          for($j=0; $j<count($schoolArr); $j++){
            if($schoolArr[$j] == $school_seq){
              $school_bool = true;
            }
          }

          $adv_bool = $school_bool;
        }
        if($advResult[$i]['age_start_average']<$age && $advResult[$i]['age_start_average'] <= $age){

        }else{
          $adv_bool = false;

        }
        if($advResult[$i]['adv_total_view']>$advResult[$i]['view_total']){

        }else{
          $adv_bool = false;

        }
        if($advResult[$i]['adv_day_view']>$advResult[$i]['day_total']){

        }else{
          $adv_bool = false;

        }

        //오늘 봤다면 제외
        $adv_seq = $advResult[$i]['adv_seq'];
        $sql = "SELECT count(*) cnt FROM tb_adv_hist WHERE adv_seq = '{$adv_seq}' AND user_seq = '{$user_seq}' AND DATE_FORMAT(reg_date,'%Y-%m-%d') = DATE_FORMAT(NOW(),'%Y-%m-%d')";
        $readResult = $this->db->query($sql)->row_array();

        if($readResult['cnt']>0){
          $adv_bool = false;
        }

        if($adv_bool == true){
          array_push($adList,$advResult[$i]);
        }
      }

      return $adList;

    }

    public function getReadAd($adv_seq,$user_seq)
    {
      $sql = "INSERT INTO tb_adv_hist (adv_seq,user_seq,reg_date) VALUES ('{$adv_seq}','{$user_seq}',NOW())";
      $this->db->query($sql);
    }

    public function getAdEndCheck($adv_seq)
    {
      $sql = "SELECT count(*) cnt,ad.adv_total_view FROM tb_adv_hist hist
              INNER JOIN tb_adv ad
              ON ad.adv_seq = hist.adv_seq
              WHERE hist.adv_seq = '{$adv_seq}'";
      $result = $this->db->query($sql)->row_array();

      $view_cnt = $result['cnt'];
      if($view_cnt >= $result['adv_total_view']){
        $sql = "UPDATE tb_adv SET adv_end_date = NOW(),status = 'N' WHERE adv_seq = '{$adv_seq}'";
        $this->db->query($sql);
      }
    }

    public function insertAdLink($adv_seq,$user_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_adv_link_hist WHERE adv_seq = '{$adv_seq}' AND user_seq = '{$user_seq}'";
      $result = $this->db->query($sql)->row_array();

      if($result['cnt']==0){
        $sql = "INSERT INTO tb_adv_link_hist (adv_seq,user_seq,reg_date) VALUES ('{$adv_seq}','{$user_seq}',NOW())";
        $this->db->query($sql);
      }
    }

    public function getUserQuizData($user_seq)
    {
      $sql = "SELECT hist.* FROM tb_quiz quiz
              LEFT JOIN tb_quiz_hist hist
              ON hist.quiz_seq = quiz.quiz_seq
              LEFT JOIN tb_user users
              ON users.user_seq = hist.user_seq
              WHERE quiz.status = 'Y' AND hist.user_seq = '{$user_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getQuizPlayData()
    {
      $sql = "SELECT * FROM tb_quiz WHERE status = 'Y' ORDER BY reg_date DESC LIMIT 1";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertUpdateQuiz($data)
    {
      $quiz_seq = $data['quiz_seq'];
      $user_seq = $data['user_seq'];

      $sql = "SELECT * FROM tb_quiz_hist WHERE quiz_seq = '{$quiz_seq}' AND user_seq = '{$user_seq}'";
      $quizHistoryData = $this->db->query($sql)->row_array();

      $sql = "SELECT * FROM tb_user WHERE user_seq = '{$user_seq}'";
      $userData = $this->db->query($sql)->row_array();
      $user_id = $userData['user_id'];
      $user_name = $userData['user_name'];
      $school_seq = $userData['school_seq'];
      $school_year = $userData['school_year'];
      $school_class = $userData['school_class'];
      $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_year = '{$school_year}' AND school_class = '{$school_class}' AND school_seq = '{$school_seq}'";
      $schoolClassData = $this->db->query($sql)->row_array();
      if(!is_array($schoolClassData)){
        $school_class_seq = 0;
      }else{
        $school_class_seq = $schoolClassData['school_class_seq'];
      }

      if(!is_array($quizHistoryData)){
        //insert
        $data['try_no'] = 1;
        $this->db->insert("tb_quiz_hist",$data);

        $carbon_point = 0;
        $point = ($data['score']/10) * 3;
        $quiz_seq = $data['quiz_seq'];
        $carbon_type = "Q";
        $carbon_year = date("Y");
        $carbon_month = date("m");
        $point_year = date("Y");
        $point_month = date("m");

        $data_arr = array(
          "school_seq"  =>  $school_seq,
          "school_class_seq" => $school_class_seq,
          "user_seq"  =>  $user_seq,
          "user_id" =>  $user_id,
          "user_name" =>  $user_name,
          "carbon_type" =>  $carbon_type,
          "quiz_seq"  =>  $quiz_seq,
          "carbon_year" =>  $carbon_year,
          "carbon_month"  =>  $carbon_month,
          "point_year"  =>  $point_year,
          "point_month" =>  $point_month,
          "point" =>  $point,
          "reg_date"  =>  date("Y-m-d H:i:s")
        );

        $this->db->insert("tb_point_hist",$data_arr);

        $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $pointResult = $this->db->query($sql)->row_array();

        if(is_array($pointResult)){
          $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
          $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
          $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
          $this->db->query($sql);
        }else{
          $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                  VALUES ('{$carbon_year}','{$carbon_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
          $this->db->query($sql);
        }
      }else{
        //update
        $data['try_no'] = $quizHistoryData['try_no']+1;
        $quiz_hist_seq = $quizHistoryData['quiz_hist_seq'];

        $carbon_point = 0;
        $point = -(($quizHistoryData['score']/10) * 3);
        $quiz_seq = $data['quiz_seq'];
        $carbon_type = "Q";
        $carbon_year = date("Y");
        $carbon_month = date("m");
        $point_year = date("Y");
        $point_month = date("m");

        $data_arr = array(
          "school_seq"  =>  $school_seq,
          "school_class_seq" => $school_class_seq,
          "user_seq"  =>  $user_seq,
          "user_id" =>  $user_id,
          "user_name" =>  $user_name,
          "carbon_type" =>  $carbon_type,
          "quiz_seq"  =>  $quiz_seq,
          "carbon_year" =>  $carbon_year,
          "carbon_month"  =>  $carbon_month,
          "point_year"  =>  $point_year,
          "point_month" =>  $point_month,
          "point" =>  $point,
          "reg_date"  =>  date("Y-m-d H:i:s")
        );

        $this->db->insert("tb_point_hist",$data_arr);

        $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $pointResult = $this->db->query($sql)->row_array();

        if(is_array($pointResult)){
          $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
          $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
          $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
          $this->db->query($sql);
        }else{
          $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                  VALUES ('{$carbon_year}','{$carbon_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
          $this->db->query($sql);
        }



        $this->db->where("quiz_hist_seq",$quiz_hist_seq);
        $this->db->update("tb_quiz_hist",$data);

        $point = ($data['score']/10) * 3;
        $quiz_seq = $data['quiz_seq'];
        $carbon_type = "Q";
        $carbon_year = date("Y");
        $carbon_month = date("m");
        $point_year = date("Y");
        $point_month = date("m");

        $data_arr = array(
          "school_seq"  =>  $school_seq,
          "school_class_seq" => $school_class_seq,
          "user_seq"  =>  $user_seq,
          "user_id" =>  $user_id,
          "user_name" =>  $user_name,
          "quiz_seq"  =>  $quiz_seq,
          "carbon_type" =>  $carbon_type,
          "carbon_year" =>  $carbon_year,
          "carbon_month"  =>  $carbon_month,
          "point_year"  =>  $point_year,
          "point_month" =>  $point_month,
          "point" =>  $point,
          "reg_date"  =>  date("Y-m-d H:i:s")
        );

        $this->db->insert("tb_point_hist",$data_arr);

        $sql = "SELECT * FROM tb_point_hist_static WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
        $pointResult = $this->db->query($sql)->row_array();

        if(is_array($pointResult)){
          $update_carbon = $pointResult['carbon']+$carbon_point <= 0 ? 0 : $pointResult['carbon']+$carbon_point;
          $update_point = $pointResult['point']+$point <= 0 ? 0 : $pointResult['point']+$point;
          $sql = "UPDATE tb_point_hist_static SET carbon = {$update_carbon},point = {$update_point} WHERE year = '{$carbon_year}' AND month = '{$carbon_month}' AND user_seq = '{$user_seq}'";
          $this->db->query($sql);
        }else{
          $sql = "INSERT INTO tb_point_hist_static (year,month,user_seq,user_id,school_seq,school_class_seq,carbon,point)
                  VALUES ('{$carbon_year}','{$carbon_month}','{$user_seq}','{$user_id}','{$school_seq}','{$school_class_seq}','{$carbon_point}','{$point}')";
          $this->db->query($sql);
        }
      }
    }

  }
?>
