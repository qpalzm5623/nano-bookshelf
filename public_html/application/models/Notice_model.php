<?php
  class Notice_Model extends CI_Model {
    function __construct(){
      parent::__construct();
    }

    //get news
    public function getNotice($seq)
    {
      $query = "SELECT * FROM tb_board_notice WHERE board_seq = '{$seq}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }

    //get boards total
    public function getNoticeTotalCount($data)
    {
      $query = "SELECT count(*) cnt FROM tb_board_notice WHERE board_view_yn = 'Y' AND board_display_yn = 'Y'";
      $rows = $this->db->query($query)->row_array();

      return $rows['cnt'];
    }

    //get boards
    public function getNoticeList($data)
    {
      $limit = $data["limit"] == "" ? null : $data["limit"];

      $query = "SELECT * FROM tb_board_notice WHERE board_view_yn = 'Y' AND board_display_yn = 'Y' ORDER BY board_seq DESC {$limit}";

      $result = $this->db->query($query)->result_array();

      return $result;
    }

    //add count view
    public function addCountView($seq)
    {
      $query = "SELECT board_read_cnt FROM tb_board_notice WHERE board_seq = '{$seq}'";
      $row = $this->db->query($query)->row_array();

      $num = (int)$row['board_read_cnt'];
      $num += 1;

      $query = "UPDATE tb_board_notice SET board_read_cnt = '{$num}' WHERE board_seq = '{$seq}'";
      $result = $this->db->query($query);
      $returnData = $this->db->affected_rows();

      return $returnData;
    }

    //set session view count
    public function setViewCount($board,$seq)
    {
      $table = "tb_board_".$board;
      $sql = "SELECT board_read_cnt FROM {$table} WHERE board_seq = '{$seq}'";
      $read_cnt = $this->db->query($sql)->row_array();
      $read_cnt = $read_cnt['board_read_cnt']+1;

      $sql = "UPDATE {$table} SET board_read_cnt = '{$read_cnt}' WHERE board_seq = '{$seq}'";
      $this->db->query($sql);
    }

    public function getFileData($board_seq)
    {
      $sql = "SELECT * FROM tb_board_file WHERE file_board_seq = '{$board_seq}'";
      $result = $this->db->query($sql)->result_array();

      return $result;
    }

    //file download
    public function getFile($file_seq)
    {
      $query = "SELECT * FROM tb_board_file WHERE file_board_seq = '{$file_seq}'";
      $result = $this->db->query($query)->row_array();

      return $result;
    }



  }
?>
