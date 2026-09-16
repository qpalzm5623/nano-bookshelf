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
            <form role="form" id="courseClassForm" enctype="multipart/form-data" action="/admin/configAdm/mainWriteProc" method="POST">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" id="mid" name="mid" value="<?php echo $mid;?>"/>
              <input type="hidden" id="url" name="url" value="<?php echo $data['url']; ?>"/>
              <input type="hidden" id="course_code" name="course_code" value="<?php echo $data['course_code']; ?>"/>
              <input type="hidden" id="class_code" name="class_code" value="<?php echo $data['class_code']; ?>"/>
              <div class="card-body">
                <h4 style="color:#007bff;">정보 입력</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>과정선택</th>
                      <td colspan="3">
                        <select class="form-control select2 col-sm-8 float-left" id="class_course_code" name="class_course_code" onchange="setTitle()">
                          <?php for($i=0; $i<count($class_course_data); $i++){ ?>
                          <option value="<?php echo $class_course_data[$i]['class_code']; ?>" data-url="/course/view/<?php echo $class_course_data[$i]['class_seq'] ?>" data-course_code="<?php echo $class_course_data[$i]['course_code']; ?>" <?php echo ($data['class_code']==$class_course_data[$i]['class_code']) ? "selected":""; ?>><?php echo $class_course_data[$i]['class_name']; ?></option>
                          <?php } ?>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>제목</th>
                      <td colspan="3"><input type="text" class="form-control col-sm-8 float-left" id="title" name="title" value="<?php echo $data['title'];?>" /></td>
                    </tr>
                    <tr>
                      <th>위치</th>
                      <td colspan="3">
                        <div class="checkbox">
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="main_type" value="HOT" <?php echo $data['main_type']=='HOT'?"checked":"checked";?> onclick="main_category_chk()"/> HOT 과정
                          </label>
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="main_type" value="RECOM" <?php echo $data['main_type']=='RECOM'?"checked":"";?> onclick="main_category_chk()"/> 추천 과정
                          </label>
                      </td>
                    </tr>
                    <tr>
                      <th>카테고리</th>
                      <td colspan="3"><input type="text" class="form-control col-sm-8 float-left" id="main_category" name="main_category" value="<?php echo $data['main_category'];?>" /></td>
                    </tr>
                    <tr>
                      <th>사용여부</th>
                      <td colspan="3">
                        <div class="checkbox">
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="status" value="Y" <?php echo $data['status']=='Y'?"checked":"checked";?>/> 사용
                          </label>
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="status" value="N" <?php echo $data['status']=='N'?"checked":"";?>/> 미사용
                          </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="card-footer">
                <button type="button" class="btn btn-default float-right" onclick="goList()">목록</button>
                <button type="button" class="btn btn-primary float-right" style="margin-right:10px;" onclick="save()">등록</button>
              </div>
            </form>
          </div>
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
$.datepicker.regional['ko'] = {
    closeText: '닫기',
    prevText: '이전달',
    nextText: '다음달',
    currentText: 'X',
    monthNames: ['1월(JAN)','2월(FEB)','3월(MAR)','4월(APR)','5월(MAY)','6월(JUN)',
    '7월(JUL)','8월(AUG)','9월(SEP)','10월(OCT)','11월(NOV)','12월(DEC)'],
    monthNamesShort: ['1월','2월','3월','4월','5월','6월',
    '7월','8월','9월','10월','11월','12월'],
    dayNames: ['일','월','화','수','목','금','토'],
    dayNamesShort: ['일','월','화','수','목','금','토'],
    dayNamesMin: ['일','월','화','수','목','금','토'],
    weekHeader: 'Wk',
    dateFormat: 'yy-mm-dd',
    firstDay: 0,
    isRTL: false,
    showMonthAfterYear: true,
    yearSuffix: ''};
   $.datepicker.setDefaults($.datepicker.regional['ko']);

   $('.date').datepicker({
     changeMonth: true,
     changeYear: true,
     showButtonPanel: true,
     yearRange: 'c-99:c+99',
     minDate: '',
     maxDate: ''
  });

  $(function(){
    $('.select2').select2();
    main_category_chk();

  });

  function main_category_chk()
  {
    var main_type = $('input[name=main_type]:checked').val();
    if(main_type == "HOT"){
      $('#main_category').attr("disabled",true);
    }else{
      $('#main_category').attr("disabled",false);
    }
  }

  function goList(){
    location.href="/admin/configAdm/mainList";
  }

  function save()
  {
    var class_code = $('#class_course_code').val();
    var course_code = $('#class_course_code').find('option:selected').data("course_code");
    var url = $('#class_course_code').find('option:selected').data("url");

    if(class_code==""){
      alert("과정을 선택해주세요");
      return
    }

    if(course_code == ""){
      alert("과정을 선택해주세요");
      return
    }

    $('#course_code').val(course_code);
    $('#url').val(url);
    $('#class_code').val(class_code);


    $('#courseClassForm').submit();
  }

  function setTitle($obj)
  {
    var txt = $('#class_course_code option:checked').text();
    $('#title').val(txt);
  }

</script>
