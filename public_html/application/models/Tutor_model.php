<?php
  class Tutor_Model extends MY_Model {
    function __construct(){
      parent::__construct();
      $this->load->library('encryption');
      $this->encryption->initialize(
          array(
                  'cipher' => 'aes-256'       //  암호화 알고리즘
                  ,'key'   =>  $this->config->config["key"]           //  암호화 키
                  ,'mode'  =>  'ctr'          //  암호화 모드
                  )
      );
    }

    public function login($tutor_id,$tutor_password)
    {
      $result = array();
      $query = "SELECT * FROM tb_user WHERE user_id = '{$tutor_id}' AND user_level = 8";
      $tutor_id_result = $this->db->query($query);
      $row = $tutor_id_result->row_array();

      if( $tutor_id_result->num_rows() > 0 ){

        if($this->decrypt("password",$row['user_password']) == $tutor_password ){
          $result["result"] = "success";
          $result["tutorData"] = $row;
        } else {
          $result["result"] = "failed";
          $result["message"] = "tutor_password";
        }

      } else {
        $result["result"] = "failed";
        $result["message"] = "tutor_id";
      }

      return $result;
    }

    /*
    @param array $userInfo 아이디,아이피,세션키
    @return array
    */
    public function getDuplicateLoginCheck($userInfo)
    {
      $user_id = $userInfo['user_id'];
      $user_ip = $userInfo['user_ip'];
      $session_key = $userInfo['session_key'];

      $sql = "SELECT seq FROM tb_login
      WHERE user_id = '{$user_id}'
      AND login_ip = '{$user_ip}'";
      $query = $this->db->query($sql);

      if($query->num_rows() > 0 ){
        return TRUE;
      }else{
        return FALSE;
      }
    }

    /*
  	로그인중복 지우기
  	@param string $user_id
  	*/
  	public function deleteLogin($user_id)
  	{
  		$sql = "DELETE FROM tb_login WHERE user_id = '{$user_id}'";
  		$this->db->query($sql);
  	}

  	/*
  	로그인
  	@param array $userData
  	user_id,user_ip,user_level,session_key,user_device
  	*/
  	public function insertLogin($userData)
  	{
  		$user_id = $userData['user_id'];
  		$user_ip = $userData['user_ip'];
  		$session_key = $userData['session_key'];
  		$user_device = $userData['user_device'];
  		$url_link = "/";
  		$login_time = date("Y-m-d H:i:s");

  		$sql = "INSERT INTO tb_login (
  							login_ip,
  							user_id,
  							session_key,
  							login_time
  						) VALUES (
  							'{$user_ip}',
  							'{$user_id}',
  							'{$session_key}',
  							'{$login_time}'
  						)";
  		$this->db->query($sql);

  		$sql = "INSERT INTO tb_login_history (
  							login_ip,
  							user_id,
  							url_link,
  							device,
  							login_time
  						) VALUES (
  							'{$user_ip}',
  							'{$user_id}',
  							'{$url_link}',
  							'{$user_device}',
  							'{$login_time}'
  						)";
  		$this->db->query($sql);

  		$sql = "UPDATE tb_user SET
  						last_login_time = '{$login_time}',
  						login_ip = '{$user_ip}'
  						WHERE user_id = '{$user_id}'";
  		$this->db->query($sql);
  	}

    //튜텨별 전체 회차
    public function getCoursesData($tutor_id)
    {
      $sql = "SELECT cc.*,course.course_name FROM tb_user users
              INNER JOIN tb_tutor tutor
              ON tutor.user_seq = users.user_seq
              INNER JOIN tb_course_class cc
              ON cc.course_code = tutor.course_code
              INNER JOIN tb_course course
              ON course.course_code = tutor.course_code
              WHERE users.user_id = '{$tutor_id}' AND user_level = '8'
              GROUP BY tutor.user_seq";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //튜텨별 전체 회차 수
    public function getTotalClass($tutor_id)
    {
      $sql = "SELECT count(*) cnt FROM (SELECT cc.* FROM tb_user users
              INNER JOIN tb_tutor tutor
              ON tutor.user_seq = users.user_seq
              INNER JOIN tb_course_class cc
              ON cc.course_code = tutor.course_code
              WHERE users.user_id = '{$tutor_id}' AND user_level = '8'
              GROUP BY tutor.user_seq) A";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //튜텨별 전체 학생 수
    public function getTotalStudent($tutor_id)
    {
      $sql = "SELECT count(*) cnt FROM (SELECT study_class.* FROM tb_user users
              INNER JOIN tb_tutor tutor
              ON tutor.user_seq = users.user_seq
              INNER JOIN tb_course_class cc
              ON cc.course_code = tutor.course_code
              INNER JOIN tb_study_class study_class
              ON study_class.course_code = tutor.course_code AND study_class.tutor_id = users.user_id
              WHERE users.user_id = '{$tutor_id}' AND user_level = '8') A";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //튜텨별 전체 채점자 수
    public function getTotalExamConfirm($tutor_id)
    {
      $sql = "SELECT count(*) cnt FROM (SELECT th.* FROM tb_user users
              INNER JOIN tb_tutor tutor
              ON tutor.user_seq = users.user_seq
              INNER JOIN tb_tutor_history th
              ON th.tutor_id = users.user_id
              WHERE users.user_id = '{$tutor_id}' AND user_level = '8') A";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //튜텨별 과정별 등록인원
    public function getTutorClassTotal($arr)
    {
      $tutor_id = $arr['tutor_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];

      $sql = "SELECT count(*) cnt FROM tb_study_class WHERE tutor_id = '{$tutor_id}' AND class_code = '{$class_code}' AND course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //튜텨별 과정별 채점인원
    public function getTutorClassConfirmTotal($arr)
    {
      $tutor_id = $arr['tutor_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];

      $sql = "SELECT count(*) cnt FROM tb_tutor_history WHERE tutor_id = '{$tutor_id}' AND class_code = '{$class_code}' AND course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //튜텨별 과정별 전체데이터
    public function getTutorClassData($arr)
    {
      $tutor_id = $arr['tutor_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];
      $limit = $arr['limit'];

      $sql = "SELECT eh.exam_history_seq seq,
                    co.company_name,
                    users.user_name,
                    users.user_id,
                    cu.step_score,
                    cu.last_score,
                    eh.last_reg_time,
                    cu.pass_yn,
                    eh.exam_type,
                    (SELECT count(*) FROM tb_tutor_history WHERE exam_history_seq = th.exam_history_seq) mark_yn
       FROM tb_study_class sc
              LEFT JOIN tb_exam_history eh
              ON eh.user_id = sc.user_id
              LEFT JOIN tb_tutor_history th
              ON th.user_id = sc.user_id
              INNER JOIN tb_course_order co
              ON co.user_id = sc.user_id
              INNER JOIN tb_user users
              ON users.user_id = sc.user_id
              LEFT JOIN tb_course_user cu
              ON cu.user_id = sc.user_id
              WHERE sc.tutor_id = '{$tutor_id}' and sc.class_code = '{$class_code}' and sc.course_code = '{$course_code}'
              {$limit}";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //튜터 채점 코멘트 업데이트
    public function updateComment($arr)
    {
      $exam_history_seq = $arr['exam_history_seq'];
      $comment = serialize($arr['comment']);

      $sql = "UPDATE tb_exam_history SET comment = '{$comment}' WHERE exam_history_seq = '{$exam_history_seq}'";
      $this->db->query($sql);
    }

    //튜터채점
    public function updateInsertExamMark($arr)
    {
      $exam_history_seq = $arr['exam_history_seq'];
      $course_code = $arr['course_code'];
      $class_code = $arr['class_code'];
      $user_id = $arr['user_id'];
      $tutor_id = $arr['tutor_id'];
      $comment = serialize($arr['comment']);
      $score_info = serialize($arr['score_info']);
      $tutor_ip = $this->input->ip_address();
      $reg_time = date("Y-m-d H:i:s");
      $score = $arr['score'];

      //점수 및 튜터 채점 확인용 필드 업데이트
      $sql = "UPDATE tb_exam_history SET comment = '{$comment}', score_info = '{$score_info}', tutor_ip = '{$tutor_ip}', tutor_reg_time = '{$reg_time}', score = '{$score}' WHERE exam_history_seq = '{$exam_history_seq}'";
      $this->db->query($sql);

      //최종점수 업데이트
      $sql = "UPDATE tb_course_user SET last_score = '{$score}' WHERE course_code ='{$course_code}' AND class_code = '{$class_code}' AND user_id = '{$user_id}'";
      $this->db->query($sql);

      //insert tb_tutor_history
      $sql = "INSERT INTO tb_tutor_history (exam_history_seq,course_code,class_code,user_id,tutor_id,reg_time)
              VALUES ('{$exam_history_seq}','{$course_code}','{$class_code}','{$user_id}','{$tutor_id}','{$reg_time}')";
      $this->db->query($sql);

    }

    //튜터채점여부 확인
    public function getExamMark($seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_tutor_history WHERE exam_history_seq = '{$seq}'";
      $query = $this->db->query($sql)->row_array();

      if($query['cnt']>0){
        return true;
      }else{
        return false;
      }
    }

    //튜텨 총 학습 수
    public function getTotalTutorCourse($tutor_id)
    {
      $sql = "SELECT count(*) cnt FROM tb_tutor tutor
              INNER JOIN tb_user users
              ON tutor.user_seq = users.user_seq
              INNER JOIN tb_exam_history exam_history
              ON exam_history.course_code = tutor.course_code
              WHERE exam_history.score > 0";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //비용정산
    public function getTutorPayData($arr)
    {
      $tutor_id = $arr['tutor_id'];
      $limit = $arr['limit'];

      $sql = "SELECT tutor.tutor_pay,
                      tutor.course_code,
                      exam_history.class_code,
                      tutor.course_name,
                      course_class.class_display_code,
                      course_class.course_start_date,
                      course_class.course_end_date,
                      count(exam_history.course_code) total_cnt,
                      count(IF(exam_history.status='Y',1,null)) mark_cnt
                      FROM tb_tutor tutor
                      INNER JOIN tb_user users
                      ON users.user_seq = tutor.user_seq
                      INNER JOIN tb_exam_history exam_history
                      ON exam_history.course_code = tutor.course_code
                      LEFT JOIN tb_tutor_history tutor_history
                      ON tutor_history.tutor_id = users.user_id
                      INNER JOIN tb_course_class course_class
                      ON course_class.class_code = exam_history.class_code
                      WHERE users.user_id = '{$tutor_id}'
                      GROUP BY exam_history.class_code
                      {$limit}";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

  }
?>
