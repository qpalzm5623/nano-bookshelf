<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
.bg-lightgray{background:#efefef}
.mt-3 {font-size:25pt}
.widget-user .widget-user-header {
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    height: auto; 
    padding: 1rem;
    text-align: center;
}
</style>
<div class="content">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          {title}
        </div>
        <div class="col-sm-6">
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <input type="hidden" id="user_seq" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
  <section class="content">
      <div class="container-fluid">
          <p>* <?php echo $data['user_name'];?>(<?php echo $data['group_name'];?>)</p>
          <div class="card card-primary">
              <div class="card-body">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="35%"/>
                      <col width="35%"/>
                      <col width="30%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center bg-lightgray">날짜</th>
                        <th class="text-center bg-lightgray">내역</th>
                        <th class="text-center bg-lightgray">포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list}
                      <tr  style="cursor:pointer">
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle">{content}</td>
                        <td class="text-center align-middle">{point}</td>
                      </tr>
                      {/list}                                
                    </tbody>
                  </table>
                </table>
              </div>
          </div>
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
      <span class="float-right" style="margin-right:5px;">
        <button type="button" class="btn btn-block btn-primary" onclick="window.close()">닫기</button>
      </span>
            </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->

  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->