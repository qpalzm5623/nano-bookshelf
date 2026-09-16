<?php
/**
 * 결제 테이블 생성 마이그레이션 컨트롤러
 * URL: /admin/migrate/run_payment
 * 실행 후 이 파일을 삭제하세요!
 */
defined('BASEPATH') OR exit('No direct script access allowed');

class Migrate extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
    }

    public function run_payment()
    {
        // 로그인 체크 없이 실행 (임시 마이그레이션용)
        $sql = "CREATE TABLE IF NOT EXISTS `tb_payment` (
          `payment_seq`        INT(11) NOT NULL AUTO_INCREMENT               COMMENT '결제 일련번호(PK)',
          `user_seq`           INT(11) NOT NULL                              COMMENT '결제 학원 user_seq',
          `user_id`            VARCHAR(100) NOT NULL                         COMMENT '결제 학원 아이디',
          `group_name`         VARCHAR(200) NOT NULL                         COMMENT '학원명',
          `plan_type`          ENUM('monthly','6month','12month') NOT NULL   COMMENT '요금제 구분',
          `plan_amount`        INT(11) NOT NULL DEFAULT 0                    COMMENT '요금제 금액(VAT별도)',
          `vat_amount`         INT(11) NOT NULL DEFAULT 0                    COMMENT 'VAT 금액',
          `total_amount`       INT(11) NOT NULL DEFAULT 0                    COMMENT '합계(VAT포함)',
          `payment_status`     ENUM('pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending' COMMENT '결제 상태',
          `payment_method`     VARCHAR(100) DEFAULT NULL                     COMMENT '결제 수단',
          `pg_transaction_id`  VARCHAR(300) DEFAULT NULL                     COMMENT 'PG 거래번호',
          `start_date`         DATE DEFAULT NULL                             COMMENT '서비스 시작일',
          `end_date`           DATE DEFAULT NULL                             COMMENT '서비스 만료일',
          `auto_renew`         TINYINT(1) NOT NULL DEFAULT 0                 COMMENT '자동갱신',
          `memo`               TEXT DEFAULT NULL                             COMMENT '관리자 메모',
          `reg_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '등록일시',
          `mod_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
          PRIMARY KEY (`payment_seq`),
          KEY `idx_user_seq`        (`user_seq`),
          KEY `idx_user_id`         (`user_id`),
          KEY `idx_payment_status`  (`payment_status`),
          KEY `idx_end_date`        (`end_date`),
          KEY `idx_reg_date`        (`reg_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='결제 내역 테이블'";

        $result = $this->db->query($sql);

        // 테이블 존재 여부 확인
        $exists = $this->db->table_exists('tb_payment');

        echo '<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Migration</title>
        <style>
            body { font-family: sans-serif; max-width: 500px; margin: 80px auto; text-align: center; }
            .box { padding: 30px; border-radius: 10px; }
            .ok  { border: 2px solid #28a745; color: #28a745; }
            .err { border: 2px solid #dc3545; color: #dc3545; }
        </style></head><body>';

        if ($exists) {
            echo '<div class="box ok">
                <h2>✅ 성공!</h2>
                <p><strong>tb_payment</strong> 테이블이 생성(또는 이미 존재)되었습니다.</p>
                <p style="color:#6c757d; font-size:0.85rem; margin-top:20px;">
                    ⚠️ 보안을 위해 이 파일을 삭제해주세요:<br>
                    <code>controllers/admin/Migrate.php</code>
                </p>
            </div>';
        } else {
            echo '<div class="box err">
                <h2>❌ 실패</h2>
                <p>테이블 생성에 실패했습니다.</p>
                <p>' . $this->db->error()['message'] . '</p>
            </div>';
        }

        echo '</body></html>';
    }
}
?>
