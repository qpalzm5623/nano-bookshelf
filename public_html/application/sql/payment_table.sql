-- ============================================================
-- 나노의책장 결제 시스템 - DB 테이블 생성 스크립트
-- 생성일: 2026-09-14
-- ============================================================

CREATE TABLE IF NOT EXISTS `tb_payment` (
  `payment_seq`        INT(11) NOT NULL AUTO_INCREMENT               COMMENT '결제 일련번호(PK)',
  `user_seq`           INT(11) NOT NULL                              COMMENT '결제 학원 user_seq (tb_user.user_seq)',
  `user_id`            VARCHAR(100) NOT NULL                         COMMENT '결제 학원 아이디',
  `group_name`         VARCHAR(200) NOT NULL                         COMMENT '학원명',
  `plan_type`          ENUM('monthly','6month','12month') NOT NULL   COMMENT '요금제 구분',
  `plan_amount`        INT(11) NOT NULL DEFAULT 0                    COMMENT '요금제 금액(VAT별도, 원)',
  `vat_amount`         INT(11) NOT NULL DEFAULT 0                    COMMENT 'VAT 금액(원)',
  `total_amount`       INT(11) NOT NULL DEFAULT 0                    COMMENT '합계 금액(VAT포함, 원)',
  `payment_status`     ENUM('pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending' COMMENT '결제 상태',
  `payment_method`     VARCHAR(100) DEFAULT NULL                     COMMENT '결제 수단(PG연동시 사용)',
  `pg_transaction_id`  VARCHAR(300) DEFAULT NULL                     COMMENT 'PG 거래번호(PG연동시 사용)',
  `start_date`         DATE DEFAULT NULL                             COMMENT '서비스 시작일',
  `end_date`           DATE DEFAULT NULL                             COMMENT '서비스 만료일',
  `auto_renew`         TINYINT(1) NOT NULL DEFAULT 0                 COMMENT '자동갱신 여부(1=사용, 0=미사용, monthly만 해당)',
  `memo`               TEXT DEFAULT NULL                             COMMENT '관리자 메모',
  `reg_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '등록일시',
  `mod_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`payment_seq`),
  KEY `idx_user_seq`        (`user_seq`),
  KEY `idx_user_id`         (`user_id`),
  KEY `idx_payment_status`  (`payment_status`),
  KEY `idx_end_date`        (`end_date`),
  KEY `idx_reg_date`        (`reg_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='결제 내역 테이블';


-- ============================================================
-- 요금제 정보 참조 (코드 테이블에 추가하려면 아래 주석 해제 후 실행)
-- tb_code 테이블 구조에 맞게 수정하세요
-- ============================================================
/*
INSERT INTO `tb_code` (`code_group`, `code_type`, `code_name`, `code_order`, `use_yn`) VALUES
('payment_plan', 'monthly', '월 구독 (100,000원)', 1, 'Y'),
('payment_plan', '6month',  '6개월 (540,000원, 10%할인)', 2, 'Y'),
('payment_plan', '12month', '12개월 (960,000원, 20%할인)', 3, 'Y');
*/
