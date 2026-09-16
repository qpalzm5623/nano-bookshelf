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
            <option value="<?php echo sprintf('%02d',($i+1)); ?>" <?php echo ($month==($i+1)) ? "selected": ""; ?>><?php echo ($i+1)."월" ?></option>
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
                    <span style="font-size:larger;">총 회원</span> <span class="float-right" style="font-size:larger;" id="member_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;" id="month_total_title"><?php echo $month ?>월 신규회원</span> <span class="float-right" style="font-size:larger;" id="month_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">탈퇴회원</span> <span class="float-right" style="font-size:larger;" id="leave_total">0</span>
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

  var data = {
    "year"  : year,
    "month" : month,
    "user_type" : "teacher"
  };

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/insight/loadMemberInsight",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      var day_total = new Date(year,month,0).getDate();

      console.log(data);


      var total_num = Number(data.data.all_total);
      var dayData = data.data.day_total;

      var label_arr = [];
      var data_arr = [];
      var total_data = [];

      var month_total = 0;

      for(var i = 0; i<day_total; i++){
        label_arr.push((i+1)+"일");

        var member_num = 0;
        for(var j=0; j<dayData.length; j++){
          if(dayData[j].day == (i+1)){
            member_num = Number(dayData[j].cnt);
          }
        }

        month_total += member_num;

        data_arr.push(member_num);
      }

      for(var j = 0; j<day_total; j++){
        total_num += data_arr[j];
        total_data.push(total_num);
      }

      $('#member_total').text(total_num);
      $('#month_total').text(month_total);
      $('#month_total_title').text(month+"월 신규회원");
      $('#leave_total').text(data.data.leave_total);


      mixedChart = new Chart(ctx, {
          type:'bar',
          data: {
              datasets: [{
                  type: 'bar',
                  label: '일별 회원수',
                  data: data_arr,
                  backgroundColor: 'rgb(255, 153, 0)',
                  borderColor: 'rgb(255, 153, 0)'
              }, {
                  type: 'line',
                  label: '총 회원수',
                  data: total_data,
                  fill : false,
                  borderColor: 'rgb(255, 204, 0)'
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
