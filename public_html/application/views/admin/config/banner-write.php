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
            <form role="form" id="courseClassForm" enctype="multipart/form-data" action="/admin/configAdm/bannerProc" method="POST">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" id="seq" name="seq" value="<?php echo $seq;?>"/>
              <div class="card-body">
                <h4 style="color:#007bff;">정보 입력</h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <th>제목</th>
                      <td colspan="3"><input type="text" class="form-control col-sm-8 float-left" id="banner_title" name="banner_title" value="<?php echo $data['banner_title'];?>" /></td>
                    </tr>
                    <tr>
                      <th>URL</th>
                      <td colspan="3"><input type="text" class="form-control col-sm-16 float-left" id="banner_url" name="banner_url"  value="<?php echo $data['banner_url'];?>"/></td>
                    </tr>
                    <tr>
                      <th>TARGET</th>
                      <td colspan="3">
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="banner_target" value="_self" <?php echo $data['banner_target']=='_self'?"checked":"checked";?>/> 현재창
                          </label>
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="banner_target" value="_blank" <?php echo $data['banner_target']=='_blank'||$data['banner_target']==''?"checked":"";?>/> 새창
                          </label>
                      </td>
                    </tr>
                    <tr>
                      <th>사용기간</th>
                      <td colspan="3"><input type="text" class="form-control date" id="start_date" name="start_date"  value="<?php echo $data['start_date']?substr($data['start_date'],0,10):'';?>" style="display:unset; width:150px;" readonly/> ~ <input type="text" class="form-control date" id="end_date" name="end_date" style="display:unset; width:150px;" value="<?php echo $data['end_date']?substr($data['end_date'],0,10):'';?>" readonly/></td>
                    </tr>
                    <tr>
                      <th>위치</th>
                      <td colspan="3">
                        <div class="checkbox">
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="banner_pos" value="main_big" <?php echo $data['banner_pos']=='main_big'?"checked":"checked";?>/> 메인 Big배너
                          </label>
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="banner_pos" value="main_middle" <?php echo $data['display_yn']=='main_middle'?"checked":"";?>/> 매인중간배너
                          </label>
                      </td>
                    </tr>

                    <tr>
                      <th>사용여부</th>
                      <td colspan="3">
                        <div class="checkbox">
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="display_yn" value="Y" <?php echo $data['display_yn']=='Y'?"checked":"checked";?>/> 사용
                          </label>
                          <label style="margin-left:5px; margin-top:5px;">
                            <input type="radio" name="display_yn" value="N" <?php echo $data['display_yn']=='N'?"checked":"";?>/> 미사용
                          </label>
                      </td>
                    </tr>
                    <tr>
                      <th>내용</th>
                      <td colspan="3">
                        <textarea class="form-control" name="contents" id="contents" style="display:none;"><?php echo $data['contents'];?></textarea>
                        <script type="text/javascript" src="/assets/admin_resources/editor/js/HuskyEZCreator.js" charset="utf-8"></script>
                      </td>
                    </tr>
                    <tr>
                      <th>이미지</th>
                      <td>
                        <input type="file" name="image" id="image" class="form-control"/>
                        <input type="hidden" name="image_org" value="<?php echo $data['image'] ? $data['image']:"" ?>"/>
                      </td>
                      <td colspan="2">
                        <?php echo $data['image'] ? $data['image']:"" ?>
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
var oEditors = [];
nhn.husky.EZCreator.createInIFrame({
    oAppRef: oEditors,
    elPlaceHolder: "contents",
    sSkinURI: "/assets/admin_resources/editor/SmartEditor2Skin.html",
    fCreator: "createSEditor2",
});

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
  });

  function goList(){
    location.href="/admin/configAdm/bannerList";
  }

  function save()
  {
    oEditors.getById["contents"].exec("UPDATE_CONTENTS_FIELD", []);

    $('#courseClassForm').submit();
  }

</script>
