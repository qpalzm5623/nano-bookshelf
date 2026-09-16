<?php
/**
 * Payment_model.php
 * 결제 내역 관련 DB 처리 모델
 * - 결제 내역 CRUD
 * - 학원별 최신 결제(구독) 정보 조회
 * - 만료 임박 결제 조회 (만료 7일, 3일 이내)
 */
class Payment_model extends CI_Model
{
    function __construct()
    {
        parent::__construct();
    }

    // ─────────────────────────────────────
    // [조회] 결제 내역 전체 건수 (슈퍼어드민용)
    // ─────────────────────────────────────
    public function getPaymentTotalCount($data)
    {
        $where = isset($data['where']) && $data['where'] !== '' ? $data['where'] : '';
        $query = "SELECT COUNT(*) cnt FROM tb_payment WHERE 1=1 {$where}";
        $rows  = $this->db->query($query)->row_array();
        return (int)$rows['cnt'];
    }

    // ─────────────────────────────────────
    // [조회] 결제 내역 목록 (슈퍼어드민용)
    // ─────────────────────────────────────
    public function getPaymentList($data)
    {
        $where = isset($data['where']) && $data['where'] !== '' ? $data['where'] : '';
        $sort  = isset($data['sort'])  && $data['sort']  !== '' ? $data['sort']  : 'ORDER BY reg_date DESC';
        $limit = isset($data['limit']) && $data['limit'] !== '' ? $data['limit'] : '';

        $query = "
            SELECT p.*,
                   u.cell_no,
                   u.user_name
              FROM tb_payment p
         LEFT JOIN tb_user u ON p.user_seq = u.user_seq
             WHERE 1=1 {$where}
            {$sort}
            {$limit}
        ";
        return $this->db->query($query)->result_array();
    }

    // ─────────────────────────────────────
    // [조회] 특정 결제 내역 상세 1건
    // ─────────────────────────────────────
    public function getPaymentDetail($payment_seq)
    {
        $query = "
            SELECT p.*,
                   u.cell_no,
                   u.user_name,
                   u.user_email
              FROM tb_payment p
         LEFT JOIN tb_user u ON p.user_seq = u.user_seq
             WHERE p.payment_seq = '{$payment_seq}'
             LIMIT 1
        ";
        return $this->db->query($query)->row_array();
    }

    // ─────────────────────────────────────
    // [조회] 특정 학원의 결제 내역 목록 (director 본인용)
    // ─────────────────────────────────────
    public function getPaymentListByUser($user_seq, $limit = '')
    {
        $query = "
            SELECT *
              FROM tb_payment
             WHERE user_seq = '{$user_seq}'
          ORDER BY reg_date DESC
            {$limit}
        ";
        return $this->db->query($query)->result_array();
    }

    // ─────────────────────────────────────
    // [조회] 특정 학원의 현재 유효한 구독 1건 (가장 최근 paid 중 만료일 기준)
    // ─────────────────────────────────────
    public function getCurrentSubscription($user_seq)
    {
        $query = "
            SELECT *
              FROM tb_payment
             WHERE user_seq = '{$user_seq}'
               AND payment_status = 'paid'
               AND end_date >= CURDATE()
          ORDER BY end_date DESC
             LIMIT 1
        ";
        return $this->db->query($query)->row_array();
    }

    // ─────────────────────────────────────
    // [조회] 만료 임박 구독 목록 (D-7, D-3 알림용)
    // $days: 만료 기준 일수 (7 또는 3)
    // ─────────────────────────────────────
    public function getExpiringSubscriptions($days)
    {
        $query = "
            SELECT p.*,
                   u.cell_no,
                   u.user_name
              FROM tb_payment p
         LEFT JOIN tb_user u ON p.user_seq = u.user_seq
             WHERE p.payment_status = 'paid'
               AND p.end_date = DATE_ADD(CURDATE(), INTERVAL {$days} DAY)
        ";
        return $this->db->query($query)->result_array();
    }

    // ─────────────────────────────────────
    // [등록] 결제 신청 등록
    // ─────────────────────────────────────
    public function insertPayment($data)
    {
        $this->db->insert('tb_payment', $data);
        return $this->db->insert_id();
    }

    // ─────────────────────────────────────
    // [수정] 결제 상태/정보 업데이트 (슈퍼어드민 수동 처리용)
    // ─────────────────────────────────────
    public function updatePayment($payment_seq, $data)
    {
        $this->db->where('payment_seq', $payment_seq);
        $this->db->update('tb_payment', $data);
        return $this->db->affected_rows();
    }

    // ─────────────────────────────────────
    // [조회] 학원의 결제 내역 총 건수 (director 본인용)
    // ─────────────────────────────────────
    public function getPaymentCountByUser($user_seq)
    {
        $query = "SELECT COUNT(*) cnt FROM tb_payment WHERE user_seq = '{$user_seq}'";
        $rows  = $this->db->query($query)->row_array();
        return (int)$rows['cnt'];
    }
}
?>
