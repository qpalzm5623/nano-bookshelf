<?php
  class Academi_Model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    public function getUserHomeworkTotalCount($data)
    {
      $where = $data['where'];
      $user_id = $data['user_id'];
      $limit = $data['limit'] ?? "";

      $sql = "SELECT count(*) cnt FROM (SELECT homework.*,
              content.academy_seq content_academy_seq,
              content.content_discription,
              content.content_category,
              content.content_image,
              content.content_type,
              content.content_file FROM tb_homework homework
              INNER JOIN tb_contents content
              ON content.content_seq = homework.content_seq
              WHERE user_id = '{$user_id}' {$limit}) a";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function saveTime($data)
    {
      $content_category = $data['content_category'];
      $save_time = $data['save_time'];
      $reg_date = $data['reg_date'];
      $user_id = $data['user_id'];

      $sql = "SELECT * FROM tb_contents_time WHERE user_id = '{$user_id}' AND contents_category = '{$content_category}' AND regdate = '{$reg_date}'";
      $result = $this->db->query($sql)->row_array();
      if(is_array($result)){
        $sumTime = $result['time'] + $save_time;
        $sql = "UPDATE tb_contents_time SET time = '{$sumTime}' WHERE user_id = '{$user_id}' AND contents_category = '{$content_category}' AND regdate = '{$reg_date}'";
        $this->db->query($sql);


      }else{
        $sql = "INSERT INTO tb_contents_time (user_id,contents_category,time,regdate) VALUES ('{$user_id}','{$content_category}','{$save_time}','{$reg_date}')";
        $this->db->query($sql);
      }
    }

    public function getAcademyDiskSize($academy_seq)
    {
      $sql = "SELECT contract_disk FROM tb_academy WHERE academy_seq = '{$academy_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['contract_disk'];
    }

    public function getHomeworkData($data)
    {
      $where = $data['where'];
      $user_id = $data['user_id'];
      $limit = $data['limit'] ?? "";

      $sql = "SELECT homework.*,
              content.academy_seq content_academy_seq,
              content.content_discription,
              content.content_category,
              content.content_image,
              content.content_type,
              content.content_file,
              content.content_time content_total_time,
              content.track_type FROM tb_homework homework
              INNER JOIN tb_contents content
              ON content.content_seq = homework.content_seq
              WHERE user_id = '{$user_id}' {$where} ORDER BY content.content_code,content.track_no {$limit}";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getHomeworkSeqData($homework_seq)
    {
      $sql = "SELECT * FROM tb_homework WHERE homework_seq = '{$homework_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function updateHomework($homework_seq)
    {
      $start_time = date("Y-m-d H:i:s");
      $sql = "UPDATE tb_homework SET start_time = '{$start_time}', status = 'M' WHERE homework_seq = '{$homework_seq}'";

      $result = $this->db->query($sql);
    }

    public function getHomeworkSeq($user_id,$content_code,$track_no)
    {
      $sql = "SELECT homework_seq FROM tb_homework WHERE user_id= '{$user_id}' AND content_code = '{$content_code}' AND track_no = '{$track_no}'";
      $result = $this->db->query($sql)->row_array();

      return $result['homework_seq'];
    }

    public function updateHomeworkTime($data)
    {
      $homework_seq = $data['homework_seq'];
      $update_time = $data['update_time'];
      $update_time = ceil($update_time);
      $end_yn = $data['end_yn'];

      $end_sql = "";
      $status_sql = "";


      $end_time = date("Y-m-d H:i:s");
      $end_sql = ",end_time='{$end_time}'";


      $sql = "SELECT * FROM tb_homework WHERE homework_seq = '{$homework_seq}'";
      $result = $this->db->query($sql)->row_array();
      if($result['content_time']<=$update_time){
        $status_sql = ",status='R'";
      }

      $start_time = date("Y-m-d H:i:s");

      //다시듣기 업데이트 방지(기존저장된 시간보다 커야 저장)
      if($result['update_time']<=$update_time){
        $sql = "UPDATE tb_homework SET start_time = '{$start_time}',update_time = '{$update_time}'{$end_sql}{$status_sql} WHERE homework_seq = '{$homework_seq}'";
        $result = $this->db->query($sql);
      }


    }

    public function getUserAudioTotalCount($data)
    {
      $where = $data['where'];
      $limit = $data['limit'] ?? "";

      $academy_seq = $this->session->userdata("academy_seq");

      $sql = "SELECT count(*) cnt FROM (SELECT * FROM tb_contents WHERE 1=1 {$where} AND content_public_yn = 'Y' AND  (content_sharing_yn = 'Y' OR academy_seq = '{$academy_seq}')  GROUP BY content_code) a";

      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getAudioData($data)
    {
      $where = $data['where'];
      $limit = $data['limit'] ?? "";

      $academy_seq = $this->session->userdata("academy_seq");

      $sql = "SELECT *,SUM(content_time) content_total_time,IF(reg_date BETWEEN DATE_ADD(NOW(),INTERVAL -1 WEEK ) AND NOW(),1,0) is_new
              FROM tb_contents WHERE 1=1 {$where} AND content_public_yn = 'Y' AND  (content_sharing_yn = 'Y' OR academy_seq = '{$academy_seq}')  GROUP BY content_code ORDER BY reg_date DESC {$limit}";
      $result = $this->db->query($sql)->result_array();


      return $result;
    }

    public function getInfoData($where)
    {
      $sql = "SELECT * FROM tb_info WHERE 1=1 {$where}";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getMainInfoData()
    {
      $sql = "SELECT * FROM tb_info WHERE info_type = 'A'";
      $adm_row = $this->db->query($sql)->row_array();

      $academy_seq = $this->session->userdata("academy_seq");
      $sql = "SELECT * FROM tb_info WHERE academy_seq = '{$academy_seq}'";
      $academy_row = $this->db->query($sql)->row_array();

      $result = array();

      if(!is_array($academy_row)){
        $result = $adm_row;
      }else{
        $result['info_manual'] = empty($academy_row['info_manual']) ? $adm_row['info_manual'] : $academy_row['info_manual'];
        $result['manual_target'] = empty($academy_row['manual_target']) ? $adm_row['manual_target'] : $academy_row['manual_target'];
        $result['info_movie'] = empty($academy_row['info_movie']) ? $adm_row['info_movie'] : $academy_row['info_movie'];
        $result['movie_target'] = empty($academy_row['movie_target']) ? $adm_row['movie_target'] : $academy_row['movie_target'];
        $result['info_blog'] = empty($academy_row['info_blog']) ? $adm_row['info_blog'] : $academy_row['info_blog'];
        $result['blog_target'] = empty($academy_row['blog_target']) ? $adm_row['blog_target'] : $academy_row['blog_target'];
      }

      return $result;
    }

    public function getAcademiTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_academy WHERE 1=1 {$where} AND status <> 'D'";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getDeleteAcademiTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_academy WHERE 1=1 {$where} AND status = 'E'";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getAcademiList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_academy WHERE 1=1 {$where} AND status <> 'D' ORDER BY academy_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getDeleteAcademiList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_academy WHERE 1=1 {$where} AND status = 'E' ORDER BY academy_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function deleteAcademy($academy_seq)
    {
      $sql = "UPDATE tb_academy SET status = 'D' WHERE academy_seq = '{$academy_seq}'";
      $this->db->query($sql);
    }

    public function updateAcademy($academy_seq,$data)
    {
      $this->db->where("academy_seq",$academy_seq);
      $this->db->update("tb_academy",$data);

      $result = $this->db->affected_rows();

      return $result;
    }

    public function getAcademy($academy_seq)
    {
      $sql = "SELECT * FROM tb_academy WHERE academy_seq = '{$academy_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getAcademiClass($academy_class_seq)
    {
      $sql = "SELECT * FROM tb_academy_class WHERE academy_class_seq = '{$academy_class_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function insertAcademyClass($data)
    {
      $this->db->insert("tb_academy_class",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateAcademyClass($academy_class_seq,$data)
    {
      $this->db->where("academy_class_seq",$academy_class_seq);
      $this->db->update("tb_academy_class",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteAcademyClass($academy_class_seq,$data)
    {
      $sql = "SELECT count(*) cnt FROM tb_user WHERE academy_class_seq = '{$academy_class_seq}'";
      $row = $this->db->query($sql)->row_array();
      $result = array();

      if($row['cnt']>0){
        $result['result'] = "failed";
      }else{
        $sql = "DELETE FROM tb_academy_class WHERE academy_class_seq = '{$academy_class_seq}'";
        $this->db->query($sql);
        $result['result'] = "success";
      }

      return $result;
    }

    public function getDuplicateAcademiId($academy_id)
    {
      $sql = "SELECT count(*) cnt FROM tb_academy WHERE academy_id = '{$academy_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getDuplicateUserId($user_id)
    {
      $sql = "SELECT count(*) cnt FROM tb_user WHERE user_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function insertAcademy($data)
    {
      $this->db->insert("tb_academy",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function insertUser($data)
    {
      $this->db->insert("tb_user",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateUser($user_seq,$data)
    {
      $this->db->where("user_seq",$user_seq);
      $this->db->update("tb_user",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateUserStatus($user_seq,$status)
    {
      $sql = "UPDATE tb_user SET status = '{$status}' WHERE user_seq = '{$user_seq}'";
      $this->db->query($sql);
    }

    public function deleteUser($user_seq)
    {
      $sql = "UPDATE tb_user SET status = 'D' WHERE user_seq = '{$user_seq}'";
      $this->db->query($sql);
    }

    public function getUseAgeTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT COUNT(*) cnt FROM (SELECT ac.* FROM tb_academy ac
                LEFT JOIN tb_user user
                ON user.academy_seq = ac.academy_seq
                WHERE 1=1 {$where} GROUP BY ac.academy_id) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getUseAgeList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT ac.*,SUM(IF(user.status='C',1,0)) use_students_total FROM tb_academy ac
                LEFT JOIN tb_user user
                ON user.academy_seq = ac.academy_seq
                WHERE 1=1 {$where}  GROUP BY ac.academy_id ORDER BY academy_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function updateFileSize($academy_seq,$file_size)
    {
      $sql = "UPDATE tb_academy SET disk_size = '{$file_size}' WHERE academy_seq = '{$academy_seq}'";
      $result = $this->db->query($sql);

      return $result;
    }

    public function getStudentTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM (SELECT user.*,ac.academy_name,acc.class_name FROM tb_user user
                LEFT JOIN tb_academy ac
                ON ac.academy_seq = user.academy_seq
                LEFT JOIN tb_academy_class acc
                ON acc.academy_class_seq = user.academy_class_seq
                WHERE 1=1 {$where} AND user.status <> 'D' GROUP BY user.user_id ) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getStudentTotal($academy_seq)
    {
      $sql = "SELECT students_total FROM tb_academy WHERE academy_seq = '{$academy_seq}'";
      $student_total = $this->db->query($sql)->row_array();
      return $student_total['students_total'];
    }

    public function getCurrentStudent($academy_seq)
    {
      $sql = "SELECT count(*) cnt FROM tb_user WHERE academy_seq = '{$academy_seq}' AND status = 'C'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getDeleteStudentTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM (SELECT user.*,ac.academy_name,acc.class_name FROM tb_user user
                LEFT JOIN tb_academy ac
                ON ac.academy_seq = user.academy_seq
                LEFT JOIN tb_academy_class acc
                ON acc.academy_class_seq = user.academy_class_seq
                WHERE 1=1 {$where} AND user.status = 'L' GROUP BY user.user_id ) a";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getStudentList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT user.*,ac.academy_name,acc.class_name FROM tb_user user
                LEFT JOIN tb_academy ac
                ON ac.academy_seq = user.academy_seq
                LEFT JOIN tb_academy_class acc
                ON acc.academy_class_seq = user.academy_class_seq
                WHERE 1=1 {$where} AND user.status <> 'D' GROUP BY user.user_id ORDER BY user_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getDeleteStudentList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT user.*,ac.academy_name,acc.class_name FROM tb_user user
                LEFT JOIN tb_academy ac
                ON ac.academy_seq = user.academy_seq
                LEFT JOIN tb_academy_class acc
                ON acc.academy_class_seq = user.academy_class_seq
                WHERE 1=1 {$where} AND user.status = 'L' GROUP BY user.user_id ORDER BY user_seq DESC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getAcademiClassTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_academy_class WHERE 1=1 $where";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }



    public function getAcademiClassList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $sql = "SELECT * FROM tb_academy_class WHERE 1=1 {$where}ORDER BY reg_date DESC {$limit}";
      $result = $this->db->query($sql)->result_array();

      return $result;

    }

    public function getHomeworkTotalCount($data)
    {
      $where = $data['where'];

      $sql = "SELECT count(*) cnt FROM tb_homework_allocation WHERE 1=1 $where";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getHomeworkList($data)
    {
      $where = $data['where'];
      $sort = $data['sort'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $sql = "SELECT * FROM tb_homework_allocation WHERE 1=1 $where $sort $limit";
      $result = $this->db->query($sql)->result_array();

      for($i=0; $i<count($result); $i++){
        $content_arr = explode(",",$result[$i]['allocation_content_seq']);
        $content_seq = $content_arr[0];
        $user_arr = explode(",",$result[$i]['allocation_user_seq']);
        $user_seq = $user_arr[0];
        $class_arr = explode(",",$result[$i]['allocation_class_seq']);
        $class_seq = $class_arr[0];


        if(!empty($class_seq)){
          $sql = "SELECT class_name FROM tb_academy_class WHERE academy_class_seq = '{$class_seq}'";
          $class_name = $this->db->query($sql)->row_array();
          $class_name = $class_name['class_name']."반 ";
        }else{
          $class_name = "";
        }

        if(!empty($content_seq)){
          $sql = "SELECT content_title FROM tb_contents WHERE content_seq = '{$content_seq}'";
          $content_title = $this->db->query($sql)->row_array();

          if(count($content_arr)>1){
            $content_title = $content_title['content_title']."외 ".(count($content_arr)-1)."컨텐츠 ";
          }else{
            $content_title = $content_title['content_title']."컨텐츠 ";
          }

        }else{
          $content_title = "";
        }

        if(!empty($user_seq)){
          $sql = "SELECT user_name FROM tb_user WHERE user_seq = '{$user_seq}'";
          $user_name = $this->db->query($sql)->row_array();

          if(count($user_arr)>1){
            $user_name = $user_name['user_name']."외 ".(count($user_arr)-1)."명";
          }else{
            $user_name = $user_name['user_name'];
          }

        }else{
          $user_name = "";
        }



        $result[$i]['allocation_title'] = $content_title.$class_name.$user_name;
        $result[$i]['total_content'] = count($content_arr);
        $result[$i]['total_user'] = count($user_arr);
      }

      return $result;
    }

    public function getHomeworkCurrentTotalCount($data)
    {
      $where = $data['where'];

      $sql = "SELECT count(*) cnt FROM (SELECT
              a.*
              FROM tb_homework a
              LEFT JOIN tb_user user
              ON user.user_id = a.user_id
              WHERE 1=1 $where GROUP BY user_id ) a";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getHomeworkCurrentList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $sql = "SELECT a.user_id,
              a.user_name,
              user.user_seq,
              (select count(*) from tb_homework where user_id = a.user_id ) cnt,
              (select count(*) from tb_homework where user_id = a.user_id AND status = 'R') complete_cnt
              FROM tb_homework a
              LEFT JOIN tb_user user
              ON user.user_id = a.user_id
              WHERE 1=1 $where GROUP BY user_id $limit";
      $result = $this->db->query($sql)->result_array();


      return $result;
    }

    public function getHomeworkDetailTotalCount($data)
    {
      $where = $data['where'];

      $sql = "SELECT count(*) cnt FROM tb_homework a
              INNER JOIN tb_contents content
              ON content.content_seq = a.content_seq WHERE 1=1 $where";
      $result = $this->db->query($sql)->row_array();


      return $result['cnt'];
    }

    public function getHomeworkDetailList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $sql = "SELECT a.*,
                    content.content_file,
                    content.content_type,
                    content.track_no,
                    content.academy_seq content_academy_seq,
                    IF(a.final_date<=NOW(),'Y','N') end_homework
                    FROM tb_homework a
              INNER JOIN tb_contents content
              ON content.content_seq = a.content_seq
              WHERE 1=1 $where $limit";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSearchUserList($where)
    {
      $sql = "SELECT * FROM tb_user WHERE 1=1 {$where}";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSearchContentList($where)
    {
      $sql = "SELECT * FROM tb_contents WHERE 1=1 {$where} ORDER BY content_code,track_no ASC";
      $result = $this->db->query($sql)->result_array();


      return $result;
    }

    public function insertAllocation($data)
    {
      $academy_class = $data['academy_class'];
      $user_seq_arr = $data['userData'];
      $content_seq_arr = $data['contentData'];

      $homework_title = $data['homework_title'];
      $final_date = $data['final_date'];

      $content_code_arr = array();
      for($i = 0; $i<count($content_seq_arr); $i++){
        $sql = "SELECT content_code FROM tb_contents WHERE content_seq = '{$content_seq_arr[$i]}' GROUP BY content_code";
        $content_code = $this->db->query($sql)->row_array();
        $content_code_arr[$i] = $content_code['content_code'];
      }

      $user_seq = implode(",",$user_seq_arr);
      $content_seq = implode(",",$content_seq_arr);
      $content_code_arr = array_unique($content_code_arr);
      $allocation_content_code = implode(",",$content_code_arr);
      $reg_date = date("Y-m-d H:i:s");

      $academy_seq = $this->session->userdata("academy_seq") ?? "";

      $sql = "INSERT INTO tb_homework_allocation (homework_title,academy_seq,allocation_class_seq,allocation_user_seq,allocation_content_code,allocation_content_seq,status,reg_date,final_date)
              VALUES('{$homework_title}','{$academy_seq}','{$academy_class}','{$user_seq}','{$allocation_content_code}','{$content_seq}','C','{$reg_date}','{$final_date}')";
      $result = $this->db->query($sql);
      $result = $this->db->affected_rows();

      $homework_allocation_seq = $this->db->insert_id();

      //homework 디비에 넣기
      for($i=0; $i<count($user_seq_arr); $i++){
        $user = $user_seq_arr[$i];
        $sql = "SELECT user_id,user_name,academy_seq FROM tb_user WHERE user_seq = '{$user}'";
        $userData = $this->db->query($sql)->row_array();

        $user_id = $userData['user_id'];
        $user_name = $userData['user_name'];
        $academy_seq = $userData['academy_seq'];

        for($j=0; $j<count($content_seq_arr); $j++){
          $content = $content_seq_arr[$j];
          $sql = "SELECT content_title,content_code,content_time,track_no FROM tb_contents WHERE content_seq = '{$content}'";
          $contentData = $this->db->query($sql)->row_array();

          $content_title = $contentData['content_title'];
          $content_code = $contentData['content_code'];
          $content_time = $contentData['content_time'];
          $track_no = $contentData['track_no'];

          //이미 있는지 체크
          $sql = "SELECT count(*) cnt FROM tb_homework WHERE user_id = '{$user_id}' AND content_seq = '{$content}'";
          $duplicateData = $this->db->query($sql)->row_array();

          if($duplicateData['cnt']==0){
            $sql = "INSERT INTO tb_homework (homework_allocation_seq,academy_seq,user_id,user_name,content_seq,content_code,track_no,content_title,content_time,final_date,reg_date,status)
                    VALUES ('{$homework_allocation_seq}','{$academy_seq}','{$user_id}','{$user_name}','{$content}','{$content_code}','{$track_no}','{$content_title}','{$content_time}','{$final_date}','{$reg_date}','D')";
            $result = $this->db->query($sql);
            $result = $this->db->affected_rows();
          }
        }


      }

      return $result;

    }

    public function getContentArray($arr)
    {
      $returnArr = array();
      for($i=0; $i<count($arr); $i++){
        $content_seq = $arr[$i];
        $sql = "SELECT * FROM tb_contents WHERE content_seq = '{$content_seq}'";
        $result = $this->db->query($sql)->row_array();
        $returnArr[$i] = $result;
      }

      return $returnArr;
    }

    public function getStudentArray($arr)
    {
      $returnArr = array();
      for($i=0; $i<count($arr); $i++){
        $student_seq = $arr[$i];
        $sql = "SELECT * FROM tb_user WHERE user_seq = '{$student_seq}'";
        $result = $this->db->query($sql)->row_array();
        $returnArr[$i] = $result;
      }

      return $returnArr;
    }

    public function getFirstContentArray($homework_seq)
    {
      $sql = "SELECT allocation_content_seq FROM tb_homework_allocation WHERE homework_seq = '{$homework_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['allocation_content_seq'];
    }

    public function getFirstStudentArray($homework_seq)
    {
      $sql = "SELECT allocation_user_seq FROM tb_homework_allocation WHERE homework_seq = '{$homework_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['allocation_user_seq'];
    }

    public function updateAllocation($data)
    {
      $homework_seq = $data['homework_seq'];
      $academy_class = $data['academy_class'];
      $user_seq_arr = $data['userData'];
      $content_seq_arr = $data['contentData'];

      $new_user_seq_arr = $data['new_user_seq'];
      $delete_user_seq_arr = $data['delete_user_seq'];
      $new_content_seq_arr = $data['new_content_seq'];
      $delete_content_seq_arr = $data['delete_content_seq'];


      $homework_title = $data['homework_title'];
      $final_date = $data['final_date'];

      $user_seq = implode(",",$user_seq_arr);
      $content_seq = implode(",",$content_seq_arr);

      $sql = "UPDATE tb_homework_allocation SET
              homework_title = '{$homework_title}',
              allocation_user_seq = '{$user_seq}',
              allocation_class_seq = '{$academy_class}',
              allocation_content_seq = '{$content_seq}',
              final_date = '{$final_date}'
              WHERE homework_seq = '{$homework_seq}'";
      $result = $this->db->query($sql);
      $result = $this->db->affected_rows();

      $sql = "UPDATE tb_homework SET final_date = '{$final_date}' WHERE homework_allocation_seq = '{$homework_seq}'";
      $this->db->query($sql);

      /*
      //기존에 있다면 지우고
      $sql = "DELETE FROM tb_homework WHERE homework_allocation_seq = '{$homework_seq}'";
      $this->db->query($sql);
      */

      //homework 디비에 넣기
      for($i=0; $i<count($user_seq_arr); $i++){
        $user = $user_seq_arr[$i];
        $sql = "SELECT user_id,user_name,academy_seq FROM tb_user WHERE user_seq = '{$user}'";
        $userData = $this->db->query($sql)->row_array();

        $user_id = $userData['user_id'];
        $user_name = $userData['user_name'];
        $academy_seq = $userData['academy_seq'];

        for($j=0; $j<count($content_seq_arr); $j++){
          $content = $content_seq_arr[$j];
          $sql = "SELECT content_title,content_code,track_no,content_time FROM tb_contents WHERE content_seq = '{$content}'";
          $contentData = $this->db->query($sql)->row_array();

          $content_title = $contentData['content_title'];
          $content_code = $contentData['content_code'];
          $content_time = $contentData['content_time'];
          $track_no = $contentData['track_no'];

          //이미 있는지 체크
          $sql = "SELECT count(*) cnt FROM tb_homework WHERE user_id = '{$user_id}' AND content_seq = '{$content}'";
          $duplicateData = $this->db->query($sql)->row_array();

          $reg_date = date("Y-m-d H:i:s");

          if($duplicateData['cnt']==0){
            $sql = "INSERT INTO tb_homework (academy_seq,homework_allocation_seq,user_id,user_name,content_seq,content_code,track_no,content_title,content_time,final_date,reg_date,status)
                    VALUES ('{$academy_seq}','{$homework_seq}','{$user_id}','{$user_name}','{$content}','{$content_code}','{$track_no}','{$content_title}','{$content_time}','{$final_date}','{$reg_date}','D')";
            $result = $this->db->query($sql);
            $result = $this->db->affected_rows();
          }
        }
      }

      //delete user
      for($i=0; $i<count($delete_user_seq_arr); $i++){
        $user = $delete_user_seq_arr[$i];
        $sql = "SELECT user_id,user_name,academy_seq FROM tb_user WHERE user_seq = '{$user}'";
        $userData = $this->db->query($sql)->row_array();
        $user_id = $userData['user_id'];
        $user_name = $userData['user_name'];
        $academy_seq = $userData['academy_seq'];

        //delete
        $sql = "DELETE FROM tb_homework WHERE homework_allocation_seq = '{$homework_seq}' AND user_id = '{$user_id}'";
        $this->db->query($sql);
      }

      //delete content
      for($i=0; $i<count($delete_content_seq_arr); $i++){
        $del_content_seq = $delete_content_seq_arr[$i];
        $sql = "DELETE FROM tb_homework WHERE homework_allocation_seq = '{$homework_seq}' AND content_seq = '{$del_content_seq}'";
        $this->db->query($sql);
      }

      return $result;

    }

    public function deleteHomework($seq)
    {
      $sql = "DELETE FROM tb_homework_allocation WHERE homework_seq = '{$seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_homework WHERE homework_allocation_seq = '{$seq}'";
      $this->db->query($sql);
    }

    public function getAllocationData($allocation_seq)
    {
      $sql = "SELECT * FROM tb_homework_allocation WHERE homework_seq = '{$allocation_seq}'";
      $result = $this->db->query($sql)->row_array();

      $userArr = explode(",",$result['allocation_user_seq']);
      $contentArr = explode(",",$result['allocation_content_seq']);

      $userData = array();
      $contentData = array();
      for($i=0; $i<count($userArr); $i++){
        $user_seq = $userArr[$i];
        $sql = "SELECT * FROM tb_user WHERE user_seq = '{$user_seq}'";
        $users = $this->db->query($sql)->row_array();
        $userData[$i] = $users;
      }

      for($i=0; $i<count($contentArr); $i++){
        $content_seq = $contentArr[$i];
        $sql = "SELECT * FROM tb_contents WHERE content_seq = '{$content_seq}'";
        $contents = $this->db->query($sql)->row_array();
        $contentData[$i] = $contents;
      }

      $returnArr = array(
        "homeworkData"  =>  $result,
        "userData"  =>  $userData,
        "contentData" =>  $contentData
      );

      return $returnArr;
    }

  }
?>
