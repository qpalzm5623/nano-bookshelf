<?php
class PointHistory_Model extends CI_Model {
    function __construct(){
        parent::__construct();
    }
    
    //get boards total
    public function getPointHistoryTotalCount($data)
    {
        $query = "SELECT count(*) cnt FROM tb_point_history WHERE user_id = '{$data['user_id']}'";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }
    
    //get boards
    public function getPointHistoryList($data)
    {
        $limit = $data["limit"] == "" ? null : $data["limit"];
        $where = $data["where"] == "" ? null : $data["where"];
        
        $query = "SELECT * FROM tb_point_history a WHERE user_id = '{$data['user_id']}' $where ORDER BY ph_seq ASC {$limit}";
        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }
    
    //get boards
    public function getPointHistory($qh_seq)
    {
        
        $query = "SELECT * FROM tb_point_history a  WHERE qh_seq = '{$qh_seq}' ";
        
        $result = $this->db->query($query)->row_array();
        
        return $result;
    }    
    
    //get boards
    public function deletePointHistory($qh_seq)
    {
        
        $query = "DELETE FROM tb_point_history   WHERE qh_seq = '{$qh_seq}' ";
        
        $result = $this->db->query($query);
        
        return $result;
    }        
    
    //get boards
    public function getPointHistoryUserList($data)
    {
        $where = $data["where"] == "" ? null : $data["where"];
        
        $query = "SELECT  a.user_id,	
                          SUM(a.point) point,
                          b.user_name, 
                          b.group_name,
                          b.class_name
                 FROM tb_point_history a
                 left join tb_user b 
                        on a.user_id = b.user_id
                WHERE 1=1 {$where}
                GROUP BY a.user_id 
                ORDER BY point desc
        ";
        //echo $query;
        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }    
    
    /*
    @param array $data
    @return int
    */
    public function insertPointHistory($data)
    {
        $this->db->insert("tb_point_history",$data);
        $return = $this->db->insert_id();
        
        return $return;
    }    

}
?>
