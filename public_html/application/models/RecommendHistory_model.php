<?php
class RecommendHistory_Model extends CI_Model {
    function __construct(){
        parent::__construct();
    }
    
    //get boards total
    public function getRecommendHistoryTotalCount($data)
    {
        $query = "SELECT count(*) cnt FROM tb_recommend_history WHERE user_id = '{$data['user_id']}'";
        $rows = $this->db->query($query)->row_array();
        
        return $rows['cnt'];
    }
    
    //get boards
    public function getRecommendHistoryList($data)
    {
        $limit = $data["limit"] == "" ? null : $data["limit"];
        $where = $data["where"] ;
        
        //$query = "SELECT * FROM tb_Recommend_history WHERE user_id = '{$data['user_id']}' ORDER BY fh_seq DESC {$limit}";
        $query = "SELECT a.*, c.quiz_seq, d.fh_seq FROM tb_book a
                inner join tb_quiz c 
                       on a.book_no=c.book_no
                inner join tb_recommend_history b
                        on a.book_no = b.book_no and c.quiz_seq = b.quiz_seq
                left join tb_Recommend_history d
                       on a.book_no=d.book_no and c.quiz_seq=d.quiz_seq and d.user_id='{$data['user_id']}'
                 WHERE 1=1 {$where} ORDER BY a.book_no DESC {$limit}";        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }
    
    public function getRecommendHistory($data)
    {
        
        $query = "SELECT * FROM tb_recommend_history WHERE user_id = '{$data['user_id']}' and book_no='{$data['book_no']}' and quiz_seq='{$data['quiz_seq']}'";
        
        $result = $this->db->query($query)->result_array();
        
        return $result;
    }    
    
    /*
    @param array $data
    @return int
    */
    public function insertRecommendHistory($data)
    {
        $this->db->insert("tb_recommend_history",$data);
        $return = $this->db->insert_id();
        
        return $return;
    }    


    public function deleteRecommendHistory($data)
    {
        $sql = "DELETE FROM tb_recommend_history WHERE  user_id = '{$data['user_id']}' and book_no='{$data['book_no']}' and quiz_seq='{$data['quiz_seq']}'";
        $return = $this->db->query($sql);
        
        return $return;
    }        
    


}
?>
