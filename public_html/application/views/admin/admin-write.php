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
            <form role="form" id="adminWriteForm">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <tbody>
                    <tr>
                      <th><small style="color:red">*</small> 아이디</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="user_id" id="user_id"/>
                        <button type="button" class="btn btn-info float-left" style="margin-left:5px;" onclick="duplicateCheck()">중복확인</button>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 이름</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="user_name" id="user_name"/>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 이메일</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="user_email" id="user_email"/>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 소속</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="affiliation" id="affiliation"/>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 운영자 권한</th>
                      <td>
                        <div class="custom-control custom-radio custom-control-inline">
                          <input type="radio" class="custom-control-input" name="user_level" id="user_level1" value="1" onchange="chkAuth(1)"/>
                          <label class="custom-control-label" for="user_level1">Master</label>
                        </div>
                        <div class="custom-control custom-radio custom-control-inline">
                          <input type="radio" class="custom-control-input" name="user_level" id="user_level2" value="2" onchange="chkAuth(2)"/>
                          <label class="custom-control-label" for="user_level2">Local</label>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 관리자 메뉴권한</th>
                      <td>
                        <table class="table table-striped">
                          <tr>
                            <th>관리자 관리</th>
                            <th>운영 관리</th>
                            <th>회원 관리</th>
                          </tr>
                          <tr>
                            <td>
                              <div class="checkbox">
                                <label>
                                <input type="checkbox" name="auth_control[]" value="master_member"/>
                                운영자 관리
                                </label>
                              </div>
                            </td>
                            <td>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="management_category"/> 카테고리 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="management_product"/> 상품 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="management_main"/> 메인 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="management_brand"/> 브랜드 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="management_product"/> 프로덕트 관리
                                </label>
                              </div>
                            </td>
                            <td>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="member_brand"/> 브랜드 회원 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="member_buyer"/> 바이어 회원 관리
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <th>주문 관리</th>
                            <th>뉴스 관리</th>
                            <th></th>
                          </tr>
                          <tr>
                            <td>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="order_management"/> 주문 관리
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="order_faq"/> 문의 관리
                                </label>
                              </div>
                            </td>
                            <td>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="board_editors"/> Editor's pick
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="board_news"/> News
                                </label>
                              </div>
                              <div class="checkbox">
                                <label>
                                  <input type="checkbox" name="auth_control[]" value="board_global"/> Global trend
                                </label>
                              </div>
                            </td>
                            <td></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- /.card-body -->

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="writeProc()">등록</button>
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
var duplicateID = "";
function CheckEmail(str)
{
  var regExp = /([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

   if (regExp.test(str)) return true;
   else return false;
}

  function duplicateCheck()
  {
    var user_id = $('#user_id').val();

    if( user_id == "" ){
      alert("아이디를 입력 해 주세요.");
      return;
    }


    var formData = {
      "user_id":user_id,
      "<?=$this->security->get_csrf_token_name();?>":$('#csrf').val()
    };

    $.ajax({
      type: "POST",
      url : "{base_url}admin/adminIdDuplicateProc",
      data: formData,
      dataType:"json",
      success : function(data, status, xhr) {
        if( data.result == "failed" ){
          alert(data.msg);
          duplicateID = "";
        }else{
          alert('사용 가능한 아이디 입니다.');
          duplicateID = user_id;
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

  }

  function chkAuth($num)
  {
    if($num == "1"){
      $("input[type=checkbox]").prop("checked",true);
    }
  }

  function goList(){
    location.href="{base_url}admin/adminList";
  }

  function writeProc(){

    var user_id = $('#user_id').val();
    var user_name = $('#user_name').val();
    var user_email = $('#user_email').val();
    var affiliation = $('#affiliation').val();
    var user_level = $('#user_level').val();

    if( duplicateID == "" || duplicateID != $('#user_id').val() ){
      alert('아이디 중복 체크를 해주시기 바랍니다.');
      return;
    }

    if( user_name == "" ){
      alert('이름을 작성 해 주세요.');
      return;
    }

    if( CheckEmail(user_email) == false ){
      alert('정상적인 이메일을 입력 해 주세요.');
      return;
    }

    if( affiliation == "" ){
      alert('소속을 작성 해 주세요.');
      return;
    }

    if( $('input:radio[name=user_level]').is(':checked') == false ){
      alert('권한을 선택 해 주세요');
      return;
    }

    var formData = $('#adminWriteForm').serialize();

    $.each($('form input[type=checkbox]')
    .filter(function(idx){
      return $(this).prop('checked') === false }), function(idx, el){
        // attach matched element names to the formData with a chosen value.
        var emptyVal = "";
        //formData += '&' + $(el).attr('name') + '=' + emptyVal;
      });

    $.ajax({
      type: "POST",
      url : "{base_url}admin/adminWriteProc",
      data: formData,
      dataType:"json",
      success : function(data, status, xhr) {
        if( data.result == "success" ){
          alert("등록 되었습니다.");
          location.href = "{base_url}admin/adminList";
        } else {
          alert("오류발생!!");
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });

  }
</script>
