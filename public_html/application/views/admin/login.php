<!DOCTYPE html>
<html lang="kr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="content-type" content="text/html; charset=UTF-8 ">
  <title>Admin</title>
  <!-- Tell the browser to be responsive to screen width -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
   <link rel="shortcut icon" type="image/x-icon" href="/assets/common/images/hrdlms_ico.ico" />
  <!-- Font Awesome -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/fontawesome-free/css/all.min.css">
  <!-- Ionicons -->
  <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
  <!-- icheck bootstrap -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/plugins/icheck-bootstrap/icheck-bootstrap.min.css">
  <!-- Theme style -->
  <link rel="stylesheet" href="{base_url}assets/admin_resources/dist/css/adminlte.min.css">
  <!-- Google Font: Source Sans Pro -->
  <!--<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700" rel="stylesheet">-->
  <link href="https://fonts.googleapis.com/css?family=Noto+Sans+KR:300,400,400i,700" rel="stylesheet">
  <style>body {color:#222; font-family:'Noto Sans KR', sans-serif; letter-spacing:-0.025em}</style>
</head>
<body class="hold-transition login-page" style="background:#fff">
<div class="login-box">
  <div class="login-logo">
    <a href="#"><img src="/html_guide/images/common/logo.png" style="width:360px"></a>
    
  </div>
  <!-- /.login-logo -->
  <div class="card">
    <div class="card-body login-card-body">
      <p class="login-box-msg">관리자 로그인</p>

      <form id="login_form">
        <div class="input-group mb-3">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <input id="admin_id" name="admin_id" type="text" class="form-control" placeholder="Id">
          <div class="input-group-append">
            <div class="input-group-text">
              <span class="fas fa-user"></span>
            </div>
          </div>
        </div>
        <div class="input-group mb-3">
          <input name="admin_password" id="admin_password" type="password" class="form-control" placeholder="Password">
          <div class="input-group-append">
            <div class="input-group-text">
              <span class="fas fa-lock"></span>
            </div>
          </div>
        </div>
        <div class="row">

          <!-- /.col -->
          <div class="col-12">
            <button  type="button" onclick="login_proc()" class="btn btn-primary btn-block btn-flat" style="background:#000">로그인</button>
          </div>
          <!-- /.col -->
        </div>
      </form>

    </div>
    <!-- /.login-card-body -->
  </div>
</div>
<!-- /.login-box -->

<!-- jQuery -->
<script src="{base_url}assets/admin_resources/plugins/jquery/jquery.min.js"></script>
<!-- Bootstrap 4 -->
<script src="{base_url}assets/admin_resources/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>

<script>

  $(function(){
    $('#admin_id').focus();
  });

  $('#admin_password').keypress(function(e){
    if(e.keyCode == 13 ){
      login_proc();
    }
  });

  function login_proc()
  {
    $.ajax({
      type: "POST",
      url : "{base_url}admin/login_proc",
      data: $('#login_form').serialize(),
      dataType:"json",
      success : function(data, status, xhr) {
        if( data.result != "success" ){
          alert(data.message);
        } else {
          $('#csrf').val(data.value);
          location.href="/admin";
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log("error : " + errorThrown);
        console.log(jqXHR.responseText);
      }
    });
  }
</script>

</body>
</html>
