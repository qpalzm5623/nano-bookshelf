<?php
  class Category_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    public function getDepth1()
    {
      $query = "SELECT * FROM categorys WHERE LENGTH(category_code) = 3 and view_yn='Y' ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getAllCategorys()
    {
      $query = "SELECT * FROM categorys WHERE view_yn='Y' ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getDepth2($depth1)
    {
      $query = "SELECT * FROM categorys WHERE LENGTH(category_code) = 6 AND LEFT(category_code,3) = '{$depth1}' and view_yn='Y' ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getDepth3($depth2)
    {
      $query = "SELECT * FROM categorys WHERE LENGTH(category_code) = 9 AND LEFT(category_code,6) = '{$depth2}' and view_yn='Y' ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getFirstCategoryList()
    {
      $query = "SELECT * FROM categorys WHERE LENGTH(category_code) = 3 ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getDepthCategoryList($cate)
    {
      $cateLen = 6;
      if( strlen($cate) == 3 ) $cateLen = 6;
      if( strlen($cate) == 6 ) $cateLen = 9;
      $orgLen = strlen($cate);
      $query = "SELECT * FROM categorys WHERE LENGTH(category_code) = {$cateLen} AND LEFT(category_code,{$orgLen}) = '{$cate}' ORDER BY view_num ASC";
      $result = $this->db->query($query)->result_array();

      return $result;
    }

    public function getParentCate($cate)
    {
      $query = "SELECT * FROM categorys WHERE category_code = '{$cate}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }

    public function chkCategoryCode($cate)
    {
      $query = "SELECT * FROM categorys WHERE category_code = '{$cate}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }

    public function insertCategory($data)
    {
      $this->db->insert("categorys",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function getParentDepths($cate)
    {
      $cate1 = array();
      $cate2 = array();
      if( strlen($cate) == 3 ){
        $query = "SELECT * FROM categorys WHERE category_code = '{$cate}'";
        $cate1 = $this->db->query($query)->row_array();
      }

      if( strlen($cate) == 6 ){
        $cate1Num = substr($cate,0,3);
        $query = "SELECT * FROM categorys WHERE category_code = '{$cate1Num}'";
        $cate1 = $this->db->query($query)->row_array();

        $query = "SELECT * FROM categorys WHERE category_code = '{$cate}'";
        $cate2 = $this->db->query($query)->row_array();
      }

      $result = array(
        "cate1" =>  $cate1,
        "cate2" =>  $cate2
      );

      return $result;
    }

    public function getCategory($seq)
    {
      $query = "SELECT * FROM categorys WHERE seq = '{$seq}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }

    public function updateCategory($data,$seq)
    {
      $this->db->where('seq',$seq);
      $this->db->update("categorys",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

    public function deleteCategory($seq)
    {
      $query = "DELETE FROM categorys WHERE seq = '{$seq}'";
      $this->db->query($query);
      $result = $this->db->affected_rows();

      return $result;
    }

    //category
    public function updateCategoryViewNum($data,$seq)
    {
      $this->db->where('seq',$seq);
      $this->db->update("categorys",$data);
      $result = $this->db->affected_rows();

      return $result;
    }

  }
?>
