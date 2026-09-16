<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="{base_url}admin/main">Home</a></li>
            <li class="breadcrumb-item active">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <!-- left column -->
        <div class="col-md-12">
          <!-- general form elements -->
          <div class="card card-primary">

            <!-- form start -->
            <form role="form" id="infoModifyForm">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <div class="form-group">
                  <label for="title">아이디</label>
                  <input type="text" class="form-control" name="user_id" id="user_id" value="{user_id}" readonly>
                </div>
                <div class="form-group">
                  <label for="title">이름</label>
                  <input type="text" class="form-control" name="user_name" id="user_name" value="{user_name}" readonly>
                </div>
                <div class="form-group">
                  <label for="title"><small style="color:red;">＊</small> 기존비밀번호</label>
                  <input type="password" class="form-control" name="user_password" id="user_password" placeholder="기존 비밀번호 입력">
                </div>
                <div class="form-group">
                  <label for="title"><small style="color:red;">＊</small> 변경비밀번호 <small style="color:red;">* 최소 8자리 이상, 영어대문자/소문자/숫자/특수문자 중 3종류 조합</small></label>
                  <input type="password" class="form-control" name="change_password" id="change_password" placeholder="변경 할 비밀번호 입력">
                </div>
                <div class="form-group">
                  <label for="title"><small style="color:red;">＊</small> 변경비밀번호 확인</label>
                  <input type="password" class="form-control" id="change_password_chk" placeholder="변경 할 비밀번호 확인">
                </div>
                <div class="form-group">
                  <label for="title">이메일</label>
                  <input type="text" class="form-control" name="user_email" id="user_email" value="{user_email}" placeholder="이메일 입력">
                </div>
                <div class="form-group">
                  <label for="title">소속</label>
                  <input type="text" class="form-control" name="affiliation" id="affiliation" value="{affiliation}" placeholder="소속 입력">
                </div>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="infoModifyProc()">수정</button>
              </div>
            </form>
          </div>
          <!-- /.card -->

        </div>
        <!--/.col (right) -->
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>

  function chkPW($str){
    var pw = $str;
    var num = pw.search(/[0-9]/g);
    var eng = pw.search(/[a-z]/ig);
    var spe = pw.search(/[`~!@@#$%^&*|\\\'\";:\/?]/gi);

    if( pw.length < 8 || pw.length > 20 ){
      alert("8자리 ~ 20자리 이내로 입력해주세요.");
      $('#change_password').focus();
      return false;
    }else if( pw.search(/\s/) != -1 ){
      alert("비밀번호는 공백 없이 입력해주세요.");
      return false;
    }else if( num < 0 || eng < 0 || spe < 0 ){
      alert("영문,숫자,특수문자를 혼합하여 입력해주세요.");
      return false;
    }else if( $('#change_password').val() != $('#change_password_chk').val() ){
      alert("변경될 비밀번호가 같지 않습니다.");
      $('#change_password_chk').focus();
      return false;
    }else if( $('#user_password').val() == $('#change_password').val() ){
      alert("기존비밀번호와 변경될 비밀번호가 같습니다.");
      $('#change_password').focus();
      return false;
    }else{
      console.log("통과");
      return true;
    }
  }

  function infoModifyProc(){
    var change_password = $('#change_password').val();

    if(chkPW(change_password)){
      var user_email = $('#user_email').val();
      var affiliation = $('#affiliation').val();

      if( user_email == "" ){
        alert("이메일을 작성 해 주세요.");
        $('#user_email').focus();
        return;
      }
      if( affiliation == "" ){
        alert("소속을 작성 해 주세요.");
        $('#affiliation').focus();
        return;
      }

      var formData = $('#infoModifyForm').serialize();

      $.ajax({
        type: "POST",
        url : "{base_url}admin/infoModifyProc",
        data: formData,
        dataType:"json",
        success : function(data, status, xhr) {
          if( data.result == "success" ){
            $('#csrf').val(data.csrf);
            console.log(data);
            alert("수정 되었습니다.");
            location.href = "{base_url}admin/infoModify";
          } else {
            console.log(data.data);
            alert(data.msg);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });
    }
  }
</script>
