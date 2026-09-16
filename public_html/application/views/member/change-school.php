<div id="wrap">
	<!-- header -->
	<header>
		<h1 class="blind">저탄소 SCHOOL</h1>
		<h2 class="page_title">학교 정보 변경하기</h2>
		<a href="javascript:window.history.back();" class="btn_prev"><span class="blind">뒤로</span></a>
		<ul class="header_menu">
			<li><a href="#" class="menu_side" onClick="handleSideMenuOpen();return false;">사이드메뉴</a></li>
		</ul>
	</header>
	<!-- //header -->

	<!-- container -->
	<div id="container">
		<!-- 학교정보변경 -->
		<div class="join_area">
			<form id="changeForm">
				<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
				<input type="hidden" id="school_seq" name="school_seq"/>
			<div class="join_form">
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
				<a href="javascript:saveSchool()" class="btn_join_next">저 장</a>
			</div>
		</form>
		</div>
		<!-- //학교정보변경 -->
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

	function saveSchool()
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

		var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();

    var data = $('#changeForm').serialize();

    data[csrf_name] = csrf_val;

    $.ajax({
      type: "POST",
      url : "/member/changeSchool_proc",
      data: data,
      dataType:"json",
      success : function(data, status, xhr) {
				swal("변경되었습니다.", {
					icon: "success",
				}).then((value)=>{
					location.href="/member/setting";
				});
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
	}
	</script>
