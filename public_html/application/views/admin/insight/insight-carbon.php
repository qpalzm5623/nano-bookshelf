<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="location" id="location" onchange="loadChart()">
            <option value="all">전국</option>
            <?php for($i=0; $i<count($locationData); $i++){ ?>
            <option value="<?php echo ($locationData[$i]['value']); ?>"><?php echo $locationData[$i]['value']; ?></option>
            <?php } ?>
          </select>
          <?php if($this->session->userdata("admin_level")==0){ ?>
          <select class="form-control col-3 float-right select2" style="margin:5px 5px 5px 5px;" name="school_seq" id="school_seq" onchange="loadChart()">
            <option value="all">기관</option>
            <?php for($i=0; $i<count($schoolList); $i++){ ?>
              <option value="<?php echo $schoolList[$i]['school_seq']; ?>"><?php echo $schoolList[$i]['school_name'];?></option>
            <?php } ?>
          </select>
          <?php }else{ ?>
            <input type="hidden" name="school_seq" id="school_seq" value="<?php echo $this->session->userdata("school_seq"); ?>"/>
          <?php } ?>
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="year" id="year" onchange="loadChart()">
            <?php for($i=2023; $i <= date("Y");$i++) {?>
                <option value="<?php echo $i;?>" <?php echo ($year==$i) ? "selected": ""; ?>><?php echo $i;?>년</option>    
            <?php }?>
          </select>
          <select class="form-control col-2 float-left" style="margin:5px 5px 5px 5px;" name="month" id="month" onchange="loadChart()">
            <?php for($i=0; $i<12; $i++){ ?>
            <option value="<?php echo sprintf('%02d',($i+1)); ?>" <?php echo date("m")==sprintf('%02d',($i+1))?"selected":"" ?>><?php echo ($i+1)."월" ?></option>
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
                    <span style="font-size:larger;">총 절감한 탄소량</span> <span class="float-right" style="font-size:larger;" id="carbon_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">일 평균 절감 탄소량</span> <span class="float-right" style="font-size:larger;" id="per_num">0</span>
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
  loadChart();
  $('.select2').select2();
  $('.select2').css("float","left");
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
    url : "/admin/insight/loadCarbonInsight",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      var day_total = new Date(year,month,0).getDate();
      console.log(data);

      if(data.data.carbon_total.carbo_total==null){
        data.data.carbon_total.carbo_total = 0;
      }

      var total_num = Number(data.data.carbon_total.carbon_total);
      var dayData = data.data.carbon_data;

      var label_arr = [];
      var data_arr = [];

      for(var i = 0; i<day_total; i++){
        label_arr.push((i+1)+"일");

        var carbon_num = 0;
        for(var j=0; j<dayData.length; j++){
          if(dayData[j].day == (i+1)){
            carbon_num = Number(dayData[j].cnt);
          }
        }

        data_arr.push(carbon_num);
      }

      $('#carbon_total').text(total_num+" kg");
      $('#per_num').text(data.data.per_num+" kg");

      mixedChart = new Chart(ctx, {
          type:'bar',
          data: {
              datasets: [{
                  type: 'bar',
                  label: '일별 절감량',
                  data: data_arr,
                  backgroundColor: 'rgb(255, 153, 0)',
                  borderColor: 'rgb(255, 153, 0)'
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
