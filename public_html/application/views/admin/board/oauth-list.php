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
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                  <button type="button" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn" onclick="search(this)">검색</button>
                  <input type="text" class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="<?php echo $this->input->get('srcN'); ?>"/>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="oauth_yn" id="oauth_yn">
                    <option value="all" <?php echo ($oauth_yn=="all") ? "selected": ""; ?>>서약서</option>
                    <option value="Y" <?php echo ($oauth_yn=="Y") ? "selected": ""; ?>>서약</option>
                    <option value="N" <?php echo ($oauth_yn=="N") ? "selected": ""; ?>>미서약</option>
                  </select>
                  <?php if($this->session->userdata("admin_level")<=1){ ?>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="school_class" id="school_class">
                    <option value="all" <?php echo ($school_class=="all") ? "selected": ""; ?>>전체</option>
                    <?php for($i=0; $i<count($classList); $i++){ ?>
                    <option value="<?php echo $classList[$i]['school_class']; ?>" <?php echo ($classList[$i]['school_class']==$school_class) ? "selected": ""; ?>><?php echo $classList[$i]['school_class']; ?></option>
                    <?php } ?>
                  </select>
                  <?php }else{ ?>
                    <input type="hidden" name="school_class" id="school_class" value="<?php echo $this->session->userdata("school_class"); ?>"/>
                  <?php } ?>
                  <?php if($this->session->userdata("admin_level")<=1){ ?>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="school_year" id="school_year">
                    <option value="all" <?php echo ($school_year=="all") ? "selected": ""; ?>>전체</option>
                    <?php for($i=0; $i<6; $i++){ ?>
                    <option value="<?php echo ($i+1); ?>" <?php echo ($school_year==($i+1)) ? "selected": ""; ?>><?php echo ($i+1)."학년" ?></option>
                    <?php } ?>
                    <option value="None" <?php echo ($school_year=="None") ? "selected": ""; ?>>None</option>
                  </select>
                <?php }else{ ?>
                  <input type="hidden" name="school_year" id="school_year" value="<?php echo $this->session->userdata("school_year"); ?>"/>
                <?php } ?>
                  <?php if($this->session->userdata("admin_level")==0){ ?>
                  <select class="form-control col-2 float-right select2" style="margin:5px 5px 5px 5px;" name="school_seq" id="school_seq">
                    <option value="all" <?php echo ($school_seq=="all") ? "selected": ""; ?>>기관</option>
                    <?php for($i=0; $i<count($schoolList); $i++){ ?>
                      <option value="<?php echo $schoolList[$i]['school_seq']; ?>"><?php echo $schoolList[$i]['school_name'];?></option>
                    <?php } ?>
                  </select>
                  <?php }else{ ?>
                    <input type="hidden" name="school_seq" id="school_seq" value="<?php echo $this->session->userdata("school_seq"); ?>"/>
                  <?php } ?>
                  <select class="form-control col-1 float-right" style="margin:5px 5px 5px 5px;" name="location" id="location">
                    <option value="all" <?php echo ($location=="all") ? "selected": ""; ?>>지역</option>
                    <?php for($i=0; $i<count($locationData); $i++){ ?>
                    <option value="<?php echo ($locationData[$i]['value']); ?>" <?php echo ($location==$locationData[$i]['value']) ? "selected": ""; ?>><?php echo $locationData[$i]['value']; ?></option>
                    <?php } ?>
                  </select>
                  <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="5%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">#</th>
                        <th class="text-center">아이디</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">학교</th>
                        <th class="text-center">학년</th>
                        <th class="text-center">반</th>
                        <th class="text-center">서약여부</th>
                        <th class="text-center">서약서</th>
                        <th class="text-center">서약일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($oauthList) > 0 ){ ?>
                      <?php for($i=0; $i<count($oauthList); $i++){ ?>
                      <tr>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['count'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['user_id'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['user_name'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['school_name'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['school_year'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['school_class'] ?></td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['oauth_yn_txt'] ?></td>
                        <td class="text-center align-middle">
                          <?php if($oauthList[$i]['oauth_yn']=="Y"){ ?>
                            <button type="button" class="btn btn-default" onclick="printPop('<?php echo $oauthList[$i]['oauth_seq']; ?>')">서약서</button>
                          <?php }else{ ?>
                            -
                          <?php } ?>
                          </td>
                        <td class="text-center align-middle"><?php echo $oauthList[$i]['oauth_reg_date'] ?></td>
                      </tr>
                      <?php } ?>
                      <?php } else { ?>
                      <tr>
                        <td class="text-center align-middle" colspan="9">서약서가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
              <span class="float-right">
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀다운로드</button>
              </span>
            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
$(function(){
  $('.select2').select2();
  $('.select2').css("float","right");
})
  function goModify($seq)
  {
      location.href="/admin/{boardType}NoticeView/"+$seq;
  }

  function writeBoard()
  {
    location.href="/admin/{boardType}NoticeWrite?boardType={boardType}";
  }

  function printPop($oauth_seq)
  {
    window.open("/admin/etcAdm/oauthPrintPop/"+$oauth_seq,"oauthPrintPop","width=782, height=851");
  }

  function excelDownload()
  {
    location.href="/admin/etcAdm/oauthDownLoad{param}";
  }
</script>
