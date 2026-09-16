<div id="wrap">
	<!-- header -->
  <header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">{page_title}</h2>
		<a href="/member/join/step1" class="btn_prev"><span class="blind">뒤로</span></a>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 학교정보입력 -->
		<div class="join_area">
			<ol class="join_step">
				<li class="current">1. 회원정보입력</li>
				<li class="current">2. 학교정보입력</li>
				<li>3. 가입완료</li>
			</ol>

			<div class="join_form">
        <form id="join_form">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <input type="hidden" name="parent_name" value="<?php echo $parent_name; ?>"/>
          <input type="hidden" name="parent_birthday" value="<?php echo $parent_birthday; ?>"/>
          <input type="hidden" name="parent_phone" value="<?php echo $parent_phone; ?>"/>
          <input type="hidden" name="user_type" value="<?php echo $user_type; ?>"/>
          <input type="hidden" name="sns_key" value="<?php echo $sns_key; ?>"/>
          <input type="hidden" name="user_id" value="<?php echo $user_id; ?>"/>
          <input type="hidden" name="user_name" value="<?php echo $user_name; ?>"/>
          <input type="hidden" name="phone" value="<?php echo $phone; ?>"/>
          <input type="hidden" name="email" value="<?php echo $email; ?>"/>
          <input type="hidden" name="birth_year" value="<?php echo $birth_year; ?>"/>
          <input type="hidden" name="birth_month" value="<?php echo $birth_month; ?>"/>
          <input type="hidden" name="birth_day" value="<?php echo $birth_day; ?>"/>
          <input type="hidden" name="gender" value="<?php echo $gender; ?>"/>
          <input type="hidden" name="location" value="<?php echo $location; ?>"/>
          <input type="hidden" name="zipcode" value="<?php echo $zipcode; ?>"/>
          <input type="hidden" name="addr1" value="<?php echo $addr1; ?>"/>
          <input type="hidden" name="addr2" value="<?php echo $addr2; ?>"/>
          <input type="hidden" name="app_key" id="app_key" value=""/>
          <input type="hidden" id="school_seq" name="school_seq"/>
  				<ul class="list_join_info">
            <li>
  						<label for="join-school" class="label">학교명</label>
  						<div class="input_area">
  							<input type="text" id="join-school" class="input_join" onkeyup="if (window.event.keyCode == 13) {findSchool()}">
  							<a href="javascript:findSchool()" class="btn_verification on">검색</a>
  						</div>
  					</li>
  				</ul>
  				<ul class="add_join_info">
  					<li>
  						<label for="join-class" class="label">학년</label>
  						<select class="uiselect" id="join-school-year" name="school_year" style="width:120px" onchange="findClass()">
  							<option value="">선택하세요</option>
  						</select>
  					</li>
  					<li>
  						<label for="join-class2" class="label">반</label>
  						<select class="uiselect" id="join-school-class" name="school_class" style="width:120px">
  							<option value="">선택하세요</option>
  						</select>
  					</li>
  				</ul>
  				<div class="no_school">
  					<span class="uicheckbox_wrap uicheckbox_size17">
  						<input type="checkbox" id="noSchool" name="school_chk" value="Y" class="uicheckbox_check">
  						<label for="noSchool" class="uicheckbox_label">학교 선택 안함</label>
  					</span>
  				</div>
  				<a href="javascript:goNext()" class="btn_join_next">다 음</a>
        </form>
			</div>
		</div>
		<!-- //학교정보입력 -->
	</div>
	<!-- //container -->

  <script>
  function findSchool()
  {
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    var school_name = $('#join-school').val();

    if(school_name==""){
      swal("학교명을 입력해주세요.");
      $('#join-school').focus();
      return
    }

    if( school_name.length < 2 ){
      swal("2글자 이상 작성해주세요.");
      $('#join-school').focus();
      return;
    }

    window.open("/member/schoolSearchPop?school_name="+school_name,"schoolSearchPop");
  }

  function choiceSchool(data)
  {
    var school_name = data.school_name;
    var school_seq = data.school_seq;

    $('#school_seq').val(school_seq);
    $('#join-school').val(school_name);
    findYear();
  }

  function findYear()
  {
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    var school_seq = $('#school_seq').val();

    if(school_seq == ""){
      swal("학교를 선택해주세요.");
      $('#school_seq').focus();
      return;
    }

    var data = {
      "school_seq" : school_seq
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/schoolYearFind",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.data.length==0){
          swal("학년이 없습니다.");
        }else{
          var html = "<option value=''>선택하세요</option>";
          for(var i=0; i<data.data.length; i++){
            html += '<option value="'+data.data[i].school_year+'">'+data.data[i].school_year+'</option>';
          }
          $('#join-school-year').html(html);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }

  function findClass()
  {
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    var school_seq = $('#school_seq').val();
    var school_year = $('#join-school-year').val();

    if(school_seq == ""){
      swal("학교를 선택해주세요.");
      $('#school_seq').focus();
      return;
    }

    if(school_year == ""){
      swal("학년을 선택해주세요.");
      $('#join-school-year').focus();
      return;
    }

    var data = {
      "school_seq" : school_seq,
      "school_year" : school_year
    };

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/schoolClassFind",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.data.length==0){
          swal("반이 없습니다.");
        }else{
          var html = "<option value=''>선택하세요</option>";
          for(var i=0; i<data.data.length; i++){
            html += '<option value="'+data.data[i].school_class+'">'+data.data[i].school_class+'</option>';
          }
          $('#join-school-class').html(html);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }

  function goNext()
  {
    var school_chk = $('input[name=school_chk]:checked').val();

    if(school_chk != "Y"){
      var school_seq = $('#school_seq').val();
      var school_year = $('#join-school-year').val();
      var school_class = $('#join-school-class').val();

      if(school_seq==""){
        swal("학교를 선택해주세요.");
        $('#school_seq').focus();
        return
      }
      if(school_year==""){
        swal("학년을 선택해주세요.");
        $('#join-school-year').focus();
        return
      }
      if(school_class==""){
        swal("반을 선택해주세요.");
        $('#join-school-class').focus();
        return
      }
    }

    osCheck();

  }

  function join_proc()
  {
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = $('#join_form').serialize();

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/sns_join_proc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
        if(data.result=="success"){
          location.href="/member/join/step3";
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
    if ( varUA.indexOf('android') > -1) {
        //안드로이드
  			try {
  		      app_key = window.androidbridge.getAndroidToken();
            $('#app_key').val(app_key);
            join_proc();
  		  } catch(e) {
          join_proc();
  		  }
    } else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
      //IOS
  		try {
  			webkit.messageHandlers.tokenHandler.postMessage("");
  		} catch(e) {
        join_proc();
  		}
    }
  }

  function receiveToken(r)
  {
      //swal('IOS RECEIVE');
      // IOS에서 콜하는 JAVASCRIPT
  	app_key = r.token+"";
  	//info = JSON.stringify(app_key);
    $('#app_key').val(app_key);
    join_proc();


  }
  </script>
