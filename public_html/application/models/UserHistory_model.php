<?php
    class UserHistory_Model extends MY_Model {
        function __construct(){
            parent::__construct();


        }
 
        
        public function getUserHistoryTotalCount($data)
        {
            $where = $data['where'];
            $sql = "SELECT count(*) cnt FROM tb_user_history a
                            WHERE 1=1 {$where}";


            $query = $this->db->query($sql)->row_array();
            $result = $query['cnt'];

            return $result;
        }
       
        public function getUserHistoryList($data)
        {
            $where = $data['where'];
            $limit = $data['limit'];
            $order = $data['order']??" ORDER BY reg_date DESC ";
            
            $sql = "SELECT user_id, 
            							 user_type, 
            							 user_name, 
            							 reg_date, 
            							 login_ip
                       FROM tb_user_history a
                            WHERE 1=1 $where
                            {$order} $limit";
            $query = $this->db->query($sql)->result_array();

            return $query;
        }        
         
                
        public function insertUserHistory($data)
        {
          $this->db->insert("tb_user_history",$data);
          $result = $this->db->affected_rows();

          return $result;
        }   
}

    
?>
