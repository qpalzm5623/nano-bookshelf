<?php
class Keyword_Model extends CI_Model {
    function __construct(){
        parent::__construct();
    }
    
    //get boards total
    public function getKeywordTotalCount($data)
    {
        $query = "SELECT count(*) cnt FROM tb_user_keyword WHERE user_id = '{$data['user_id']}'";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }
    
    //get boards
    public function getKeywordList($data)
    {
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT * FROM tb_user_keyword WHERE user_id = '{$data['user_id']}' ORDER BY uk_seq DESC {$limit}";
        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }
    
    //get boards
    public function getKeyword($data)
    {
        $limit = $data["limit"] == "" ? null : $data["limit"];
        
        $query = "SELECT * FROM tb_user_keyword WHERE user_id = '{$data['user_id']}' and keyword = '{$data['keyword']}'";
        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }    
    
    /*
    @param array $data
    @return int
    */
    public function insertKeyword($data)
    {
        $this->db->insert("tb_user_keyword",$data);
        $return = $this->db->insert_id();
        
        return $return;
    }    
    
    public function deleteKeyword($data)
    {
        $keyword= $data['keyword'];
        $user_id= $data['user_id'];
        $sql = "DELETE FROM tb_user_keyword WHERE user_id = '{$user_id}' and keyword = '{$keyword}' ";
        $this->db->query($sql);
    }        

}
?>
