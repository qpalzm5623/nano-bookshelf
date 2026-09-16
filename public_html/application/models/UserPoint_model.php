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
        
        $query = "SELECT * FROM tb_point_history WHERE user_id = '{$data['user_id']}' ORDER BY ph_seq DESC {$limit}";
        
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
