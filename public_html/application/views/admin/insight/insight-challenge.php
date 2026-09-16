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
          <select class="form-control col-3 float-right select2" style="margin:5px 5px 5px 5px;" name="school_seq" id="school_seq">
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
                <?php for($i=0; $i<count($challengeList); $i++){ ?>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;"><?php echo $challengeList[$i]['challenge_title']; ?></span> <span class="float-right" style="font-size:larger;" id="challenge_<?php echo $i; ?>">0</span>
                  </span>
                </li>
                <?php } ?>
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
    url : "/admin/insight/loadChallengeInsight",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      var challengeArr = data.data.challengeList;
      var challenge_total = data.data.challenge_total;

      var colorArr = [
        'rgb(255, 204, 229)',
        'rgb(229, 204, 255)',
        'rgb(204, 204, 255)',
        'rgb(153, 204, 255)',
        'rgb(153, 255, 204)',
        'rgb(204, 255, 153)',
        'rgb(255, 204, 153)',
        'rgb(255, 153, 153)',
        'rgb(102, 0, 204)',
        'rgb(204, 0, 102)',
      ];

      var dataSet = [];
      var challengeData = [];
      var challengeTotal = [];
      var day_total = new Date(year,month,0).getDate();
      var label_arr = [];

      for(var i = 0; i<day_total; i++){
        label_arr.push((i+1)+"일");
      }

      for(var i=0; i<challengeArr.length; i++){
        challengeData[i] = [];
        var total = 0;
        for(var j=0; j<day_total; j++){
          var num = 0;

          for(var t=0; t<challenge_total.length; t++){
            if(challenge_total[t].day == (j+1) && challengeArr[i].challenge_title == challenge_total[t].challenge_title){
              num = Number(challenge_total[t].cnt);
            }
          }
          total += num;

          challengeData[i].push(num);
        }

        challengeTotal.push(total);

        var obj = {
            type: 'line',
            label: challengeArr[i].challenge_title,
            data: challengeData[i],
            fill : false,
            borderColor: colorArr[i]
        };
        dataSet.push(obj);
        $('#challenge_'+i).text(challengeTotal[i]);
      }

      mixedChart = new Chart(ctx, {
          type:'bar',
          data: {
              datasets: dataSet,
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

      console.log(challengeTotal);
      return


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
