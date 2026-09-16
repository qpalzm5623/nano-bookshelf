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
        <ul class="nav nav-tabs" id="custom-tabs-one-tab" role="tablist">
          <li class="nav-item">
            <a class="nav-link <?php echo $mode=="terms"?"active":"";?>" id="custom-tabs-one-home-tab" href="/admin/configAdm/terms/terms" role="tab" aria-controls="custom-tabs-one-home" aria-selected="true">사이트 이용약관</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $mode=="privacy"?"active":"";?>" id="custom-tabs-one-profile-tab" href="/admin/configAdm/terms/privacy" role="tab" aria-controls="custom-tabs-one-profile" aria-selected="false">개인정보처리방침 이용약관</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $mode=="course"?"active":"";?>" id="custom-tabs-one-messages-tab" href="/admin/configAdm/terms/course" role="tab" aria-controls="custom-tabs-one-messages" aria-selected="false">수강유의약관</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $mode=="exam"?"active":"";?>" id="custom-tabs-one-settings-tab" href="/admin/configAdm/terms/exam" role="tab" aria-controls="custom-tabs-one-settings" aria-selected="false">시험응시 약관</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo $mode=="refund"?"active":"";?>" id="custom-tabs-one-settings-tab" href="/admin/configAdm/terms/refund" role="tab" aria-controls="custom-tabs-one-settings" aria-selected="false">환불 규정</a>
          </li>          
        </ul>   
      <div class="row">
        <!-- left column -->
        <div class="col-md-12">
          <!-- general form elements -->
          <div class="card card-primary">
            <!-- form start -->
            <form role="form" id="mainForm" enctype="multipart/form-data" action="/admin/configAdm/termsProc" method="POST">
              <input type="hidden" id="csrf" name="<?php echo $this->security->get_csrf_token_name();?>" value="<?php echo $this->security->get_csrf_hash();?>"/>
              <input type="hidden" id="mode" name="mode" value="<?php echo $mode;?>"/>
              <div class="card-body">
                <h4 style="color:#007bff;">
                <?php 
                    if($mode=="terms")
                        echo "사이트 이용약관";
                    else if($mode=="privacy")
                        echo "개인정보처리방침 이용약관";
                    else if($mode=="privacy")
                        echo "개인정보처리방침 이용약관";
                    else if($mode=="course")
                        echo "수강유의약관";
                    else if($mode=="exam")
                        echo "시험응시 약관";
                    else if($mode=="refund")
                        echo "환불규정";
                ?>    
                </h4>
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <colgroup width="15%" />
                  <colgroup width="35%" />
                  <tbody>
                    <tr>
                      <td colspan="4">
                        <textarea class="form-control" name="contents" id="contents" style="display:none;"><?php echo $contents;?></textarea>
                        <script type="text/javascript" src="/assets/admin_resources/editor/js/HuskyEZCreator.js" charset="utf-8"></script>
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
    location.href="/admin/operationAdm/courseClassList";
  }

  function save()
  {
      oEditors.getById["contents"].exec("UPDATE_CONTENTS_FIELD", []);
      $('#mainForm').submit();
  }

</script>