<?php
  class Partner_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //login
    public function login($partner_id,$partner_password)
    {
      $result = array();
      $query = "SELECT * FROM tb_user WHERE user_id = '{$partner_id}' AND user_level = 7";
      $partner_id_result = $this->db->query($query);
      $row = $partner_id_result->row_array();

      if( $partner_id_result->num_rows() > 0 ){

        if($this->decrypt("password",$row['user_password']) == $partner_password ){
          $result["result"] = "success";

          $sql = "SELECT company_seq FROM tb_partner WHERE partner_id = '{$partner_id}'";
          $query = $this->db->query($sql)->result_array();

          $companyArr = array();

          for($i=0; $i<count($query); $i++){
            $companyArr[$i] = $query[$i]['company_seq'];
          }

          $result["companySeq"] = $companyArr;
        } else {
          $result["result"] = "failed";
          $result["message"] = "partner_password";
        }

      } else {
        $result["result"] = "failed";
        $result["message"] = "partner_id";
      }

      return $result;
    }

    public function getPlayingCompanyList($arr)
    {
      $where = $arr['where'];
      $limit = $arr['limit'];
      $company_seq = $arr['company_seq'];

      $sql = "SELECT company_seq, company_name FROM tb_company WHERE 1=1 $where AND company_seq in ({$company_seq}) $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //company total count
    public function getCompanyTotal($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_company WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    public function getPartner($company_seq)
    {
      $password_key = $this->config->config['password_key'];
      $encryption_key = $this->config->config['encryption_key'];        
      $sql = "SELECT users.*, 
                     AES_DECRYPT(UNHEX(email), '{$encryption_key}') email,
                    AES_DECRYPT(UNHEX(tel), '{$encryption_key}') tel,
                    AES_DECRYPT(UNHEX(cell), '{$encryption_key}') cell
                FROM tb_partner partner
              INNER JOIN tb_user users
              ON users.user_seq = partner.user_seq
              INNER JOIN tb_company company
              ON company.company_seq = partner.company_seq
              WHERE partner.company_seq = '{$company_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
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

    public function getPlayingStudyList($company_seq)
    {
      $sql = "SELECT study_count.*,
                    course_class.course_start_date,
                    course_class.course_end_date,
                    course_class.class_type
                    FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE study_count.company_seq = '{$company_seq}' AND end_yn = 'N'";

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

    public function getEndStudyList($company_seq)
    {
      $sql = "SELECT study_count.*,
                    course_class.course_start_date,
                    course_class.course_end_date,
                    course_class.class_type
                    FROM tb_study_count study_count
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = study_count.class_code
              WHERE study_count.company_seq = '{$company_seq}' AND end_yn = 'Y'";

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
