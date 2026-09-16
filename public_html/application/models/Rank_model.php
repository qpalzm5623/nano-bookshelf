<?php
  class Rank_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    public function getRankTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM (SELECT
                users.user_id,
                users.user_name,
                school.school_name,
                users.school_year,
                users.school_class,
                SUM(hist.carbon) carbon_point,
                SUM(hist.point) point,
                hist.carbon_seq point_seq
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where}
                GROUP BY hist.user_seq
                ORDER BY carbon_point DESC) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getRankList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT
                users.user_seq,
                users.user_id,
                users.user_name,
                school.school_name,
                users.school_year,
                users.school_class,
                SUM(hist.carbon) carbon_point,
                SUM(hist.point) point,
                hist.carbon_seq point_seq
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where}
                GROUP BY hist.user_seq
                ORDER BY carbon_point DESC {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getUserDetail($user_seq,$where)
    {
      $sql = "SELECT
                users.user_seq,
                users.user_id,
                users.user_name,
                users.user_level,
                users.school_seq,
                school.school_name,
                users.school_year,
                users.school_class,
                SUM(hist.carbon) carbon_point,
                SUM(hist.point) point,
                hist.carbon_seq point_seq,
                (SELECT count(*) FROM tb_feed WHERE 1=1{$where} AND user_seq = '{$user_seq}' AND status='Y') total_feed
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where} AND hist.user_seq = '{$user_seq}'
                GROUP BY hist.user_seq";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getUserCarbonData($user_seq)
    {
      $year = date("Y");
      $sql = "SELECT carbon FROM tb_point_hist_static WHERE user_seq = '{$user_seq}' AND year = '{$year}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getSchoolRankTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM (SELECT
                school.school_name,
                school.location,
                SUM(hist.carbon) carbon_point
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where}
                GROUP BY hist.school_seq
                ORDER BY carbon_point DESC) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getSchoolRankList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT
                school.school_name,
                school.location,
                school.school_seq,
                SUM(hist.carbon) carbon_point
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where}
                GROUP BY hist.school_seq
                ORDER BY carbon_point DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getSchoolRankDetail($where,$school_seq)
    {
      $sql = "SELECT
                school.school_name,
                school.logo_image,
                school.location,
                school.school_seq,
                (SELECT count(*) FROM tb_school_class WHERE school_seq = hist.school_seq) total_class,
                (SELECT count(*) FROM tb_user WHERE school_seq = hist.school_seq) total_user,
                (SELECT count(*) FROM tb_point_hist WHERE 1=1{$where} AND school_seq = '{$school_seq}' AND carbon_type='C') total_feed,
                SUM(hist.carbon) carbon_point
                 FROM tb_point_hist hist
                INNER JOIN tb_user users
                ON users.user_seq = hist.user_seq
                LEFT JOIN tb_school school
                ON school.school_seq = hist.school_seq
                LEFT JOIN tb_school_class school_class
                ON school_class.school_class_seq = hist.school_class_seq
                LEFT JOIN tb_challenge challenge
                ON challenge.challenge_seq = hist.challenge_seq
                WHERE 1=1{$where} AND hist.school_seq = '{$school_seq}'
                GROUP BY hist.school_seq";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getSchoolRankAverage($school_seq)
    {
      $sql = "SELECT SUM(hist.carbon) point_sum
              FROM tb_point_hist hist
             INNER JOIN tb_user users
             ON users.user_seq = hist.user_seq
             LEFT JOIN tb_school school
             ON school.school_seq = hist.school_seq
             LEFT JOIN tb_school_class school_class
             ON school_class.school_class_seq = hist.school_class_seq
             LEFT JOIN tb_challenge challenge
             ON challenge.challenge_seq = hist.challenge_seq
             WHERE hist.school_seq = '{$school_seq}'
             GROUP BY hist.user_seq";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getTotalChallengeMonthData($year,$month)
    {
      $sql = "SELECT chall1.challenge_title,SUM(challenge.challenge_carbon_point) total_carbon FROM tb_point_hist hist
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = hist.challenge_seq
              INNER JOIN tb_challenge chall1
              ON chall1.challenge_cate_id = challenge.challenge_parent_cate_id
              WHERE hist.carbon_type = 'C' AND hist.carbon_year = '{$year}' AND hist.carbon_month = '$month'
              GROUP BY chall1.challenge_seq";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getUserChallengeMonthData($year,$month,$user_seq)
    {
      $sql = "SELECT chall1.challenge_title,SUM(challenge.challenge_carbon_point) total_carbon FROM tb_point_hist hist
              INNER JOIN tb_challenge challenge
              ON challenge.challenge_seq = hist.challenge_seq
              INNER JOIN tb_challenge chall1
              ON chall1.challenge_cate_id = challenge.challenge_parent_cate_id
              WHERE hist.carbon_type = 'C' AND hist.carbon_year = '{$year}' AND hist.carbon_month = '$month' AND hist.user_seq = '{$user_seq}'
              GROUP BY chall1.challenge_seq";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSoloRank($where,$user_seq)
    {
      //내 점수 확인
      $sql = "SELECT carbon FROM tb_point_hist_static WHERE user_seq = '{$user_seq}' {$where}";
      $my_carbon = $this->db->query($sql)->row_array();
      if(!is_array($my_carbon)){
        $my_carbon = 0;
      }else{
        $my_carbon = $my_carbon['carbon'];
      }

      //총 포인트 랭크
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' AND carbon > '{$my_carbon}' {$where}";
      $myRank = $this->db->query($sql)->row_array();
      $myRank = $myRank['cnt']+1;

      //총 포인트 인원
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' {$where}";
      $total_point_member = $this->db->query($sql)->row_array();
      $total_point_member = $total_point_member['cnt'];

      //10명 간추리기
      $sql = "SELECT A.*,users.user_name,users.school_name,users.school_year,users.school_class FROM (SELECT * FROM tb_point_hist_static WHERE 1=1{$where} limit 10) A
              LEFT JOIN tb_user users
              ON users.user_seq = A.user_seq
              WHERE users.user_status = 'C'
              ORDER BY A.carbon DESC";
      $rankArr = $this->db->query($sql)->result_array();

      $returnArr = array(
        "rankArr" =>  $rankArr,
        "my_carbon" =>  $my_carbon,
        "myRank"  =>  $myRank,
        "total_point_member"  =>  $total_point_member
      );

      return $returnArr;

    }

    public function getClassRank($where,$user_seq)
    {
      $sql = "SELECT school_class_seq FROM tb_school_class class
              LEFT JOIN tb_user users
              ON users.school_seq = class.school_seq AND users.school_year = class.school_year AND users.school_class = class.school_class
              WHERE user_seq = '{$user_seq}'";
      $school_class_seq = $this->db->query($sql)->row_array();
      $school_class_seq = $school_class_seq['school_class_seq'];

      //내 학급 점수 확인
      $sql = "SELECT SUM(carbon) carbon FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' AND static.school_class_seq = '{$school_class_seq}' {$where} GROUP BY static.school_class_seq";
      $my_carbon = $this->db->query($sql)->row_array();
      if(!is_array($my_carbon)){
        $my_carbon = 0;
      }else{
        $my_carbon = $my_carbon['carbon'];
      }

      //총 포인트 랭크
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' AND carbon > '{$my_carbon}' {$where} GROUP BY school_class_seq";
      $myRank = $this->db->query($sql)->row_array();
      $myRank = $myRank['cnt']+1;

      //총 포인트 인원
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' {$where} GROUP BY school_class_seq";
      $total_point_class = $this->db->query($sql)->row_array();
      $total_point_class = $total_point_class['cnt'];

      //10명 간추리기
      $sql = "SELECT A.*,school.school_name,class.school_year,class.school_class FROM
              (SELECT SUM(static.carbon) carbon,static.school_seq,static.school_class_seq FROM tb_point_hist_static static
              INNER JOIN tb_user users
              ON users.user_seq = static.user_seq
              WHERE users.user_status = 'C' {$where} GROUP BY school_class_seq limit 10) A
              LEFT JOIN tb_school school
              ON school.school_seq = A.school_seq
              LEFT JOIN tb_school_class class
              ON class.school_class_seq = A.school_class_seq
              ORDER BY A.carbon DESC";
      $rankArr = $this->db->query($sql)->result_array();

      $returnArr = array(
        "rankArr" =>  $rankArr,
        "my_carbon" =>  $my_carbon,
        "myRank"  =>  $myRank,
        "total_point_class"  =>  $total_point_class
      );

      return $returnArr;

    }

    public function getSchoolRank($where,$user_seq)
    {
      $sql = "SELECT school_seq FROM tb_user WHERE user_seq = '{$user_seq}'";
      $school_seq = $this->db->query($sql)->row_array();
      $school_seq = $school_seq['school_seq'];

      //내 학교 점수 확인
      $sql = "SELECT SUM(carbon) carbon FROM tb_point_hist_static WHERE school_seq = '{$school_seq}' {$where} GROUP BY school_seq";
      $my_carbon = $this->db->query($sql)->row_array();
      if(!is_array($my_carbon)){
        $my_carbon = 0;
      }else{
        $my_carbon = $my_carbon['carbon'];
      }

      //총 포인트 랭크
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static WHERE carbon > '{$my_carbon}' {$where} GROUP BY school_seq";
      $myRank = $this->db->query($sql)->row_array();
      $myRank = $myRank['cnt']+1;

      //총 포인트 인원
      $sql = "SELECT count(*) cnt FROM tb_point_hist_static WHERE 1=1 {$where} GROUP BY school_seq";
      $total_point_school = $this->db->query($sql)->row_array();
      $total_point_school = $total_point_school['cnt'];

      //10명 간추리기
      $sql = "SELECT A.*,school.school_name FROM (SELECT SUM(carbon) carbon,school_seq FROM tb_point_hist_static WHERE 1=1{$where} GROUP BY school_seq limit 10) A
              LEFT JOIN tb_school school
              ON school.school_seq = A.school_seq
              ORDER BY A.carbon DESC";
      $rankArr = $this->db->query($sql)->result_array();

      $returnArr = array(
        "rankArr" =>  $rankArr,
        "my_carbon" =>  $my_carbon,
        "myRank"  =>  $myRank,
        "total_point_school"  =>  $total_point_school
      );

      return $returnArr;

    }

  }
?>
