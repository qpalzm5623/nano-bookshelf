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
                    <span style="font-size:larger;">뉴스기사</span> <span class="float-right" style="font-size:larger;" id="news_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">퀴즈컨텐츠</span> <span class="float-right" style="font-size:larger;" id="quiz_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">미니게임</span> <span class="float-right" style="font-size:larger;" id="game_total">0</span>
                  </span>
                </li>
                <li class="nav-item">
                  <span class="nav-link">
                    <span style="font-size:larger;">영상</span> <span class="float-right" style="font-size:larger;" id="movie_total">0</span>
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
    url : "/admin/etcAdm/loadPlayInsight",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {

      var day_total = new Date(year,month,0).getDate();
      var newsData = data.data.news_total;
      var quizData = data.data.quiz_total;
      var gameData = data.data.game_total;
      var movieData = data.data.movie_total;


      var news_arr = [];
      var quiz_arr = [];
      var game_arr = [];
      var movie_arr = [];

      var label_arr = [];

      var news_total = 0;
      var quiz_total = 0;
      var game_total = 0;
      var movie_total = 0;

      for(var i = 0; i<day_total; i++){
        label_arr.push((i+1)+"일");
        var news_num = 0;
        var quiz_num = 0;
        var game_num = 0;
        var movie_num = 0;
        for(var j=0; j<newsData.length; j++){
          if(newsData[j].day == (i+1)){
            news_num = Number(newsData[j].cnt);
          }
        }
        news_total += news_num;
        news_arr.push(news_num);

        for(var t=0; t<quizData.length; t++){
          if(quizData[t].day == (i+1)){
            quiz_num = Number(quizData[t].cnt);
          }
        }
        quiz_total += quiz_num;
        quiz_arr.push(quiz_num);

        for(var s=0; s<gameData.length; s++){
          if(gameData[s].day == (i+1)){
            game_num = Number(gameData[s].cnt);
          }
        }
        game_total += game_num;
        game_arr.push(game_num);

        for(var d=0; d<movieData.length; d++){
          if(movieData[d].day == (i+1)){
            movie_num = Number(movieData[d].cnt);
          }
        }
        movie_total += movie_num;
        movie_arr.push(movie_num);
      }

      $('#news_total').text(news_total);
      $('#quiz_total').text(quiz_total);
      $('#game_total').text(game_total);
      $('#movie_total').text(movie_total);

      mixedChart = new Chart(ctx, {
          type:'bar',
          data: {
              datasets: [{
                  type: 'line',
                  label: '뉴스기사',
                  data: news_arr,
                  fill : false,
                  borderColor: 'rgb(255, 204, 229)'
              }, {
                  type: 'line',
                  label: '퀴즈컨텐츠',
                  data: quiz_arr,
                  fill : false,
                  borderColor: 'rgb(229, 204, 255)'
              }, {
                  type: 'line',
                  label: '미니게임',
                  data: game_arr,
                  fill : false,
                  borderColor: 'rgb(204, 229, 255)'
              }, {
                  type: 'line',
                  label: '영상',
                  data: movie_arr,
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
