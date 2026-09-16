<!DOCTYPE html>
<html lang="kr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="content-type" content="text/html; charset=UTF-8 ">
  <title>Admin</title>
  <!-- Tell the browser to be responsive to screen width -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Font Awesome -->


<!--
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css"
  />
-->
<script src="https://kit.fontawesome.com/ab06f23d17.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css"/>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/css/bootstrap-datepicker3.standalone.min.css">
  <!-- Ionicons -->
  <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
  <!-- Tempusdominus Bbootstrap 4 -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css">
  <!-- iCheck -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/icheck-bootstrap/icheck-bootstrap.min.css">
  <!-- JQVMap -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/jqvmap/jqvmap.min.css">
  <!-- Theme style -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/dist/css/adminlte.min.css">
  <!-- overlayScrollbars -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/overlayScrollbars/css/OverlayScrollbars.min.css">
  <!-- Daterange picker -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/daterangepicker/daterangepicker.css">
  <!-- summernote -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/summernote/summernote-bs4.css">
  <!--@import url(https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap);-->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/dist/css/select2.min.css">
  <script src="{base_url}assets/admin_resources/dist/js/common.js"></script>
  
  <!-- jQuery
  <script src="/assets/admin_resources/plugins/jquery/jquery.min.js"></script>
-->
<!-- jQuery -->
<script src="{base_url}assets/admin_resources/plugins/jquery/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.5/jquery.validate.js"></script>
<script language="javascript">
$(document).ready(function() {
  // 한국어 메시지 정의
  $.extend($.validator.messages, {
    required: "필수 입력 항목입니다.",
    remote: "이 항목을 수정하세요.",
    cell_no: "유효한 휴대폰 번호를 입력하세요..",
    email: "유효한 E-Mail 주소를 입력하세요.",
    url: "유효한 URL을 입력하세요.",
    date: "올바른 날짜를 입력하세요.",
    dateISO: "올바른 날짜(ISO)를 입력하세요.",
    number: "유효한 숫자를 입력하세요.",
    digits: "숫자만 입력 가능합니다.",
    creditcard: "신용카드 번호를 입력하세요.",
    equalTo: "같은 값을 다시 입력하세요.",
    accept: "올바른 확장자를 가진 값을 입력하세요.",
    maxlength: $.validator.format("{0}자 이하로 입력하세요."),
    minlength: $.validator.format("{0}자 이상으로 입력하세요."),
    rangelength: $.validator.format("{0}자에서 {1}자까지의 값을 입력하세요."),
    range: $.validator.format("{0}에서 {1}까지의 값을 입력하세요."),
    max: $.validator.format("{0} 이하의 값을 입력하세요."),
    min: $.validator.format("{0} 이상의 값을 입력하세요.")
  });    
});
</script>

  <!-- Google Font: Source Sans Pro -->
  <!--<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700" rel="stylesheet">-->
  <link href="https://fonts.googleapis.com/css?family=Noto+Sans+KR:300,400,400i,700" rel="stylesheet">
  <style>
.select2-container .select2-selection--single {
    box-sizing: border-box;
    cursor: pointer;
    display: block;
    height: 37px;
    user-select: none;
    -webkit-user-select: none;
    margin-left:5px;
    margin-top:5px;
}

.keyword {padding:5px;border:1px solid #ddd;}
.keywords {padding-left:20px;padding-top:20px;float:left;}
.small_table{
  font-size:12px !important;
}

.row-search {line-height:45px;height:45px;}
.bg-lightgray {background-color:#efefef}
.mt-10 {margin-top:10px;}
</style>
<style>body {color:#222; font-family:'Noto Sans KR', sans-serif; letter-spacing:-0.025em}</style>
</head>

<body class="hold-transition sidebar-mini layout-fixed">
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
<div class="wrapper">

  <!-- Navbar -->
  <nav class="main-header navbar navbar-expand navbar-white navbar-light">
    <!-- Left navbar links -->
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" data-widget="pushmenu" href="#"><i class="fas fa-bars"></i></a>
      </li>

      <li class="nav-item d-none d-sm-inline-block">
        <a href="/admin/" class="nav-link">HOME</a>
      </li>
      <li class="nav-item d-none d-sm-inline-block">
        <a href="javascript:logout()" class="nav-link">LOGOUT</a>
      </li>
      <?php if(strstr($_SERVER['REQUEST_URI'], "insight")){?>
          <?php if(($this->session->userdata("admin_level") == "A")){?>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightMemberDirector" class="nav-link">가맹점 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightMemberMaster" class="nav-link">마스터 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightMemberTeacher" class="nav-link">선생님 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightMemberUser" class="nav-link">학생 회원 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightQuiz" class="nav-link">북퀴즈 등록 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightQuizConfirm" class="nav-link">북퀴즈 인증 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightBook" class="nav-link">선호도현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightRanking" class="nav-link">랭킹 현황</a>
          </li>      
          <?php } else if(($this->session->userdata("admin_level") == "director")){?>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightMemberUser" class="nav-link">학생 회원 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightQuiz" class="nav-link">우리원 북퀴즈 등록 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightQuizConfirm" class="nav-link">우리원 북퀴즈 인증 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/insight/insightBook" class="nav-link">선호도 현황</a>
          </li>
          <li class="nav-item d-none d-sm-inline-block">
            <a href="/admin/manage/ranking" class="nav-link">랭킹 현황</a>
          </li>                
          <?php } else {?>
          <?php }?>
      <?php }?>

    </ul>
  </nav>
  <!-- /.navbar -->
