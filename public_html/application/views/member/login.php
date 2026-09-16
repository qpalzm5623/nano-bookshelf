<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<!--<meta name="viewport" content="width=device-width, initial-scale=1.0">-->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<link rel="stylesheet" href="/resources/css/normalize.css">
	<link rel="stylesheet" href="/resources/css/common.css">
	<link rel="stylesheet" href="/resources/css/sub.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script>
	<script src="/resources/js/common.js"></script>
	<title>나노의책장</title>
</head>
<body>
    
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<h2 class="header_title">로그인</h2>
			</div>
		</header>
		<!-- // header -->

		<!-- contents -->
		<div class="contents" id="contents">
            <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
            <input type="hidden" id="app_key" name="app_key"/>		    
			<div class="login form_wrap">
				<h1 class="logo"><img src="/resources/images/common/logo.png" alt=""></h1>
				<ul class="form_area">
					<li class="form_box"><div class="input_box"><input type="text"  id="user_id" name="user_id" placeholder="아이디를 입력해 주세요."></div></li>
					<li class="form_box">
						<div class="input_box"><input type="password" id="user_password" name="user_password" class="input_login" onkeypress="if( event.keyCode == 13 ){goLogin();}" placeholder="비밀번호를 입력해 주세요."><button class="input_view" onClick="pwTypeToggle(this, '#user_password');">비밀번호 보기</button><!-- <button class="input_view on">비밀번호 보기</button>--></div>
					</li>
				</ul>
				<div class="login_utils">
					<div class="checkbox"><input type="checkbox" id="idSave" class="uicheckbox_check" value="Y"><label for="idSave">아이디 저장</label></div>
					<div class="checkbox"><input type="checkbox" id="autoLogin" name="autoLogin"  value="Y" ><label for="autoLogin">자동 로그인</label></div>
				</div>
				<button class="btn_basic open_confirm" onclick="goLogin()" >로그인</button>
				<div class="notice_text">※로그인 정보는 담당 선생님께 문의해 주세요.</div>
			</div>

			<!-- 알림 팝업 -->
			<div class="layer_popup_wrap confirm">
				<div class="layer_popup">
					<div class="popup_contents">
						<div class="popup_text"></div>
					</div>
					<div class="popup_btn_area">
						<a href="#" class="btn popup_close">확 인</a>
					</div>
				</div>
			</div>
			<!-- // 알림 팝업 -->

		</div>
		<!-- // contents -->

	</div>
</body>
</html>
  
  <script>
  var app_key = "";
  var login_str = "";
function pwTypeToggle(btn, target){
	if(jQuery(btn).hasClass('active')){
		jQuery(btn).removeClass('active');
		jQuery(target).attr('type', 'password');
		return;
	}
	jQuery(btn).addClass('active');
	jQuery(target).attr('type', 'text');
}  
  function goLogin()
  {
      var user_id = $('#user_id').val();
      var user_password = $('#user_password').val();
      
      if(user_id == ""){
          //swal("아이디를 입력해주세요");
          //$('#user_id').focus();
          $('.popup_text').html('아이디를 입력해 주세요.');
          $('.layer_popup_wrap').show();
          $('#user_id').focus();
          return;
      }
      if(user_password == ""){
          $('.popup_text').html('비밀번호를 입력해 주세요.');
          $('.layer_popup_wrap').show();
          $('#user_password').focus();
          //swal("비밀번호를 입력해주세요");
          //$('#user_password').focus();
          return;
      }
      
      osCheck();
      
  }

  function loginProc()
  {
      var user_id = $('#user_id').val();
      var user_password = $('#user_password').val();
      
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();
      var auto_login = $('input[name="autoLogin"]:checked').val();
      
    if($("#idSave").is(":checked")){ // ID 저장하기 체크했을 때,
        setCookie("id_save", $("#user_id").val(), 7); // 하루 동안 쿠키 보관
    }
                  
      var data = {
          "user_id" : user_id,
          "user_password" : user_password,
          "auto_login"  : auto_login,
          "app_key" : app_key
      }
      
      data[csrf_name] = csrf_val;
      $.ajax({
          type: "POST",
          url : "/home/login_proc",
          data: data,
          dataType:"json",
          success : function(data, status, xhr) {
              //console.log(data);
              $('.layer_popup_wrap').hide();
              if(data.result=="failed"){
                  isLoginFailed = true;
                  $('.popup_text').html(data.msg);
                  $('.layer_popup_wrap').show();
              }else{
                  $('.layer_popup_wrap').hide();
                  location.href="/main";
                  return;
                  /*
                  swal("로그인 되었습니다.", {
                      icon: "success",
                  }).then((value)=>{
                      location.href="/main";
                  });
                  */
              }
          },
          error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
          }
      });
  }

  function osCheck()
  {
      var varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기
      console.log(varUA);
      if ( varUA.indexOf('android') > -1) {
          //안드로이드
  	  	  try {
  	  	      app_key = window.androidbridge.getAndroidToken();
              loginProc();
  	  	  } catch(e) {
              app_key = "";
              loginProc();
  	  	  }
      } else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ||varUA.indexOf("mac") > -1)  {
          //IOS
  	      try {
              login_str = "login";
  	      	  webkit.messageHandlers.tokenHandler.postMessage("");
  	      } catch(e) {
              loginProc();
              //swal(e);
  	      }
      }
  }

  function receiveToken(r)
  {
      //swal('IOS RECEIVE');
      // IOS에서 콜하는 JAVASCRIPT
  	  app_key = r.token+"";
  	  //info = JSON.stringify(app_key);
      if(login_str == "login"){
          loginProc();
      }else{
          autoLogin();
      }
  }

  var isLoginFailed = false;
  $(document).ready(function(){
    $('.layer_popup_wrap').hide();

    // 스토리보드 AA-001 요건: 로그인 실패 팝업 닫기 시 입력 정보 초기화
    $('.layer_popup .popup_close').on('click', function(e){
        e.preventDefault();
        $('.layer_popup_wrap').hide();
        if(isLoginFailed) {
            $('#user_id').val('');
            $('#user_password').val('');
            $('#user_id').focus();
            isLoginFailed = false;
        }
    });

    //autologinCheck
    autoLoginCheck();

     //저장된 쿠기값을 가져와서 id 칸에 넣어준다 없으면 공백으로 처리
     var key = getCookie("id_save");
     $("#user_id").val(key);


     if($("#user_id").val() !=""){
         // 페이지 로딩시 입력 칸에 저장된 id가 표시된 상태라면 id저장하기를 체크 상태로 둔다
         $("#idSave").attr("checked", true); //id저장하기를 체크 상태로 둔다 (.attr()은 요소(element)의 속성(attribute)의 값을 가져오거나 속성을 추가합니다.)
     }

      $("#idSave").change(function(){ // 체크박스에 변화가 있다면,
            if($("#idSave").is(":checked")){ // ID 저장하기 체크했을 때,
                setCookie("id_save", $("#user_id").val(), 7); // 하루 동안 쿠키 보관
            }else{ // ID 저장하기 체크 해제 시,
                deleteCookie("id_save");
            }
      });

        // ID 저장하기를 체크한 상태에서 ID를 입력하는 경우, 이럴 때도 쿠키 저장.
        $("#user_id").keyup(function(){ // ID 입력 칸에 ID를 입력할 때,
            if($("#idsave").is(":checked")){ // ID 저장하기를 체크한 상태라면,
                setCookie("id_save", $("#user_id").val(), 7); // 7일 동안 쿠키 보관
            }
        });
    });

    //쿠키 함수
    function setCookie(cookieName, value, exdays){
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var cookieValue = escape(value) + ((exdays==null) ? "" : "; expires=" + exdate.toGMTString());
        document.cookie = cookieName + "=" + cookieValue;
    }

    function deleteCookie(cookieName){
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() - 1);
        document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString();
    }

    function getCookie(cookieName) {
        cookieName = cookieName + '=';
        var cookieData = document.cookie;
        var start = cookieData.indexOf(cookieName);
        var cookieValue = '';
        if(start != -1){
            start += cookieName.length;
            var end = cookieData.indexOf(';', start);
            if(end == -1)end = cookieData.length;
            cookieValue = cookieData.substring(start, end);
        }
        return unescape(cookieValue);
    }

    function autoLoginCheck()
    {
        var varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기
        if ( varUA.indexOf('android') > -1) {
        //안드로이드
    	    try {
    		    app_key = window.androidbridge.getAndroidToken();
    			autoLogin();
    		} catch(e) {
    		}
        } else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
        //IOS
    		try {
                login_str = "";
    			webkit.messageHandlers.tokenHandler.postMessage("");
    		} catch(e) {

    		}
        }
    }

    function autoLogin()
    {
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        var data = {
            "app_key" : app_key
        }
        data[csrf_name] = csrf_val;
        $.ajax({
            type: "POST",
            url : "/home/autoLoginCheck",
            data: data,
           dataType:"json",
           success : function(data, status, xhr) {
               if(data.result=="success"){
                   location.href="/main";
               }
           },
               error: function(jqXHR, textStatus, errorThrown) {
               console.log(jqXHR.responseText);
           }
        });
    }
  </script>
