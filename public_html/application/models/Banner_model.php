<?php
  class Banner_model extends MY_Model {
    function __construct(){
      parent::__construct();
    }

    //company total count
    public function getBannerTotalCount($data)
    {
      $where = $data['where'];
      $query = "SELECT count(*) cnt FROM tb_banner WHERE 1=1 {$where}";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //company list
    public function getBannerList($data)
    {
      $where = $data['where'];
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_banner WHERE 1=1 {$where} ORDER BY banner_seq DESC {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //company view
    public function getBanner($banner_seq)
    {
      $sql = "SELECT * FROM tb_banner WHERE banner_seq = '{$banner_seq}'";
      $query = $this->db->query($sql)->row_array();

      return $query;
    }
    
    public function getBannerUser($data)
    {
        $where = $data['where'];
        $sql = "SELECT * FROM tb_banner WHERE 1=1 {$where}";
        $query = $this->db->query($sql)->row_array();
        
        return $query;
    }    

    //정보 입력
    public function insertBanner($data)
    {
      $this->db->insert("tb_banner",$data);
      $result = $this->db->insert_id();

      return $result;
    }

    //정보 수정
    public function updateBanner($data,$seq)
    {
      $this->db->where("banner_seq",$seq);
      $this->db->update("tb_banner",$data);
      $result = $this->db->affected_rows();

      return $result;
    } 
    
    public function deleteBanner($seq)
    {
      $sql = "DELETE FROM tb_banner WHERE banner_seq = '{$seq}'";
      $this->db->query($sql);
    }    
  }

?>
