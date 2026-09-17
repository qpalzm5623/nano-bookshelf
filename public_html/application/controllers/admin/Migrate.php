<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Migrate extends CI_Controller {
    public function index() {
        echo "SQL 파일: application/sql/payment_table.sql";
    }
}
