<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="year" id="year" onchange="loadChart()">
            <?php for($i=2023; $i <= date("Y");$i++) {?>
                <option value="<?php echo $i;?>" <?php echo ($year==$i) ? "selected": ""; ?>><?php echo $i;?>년</option>    
            <?php }?>
          </select>
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="month" id="month" onchange="loadChart()">
            <?php for($i=0; $i<12; $i++){ ?>
            <option value="<?php echo sprintf('%02d',($i+1)); ?>" <?php echo date("m")==sprintf('%02d',($i+1)) ? "selected":"" ?>><?php echo ($i+1)."월" ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="#">Home</a></li>
            <li class="breadcrumb-item">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>
  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-8">
          <canvas id="chart" width="100%"></canvas>
        </div>
        <!-- /.col -->
        <!-- 회원현황 -->
        <div class="col-md-4">
          <!-- Widget: user widget style 2 -->
          <div class="card card-widget widget-user-2">
            <!-- Add the bg color to the header using any of the bg-* classes -->
            <div class="widget-user-header bg-warning">
              <!-- /.widget-user-image -->
              <h1 class="widget-user-username" style="margin-left:0">{title}</h1>
            </div>
            <div class="card-footer p-0">
              <ul class="nav flex-column">
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">Total</span> <span class="float-right" style="font-size:larger;" id="total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">신규</span> <span class="float-right" style="font-size:larger;" id="total_new">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">승인요청</span> <span class="float-right" style="font-size:larger;" id="total_request">0</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <!-- /.widget-user -->
        </div>
        <!-- /.col -->

      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.0.0/chart.min.js"></script>
<script>
var mixedChart;
var ctx = document.getElementById('chart').getContext('2d');
$(function(){
  $('.select2').select2();
  $('.select2').css("float","left");
  loadChart();

});

function loadChart()
{
  if (mixedChart !== undefined) {
    mixedChart.destroy();
  }
  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var year = $('#year').val();
  var month = $('#month').val();
  var school_seq = $('#school_seq').val();
  var location = $('#location').val();

  var data = {
    "year"  : year,
    "month" : month,
    "school_seq"  : school_seq,
    "location"  : location
  };

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/insight/loadQuizInsight",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {

      var day_total = new Date(year,month,0).getDate();
      var totalData = data.data.total;
      var totalNewData = data.data.total_new;
      var totalRequestData = data.data.total_request;


      var total_arr = [];
      var total_new_arr = [];
      var total_request_arr = [];

      var label_arr = [];

      var total = 0;
      var total_new_total = 0;
      var total_request = 0;

      for(var i = 0; i<day_total; i++){
        label_arr.push((i+1)+"일");
        var total_num = 0;
        var total_new_num = 0;
        var total_request_num = 0;
        for(var j=0; j<totalData.length; j++){
          if(totalData[j].day == (i+1)){
            total_num = Number(totalData[j].cnt);
          }
        }
        total += total_num;
        total_arr.push(total_num);

        for(var t=0; t<totalNewData.length; t++){
          if(totalNewData[t].day == (i+1)){
            total_new_num = Number(totalNewData[t].cnt);
          }
        }
        total_new_total += total_new_num;
        total_new_arr.push(total_new_num);

        for(var s=0; s<totalRequestData.length; s++){
          if(totalRequestData[s].day == (i+1)){
            total_request_num = Number(totalRequestData[s].cnt);
          }
        }
        total_request += total_request_num;
        total_request_arr.push(total_request_num);
      }

      $('#total').text(total);
      $('#total_new').text(total_new_total);
      $('#total_request').text(total_request);

      mixedChart = new Chart(ctx, {
          type:'bar',
          data: {
              datasets: [{
                  type: 'line',
                  label: 'Total',
                  data: total_arr,
                  fill : false,
                  borderColor: 'rgb(255, 204, 229)'
              }, {
                  type: 'line',
                  label: '신규',
                  data: total_new_arr,
                  fill : false,
                  borderColor: 'rgb(229, 204, 255)'
              },  {
                  type: 'line',
                  label: '승인요청',
                  data: total_request_arr,
                  fill : false,
                  borderColor: 'rgb(204, 255, 204)'
              }],
              labels: label_arr
          },
          options: {
              legend: {
                    },
              scales: {
                  // y축
                  yAxes: [{
                      stacked: true
                   }],
                   // x축
                   xAxes: [{
                       stacked: true
                   }]
              }
          }
      });
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}


  function changeYearMonth()
  {
    var year = $('#year').val();
    var month = $('#month').val();
  }
</script>
