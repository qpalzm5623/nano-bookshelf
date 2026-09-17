<?php
    class User_Model extends MY_Model {
        function __construct(){
            parent::__construct();


        }

        public function getLoginData($user_id,$user_password)
        {
            $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}' AND user_type='user' AND user_status <> 'D'";
            
            $result = $this->db->query($sql)->row_array();
            $returnArr = array();
            if(is_array($result)){
                //if($result['user_type'] != 'default'){
                //    $returnArr['result'] = "failed";
                //    $returnArr['msg'] = "sns";
                //    return $returnArr;
                //}
                $org_password = $this->decrypt("password",$result['user_password']);
                
                if($user_password == $org_password){

                    if(!empty($result['group_name'])){
                        $group_name = $result['group_name'];
                        //기관 계약기간 체크
                        $sql = "SELECT * FROM tb_user WHERE group_name = '{$group_name}' AND user_type = 'director'";
                        $row = $this->db->query($sql)->row_array();
                                    
                        
                        if($row['service_end_date']<date("Y-m-d")){
                            $returnArr['result'] = "failed";
                            $returnArr['msg'] = 'school_end';
                            return $returnArr;
                        }
                    }


                    if($result['user_status'] != 'Y'){
                        switch($result['status']){
                            case "R":
                            $returnArr['result'] = "failed";
                            $returnArr['msg'] = "status_r";
                            break;
                            case "L":
                            $returnArr['result'] = "failed";
                            $returnArr['msg'] = "status_l";
                            break;
                            case "D":
                            $returnArr['result'] = "failed";
                            $returnArr['msg'] = "status_d";
                            break;
                        }
                        return $returnArr;
                    }
                    $returnArr['result'] = "success";
                    $returnArr['user_seq']    = $result['user_seq'];
                    $returnArr['group_name'] = $result['group_name'];
                    $returnArr['group_user_seq'] = $result['group_user_seq'];
                }else{
                    $returnArr['result'] = "failed";
                    $returnArr['msg'] = "user_password";
                }

            }else{
                $returnArr['result'] = "failed";
                $returnArr['msg'] = "user_id";
            }

            return $returnArr;
        }

        public function updateSchoolClassMember($user_seq,$school_seq,$school_name,$school_year,$school_class)
        {
            if(!empty($school_seq)){
                $sql = "SELECT school_class_seq FROM tb_school_class WHERE school_seq = '{$school_seq}' AND school_year = '{$school_year}' AND school_class = '{$school_class}'";
                $schoolClassData = $this->db->query($sql)->row_array();
                $school_class_seq = $schoolClassData['school_class_seq'];
                if(!empty($school_class_seq)){
                    $sql = "UPDATE tb_point_hist SET school_seq = '{$school_seq}',school_class_seq = '{$school_class_seq}' WHERE user_seq = '{$user_seq}'";
                    $this->db->query($sql);

                    $sql = "UPDATE tb_point_hist_static SET school_seq = '{$school_seq}',school_class_seq = '{$school_class_seq}' WHERE user_seq = '{$user_seq}'";
                    $this->db->query($sql);
                }
            }else{
                $sql = "UPDATE tb_point_hist SET school_seq = '0',school_class_seq = '0' WHERE user_seq = '{$user_seq}'";
                $this->db->query($sql);

                // [수정] WHERE 절 누락 버그 수정 — 기존 코드는 tb_point_hist_static 전체가 업데이트됨
                $sql = "UPDATE tb_point_hist_static SET school_seq = '0',school_class_seq = '0' WHERE user_seq = '{$user_seq}'";
                $this->db->query($sql);
            }


        }

        public function updateSchoolClass($class_admin_id,$school_year,$school_class)
        {
            $sql = "UPDATE tb_user SET school_year = '{$school_year}',school_class = '{$school_class}' WHERE user_id = '{$class_admin_id}'";
            $this->db->query($sql);

            $sql = "UPDATE tb_school_class SET class_admin_id = '' WHERE class_admin_id = '{$class_admin_id}'";
            $this->db->query($sql);
        }

        public function getDuplicatePhone($phone)
        {
            $sql = "SELECT * FROM tb_user WHERE replace(phone,'-','') = '{$phone}'";
            $result = $this->db->query($sql)->result_array();

            return $result;
        }

        public function updateAppKey($user_id,$app_key)
        {
            $sql = "UPDATE tb_user SET app_key = '{$app_key}' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }

        public function updateProfile($user_seq,$profile_img)
        {
            $sql = "UPDATE tb_user SET profile_img = '{$profile_img}' WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);
        }


        public function getCarbonOauthData($user_seq)
        {
            $sql = "SELECT * FROM tb_oauth WHERE user_seq = '{$user_seq}'";
            $result = $this->db->query($sql)->row_array();
            return $result;
        }

        public function changePush($user_id,$type,$val)
        {
            $sql = "UPDATE tb_user_push SET push_{$type} = '{$val}' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }

        public function changePassword($user_id,$new_password)
        {
            $sql = "UPDATE tb_user SET user_password = '{$new_password}' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }
        
        public function changePasswordSeq($user_seq,$new_password)
        {
            $sql = "UPDATE tb_user SET user_password = '{$new_password}' WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);
        }        

        public function leaveUser($user_id,$data)
        {
            $withdrawal_type = $data['withdrawal_type'];
            $withdrawal_text = $data['withdrawal_text'];
            $withdrawal_date = $data['withdrawal_date'];

            $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}'";
            $userData = $this->db->query($sql)->row_array();
            $user_seq = $userData['user_seq'];

            $sql = "UPDATE tb_user SET school_seq = '',
                            user_id = '',
                            user_password = '',
                            birthday = NULL,
                            gender = '',
                            email = '',
                            location = '',
                            zipcode = '',
                            addr1 = '',
                            addr2 = '',
                            phone = '',
                            phone_cert = '',
                            user_type = '',
                            auto_login = '',
                            sns_key = '',
                            app_key = '',
                            school_name = '',
                            school_year = '',
                            school_class = '',
                            school_status = '',
                            school_status_confirm_id = '',
                            parent_name = '',
                            parent_birthday = NULL,
                            parent_email = '',
                            parent_phone = '',
                            parent_phone_status = '',
                            parent_zipcode = '',
                            parent_addr1 = '',
                            parent_addr2 = '',
                            user_status = 'L',
                            profile_img = '',
                            withdrawal_id = '{$user_id}',
                            withdrawal_type = '{$withdrawal_type}',
                            withdrawal_text = '{$withdrawal_text}',
                            withdrawal_date = '{$withdrawal_date}',
                            update_time = '{$withdrawal_date}'
                            WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "SELECT user_seq FROM tb_school WHERE user_seq = '{$user_seq}'";
            $school_adm = $this->db->query($sql)->row_array();
            if(is_array($school_adm)){
                $sql = "UPDATE tb_school SET user_seq = '' WHERE user_seq = '{$user_seq}'";
                $this->db->query($sql);
            }

            $sql = "DELETE FROM tb_quiz_hist WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            // [수정] tb_qna DELETE가 3번 중복 실행되던 버그 수정 → 1번만 실행
            $sql = "DELETE FROM tb_qna WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_point_hist WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_point_hist_static WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_oauth WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_login_hist WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_feed_report WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_feed_like WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_feed_comment WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_feed WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_edu_board_history WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_carbon_hist WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_alarm_hist WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_adv_comment WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $sql = "DELETE FROM tb_user_push WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);

            $this->db->insert("tb_user_leave_hist",$userData);

        }

        public function insertLogin($data)
        {
            $this->db->insert("tb_login",$data);

            $login_date = date("Y-m-d H:i:s");
            $ip_address = $data['user_ip'];
            $user_id = $data['user_id'];

            $sql = "UPDATE tb_user SET last_login_time = '{$login_date}', login_ip = '{$ip_address}' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);

            $user_seq = $data['user_seq'];
            $user_id = $data['user_id'];
            $user_ip = $data['user_ip'];
            $reg_date = $data['reg_date'];

            $sql = "INSERT INTO tb_login_hist (user_seq,user_id,user_ip,reg_date) VALUES('{$user_seq}','{$user_id}','{$user_ip}','{$reg_date}')";
            $this->db->query($sql);
        }


        public function setAutoLogin($user_id,$auto_login)
        {
            $sql = "UPDATE tb_user SET auto_login = '{$auto_login}' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }

 

        public function getFindId($user_name,$email)
        {
            $sql = "SELECT * FROM tb_user WHERE user_name = '{$user_name}' AND email = '{$email}' limit 1";
            $result = $this->db->query($sql)->row_array();

            return $result;
        }

        public function getFindPw($user_id,$user_name,$email)
        {
            $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}' AND user_name = '{$user_name}' AND email = '{$email}' limit 1";
            $result = $this->db->query($sql)->row_array();
            return $result;
        }

        public function getTotalComment($user_id)
        {
            $sql = "SELECT count(*) cnt from tb_alarm alarm
                            INNER JOIN tb_user users
                            ON users.user_id = alarm.to_id
                            LEFT JOIN tb_alarm_hist hist
                            ON hist.alarm_seq = alarm.alarm_seq
                            WHERE users.reg_date < alarm.reg_date AND alarm.alarm_type = 'comment' and alarm.to_id = '{$user_id}' and hist.user_id is NULL";
            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }

        /*
        @param array "limit","where"
        @return int
        */
        public function getMemberTotalCount($data)
        {
            $where = $data['where'];
            $sql = "SELECT count(*) cnt FROM (SELECT users.*,school.school_name school_name_org FROM tb_user users
                            LEFT JOIN tb_school school
                            ON school.school_seq = users.school_seq
                            WHERE 1=1 {$where}) a";


            $query = $this->db->query($sql)->row_array();
            $result = $query['cnt'];

            return $result;
        }

        public function getMemberTotal($where="")
        {
            $sql = "SELECT count(*) cnt FROM tb_user users WHERE (user_status = 'C' OR user_status = 'R') {$where}";
            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }

        public function getYearMonthMemberTotal($year,$month,$where="")
        {
            if($month=="all"){
                $sql = "SELECT count(*) cnt FROM tb_user users
                                WHERE (user_status = 'C' OR user_status = 'R') AND YEAR(reg_date) = '{$year}' {$where}";
            }else{
                $sql = "SELECT count(*) cnt FROM tb_user users
                                WHERE (user_status = 'C' OR user_status = 'R') AND YEAR(reg_date) = '{$year}' AND MONTH(reg_date) = '{$month}' {$where}";
            }

            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }

        public function getDayMemberInsight($year,$month,$where="")
        {
            $last_day = date("Y-m-d",strtotime($year."-".$month."-01 -1 days"));

            $sql = "SELECT DAY(reg_date) day,count(*) cnt FROM tb_user users WHERE (user_status = 'C' OR user_status = 'R') AND YEAR(reg_date) = '{$year}' AND MONTH(reg_date) = '{$month}' {$where} GROUP BY DATE(reg_date) ORDER BY DATE(reg_date) ASC";
            $day_total = $this->db->query($sql)->result_array();

            $sql = "SELECT count(*) cnt FROM tb_user users WHERE (user_status = 'C' OR user_status = 'R') AND DATE(reg_date) <= '{$last_day}' {$where}";
            $all_total = $this->db->query($sql)->row_array();

            $sql = "SELECT count(*) cnt FROm tb_user users WHERE user_status = 'L'  AND MONTH(withdrawal_date) = '{$month}' {$where}";
            $leave_total = $this->db->query($sql)->row_array();

            $returnArr = array(
                "day_total" =>    $day_total,
                "all_total" =>    $all_total['cnt'],
                "leave_total" =>    $leave_total['cnt']
            );

            return $returnArr;
        }

        public function getSearchLeaveMemberTotal($year,$month,$where="")
        {
            if($month=="all"){
                $sql = "SELECT count(*) cnt FROM tb_user users
                                WHERE (user_status = 'C' OR user_status = 'R')  AND user_status = 'L'  {$where}";
            }else{
                $sql = "SELECT count(*) cnt FROM tb_user users
                                WHERE (user_status = 'C' OR user_status = 'R')  AND user_status = 'L'   {$where}";
            }

            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }
  

        /*
        @param array "limit","where"
        @return array
        */
        public function getMemberList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $sql = "SELECT users.*,school.school_name school_name_org FROM tb_user users
                            LEFT JOIN tb_school school
                            ON school.school_seq = users.school_seq
                            WHERE 1=1 $where
                            ORDER BY users.user_seq DESC $limit";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }

        public function getMember($user_seq)
        {
            $sql = "SELECT user.*,school.contract_type,school.school_name school_name_org FROM tb_user user
                            LEFT JOIN tb_school school
                            ON school.school_seq = user.school_seq
                            WHERE user.user_seq = '{$user_seq}'";
            $result = $this->db->query($sql)->row_array();

            return $result;
        }

        public function updateMember($data,$user_seq)
        {
            $this->db->where("user_seq",$user_seq);
            $this->db->update("tb_user",$data);
            $result = $this->db->affected_rows();

            return $result;
        }

        public function deleteUser($user_seq)
        {
            $sql = "UPDATE tb_user SET user_status = 'D' WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);
        }
        
        public function deleteUserClear($user_seq)
        {
            $sql = "DELETE FROM tb_user WHERE user_seq = '{$user_seq}'";
            $this->db->query($sql);
        }

        /*
        @param array "limit","where"
        @return array
        */
        public function getLeaveUserList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $sql = "SELECT * FROM tb_user_leave WHERE 1=1 $where
                            ORDER BY seq DESC $limit";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }

        /*
        @param array $userInfo 아이디,아이피,세션키
        @return array
        */
        public function getDuplicateLoginCheck2($userInfo)
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
        @param array $data 아이디,비밀번호
        @return array
        */
        public function getLoginMember($data)
        {
            $user_id = $data['user_id'];
            $user_password = $data['user_password'];

            $returnArr = array();

            $password_key = $this->config->config['password_key'];

            $sql = "SELECT user_id, AES_DECRYPT(UNHEX(user_password), '{$password_key}') user_password,user_level FROM tb_user
            WHERE user_id = '{$user_id}' AND user_level = '10'";

            $query = $this->db->query($sql);

            if( $query->num_rows() > 0 ){
                $user_row = $query->row();

                if($user_row->user_password == $user_password){
                    $returnArr['status'] = "success";
                    $returnArr['user_level'] = $user_row->user_level;
                }else{
                    $returnArr['status'] = "failed";
                    $returnArr['err_msg'] = "password";
                }
            }else{
                $returnArr['status'] = "failed";
                $returnArr['err_msg'] = "id";
            }

            if($this->session->userdata('user_id') == $user_id){
                $returnArr['status'] = "failed";
                $returnArr['err_msg'] = "logined";
            }

            return $returnArr;
        }

        /*
        로그인 체크
        @param string user_id
        @return array
        */
        public function getLoginCheck($user_id)
        {
            $sql = "SELECT * FROM tb_login WHERE user_id = '{$user_id}'";
            $result = $this->db->query($sql)->row_array();

            return $result;
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

        public function getAutoLoginCheck($app_key)
        {
            $sql = "SELECT * FROM tb_user WHERE app_key = '{$app_key}' AND auto_login = 'Y'";
            $result = $this->db->query($sql)->row_array();

            return $result;
        }

        public function deleteAutoLogin($user_id)
        {
            $sql = "UPDATE tb_user SET auto_login = 'N' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }

        public function addAutoLogin($user_id)
        {
            $sql = "UPDATE tb_user SET auto_login = 'Y' WHERE user_id = '{$user_id}'";
            $this->db->query($sql);
        }

        public function getDuplicateLoginCheck($user_id,$login_key)
        {
            $sql = "SELECT * FROM tb_login WHERE user_id = '{$user_id}' AND login_key = '{$login_key}'";
            $query = $this->db->query($sql)->row_array();
            return $query;
        }

        public function getSnsMember($sns_type,$sns_key)
        {
            $sql = "SELECT * FROM tb_user WHERE user_type = '{$sns_type}' AND sns_key = '{$sns_key}'";
            $result = $this->db->query($sql)->row_array();

            if(is_array($result)){
                if(!empty($result['school_seq'])){
                    //기관 계약기간 체크
                    $school_chk = $this->school_model->getSchoolDay($result['school_seq']);
                    if($school_chk['contract_end_date']<date("Y-m-d")){
                        $returnArr['result'] = "failed";
                        $returnArr['msg'] = 'school_end';
                        $this->school_model->updateSchoolBookYn($result['school_seq']);
                        return $returnArr;
                    }
                }


                if($result['user_status'] != 'C'){
                    switch($result['status']){
                        case "R":
                        $returnArr['result'] = "failed";
                        $returnArr['msg'] = "status_r";
                        break;
                        case "L":
                        $returnArr['result'] = "failed";
                        $returnArr['msg'] = "status_l";
                        break;
                        case "D":
                        $returnArr['result'] = "failed";
                        $returnArr['msg'] = "status_d";
                        break;
                    }
                    return $returnArr;
                }
                $returnArr['result'] = "success";
                $returnArr['user_seq']    = $result['user_seq'];
                $returnArr['user_id'] = $result['user_id'];
                $returnArr['school_seq'] = empty($result['school_seq']) ? 0 : $result['school_seq'];
            }else{
                $returnArr['result'] = "failed";
                $returnArr['msg'] = "id";
            }

            return $returnArr;
        }

        public function getDuplicateId($user_id)
        {
            $sql = "SELECT count(*) cnt FROM tb_user WHERE user_id = '{$user_id}'";
            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }

        public function insertMember($user_data)
        {
            $this->db->insert("tb_user",$user_data);
            $result = $this->db->affected_rows();

            $user_id = $user_data['user_id'];

            $sql = "SELECT user_seq FROM tb_user WHERE user_id = '{$user_id}'";
            $rows = $this->db->query($sql)->row_array();

            $user_seq = $rows['user_seq'];

            $sql = "INSERT INTO tb_user_push (user_seq,user_id) VALUES ('{$user_seq}','{$user_id}')";
            $this->db->query($sql);


            return $result;
        } 

        public function insertAlarm($data)
        {
            $this->db->insert("tb_alarm",$data);
        }

        public function deleteAlarm($data)
        {
            $send_id = $data['send_id'];
            $alarm_target = $data['alarm_target'];
            $alarm_type = $data['alarm_type'];
            $school_seq = $data['school_seq'];
            $school_class_seq = $data['school_class_seq'];
            $feed_seq = $data['feed_seq'];
            $quiz_seq = $data['quiz_seq'];
            $to_id = $data['to_id'];
            $title = $data['title'];
            $link = $data['link'];

            $sql = "DELETE FROM tb_alarm WHERE
                            send_id = '{$send_id}'
                            AND alarm_target = '{$alarm_target}'
                            AND alarm_type = '{$alarm_type}'
                            AND school_seq = '{$school_seq}'
                            AND school_class_seq = '{$school_class_seq}'
                            AND feed_seq = '{$feed_seq}'
                            AND quiz_seq = '{$quiz_seq}'
                            AND to_id = '{$to_id}'";
            $this->db->query($sql);

        }

        public function getAlarm($user_id)
        {
            $sql = "SELECT a.* FROM (SELECT alarm.*,
                     users.profile_img,
                     users2.profile_img send_profile,
                     users.user_name,
                     feed.feed_photo,
                     alarm_hist.user_id
                         FROM tb_alarm alarm
         LEFT JOIN tb_alarm_hist alarm_hist
         ON alarm_hist.alarm_seq = alarm.alarm_seq AND (alarm_hist.user_id = alarm.to_id OR alarm.alarm_target = 'all' OR alarm.alarm_target = 'school_class')
         INNER JOIN tb_user users
         ON users.user_id = alarm.to_id
         LEFT JOIN tb_user users2
         ON users2.user_id = alarm.send_id
         LEFT JOIN tb_feed feed
         ON feed.feed_seq = alarm.feed_seq
         LEFT JOIN tb_quiz quiz
         ON quiz.quiz_seq = alarm.quiz_seq
         LEFT JOIN tb_school school
         ON school.school_seq = alarm.school_seq
         LEFT JOIN tb_school_class school_class
         ON school_class.school_seq = users2.school_seq AND school_class.school_year = users2.school_year AND school_class.school_class = users2.school_class
         WHERE users2.user_id <> '{$user_id}' AND (alarm.to_id = '{$user_id}' OR alarm.alarm_target = 'all' OR (alarm.alarm_target='school_class' AND alarm.school_class_seq=school_class.school_class_seq)) AND alarm_hist.user_id is NULL GROUP BY alarm.alarm_seq ORDER BY alarm.reg_date DESC) a
         WHERE (SELECT reg_date FROM tb_user WHERE user_id = '{$user_id}') < a.reg_date";
            $result = $this->db->query($sql)->result_array();

            return $result;
        }

        public function readAlarm($data)
        {
            $this->db->insert("tb_alarm_hist",$data);
        }

        public function readAllAlarm($user_id,$alarmData)
        {
            for($i=0; $i<count($alarmData); $i++){
                $alarm_seq = $alarmData[$i]['alarm_seq'];
                $sql = "INSERT INTO tb_alarm_hist (user_id,alarm_seq,read_date) VALUES ('{$user_id}','{$alarm_seq}',NOW())";
                $this->db->query($sql);
            }
        }

        public function getNoticeHistory($user_id)
        {
            $sql = "SELECT notice_seq FROM tb_notice WHERE notice_read_type = 0 AND notice_display_yn = 'Y'";
            $noticeData = $this->db->query($sql)->result_array();

            $read_cnt = 0;
            for($i=0; $i<count($noticeData); $i++){
                $notice_seq = $noticeData[$i]['notice_seq'];
                $sql = "SELECT count(*) cnt FROM tb_notice_history WHERE notice_seq = '{$notice_seq}' AND user_id = '{$user_id}'";
                $result = $this->db->query($sql)->row_array();
                $read_cnt += $result['cnt'];
            }

            $read_yn = "N";
            if(count($noticeData)!=$read_cnt){
                $read_yn = "N";
            }else{
                $read_yn = "Y";
            }

            return $read_yn;
        }

        public function getUserTotalPoint($user_seq)
        {
            $sql = "SELECT SUM(point) num FROM tb_point_hist WHERE user_seq = '{$user_seq}'";
            $result = $this->db->query($sql)->row_array();

            return $result['num'];
        }

        public function getUserPoint($user_seq,$type)
        {
            $sql = "SELECT SUM(point) num FROM tb_point_hist WHERE user_seq = '{$user_seq}' AND carbon_type = '{$type}'";
            $result = $this->db->query($sql)->row_array();

            return $result['num'];
        }

        public function getPushAllUser()
        {
            $sql = "SELECT users.* FROM tb_user users
                            INNER JOIN tb_user_push push
                            ON push.user_seq = users.user_seq
                            WHERE push.push_quiz = 'Y' AND (users.app_key is NOT NULL AND users.app_key <> '') AND users.user_status = 'C'";
            $result = $this->db->query($sql)->result_array();

            return $result;
        }

        public function getPushUser($user_id,$alarm_type)
        {
            //comment,like,feed,quiz,carbon,qna
            if($alarm_type=="delete"){
                $sql = "SELECT users.* FROM tb_user users
                                INNER JOIN tb_user_push push
                                ON push.user_seq = users.user_seq
                                WHERE (users.app_key is NOT NULL AND users.app_key <> '') AND users.user_status = 'C' AND users.user_id = '{$user_id}'";
            }else{
                $sql = "SELECT users.* FROM tb_user users
                                INNER JOIN tb_user_push push
                                ON push.user_seq = users.user_seq
                                WHERE push.push_{$alarm_type} = 'Y' AND (users.app_key is NOT NULL AND users.app_key <> '') AND users.user_status = 'C' AND users.user_id = '{$user_id}'";
            }

            $result = $this->db->query($sql)->row_array();

            return $result;
        }

        public function getPushSchoolClassUser($user_id,$school_seq,$school_class_seq)
        {
            $sql = "SELECT users.* FROM tb_user users
                            LEFT JOIN tb_school_class class
                            ON class.school_seq = users.school_seq AND class.school_year = users.school_year AND class.school_class = users.school_class
                            INNER JOIN tb_user_push push
                            ON push.user_seq = users.user_seq
                            WHERE push.push_feed = 'Y'
                            AND (users.app_key is NOT NULL AND users.app_key <> '')
                            AND users.user_status = 'C'
                            AND users.user_id <> '{$user_id}'
                            AND class.school_class_seq = '{$school_class_seq}'";
            $result = $this->db->query($sql)->result_array();

            return $result;

        }
        
        
        
        public function getDuplicateUserId($user_id)
        {
            $sql = "SELECT * FROM tb_user WHERE user_id = '{$user_id}' limit 1";
            $result = $this->db->query($sql)->row_array();

            return $result;
        }
                
        public function getUserData($user_id)
        {
            $sql = "SELECT *
                             FROM tb_user 
                            WHERE user_id = '{$user_id}'";

            $result = $this->db->query($sql)->row_array();

            return $result;
        }        
        
        public function getTeacherData($data)
        {
            $group_name=$data['group_name'];
            $class_name=$data['class_name'];
            $sql = "SELECT *
                             FROM tb_user 
                            WHERE group_name = '{$group_name}' and user_type='teacher' and class_name='$class_name'";

            $result = $this->db->query($sql)->row_array();

            return $result;
        }                
        
        public function getDirectorData($data)
        {
            $where = $data['where'];
            $sql = "SELECT *
                             FROM tb_user 
                            WHERE user_type = 'director' {$where}";

            $result = $this->db->query($sql)->row_array();

            return $result;
        }                
        
        public function getUserSeq($user_seq)
        {
            $sql = "SELECT *
                             FROM tb_user 
                            WHERE user_seq = '{$user_seq}'";

            $result = $this->db->query($sql)->row_array();

            return $result;
        }                
        
        
        public function getUserTotalCount($data)
        {
            $where = $data['where'];
            $sql = "SELECT count(*) cnt FROM tb_user a
                            WHERE 1=1 {$where}";


            $query = $this->db->query($sql)->row_array();
            $result = $query['cnt'];

            return $result;
        }
        
        public function getUserPointTotalCount($data)
        {
            $where = $data['where'];
            $sql = "SELECT count(*) cnt from (SELECT a.user_id FROM tb_user a 
                            left join tb_point_history b
                                   on b.user_id = a.user_id
                                   
                            WHERE 1=1 {$where}
                            GROUP by a.user_id) M
                            ";
            $query = $this->db->query($sql)->row_array();
            $result = $query['cnt'];

            return $result;
        }        

        public function getUserTotal($where="")
        {
            $sql = "SELECT count(*) cnt FROM tb_user users WHERE (user_status = 'C' OR user_status = 'R') {$where}";
            $result = $this->db->query($sql)->row_array();

            return $result['cnt'];
        }
                
        public function getUserPointList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $order = $data['order']??" ORDER BY user_seq DESC ";
            
            $sql = "SELECT a.*, SUM(b.point) point 
                       FROM tb_user a 
                            left join tb_point_history b
                                   on b.user_id = a.user_id
                            WHERE 1=1 $where
                            GROUP BY a.user_id
                            {$order} $limit";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }
        
        public function getAllUserPointList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $order = $data['order']??" ORDER BY user_seq DESC ";
            
            $sql = "
                    SELECT a.user_id,  IFNULL(SUM(b.point), 0) AS total_points
                     FROM tb_user a 
                 left join tb_point_history b
                                                   on b.user_id = a.user_id
                                            WHERE 1=1 $where
                                            GROUP BY a.user_id
                                            ORDER BY total_points DESC 
                                            
            ";
            
            $query = $this->db->query($sql)->result_array();

            return $query;
        }        
        
        public function getUserList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $order = $data['order']??" ORDER BY user_seq DESC ";
            
            $sql = "SELECT user_seq, 
                           user_id, 
                           user_password, 
                           user_type, 
                           user_status, 
                           grade, 
                           point, 
                           gender, 
                           group_name, 
                           group_user_seq, 
                           class_name, 
                           class_seq, 
                           user_name, 
                           cell_no, 
                           email, 
                           address, 
                           address_detail, 
                           parent_name, 
                           parent_cell, 
                           pricing_plan, 
                           pricing_price, 
                           focus_category, 
                           business_no, 
                           start_date, 
                           end_date, 
                           service_start_date, 
                           service_end_date,                            
                           stop_start_date, 
                           stop_end_date, 
                           stop_reason, 
                           memo, 
                           use_count, 
                           sms_yn, 
                           email_yn, 
                           marketing_yn, 
                           privacy_term, 
                           logo, 
                           reg_date, 
                           mod_date, 
                           withdrawal_date
                       FROM tb_user a
                            WHERE 1=1 $where
                            {$order} $limit";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }        
        
        
        public function getUserGradeList()
        {
            $sql = "SELECT DISTINCT(group_name) group_name
                       FROM tb_user 
                   GROUP BY group_name";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }
        
        public function getUserGroupList()
        {
            $sql = "SELECT DISTINCT(group_name) group_name
                       FROM tb_user 
                   GROUP BY group_name";
            $query = $this->db->query($sql)->result_array();

            return $query;
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
        
        public function updateClassName($new_class_name,$group_name, $class_name)
        {
            $sql = "update tb_user set class_name='{$new_class_name}' where group_name='{$group_name}' and class_name='{$class_name}' and user_type='user'";
            $query = $this->db->query($sql);
            $result = $this->db->affected_rows();

          return $result;            
        }        
        
        public function updateUserStatus($user_seq,$user_status)
        {
            $sql = "update tb_user set user_status='{$user_status}' where user_seq='{$user_seq}'";
            $query = $this->db->query($sql);
            $result = $this->db->affected_rows();

          return $result;            
        }
        
        public function updateUserCellNo($user_seq,$cell_no)
        {
            $sql = "update tb_user set cell_no='{$cell_no}' where user_seq='{$user_seq}'";
            $query = $this->db->query($sql);
            $result = $this->db->affected_rows();

          return $result;            
        }        
        
        public function getUserClassList($data)
        {
            $where = $data['where'];
            $sql = "SELECT DISTINCT(class_name) class_name
                       FROM tb_user a
                   WHERE 1=1 {$where}
                   GROUP BY class_name";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }        
        
        public function updatePoint($user_id,$point)
        {
            $sql = "UPDATE tb_user SET point = point+'{$point}' WHERE user_id= '{$user_id}'";
            $this->db->query($sql);
        }                
        
        public function updateGrade()
        {
            $sql = "UPDATE tb_user SET grade = grade+1 WHERE user_type='user'";
            return $this->db->query($sql);
        }             
}

    
?>
