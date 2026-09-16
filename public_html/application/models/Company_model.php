<?php
  class Company_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //login
    public function login($company_id,$company_password)
    {
      $result = array();
      $query = "SELECT * FROM tb_user WHERE user_id = '{$company_id}' AND user_level = 9";
      $company_id_result = $this->db->query($query);
      $row = $company_id_result->row_array();

      if( $company_id_result->num_rows() > 0 ){

        if($this->decrypt("password",$row['user_password']) == $company_password ){
          $result["result"] = "success";
          $result["companyData"] = $row;
        } else {
          $result["result"] = "failed";
          $result["message"] = "company_password";
        }

      } else {
        $result["result"] = "failed";
        $result["message"] = "company_id";
      }

      return $result;
    }

    //company total count
    public function getCompanyTotal($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_company WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //company list
    public function getCompanyList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_company WHERE 1=1 {$where}ORDER BY company_seq DESC {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getAllCompanys()
    {
      $sql = "SELECT * FROM tb_company";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //company view
    public function getCompany($company_seq)
    {
      $sql = "SELECT * FROM tb_company WHERE company_seq = '{$company_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //사업자번호 중복체크
    public function getBusinessNo($business_no)
    {
      $sql = "SELECT * FROM tb_company WHERE business_no = '{$business_no}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //회사정보 입력
    public function insertCompany($data)
    {
      $this->db->insert("tb_company",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //회사정보 수정
    public function updateCompany($data,$seq)
    {
      $this->db->where("company_seq",$seq);
      $this->db->update("tb_company",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    //회사담당자 회사정보 수정
    public function updateCompanyData($arr)
    {
      $company_seq = $arr['company_seq'];
      $company_seq  = $arr['company_seq'];
      $company_tel  = $arr['company_tel'];
      $company_fax  = $arr['company_fax'];
      $company_zipcode  = $arr['company_zipcode'];
      $company_address  = $arr['company_address'];
      $company_address_detail = $arr['company_address_detail'];

      $sql = "UPDATE tb_company SET company_tel = '{$company_tel}', company_fax = '{$company_fax}', company_zipcode = '{$company_zipcode}', company_address = '{$company_address}', company_address_detail = '{$company_address_detail}' WHERE company_seq = '{$company_seq}'";
      $query = $this->db->query($sql);
      $result = $this->db->affected_rows();

      return $result;
    }

    //기업아이디 찾기
    public function getCompanyId($giup_id)
    {
      $sql = "SELECT company_seq FROM tb_company WHERE giup_id = '{$giup_id}'";
      $result = $this->db->query($sql)->row_array();

      return $result['company_seq'];
    }



    //기업관리자용
    public function getPlayingStudyTotal($arr)
    {
      $where = $arr['where'];
      $company_seq = $arr['company_seq'];

      $sql = "SELECT count(*) cnt FROM (SELECT study_count.* FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE 1=1 {$where} AND study_count.company_seq = '{$company_seq}' AND end_yn = 'N') A";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    public function getPlayingStudyList($arr)
    {
      $where = $arr['where'];
      $company_seq = $arr['company_seq'];
      $limit = $arr['limit'];

      $sql = "SELECT study_count.*,
                    course_class.course_start_date,
                    course_class.course_end_date,
                    course_class.class_type
                    FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE 1=1 {$where} AND study_count.company_seq = '{$company_seq}' AND end_yn = 'N' {$limit}";

      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getEndStudyTotal($arr)
    {
      $where = $arr['where'];
      $company_seq = $arr['company_seq'];

      $sql = "SELECT count(*) cnt FROM (SELECT study_count.* FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE 1=1 {$where} AND study_count.company_seq = '{$company_seq}' AND end_yn = 'Y') A";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }

    public function getEndStudyList($arr)
    {
      $where = $arr['where'];
      $company_seq = $arr['company_seq'];
      $limit = $arr['limit'];

      $sql = "SELECT study_count.*,
                    course_class.course_start_date,
                    course_class.course_end_date,
                    course_class.class_type
                    FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE 1=1 {$where} AND study_count.company_seq = '{$company_seq}' AND end_yn = 'Y' {$limit}";

      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getUserCourseClassData($arr)
    {
      $company_seq = $arr['company_seq'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];

      $sql = "SELECT users.user_id,
                      users.user_name,
                      users.jumin,
                      users.cell,
                      company.company_name,
                      users.dept,
                      users.position,
                      orders.course_name
              FROM tb_user users
              INNER JOIN tb_company company
              ON company.company_seq = users.company_seq
              INNER JOIN tb_course_order orders
              ON orders.user_id = users.user_id
              WHERE users.user_level = 10";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }
  }

?>
