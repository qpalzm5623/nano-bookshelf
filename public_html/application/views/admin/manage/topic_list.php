<script src="https://cdnjs.cloudflare.com/ajax/libs/TableDnD/0.9.1/jquery.tablednd.js" integrity="sha256-d3rtug+Hg1GZPB7Y/yTcRixO/wlI78+2m08tosoRn7A=" crossorigin="anonymous"></script>

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
                
    <form method="post" name="listForm" id="listForm">
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>        
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <div class="card-body table-responsive p-0">
                <div class="form-group">

                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="30%"/>
                      <col width="20%"/>
                      <col width="30%"/>
                      <col width="20%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">주제별</th>
                        <th class="text-center">등록 도서 수</th>
                        <th class="text-center">이미지</th>
                        <th class="text-center">노출여부</th>
                      </tr>
                    </thead>
                    <tbody id="topic_list">
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr onclick="goModify('{code_seq}')" style="cursor:pointer">
                        <td class="text-center align-middle">{code_name}</td>
                        <td class="text-center align-middle">{code_count}</td>
                        <td class="text-center align-middle"><image src="/upload/code/{code_image}" style="height:200px;"></td>
                        <td class="text-center align-middle">
                            {code_status}
                            <input type="hidden" name="code_seq[]" value="{code_seq}">
                        </td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">조회된 책주제가 없습니다.</td>
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

              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-primary" onclick="writeBtn()">주제 등록</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-primary" onclick="sortBtn()">순서 저장</button>
              </span>              
            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
    </form>
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
  function goModify($seq)
  {
      location.href="topic_write/"+$seq;
  }
  function sortBtn() 
  {
      var data = $('#listForm').serialize();

      $.ajax({
        type: "POST",
        url : "/admin/manage/updateToic",
        data: data,
        dataType:"json",
        success : function(data, status, xhr) {
          alert("저장되었습니다.");
          location.reload();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
        }
      });     
  }

  function writeBtn()
  {
    location.href="topic_write";
  }

  function academiExcelWrite()
  {
    window.open("banner_excel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  $(document).ready(function() {
    $("#topic_list").tableDnD({
        onDragClass: "myDragClass",
        onDrop: function(table, row) {
            var rows = table.tBodies[0].rows;
        },
        onDragStart: function(table, row) {

        }
    });  
  });  
</script>
