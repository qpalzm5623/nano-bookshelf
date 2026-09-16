<?php
  class Exam_Model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    public function insertExamContents($data)
    {
      $data['reg_time'] = date("Y-m-d H:i:s");
      $this->db->insert("tb_exam",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    public function updateExamContents($data,$exam_seq)
    {
      $this->db->where("exam_seq",$exam_seq);
      $this->db->update("tb_exam",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function getExamContentTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_exam WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    public function getExamContentList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT * FROM tb_exam WHERE 1=1 $where ORDER BY exam_seq DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getExamContent($exam_seq)
    {
      $sql = "SELECT * FROM tb_exam WHERE exam_seq = '{$exam_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getExamHistoryTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_exam_history exam_history
              INNER JOIN tb_exam exam
              ON exam.exam_seq = exam_history.exam_history_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    public function getExamHistoryList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT exam_history.*,
                    course_class.class_type,
                    course_class.class_display_code,
                    course.course_name,
                    users.user_id,
                    users.user_name
                     FROM tb_exam_history exam_history
              INNER JOIN tb_exam exam
              ON exam.exam_seq = exam_history.exam_history_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE 1=1 $where ORDER BY exam_history.exam_history_seq DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getExamHistory($exam_history_seq)
    {
      $sql = "SELECT exam_history.*,
                    course_class.class_type,
                    course_class.class_display_code,
                    course.course_name,
                    users.user_id,
                    users.user_name,
                    course.exam_info
                     FROM tb_exam_history exam_history
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE exam_history.exam_history_seq = '{$exam_history_seq}'";

      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getExamStepHistoryTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_exam_history exam_history
              INNER JOIN tb_exam exam
              ON exam.exam_seq = exam_history.exam_history_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    public function getExamStepHistoryList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT exam_history.*,
                    course_class.class_type,
                    course_class.class_display_code,
                    course.course_name,
                    users.user_id,
                    users.user_name
                     FROM tb_exam_history exam_history
              INNER JOIN tb_exam exam
              ON exam.exam_seq = exam_history.exam_history_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE 1=1 $where ORDER BY exam_history.exam_history_seq DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getExamStepHistory($exam_history_seq)
    {
      $sql = "SELECT exam_history.*,
                    course_class.class_type,
                    course_class.class_display_code,
                    course.course_name,
                    users.user_id,
                    users.user_name
                     FROM tb_exam_history exam_history
              INNER JOIN tb_exam exam
              ON exam.exam_seq = exam_history.exam_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_history.class_code
              INNER JOIN tb_course course
              ON course.course_code = exam_history.course_code
              INNER JOIN tb_user users
              ON users.user_id = exam_history.user_id
              WHERE exam_history.exam_history_seq = '{$exam_history_seq}' AND exam.exam_step = 'STEP'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //각 멤버 최종평가점수
    public function getMemberExamGrade($user_id,$class_code,$course_code)
    {
      $sql = "SELECT score FROM tb_exam_history
              WHERE exam_type = 'LAST' AND course_code = '{$course_code}' AND class_code = '{$class_code}' AND user_id = '{$user_id}'";

      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    //각 멤버 진행평가점수
    public function getMemberStepExamGrade($user_id,$class_code,$course_code)
    {
      $sql = "SELECT * FROM tb_exam_history
              WHERE exam_type = 'STEP' AND course_code = '{$course_code}' AND class_code = '{$class_code}' AND user_id = '{$user_id}'";

      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    public function getExamAgreeTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_exam_agree exam_agree
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_agree.class_code
              INNER JOIN tb_course course
              ON course.course_code = course_class.course_code
              WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    public function getExamAgreeList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT exam_agree.*,
                    course_class.class_type,
                    course_class.class_display_code,
                    course.course_name,
                    course_class.course_start_date start_date,
                    course_class.course_end_date end_date
                    FROM tb_exam_agree exam_agree
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = exam_agree.class_code
              INNER JOIN tb_course course
              ON course.course_code = course_class.course_code
              WHERE 1=1 $where ORDER BY exam_agree.reg_time DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //시험정보
    public function getExamData($arr)
    {
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];

      $sql = "SELECT his.*,cu.start_score,cu.step_score,cu.last_score FROM tb_exam_history his
              INNER JOIN tb_course_user cu
              ON cu.user_id = his.user_id AND cu.class_code = his.class_code
              WHERE his.user_id = '{$user_id}' AND his.class_code = '{$class_code}' AND his.course_code = '{$course_code}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //시험봤는지
    public function getUserExam($arr)
    {
      $user_id = $arr['user_id'];
      $course_code = $arr['course_code'];
      $class_code = $arr['class_code'];
      $exam_type = strtoupper($arr['exam_type']);

      $sql = "SELECT * FROM tb_exam_history WHERE user_id = '{$user_id}' AND course_code = '{$course_code}' AND class_code = '{$class_code}' AND exam_type = '{$exam_type}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //시험넣기
    /*
    $insertData = array(
      "exam_type"	=>	$type,
      "user_id"	=>	$user_id,
      "class_code"	=>	$class_code,
      "course_code"	=>	$course_code,
      "reg_time"		=>	date("Y-m-d H:i:s"),
      "ip"					=>	$this->input->ip_address()
    );
    */
    public function insertUserExam($arr)
    {
      $exam_type = $arr['exam_type'];
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];
      $reg_time = $arr['reg_time'];
      $ip = $arr['ip'];
      $question_info = $arr['question_info'];

      $sql = "INSERT INTO tb_exam_history (exam_type,user_id,class_code,course_code,ip,reg_time,question_info) VALUES ('{$exam_type}','{$user_id}','{$class_code}','{$course_code}','{$ip}','{$reg_time}','{$question_info}')";
      $this->db->query($sql);
    }

    //시험 응시완료로 변경
    public function updateUserExamConfirm($seq)
    {
      $last_reg_time = date("Y-m-d H:i:s");

      $sql = "UPDATE tb_exam_history SET status = 'Y', last_reg_time = '{$last_reg_time}' WHERE exam_history_seq = '{$seq}'";
      $this->db->query($sql);
    }

    //시험 응시완료
    public function updateUserExamFinish($arr)
    {
      $exam_type = $arr['exam_type'];
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $answer = $arr['answer'];
      $status = $arr['status'];
      $last_reg_time = $arr['last_reg_time'];

      $sql = "UPDATE tb_exam_history SET status = '{$status}', answer = '{$answer}', last_reg_time = '{$last_reg_time}' WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND exam_type = '{$exam_type}'";
      $this->db->query($sql);
      $result = $this->db->affected_rows();



      return $result;
    }

    //객관식 문제 뽑기
    public function getChoExamList($course_code,$exam_step)
    {
      $exam_step = strtoupper($exam_step);
      $sql = "SELECT * FROM tb_exam WHERE course_code = '{$course_code}' AND exam_step = '{$exam_step}' AND exam_type = 'CHO' AND status = 'Y'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //단답식 문제 뽑기
    public function getQueExamList($course_code,$exam_step)
    {
      $exam_step = strtoupper($exam_step);
      $sql = "SELECT * FROM tb_exam WHERE course_code = '{$course_code}' AND exam_step = '{$exam_step}' AND exam_type = 'QUE' AND status = 'Y'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //서술형 문제 뽑기
    public function getDescExamList($course_code,$exam_step)
    {
      $exam_step = strtoupper($exam_step);
      $sql = "SELECT * FROM tb_exam WHERE course_code = '{$course_code}' AND exam_step = '{$exam_step}' AND exam_type = 'DESC' AND status = 'Y'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //시험동의체크
    public function getExamAgreeCheck($arr)
    {
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];

      $sql = "SELECT count(*) cnt FROM tb_exam_agree WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    //시험동의 insert
    public function insertExamAgree($arr)
    {
      $this->db->insert("tb_exam_agree",$arr);
      $result = $this->db->insert_id();

      return $result;
    }

    //시험 자동 채점
    public function updateAutoGradingScore($arr)
    {
      $exam_history_seq = $arr['exam_history_seq'];
      $score_info = $arr['score_info'];
      $score = $arr['score'];

      $sql = "UPDATE tb_exam_history SET score_info = '{$score_info}', score = '{$score}' WHERE exam_history_seq = '{$exam_history_seq}'";
      $query = $this->db->query($sql);




      //agent 시험 넣기
      //history 가져오기
      $sql = "SELECT * FROM tb_exam_history WHERE exam_history_seq = '{$exam_history_seq}'";
      $examHistory = $this->db->query($sql)->row_array();

      $user_id = $examHistory['user_id'];
      $class_code = $examHistory['class_code'];
      $exam_type = $examHistory['exam_type'];
      $now = date("Y-m-d H:i:s");
      $du_date = date("Ymd");

      $copied_answer = "N";

      $eval_type = "";
      switch($exam_type){
        case "STEP":
        $eval_type = "진행평가_1";
        $eval_code = "04";
        break;

        case "LAST":
        $eval_type = "시험_1";
        $eval_code = "02";
        break;
      }

      $ip = $this->get_client_ip();

      //이미 있는지 체크
      $sql = "SELECT * FROM tb_score_history WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND eval_type = '{$eval_type}' LIMIT 1";
      $historyResult = $this->db->query($sql)->row_array();

      //이미 있다면
      if(is_array($historyResult)){
        $idx = $historyResult['idx'];
        $sql = "UPDATE tb_score_history SET score = '{$score}', status = 'U', eval_code = '{$eval_code}', eval_type = '{$eval_type}', submit_date = '{$now}', du_date = '{$du_date}' WHERE idx = '{$idx}'";
        $this->db->query($sql);
      }else{
        $sql = "INSERT INTO tb_score_history (user_id,course_code,class_code,eval_type,submit_date,score,ip,du_date,status,copied_answer,reg_date,eval_code)
                VALUES('{$user_id}','{$course_code}','{$class_code}','{$eval_type}','{$now}','{$score}','{$ip}','{$du_date}','U','{$copied_answer}','{$now}','{$eval_code}')";
        $this->db->query($sql);
      }


    }

    public function insertOtpHistory($data)
    {
      $user_id = $data['user_id'];
      $class_code = $data['class_code'];
      $course_code = $data['course_code'];
      $reg_date = $data['reg_date'];
      $eval_cd = $data['eval_cd'];
      $cert_type = $data['cert_type'];
      $user_ip = $this->get_client_ip();

      $sql = "INSERT INTO tb_otp_history (user_id,class_code,course_code,eval_cd,user_ip,cert_type,reg_date) VALUES ('{$user_id}','{$class_code}','{$course_code}','{$eval_cd}','{$user_ip}','{$cert_type}','{$reg_date}')";
      $result = $this->db->query($sql);

      return $result;
    }

  }
?>
