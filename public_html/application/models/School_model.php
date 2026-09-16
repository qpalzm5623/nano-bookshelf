<?php
  class School_Model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    public function getSchoolTotalCount($data)
    {
      $where = $data['where'];
      $limit = $data['limit'] ?? "";

      $sql = "SELECT count(*) cnt FROM ( SELECT school.* FROM tb_school school
              LEFT JOIN tb_user user
              ON user.user_seq = school.user_seq
              WHERE 1=1 $where) a";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getSchoolDay($school_seq)
    {
      $sql = "SELECT * FROM tb_school WHERE school_seq = '{$school_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getSchoolNoData($school_no)
    {
      $sql = "SELECT * FROM tb_school WHERE school_no = '{$school_no}'";
      $result = $this->db->query($sql)->row_array();
      return $result;
    }

    public function updateSchoolBookYn($school_seq)
    {
      $sql = "UPDATE tb_school SET book_yn = 'N' WHERE school_seq = '{$school_seq}'";
      $this->db->query($sql);
    }

    public function getSchoolList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];
      $sort = empty($data['sort']) ? "ORDER BY school.school_seq DESC" : $data['sort'];

      $query = "SELECT school.*,
                      user.user_id admin_id,
                      user.user_name admin_name,
                      (SELECT count(*) FROM tb_user WHERE school_seq = school.school_seq) total_user,
                      (SELECT count(*) FROM tb_school_class WHERE school_seq = school.school_seq) total_class
                      FROM tb_school school
                LEFT JOIN tb_user user
                ON user.user_seq = school.user_seq
                WHERE 1=1 {$where} {$sort} {$limit}";
      $result = $this->db->query($query)->result_array();


      return $result;
    }

    public function getSchool($school_seq)
    {
      $sql = "SELECT * FROM tb_school WHERE school_seq = '{$school_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getAllSchool()
    {
      $sql = "SELECT * FROM tb_school";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function updateSchoolStatus($school_seq,$school_status)
    {
      $sql = "UPDATE tb_school SET status = '{$school_status}' WHERE school_seq = '{$school_seq}'";
      $this->db->query($sql);
    }

    public function updateSchoolAdmin($user_seq,$school_seq)
    {
      $sql = "SELECT * FROM tb_school WHERE user_seq != 0 AND user_seq is NOT NULL AND school_seq = '{$school_seq}' AND user_seq <> '{$user_seq}'";
      $result = $this->db->query($sql)->result_array();

      $returnBool = true;

      if(count($result)<=0){
        $sql = "UPDATE tb_school SET user_seq = '{$user_seq}' WHERE school_seq = '{$school_seq}'";
        $this->db->query($sql);
      }else{
        $returnBool = false;
      }

      return $returnBool;

    }

    public function getSchoolSearchPop($school_classification,$school_name)
    {
      $sql = "SELECT * FROM tb_school_config WHERE school_classification = '{$school_classification}' AND school_name LIKE '%{$school_name}%'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolOrgSearchPop($school_classification,$school_name)
    {
      $sql = "SELECT * FROM tb_school WHERE school_classification = '{$school_classification}' AND school_name LIKE '%{$school_name}%'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolSearchPop3($school_name)
    {
      $sql = "SELECT * FROM tb_school WHERE school_name LIKE '%{$school_name}%' AND status = 'Y'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function insertSchool($data)
    {
      $this->db->insert("tb_school",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateSchool($school_seq,$data)
    {
      $this->db->where("school_seq",$school_seq);
      $this->db->update("tb_school",$data);

      $result = $this->db->affected_rows();

      return $result;
    }

    public function insertSchoolConfig($data)
    {
      $this->db->insert("tb_school_config",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteSchool($school_seq)
    {
      $sql = "DELETE FROM tb_school WHERE school_seq = '{$school_seq}'";
      $this->db->query($sql);
    }

    public function getDuplicateSchoolName($school_name)
    {
      $sql = "SELECT count(*) cnt FROM tb_school WHERE school_name = '{$school_name}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }





    public function getClassTotalCount($data)
    {
      $where = $data['where'];
      $limit = $data['limit'] ?? "";

      $sql = "SELECT count(*) cnt FROM (SELECT class.*,
                        school.contract_type,
                        (SELECT count(*) FROM tb_user WHERE school_seq = school.school_seq AND school_year = class.school_year AND school_class = class.school_class) total_user,
                        users.user_name class_admin_name,
                        (SELECT user_id FROM tb_user WHERE user_seq = school.user_seq) admin_id,
                        school.status status
                        FROM tb_school_class class
                INNER JOIN tb_school school
                ON school.school_seq = class.school_seq
                LEFT JOIN tb_user users
                ON users.user_id = class.class_admin_id
                WHERE 1=1 {$where} GROUP BY class.school_class_seq ) a";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function getDuplicateSchoolClass($school_seq,$school_year,$school_class)
    {
      $sql = "SELECT * FROM tb_school_class WHERE school_seq = '{$school_seq}' AND school_year = '{$school_year}' AND school_class = '{$school_class}'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getClassAdminChk($school_seq,$user_id)
    {
      $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}' AND school_seq = '{$school_seq}' AND user_level = 2";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getClassAdminChk2($school_seq,$user_id)
    {
      $sql = "SELECT * FROM tb_school_class WHERE school_seq = '{$school_seq}' AND class_admin_id = '{$user_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function getClassList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT class.*,
                        school.contract_type,
                        (SELECT count(*) FROM tb_user WHERE school_seq = school.school_seq AND school_year = class.school_year AND school_class = class.school_class AND user_status = 'C') total_user,
                        users.user_name class_admin_name,
                        users.user_id class_admin_id,
                        (SELECT user_id FROM tb_user WHERE user_seq = school.user_seq) admin_id,
                        (SELECT user_name FROM tb_user WHERE user_seq = school.user_seq AND user_status = 'C') admin_name,
                        school.status status
                        FROM tb_school_class class
                INNER JOIN tb_school school
                ON school.school_seq = class.school_seq
                LEFT JOIN tb_user users
                ON users.user_id = class.class_admin_id AND users.user_status = 'C'
                WHERE 1=1 {$where} GROUP BY class.school_class_seq ORDER BY school.school_name,class.school_year,class.school_class ASC {$limit}";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getClassGroupList()
    {
      $query = "SELECT class.*,
                        school.contract_type,
                        (SELECT count(*) FROM tb_user WHERE school_seq = school.school_seq AND school_year = class.school_year AND school_class = class.school_class AND user_status = 'C') total_user,
                        users.user_name class_admin_name,
                        users.user_id class_admin_id,
                        (SELECT user_id FROM tb_user WHERE user_seq = school.user_seq) admin_id,
                        (SELECT user_name FROM tb_user WHERE user_seq = school.user_seq AND user_status = 'C') admin_name,
                        school.status status
                        FROM tb_school_class class
                INNER JOIN tb_school school
                ON school.school_seq = class.school_seq
                LEFT JOIN tb_user users
                ON users.user_id = class.class_admin_id AND users.user_status = 'C'
                GROUP BY class.school_class ORDER BY class.school_class ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getAllClassAdmin($school_seq)
    {
      $sql = "SELECT * FROM tb_user WHERE school_seq = '{$school_seq}' AND user_level = 2";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getFindClassAdminName($school_seq,$srcN)
    {
      $sql = "SELECT * FROM tb_user WHERE school_seq = '{$school_seq}' AND (user_name LIKE '%{$srcN}%' OR user_id LIKE '%{$srcN}%') AND user_level = 2";
      echo $sql;
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolSeqClass($school_seq,$school_year="")
    {
      $school_year_sql = "";
      if(!empty($school_year)){
        $school_year_sql .= "AND school_year = '{$school_year}'";
      }
      $sql = "SELECT * FROM tb_school_class WHERE school_seq = '{$school_seq}' {$school_year_sql}";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolName($school_seq)
    {
      $sql = "SELECT school_name FROM tb_school WHERE school_seq = '{$school_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result['school_name'];
    }

    public function getSchoolNameFind($school_name)
    {
      $school_name = str_replace(' ','',$school_name);
      $sql = "SELECT * FROM tb_school WHERE REPLACE(school_name,' ','') LIKE '%{$school_name}%'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolYear($school_seq)
    {
      $sql = "SELECT * FROM tb_school_class WHERE school_seq = '{$school_seq}' GROUP BY school_year";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function getSchoolClass($school_seq,$school_year)
    {
      $sql = "SELECT * FROM tb_school_class WHERE school_seq = '{$school_seq}' AND school_year = '{$school_year}' GROUP BY school_class";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    public function insertClass($data)
    {
      $this->db->insert("tb_school_class",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function getClassData($school_class_seq)
    {
      $sql = "SELECT * FROM tb_school_class WHERE school_class_seq = '{$school_class_seq}'";
      $result = $this->db->query($sql)->row_array();

      return $result;
    }

    public function updateClass($school_class_seq,$data)
    {
      $this->db->where("school_class_seq",$school_class_seq);
      $this->db->update("tb_school_class",$data);

      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteClass($school_class_seq)
    {
      $sql = "DELETE FROM tb_school_class WHERE school_class_seq = '{$school_class_seq}'";
      $this->db->query($sql);
    }




    public function getContractList()
    {
      $query = "SELECT * FROM tb_config WHERE category = 'contract'";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function insertContract($contract_name)
    {
      $sql = "INSERT INTO tb_config (category,value) VALUES('contract','{$contract_name}')";
      $this->db->query($sql);
    }

    public function deleteContract($seq)
    {
      $sql = "DELETE FROM tb_config WHERE seq = '{$seq}'";
      $this->db->query($sql);
    }

  }
?>
