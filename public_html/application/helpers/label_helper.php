<?php
/**
 * label_helper.php
 *
 * 코드 -> 한국어 레이블 변환 공통 헬퍼
 *
 * 기존에 Partner.php, Master.php, Manage.php, Etc.php 등
 * 여러 컨트롤러에서 동일한 switch 블록이 반복되던 것을 한 곳으로 통합.
 *
 * 사용법:
 *   $this->load->helper('label');
 *   $list[$i]['user_type']   = user_type_label($list[$i]['user_type']);
 *   $list[$i]['user_status'] = user_status_label($list[$i]['user_status']);
 *   $list = apply_user_labels($list);        // 리스트 전체 일괄 변환
 *   $list = apply_user_labels($list, true);  // grade 변환도 함께
 */

defined('BASEPATH') OR exit('No direct script access allowed');

// 사용자 유형 코드 -> 한국어 레이블
if (!function_exists('user_type_label')) {
    function user_type_label($code)
    {
        $map = [
            'director' => '원장',
            'teacher'  => '선생님',
            'master'   => '마스터',
            'user'     => '원생',
        ];
        return isset($map[$code]) ? $map[$code] : $code;
    }
}

// 사용자 상태 코드 -> 한국어 레이블
if (!function_exists('user_status_label')) {
    function user_status_label($code)
    {
        $map = [
            'Y' => '정상',
            'N' => '정지',
            'R' => '탈퇴신청',
            'L' => '탈퇴완료',
            'D' => '삭제',
            'C' => '완료',
        ];
        return isset($map[$code]) ? $map[$code] : $code;
    }
}

// 학년 코드 -> 한국어 레이블
if (!function_exists('grade_label')) {
    function grade_label($code)
    {
        $map = [
            '0'  => '미취학',
            '1'  => '초1', '2' => '초2', '3' => '초3',
            '4'  => '초4', '5' => '초5', '6' => '초6',
            '7'  => '중1', '8' => '중2', '9' => '중3',
            '10' => '고1', '11' => '고2', '12' => '고3',
        ];
        return isset($map[$code]) ? $map[$code] : $code;
    }
}

// 결제 상태 코드 -> 한국어 레이블
if (!function_exists('payment_status_label')) {
    function payment_status_label($code)
    {
        $map = [
            'pending'   => '결제대기',
            'paid'      => '결제완료',
            'cancelled' => '취소',
            'expired'   => '만료',
        ];
        return isset($map[$code]) ? $map[$code] : $code;
    }
}

// 학교 구분 코드 -> 한국어 레이블
if (!function_exists('school_classification_label')) {
    function school_classification_label($code)
    {
        $map = [
            'ELE' => '초등학교',
            'MID' => '중학교',
            'HIG' => '고등학교',
            'ETC' => '기타',
        ];
        return isset($map[$code]) ? $map[$code] : $code;
    }
}

// 리스트 배열 전체에 레이블 일괄 변환
// $grade = true 이면 grade 필드도 변환
if (!function_exists('apply_user_labels')) {
    function apply_user_labels(array $list, $grade = false)
    {
        foreach ($list as &$row) {
            if (isset($row['user_type'])) {
                $row['user_type'] = user_type_label($row['user_type']);
            }
            if (isset($row['user_status'])) {
                $row['user_status'] = user_status_label($row['user_status']);
            }
            if ($grade && isset($row['grade'])) {
                $row['grade'] = grade_label($row['grade']);
            }
        }
        unset($row);
        return $list;
    }
}