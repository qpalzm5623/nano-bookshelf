<!-- Ion Slider -->
<link rel="stylesheet" href="/css/ion.rangeSlider.min.css">
<!-- iCheck for checkboxes and radio inputs -->
<link rel="stylesheet" href="/css/icheck-bootstrap.min.css">
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-6">
          <div class="card">
            <!-- /.card-header -->
              <table class="table">
                <colgroup>
                  <col width="5%"/>
                  <col/>
                  <col width="10%"/>
                </colgroup>
                <tbody>
                  <tr>
                    <th class="text-left align-middle">전체</th>
                    <td class="text-left align-middle">
                      <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">
                        </div>
                      </div>
                    </td>
                    <td class="text-left align-middle">
                      <?php echo $oauthData['oauthTotal'] ?>
                    </td>
                  </tr>
                  <?php for($i=0; $i<count($oauthData['oauthList']); $i++){ ?>
                    <tr>
                      <th class="text-left align-middle"><?php echo $oauthData['oauthList'][$i]['value']; ?></th>
                      <td class="text-left align-middle">
                        <div class="progress">
                          <div class="progress-bar bg-warning" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $oauthData['oauthList'][$i]['per']; ?>%">
                          </div>
                        </div>
                      </td>
                      <td class="text-left align-middle numbers"><?php echo $oauthData['oauthList'][$i]['cnt']; ?></td>
                    </tr>
                  <?php } ?>
                  <tr>
                    <th class="text-left align-middle">기타</th>
                    <td class="text-left align-middle">
                      <div class="progress">
                        <div class="progress-bar bg-warning" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $noOauthPer; ?>%">
                        </div>
                      </div>
                    </td>
                    <td class="text-left align-middle numbers"><?php echo $noOauthTotal; ?></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- /.card-body -->

        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->

</div>

<script>
$(function(){
  $('.numbers').each(function(d){
    var num = $(this).text();
    if( num == 0){
      $(this).text(0);
    }else{
      $(this).text(numberToKorean(num));
    }

  });
});

function numberFormat(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToKorean(number){
    var inputNumber  = number < 0 ? false : number;
    var unitWords    = ['', 'k', 'm'];
    var splitUnit    = 1000;
    var splitCount   = unitWords.length;
    var resultArray  = [];
    var resultString = '';

    for (var i = 0; i < splitCount; i++){
        var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
        unitResult = Math.floor(unitResult);
        if (unitResult > 0){
            resultArray[i] = unitResult;
        }
    }

    for (var i = 0; i < resultArray.length; i++){
        if(!resultArray[i]) continue;
        resultString = String(numberFormat(resultArray[i])) + unitWords[i];
    }

    return resultString;
}
</script>
