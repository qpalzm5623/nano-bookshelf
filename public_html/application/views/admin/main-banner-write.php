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
            <form role="form" id="mainBannerWriteForm" enctype="multipart/form-data" action="{base_url}admin/mainBannerWriteProc" method="POST">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body">
                <table class="table table-bordered">
                  <colgroup width="15%" />
                  <colgroup width="" />
                  <tbody>
                    <tr>
                      <th><small style="color:red">*</small> 언어</th>
                      <td>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="language" value="kor" checked/> 한국어
                        </label>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="language" value="eng"/> 영어
                        </label>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="language" value="chn"/> 중국어
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <th><small style="color:red">*</small> 노출위치</th>
                      <td>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="view_location" value="top" checked/> 상단배너
                        </label>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="view_location" value="new"/> NEW PRODUCT
                        </label>
                      </td>
                    </tr>                    
                    <tr>
                      <th><small style="color:red">*</small> 제목</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="b_title" id="b_title"/>
                      </td>
                    </tr>
                    <tr>
                      <th>설명글</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="b_description" id="b_description"/>
                      </td>
                    </tr>
                    
                    <tr class="top_tr">
                      <th><small style="color:red">*</small> 게시기간</th>
                      <td style="vertical-align:middle;">
                        <input type="text" class="form-control col-sm-1 date float-left" name="b_start_date" id="b_start_date" placeholder="yyyy-mm-dd"/>
                        <select class="form-control col-sm-1 float-left" style="margin-left:5px; margin-right:5px;" name="b_start_h">
                          <?php
                            for($i=0;$i<24;$i++){
                              if( $i < 10 ){
                                $h = "0".$i;
                              }else{
                                $h = $i;
                              }
                          ?>
                            <option value="<?php echo $h; ?>"><?php echo $h."시"; ?></option>
                          <?php } ?>
                        </select>
                        <select class="form-control col-sm-1 float-left" name="b_start_m">
                            <option value="00">00분</option>
                            <option value="30">30분</option>
                        </select>
                        <label class="float-left">&nbsp;~&nbsp;</label>
                        <input type="text" class="form-control col-sm-1 date float-left" name="b_end_date" id="b_end_date" placeholder="yyyy-mm-dd"/>
                        <select class="form-control col-sm-1 float-left" style="margin-left:5px; margin-right:5px;" name="b_end_h">
                          <?php
                            for($i=0;$i<24;$i++){
                              if( $i < 10 ){
                                $h = "0".$i;
                              }else{
                                $h = $i;
                              }
                          ?>
                            <option value="<?php echo $h; ?>"><?php echo $h."시"; ?></option>
                          <?php } ?>
                        </select>
                        <select class="form-control col-sm-1 float-left" name="b_end_m">
                            <option value="00">00분</option>
                            <option value="30">30분</option>
                        </select>


                      </td>
                    </tr>
                    <tr  class="top_tr">
                      <th><small style="color:red">*</small> 이미지</th>
                      <td>
                        <input type="file" class="form-control col-sm-4" id="b_image" name="b_image"> * PC용 사이즈 : 500 x 360 /  파일형식 : JPG, PNG / 용량 : 2MB 이하
                      </td>
                    </tr>
                    <tr  class="top_tr">
                      <th><small style="color:red">*</small> 링크</th>
                      <td>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="b_target" value="_self" checked/> 본창
                        </label>
                        <label style="margin-left:5px; margin-top:5px;">
                          <input type="radio" name="b_target" value="_blank"/> 새창
                        </label>
                        <input type="text" class="form-control col-sm-4 float-left" name="b_link" id="b_link"/>
                      </td>
                    </tr>
                    <tr  class="top_tr">
                      <th><small style="color:red">*</small> 노출순서</th>
                      <td>
                        <input type="text" class="form-control col-sm-4 float-left" name="sort_order" id="sort_order" value="1"/>
                        숫자가 작을수록 앞에 노출됩니다.
                      </td>
                    </tr>    
                    <tr class="new_tr" style="display:none;">
                      <input type="hidden" name="new_products" id="new_products"/>
                      <th>선택 프로덕트</th>
                      <td>
                        <div class="row">
                          <div class="col">
                            <button type="button" class="btn btn-default col-sm-1" data-toggle="modal" data-target="#new_product_modal">추가</button>
                          </div>
                        </div>
                        <div class="row" id="new_choice_item">

                        </div>
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
<!--선택 브랜드 팝업 -->
<div class="modal fade" id="new_product_modal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">상품 추가</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
        <div class="form-group">
          <button type="button" class="form-control col-2 btn btn-block btn-success float-right" style="margin:5px 5px 5px 5px;" onclick="loadProducts()">검색</button>
          <input type="text" class="form-control col-4 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN1" value="" placeholder="검색">
          <select class="form-control  float-right" style="margin:5px 5px 5px 5px;width:100px;" name="srcType" id="srcType1">
            <option value="all" selected>전체</option>
            <option value="brand">브랜드</option>
            <option value="name">상품명</option>
          </select>
        </div>      
      <div class="modal-body" id="new-product-items">

      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" onclick="addNewProduct()">추가</button>
      </div>
    </div>
  </div>
</div>

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


  $(function(){
       $('.date').datepicker({
         changeMonth: true,
         changeYear: true,
         showButtonPanel: true,
         yearRange: 'c-99:c+99',
         minDate: '',
         maxDate: ''
      });
      
       $("input[name=view_location]").on("change",function(){
           if($("input[name=view_location]:checked").val() =="new") {
               $('.top_tr').hide();
               $('.new_tr').show();
           } else {
               $('.top_tr').show();
               $('.new_tr').hide();
           }
       });

  });

  function goList()
  {
    location.href="{base_url}admin/mainBannerList";
  }

  function writeProc()
  {
    $('#new_products').val(new_choice_item_arr.join("|"));
    
    $('#mainBannerWriteForm').submit();

  }
  

  var new_item_arr = [];
  var new_choice_item_arr = [];


  function addNewProduct()
  {
    var arr = [];
    
      var html = "";
      $("input[name='newProductItems']:checked").each(function(index){
        
        arr.push($(this).val());
        var i = $(this).val();
        var info = $(this).data('info')
        var infoArray = $(this).data('info').split("||");
        //console.log($(this).data('info'));
        html += '<div class="col-lg-3 justify-content-center text-center" id="new_'+i+'" data-names="'+new_choice_item_arr[i]+'">';
        html += '<img src="/upload/product/'+infoArray[0]+'" style="width:100px;height:100px">['+infoArray[1]+']'+infoArray[2]+" <a href='#' onclick='delNewProduct(\""+i+"\")'>[x]</a>";
        html += '</div>';        

      });
      new_choice_item_arr = arr;

      

      //for( var i = 0; i < week_choice_item_arr.length; i++ ){
      //  html += '<div class="col-lg-3 justify-content-center text-center" id="week_'+i+'" data-names="'+week_choice_item_arr[i]+'">';
      //  html += week_choice_item_arr[i]+" <a href='#' onclick='delWeekBrand(\""+i+"\")'>[x]</a>";
      //  html += '</div>';
      //}

      $('#new_choice_item').html(html);
      $('#new_product_modal').modal('hide');
  }

  function delNewProduct($num)
  {
    $('div').remove("#new_"+$num);
  }
  

  function loadProducts()
  {

 
    var formData = {
      "<?=$this->security->get_csrf_token_name();?>" : "<?=$this->security->get_csrf_hash();?>",
      "srcN":$('#srcN').val(),
      "srcType":$('#srcType option:selected').val(),
      "language":$('input[name=language]:checked').val(),
    };        
    
    $('#new-product-items').html('');

    $.ajax({
      type: "POST",
      url : "{base_url}admin/getProductsList",
      data : formData,
      dataType:"json",
      success : function(data, status, xhr) {
        new_item_arr = data;
        hot_item_arr = data;

        for( var i = 0; i < new_item_arr.length; i++ ){
          var html = "";
          if( i > 0 ){
            html += '<hr />';
          }
          html += '<div class="form-group form-check">';
          html += '<input type="checkbox" class="form-check-input" name="newProductItems" id="new_product_'+new_item_arr[i].seq+'" value="'+new_item_arr[i].seq+'"  data-info="'+new_item_arr[i].brand_seq+'/'+new_item_arr[i].thumb_name+'||'+new_item_arr[i].brand_name+'||'+new_item_arr[i].product_name+'">';
          html += '<label class="form-check-label" for="new_product_'+new_item_arr[i].seq+'"><img src="/upload/product/'+new_item_arr[i].brand_seq+'/'+new_item_arr[i].thumb_name+'"  style="width:60px;height:60px"></label>';
          html += '<label class="form-check-label" for="new_product_'+new_item_arr[i].seq+'">['+new_item_arr[i].brand_name+']</label>';
          html += '<label class="form-check-label" for="new_product_'+new_item_arr[i].seq+'">'+new_item_arr[i].product_name+'</label>';
          html += '</div>';

          $('#new-product-items').append(html);
 

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR.responseText);
      }
    });
  }
  
</script>
