<?php
  class Course_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_course WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    public function getCourseDuplicate($course_code)
    {
      $sql = "SELECT count(course_seq) cnt FROM tb_course WHERE course_code = '{$course_code}'";
      $result = $this->db->query($sql)->row_array();

      return $result['cnt'];
    }

    public function insertExcelCourse($data)
    {
      $this->db->insert("tb_course",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    public function insertExcelCourseContents($data)
    {
      $this->db->insert("tb_course_contents",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    public function insertExcelCourseContentsPage($data)
    {
      $this->db->insert("tb_course_contents_page",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseInfoTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_course WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseOrderTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT count.* FROM tb_study_count count
              INNER JOIN tb_course_class class
              ON class.class_code = count.class_code
              INNER JOIN tb_course course
              ON course.course_code = count.course_code
              WHERE 1=1 $where) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseContentsTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT contents.* FROM tb_course_contents contents
              INNER JOIN tb_course course
              ON course.course_code = contents.course_code WHERE 1=1 $where) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getContentsPageTotalCount($data)
    {
      $where = $data['where'];
      /*
      $sql = "SELECT count(*) cnt FROM (SELECT page.* FROM tb_course_contents_page page
              INNER JOIN tb_course course
              ON course.course_code = page.course_code 
              INNER JOIN tb_course_contents contents
              ON contents.course_code = page.course_code and contents.contents_order = page.contents_order
              WHERE 1=1 $where) A";
      */
              
      $sql = "SELECT count(*) cnt FROM tb_course_contents_page page
              LEFT JOIN tb_course course
              ON course.course_code = page.course_code
              WHERE 1=1 $where ";
      //echo $sql;
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseClassTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_course_class WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getCourseEndTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT sc.* FROM tb_study_count sc
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = sc.class_code
              WHERE 1=1 $where) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getReportTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT report.* FROM tb_report report
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = report.class_code
              WHERE 1=1 $where) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getSurveyTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT sv.* FROM tb_survey sv
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = sv.class_code
              WHERE 1=1 $where) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getSurveyContentTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM tb_survey_contents
              WHERE 1=1 $where";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return int
    */
    public function getReportCreateTotalCount($data)
    {
      $where = $data['where'];
      $sql = "SELECT count(*) cnt FROM (SELECT course_order.* FROM tb_course_order course_order
              INNER JOIN tb_course course
              ON course.course_code = course_order.course_code
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = course_order.class_code
              WHERE 1=1 $where GROUP BY course_order.company_seq,course_order.class_code )A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getReportCreateList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT course_order.class_code,
                    course_class.class_type,
                    course_order.course_code,
                    course_order.company_seq,
                    course_order.company_name,
                    course_order.course_name,
                    course_class.class_display_code,
                    course_class.course_start_date,
                    course_class.course_end_date
       FROM tb_course_order course_order
              INNER JOIN tb_course course
              ON course.course_code = course_order.course_code
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = course_order.class_code
              WHERE 1=1 {$where} GROUP BY course_order.company_seq,course_order.class_code {$limit}";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getCourseDetail($course_code)
    {
      $sql = "SELECT * FROM tb_course_contents WHERE course_code = '{$course_code}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getClassData($class_code)
    {
      $sql = "SELECT * FROM tb_course_class WHERE class_code = '{$class_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT * FROM tb_course WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param string $course_code
    @return array
    */
    public function getCourseContents($course_code)
    {
      $sql = "SELECT MAX(contents_order) cnt FROM tb_course_contents WHERE course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query['cnt'];
    }


    /*
    @param string $course_code
    @return array
    */
    public function getCourseContentsDetail($contents_seq)
    {
      $sql = "SELECT  * FROM tb_course_contents WHERE contents_seq = '{$contents_seq}'";
      $result = $this->db->query($sql)->row_array();

      $sql = "SELECT  course_name FROM tb_course WHERE course_code = '{$result['course_code']}'";
      $courseResult = $this->db->query($sql)->row_array();
      $result['course_name'] = $courseResult['course_name'];

      return $result;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseOrderList($data)
    {
      $where = $data["where"];
      $limit = $data["limit"];
      $sql = "SELECT count.*,
                class.course_start_date start_date,
                class.course_end_date end_date,
                class.class_display_code,
                class.class_type,
                'O' refund_yn,
                'O' end_yn
              FROM tb_study_count count
              INNER JOIN tb_course_class class
              ON class.class_code = count.class_code
              INNER JOIN tb_course course
              ON course.course_code = count.course_code
              WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseInfoList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT * FROM tb_course WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseContentsList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT contents.*,course.course_name FROM tb_course_contents contents
              INNER JOIN tb_course course
              ON course.course_code = contents.course_code WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getContentsPageList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT page.*,course.course_name FROM tb_course_contents_page page
              LEFT JOIN tb_course course
              ON course.course_code = page.course_code
              WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();


      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseClassList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT class.*,course.hrd_code,course.course_name FROM tb_course_class class
              INNER JOIN tb_course course
              ON course.course_code = class.course_code WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getCourseEndList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT sc.*,
              course_class.class_type,
              course_class.class_display_code,
              course_class.course_start_date start_date,
              course_class.course_end_date end_date FROM tb_study_count sc
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = sc.class_code
              WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getReportList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT report.*,
              course.course_name,
              course_class.class_type,
              course_class.class_display_code,
              course_class.course_start_date start_date,
              course_class.course_end_date end_date,
              (SELECT count(*) FROM tb_course_user WHERE class_code = report.class_code AND course_code = report.course_code) total_student,
              (SELECT count(*) FROM tb_report_history WHERE report_seq = report.report_seq) total_report_student
              FROM tb_report report
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = report.class_code
              INNER JOIN tb_course course
              ON course.course_code = report.course_code
              WHERE 1=1 $where ORDER BY report.report_seq DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getSurveyList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT sv.*,
                    course.course_name,
                    course_class.class_display_code FROM tb_survey sv
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = sv.class_code
              INNER JOIN tb_course course
              ON course.course_code = sv.course_code
              WHERE 1=1 $where $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array "limit","where"
    @return array
    */
    public function getSurveyContentList($data)
    {
      $where = $data['where'];
      $limit = $data['limit'];
      $sql = "SELECT * FROM tb_survey_contents
              WHERE 1=1 $where ORDER BY survey_order DESC $limit";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param string $course_code
    @return array
    */
    public function getCourseCode($course_code)
    {
      $sql = "SELECT * FROM tb_course WHERE course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param int $course_seq
    @return array
    */
    public function getCourse($course_seq)
    {
      $sql = "SELECT * FROM tb_course WHERE course_seq = '{$course_seq}'";
      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    /*
    @param int $course_seq
    @return array
    */
    public function getReport($report_seq)
    {
      $sql = "SELECT * FROM tb_report WHERE report_seq = '{$report_seq}'";
      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    /*
    @param int $class_seq
    @return array
    */
    public function getCourseClass($class_seq)
    {
      $sql = "SELECT * FROM tb_course_class WHERE class_seq = '{$class_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param string $course_code , $class_code
    @return array
    */
    public function getCourseClassData($course_code,$class_code)
    {
      $sql = "SELECT course.course_name,
                    class.class_seq,
                    class.class_display_code,
                    class.course_start_date,
                    class.course_end_date,
                    class.class_type,
                    course.eval_per_exam,
                    course.eval_per_attend,
                    course.eval_per_report,
                    course.eval_per_step_exam,
                    MAX(contents.contents_order) chasi
                     FROM tb_course course
              INNER JOIN tb_course_class class
              ON class.course_code = course.course_code
              INNER JOIN tb_course_contents contents
              ON contents.course_code = course.course_code
              WHERE course.course_code = '{$course_code}' AND class.class_code = '{$class_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getCourseClassSurvey($survey_seq)
    {
      $sql = "SELECT * FROM tb_survey WHERE survey_seq = '{$survey_seq}'";
      $return = $this->db->query($sql)->row_array();

      return $return;
    }

    /*
    @param string $course_code, string $class_display_code
    @return array
    */
    public function getClass($course_code,$class_display_code)
    {
      $sql = "SELECT * FROM tb_course_class WHERE course_code = '{$course_code}' AND class_display_code = '{$class_display_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param string $course_code, int $class_display_code
    @return int 1,0
    */
    public function getDuplicateClass($course_code,$class_display_code)
    {
      $sql = "SELECT * FROM tb_course_class WHERE course_code = '{$course_code}' AND class_display_code = '{$class_display_code}'";
      $query = $this->db->query($sql)->row_array();
      $result = is_array($query) ? 1 : 0;

      return $result;
    }

    /*
    @param int $contents_seq
    @return array
    */
    public function getContentsPage($page_seq)
    {
      $sql = "SELECT page.*,course.course_name FROM tb_course_contents_page page
              INNER JOIN tb_course course
              ON course.course_code = page.course_code
              WHERE page_seq = '{$page_seq}'";
      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    /*
    @param int $contents_seq
    @return array
    */
    public function getContentsContents($contents_seq)
    {
      $sql = "SELECT contents.*,course.course_name FROM tb_course_contents contents
              INNER JOIN tb_course course
              ON course.course_code = contents.course_code WHERE contents_seq = '{$contents_seq}'";
      $query = $this->db->query($sql)->row_array();
      return $query;
    }

    /*
    @param string $course_code
    @return int
    */
    public function getCourseContentCnt($course_code)
    {
      $sql = "SELECT MAX(contents_order) cnt FROM tb_course_contents WHERE course_code = '{$course_code}'";
      $query = $this->db->query($sql)->row_array();

      $result = $query['cnt'];

      return $result;
    }

    public function getCourseContentPage($course_code,$chasi)
    {
      $sql = "SELECT contents_page FROM tb_course_contents WHERE course_code = '{$course_code}' AND contents_order = '{$chasi}'";
      $query = $this->db->query($sql)->row_array();

      $return = $query['contents_page'];
      return $return;
    }

    public function getCourseContentPages($course_code,$chasi)
    {
      $sql = "SELECT * FROM tb_course_contents WHERE course_code = '{$course_code}' AND contents_order = '{$chasi}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getCourseContentPageContent($course_code,$chasi,$page)
    {
      $sql = "SELECT * FROM tb_course_contents_page WHERE course_code = '{$course_code}' AND contents_order = '{$chasi}' AND page_order = '{$page}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @return array
    */
    public function getAllCourses()
    {
      $sql = "SELECT * FROM tb_course";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @return array
    */
    public function getAllCourseClasses()
    {
      $sql = "SELECT classes.*,course.course_name FROM tb_course_class classes
              INNER JOIN tb_course course
              ON course.course_code = classes.course_code";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param array $insertCourseData
    @return int
    */
    public function insertCourse($insertCourseData)
    {
      $this->db->insert("tb_course",$insertCourseData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertCourseData
    @return int
    */
    public function insertReport($insertReportData)
    {
      $this->db->insert("tb_report",$insertReportData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertClassData
    @return int
    */
    public function insertCourseClass($insertClassData)
    {
      $this->db->insert("tb_course_class",$insertClassData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertCourseContentsData
    @return int
    */
    public function insertCourseContents($insertCourseContentsData)
    {
      $this->db->insert("tb_course_contents",$insertCourseContentsData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertCourseContentsData
    @return int
    */
    public function insertCourseUser($insertCourseUserData)
    {
      $this->db->insert("tb_course_user",$insertCourseUserData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertContentsPageData
    @return int
    */
    public function insertContentsPage($insertContentsPageData)
    {
      $this->db->insert("tb_course_contents_page",$insertContentsPageData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertSurveyData
    @return int
    */
    public function insertSurvey($insertSurveyData)
    {
      $this->db->insert("tb_survey",$insertSurveyData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $insertSurveyContentData
    @return int
    */
    public function insertSurveyContent($insertSurveyContentData)
    {
      $this->db->insert("tb_survey_contents",$insertSurveyContentData);
      $result = $this->db->insert_id();

      return $result;
    }

    /*
    @param array $updateCourseContentsData
    @return int
    */
    public function updateCourseContents($updateCourseContentsData,$contents_seq)
    {
      $this->db->where("contents_seq",$contents_seq);
      $this->db->update("tb_course_contents",$updateCourseContentsData);
      $result = $this->db->affected_rows();

      return $result;
    }

    /*
    @param array $updateCourseContentsData
    @return int
    */
    public function updateReport($updateReportData,$report_seq)
    {
      $this->db->where("report_seq",$report_seq);
      $this->db->update("tb_report",$updateReportData);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function updateCourseEnd($seq)
    {
      $updateData = array(
        "end_yn"  =>  "Y"
      );

      $this->db->where("seq",$seq);
      $this->db->update("tb_study_count",$updateData);
      $result = $this->db->affected_rows();

      return $result;
    }

    /*
    @param array $updatContentsPageData
    @return int
    */
    public function updateContentsPage($updatContentsPageData,$page_seq)
    {
      $this->db->where("page_seq",$page_seq);
      $this->db->update("tb_course_contents_page",$updatContentsPageData);
      $result = $this->db->affected_rows();

      return $result;
    }

    /*
    @param array $updateCourseData
    @param int $course_seq
    @return int
    */
    public function updateCourse($updateCourseData,$course_seq)
    {
      $this->db->where("course_seq",$course_seq);
      $this->db->update("tb_course",$updateCourseData);
      $result = $this->db->affected_rows();

      return $result;
    }

    /*
    @param array $updateClassData
    @param int $class_seq
    @return int
    */
    public function updateCourseClass($updateClassData,$class_seq)
    {
      $this->db->where("class_seq",$class_seq);
      $this->db->update("tb_course_class",$updateClassData);
      $result = $this->db->affected_rows();

      return $result;
    }


    public function checkSurveyContentOrder($survey_seq,$survey_order)
    {
      $sql = "SELECT * FROM tb_survey_contents WHERE survey_seq = '{$survey_seq}' AND survey_order = '{$survey_order}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getNextSurveyContentOrder($survey_seq)
    {
      $sql = "SELECT MAX(survey_order) survey_order FROM tb_survey_contents WHERE survey_seq = '{$survey_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getSurveyContent($survey_content_seq)
    {
      $sql = "SELECT * FROM tb_survey_contents WHERE survey_contents_seq = '{$survey_content_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getSurvey($survey_seq)
    {
      $sql = "SELECT * FROM tb_survey WHERE survey_seq = '{$survey_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    /*
    @param array $updateClassData
    @param int $class_seq
    @return int
    */
    public function updateSurveyContent($updateSurveyContent,$survey_content_seq)
    {
      $this->db->where("survey_contents_seq",$survey_content_seq);
      $this->db->update("tb_survey_contents",$updateSurveyContent);
      $result = $this->db->affected_rows();

      return $result;
    }

    /*
    @param array $updateClassData
    @param int $class_seq
    @return int
    */
    public function updateSurvey($updateSurveyData,$survey_seq)
    {
      $this->db->where("survey_seq",$survey_seq);
      $this->db->update("tb_survey",$updateSurveyData);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteSurveyContent($survey_content_seq)
    {
      $sql = "DELETE FROM tb_survey_contents WHERE survey_contents_seq = '{$survey_content_seq}'";
      $this->db->query($sql);
    }

    public function deleteSurvey($survey_seq)
    {
      $sql = "DELETE FROM tb_survey WHERE survey_seq = '{$survey_seq}'";
      $this->db->query($sql);

      $sql = "DELETE FROM tb_survey_contents WHERE survey_seq = '{$survey_seq}'";
      $this->db->query($sql);
    }

    //멤버별 코스정보
    public function getMemberCourseData($user_id,$studyTab)
    {
      if($studyTab=="possibility"){
        $where = " AND course_class.course_end_date >= NOW()";
      }else{
        $where = " AND course_class.course_end_date < NOW()";
      }
      $sql = "SELECT course.course_name,
                    course.course_code,
                    course_user.total_class,
                    course_user.clear_class,
                    course_class.class_code,
                    course_class.course_start_date,
                    course_class.course_end_date,
                    course.eval_condition_report
              FROM tb_course_order course_order
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = course_order.class_code
              INNER JOIN tb_course course
              ON course.course_code = course_order.course_code
              INNER JOIN tb_course_user course_user
              ON course_user.user_id = course_order.user_id
              WHERE course_order.user_id = '{$user_id}'$where";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getMemberStudyCnt($user_id)
    {
      $sql = "SELECT count(*) cnt FROM (SELECT course_order.*
              FROM tb_course_order course_order
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = course_order.class_code
              INNER JOIN tb_course course
              ON course.course_code = course_order.course_code
              WHERE course_order.user_id = '{$user_id}' AND course_class.course_end_date >= NOW()) A";
      $query = $this->db->query($sql)->row_array();
      $result = $query['cnt'];

      return $result;
    }

    //학습화면 디테일
    public function getClassDetailData($user_id,$class_code)
    {
      $sql = "SELECT * FROM tb_course_class class
              INNER JOIN tb_course course
              ON course.course_code = class.course_code
              WHERE class.class_code = '{$class_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //회차 인증
    public function getClassCertCheck($user_id,$class_code)
    {
      $sql = "SELECT * FROM tb_cert_history WHERE class_code = '{$class_code}' AND user_id = '{$user_id}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //최초입과 인증
    public function courseCertInsert($data)
    {
      $this->db->insert("tb_cert_history",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //해당인원 진행사항
    public function getUserCourseData($user_id,$class_code)
    {
      $sql = "SELECT * FROM tb_course_user WHERE class_code = '{$class_code}' AND user_id = '{$user_id}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //차시
    public function getCourseContentData($course_code)
    {
      $sql = "SELECT * FROM tb_course_contents WHERE course_code = '{$course_code}' ORDER BY contents_order ASC";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //사용자별 차시 학습데이터
    public function getUserContetsData($arr)
    {
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];
      $class_order = $arr['class_order'];

      $sql = "SELECT * FROM tb_course_user_history WHERE course_code = '{$course_code}' AND class_code = '{$class_code}' AND user_id = '{$user_id}' AND class_order = '{$class_order}'";
      $query = $this->db->query($sql)->row_array();

      if(!is_array($query)){
        $result = array();
      }else{
        $result = $query;
      }

      return $result;
    }

    //차시별 인원 정보
    public function getMemberPageData($arr)
    {
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_code = $arr['course_code'];
      $class_order = $arr['class_order'];

      $sql = "SELECT * FROM tb_course_user_history WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND course_code = '{$course_code}' AND class_order = '{$class_order}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //코스 히스토리
    public function getCourseHistoryData($arr)
    {
      $user_id  =  $arr['user_id'];
      $class_code =  $arr['class_code'];
      $course_code  =  $arr['course_code'];
      $class_order  =  $arr['class_order'];

      $sql = "SELECT * FROM tb_course_user_history WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND course_code = '{$course_code}' AND class_order = '{$class_order}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //코스 히스토리 입력
    public function insertCourseHistory($arr)
    {
      $user_id  =  $arr['user_id'];
      $class_code =  $arr['class_code'];
      $course_code  =  $arr['course_code'];
      $class_order  =  $arr['class_order'];
      $reg_date = date("Y-m-d H:i:s");
      $ip = $this->input->ip_address();

      $page_history = array(
        "start_time"  =>  date("Y-m-d H:i:s"),
        "end_time"    =>  "",
        "page_history"  =>  array()
      );
      $page_history['page_history'][1] = array();


      $page_history = serialize($page_history);

      $sql = "INSERT INTO tb_course_user_history (course_code,class_code,user_id,class_order,page_order,sum_total_time,pass_yn,reg_time,ip,page_history)
              VALUES ('{$course_code}','{$class_code}','{$user_id}','{$class_order}','1','0','N','{$reg_date}','{$ip}','{$page_history}')";
      $query = $this->db->query($sql);

      $seq = $this->db->insert_id();

      $sql = " SELECT * FROM tb_course_user_history WHERE seq = '{$seq}'";
      $return = $this->db->query($sql)->row_array();

      //진도율 agent 넣기
      $eval_type = "진도_".$class_order;
      $eval_code = "01";
      $submit_date = date("Y-m-d H:i:s");
      $status = 'U';
      $copied_answer = "X";
      $reg_date = date("Y-m-d H:i:s");
      $ip = $this->get_client_ip();
      $du_date = date("Ymd");

      $sql = "SELECT MAX(contents_order) total FROM tb_course_contents WHERE course_code = '{$course_code}'";
      $scoreResult = $this->db->query($sql)->row_array();

      $score = 0;
      if(is_array($scoreResult)){
        $score = ($class_order / $scoreResult['total'])*100;
      }

      $sql = "INSERT INTO tb_score_history (user_id,course_code,class_code,eval_type,submit_date,score,ip,du_date,status,copied_answer,reg_date,eval_code)
              VALUES('{$user_id}','{$course_code}','{$class_code}','{$eval_type}','{$submit_date}','{$score}','{$ip}','{$du_date}','{$status}','{$copied_answer}','{$reg_date}','{$eval_code}')";
      $this->db->query($sql);

      return $return;

    }

    //플레이어 업데이트
    public function updatePlayer($arr)
    {
      $seq = $arr['seq'];
      $time = $arr['time'];
      $page_time = $arr['page_time'];
      $page = $arr['page'];
      $ip = $arr['ip'];

      $sql = "SELECT * FROM tb_course_user_history WHERE seq = '{$seq}'";
      $query = $this->db->query($sql)->row_array();

      $page_history = array();
      $page_history = unserialize($query['page_history']);

      $ip_history = unserialize($query['ip_history']);

      if(!is_array($page_history)){
        $page_history['start_time'] = date("Y-m-d H:i:s");
      }

      if(!is_array($ip_history)){
        $ip_history = array();
      }

      $page_history['end_time'] = date("Y-m-d H:i:s");

      $pageData = array(
        "pages" =>  $page,
        "pages_time" =>  $page_time,
        "seconds" =>  $time,
        "reg_time"  =>  date("Y-m-d H:i:s"),
      );

      if(is_array($page_history['page_history'][$page])){
        array_push($page_history['page_history'][$page],$pageData);
      }else{
        $page_history['page_history'][$page] = array();
      }

      array_push($ip_history,$ip);

      $page_history = serialize($page_history);
      $ip_history = serialize($ip_history);

      $sum_total_time = $query['sum_total_time'];
      $sum_total_time += $time;

      $sql = "UPDATE tb_course_user_history SET sum_total_time = '{$sum_total_time}', page_history = '{$page_history}', ip_history = '{$ip_history}' WHERE seq = '{$seq}'";
      $this->db->query($sql);
    }

    //페이지 시간
    public function getPageTotalTime($seq,$page)
    {
      $sql = "SELECT pages.page_time FROM tb_course_user_history his
              INNER JOIN tb_course_contents_page pages
              ON pages.course_code = his.course_code AND pages.contents_order = his.class_order
              WHERE his.seq = {$seq} AND pages.page_order = '{$page}'";
      $query = $this->db->query($sql)->row_array();
      $return = $query['page_time'];
      return $return;
    }

    //사용자 페이지타임
    public function getUserPageTime($seq)
    {
      $sql = "SELECT page_history FROM tb_course_user_history WHERE seq = '{$seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    //페이지 수료
    public function updatePageSuryo($seq)
    {
      $datetime = date("Y-m-d H:i:s");
      $sql = "UPDATE tb_course_user_history SET pass_yn = 'Y' , pass_time = '{$datetime}' WHERE seq = '{$seq}'";
      $this->db->query($sql);
    }

    //사용자 차시 타임
    public function getUserCourseContentsData($user_id,$class_code,$class_order)
    {
      $sql = "SELECT sum_total_time FROM tb_course_user_history WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND class_order = '{$class_order}'";
      $query = $this->db->query($sql)->row_array();

      return $query['sum_total_time'];
    }

    public function getCourseContentsTimes($course_code)
    {
      $sql = "SELECT contents_order, contents_time FROM tb_course_contents WHERE course_code = '{$course_code}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getCourseUser($user_id,$class_code)
    {
      $sql = "SELECT * FROM tb_course_user WHERE user_id = '{$user_id}' AND class_code = '{$class_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getRetryMemberTotal($course_code)
    {
      $sql = "SELECT class_code, course_code, user_id, COUNT(*) cnt FROM tb_course_order WHERE course_code = '{$course_code}' GROUP BY course_code,user_id HAVING CNT > 1";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getRetryMemberList($course_code,$user_id)
    {
      $slq = "SELECT co.company_name,
                    users.user_id,
                    users.user_name,
                    users.birthday,
                    cu.total_class,
                    cu.clear_class,
                    cu.step_score,
                    cu.last_score,
                    cu.reprot_yn,
                    cu.pass_yn,
                    cc.course_start_date,
                    cc.course_end_date
                    FROM tb_course_order co
              INNER JOIN tb_user users
              ON users.user_id = co.user_id
              INNER JOIN tb_course_user cu
              ON cu.user_id = co.user_id AND cu.course_code = co.course_code
              INNER JOIN tb_course_class cc
              ON cc.class_code = co.class_code
              WHERE co.user_id = 'mulggimpyo1' AND co.course_code = 'H-2021-HOS-50'";
      $query = $this->db->query($sql);
      return $query;
    }

    public function getReviews($course_code)
    {
      $sql = "SELECT after.*, users.user_name, users.position FROM tb_board_after after
              INNER JOIN tb_user users
              ON users.user_id = after.board_writer_id
              WHERE after.course_code = '{$course_code}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //신청가능한 회차목록
    public function getRegisterClassData($course_code)
    {
      $sql = "SELECT * FROM tb_course_class WHERE course_code = '{$course_code}' AND register_end_date > NOW()";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //카트 중복체크
    public function getDuplicateCart($arr)
    {
      $user_id = $arr['user_id'];
      $class_code = $arr['class_code'];
      $course_seq = $arr['course_seq'];

      $sql = "SELECT * FROM tb_cart WHERE user_id = '{$user_id}' AND class_code = '{$class_code}' AND course_seq = '{$course_seq}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //카트 저장
    public function insertCart($arr)
    {
      $this->db->insert("tb_cart",$arr);

      return $this->db->insert_id();
    }

    //카트정보
    public function getCart($user_id)
    {
      $sql = "SELECT cart.*,
                course.course_type,
                course_class.course_start_date,
                course_class.course_end_date,
                course.total_hour,
                course.course_price
                 FROM tb_cart cart
              INNER JOIN tb_course course
              ON course.course_seq = cart.course_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = cart.class_code
       WHERE user_id = '{$user_id}'";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    //카트결제정보
    public function getCartPayment($ct_id)
    {
      if(is_array($ct_id)){
        $ct_id = implode(",",$ct_id);
      }

      $sql = "SELECT cart.*,
                course.course_type,
                course_class.course_start_date,
                course_class.course_end_date,
                course.total_hour,
                course.course_price
                 FROM tb_cart cart
              INNER JOIN tb_course course
              ON course.course_seq = cart.course_seq
              INNER JOIN tb_course_class course_class
              ON course_class.class_code = cart.class_code
       WHERE cart.ct_id in ($ct_id)";
      $query = $this->db->query($sql)->result_array();

      return $query;


    }

    //결제정보 넣기
    public function insertPayment($data)
    {
      $this->db->insert("tb_payment",$data);
      $pm_id = $this->db->insert_id();

      return $pm_id;
    }

    //결제완료 페이지
    public function getPayment($pm_id)
    {
      $sql = "SELECT * FROM tb_payment WHERE pm_id = '{$pm_id}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function getPaymentCourse($class_code)
    {
      $sql = "SELECT course.course_type,
              course_class.course_start_date,
              course_class.course_end_date,
              course.total_hour,
              course.course_price
              FROM tb_course_class course_class
              INNER JOIN tb_course course
              ON course.course_code = course_class.course_code
              WHERE course_class.class_code = '{$class_code}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }

    public function deleteCart($ct_id)
    {
      if(is_array($ct_id)){
        $ct_id = implode(",",$ct_id);
      }

      $sql = "DELETE FROM tb_cart WHERE ct_id in ($ct_id)";
      $query = $this->db->query($sql);
    }

    /*
    메인관련
    */

    public function getMainHotProduct()
    {
      $sql = "SELECT main.class_code,
                    main.course_code,
                    main.url,
                    main.url_target,
                    main.title,
                    course.contents_1,
                    course.course_name,
                    course.course_image
                    FROM tb_main main
              INNER JOIN tb_course course
              ON course.course_code = main.course_code
              WHERE main.main_type = 'HOT' ORDER BY main.sort_order ASC";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getMainRecomProduct()
    {
      $sql = "SELECT main.class_code,
                    main.course_code,
                    main.url,
                    main.url_target,
                    main.title,
                    main.main_category,
                    course.contents_1,
                    course.course_name,
                    course.course_image,
                    course.total_hour,
                    (SELECT count(course_code) FROM tb_course_class WHERE course_code = main.course_code) course_cnt
                    FROM tb_main main
              INNER JOIN tb_course course
              ON course.course_code = main.course_code
              WHERE main.main_type = 'RECOM' ORDER BY main.sort_order ASC";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    public function getMainReviews()
    {
      $sql = "SELECT ba.*,
                    course.course_name,
                    course.course_image
                    FROM tb_board_after ba
              INNER JOIN tb_course course
              ON course.course_code = ba.course_code
              ORDER BY ba.board_reg_datetime DESC LIMIT 2";
      $query = $this->db->query($sql)->result_array();

      return $query;
    }

    /*
    @param int $course_seq
    @return array
    */
    public function deleteCourse($course_seq)
    {
      $sql = "DELETE FROM tb_course WHERE course_seq = '{$course_seq}'";
      $result = $this->db->query($sql);
      return $result;
    }

    /*
    @param int $course_seq
    @return array
    */
    public function deleteCourseContents($contents_seq)
    {
      $sql = "DELETE FROM tb_course_contents WHERE contents_seq = '{$contents_seq}'";
      $result = $this->db->query($sql);
      return $result;
    }
    
    /*
    @param int $course_seq
    @return array
    */
    public function deleteCourseContentsPage($page_seq)
    {
      $sql = "DELETE FROM tb_course_contents_page WHERE page_seq = '{$page_seq}'";
      $result = $this->db->query($sql);
      return $result;
    }    


  }
?>
