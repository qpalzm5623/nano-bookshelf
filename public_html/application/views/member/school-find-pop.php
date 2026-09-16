
<!-- Content Wrapper. Contains page content -->
<div class="wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>기관검색</h1>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>
  <form id="contractForm" onsubmit="return false;">
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <table class="table table-hover">
              <colgroup>
                <col/>
                <col width="30%"/>
              </colgroup>
              <tbody id="search">
                <tr>
                  <th class="text-left align-middle"><input type="text" class="form-control col-sm-2 float-left" name="school_name" id="school_name" onkeyup="if (window.event.keyCode == 13) {search()}" value="<?php echo $school_name; ?>"/></th>
                  <td class="text-left align-middle">
                    <button type="button" class="btn btn-sm btn-default float-left col-sm-2" onclick="search()">검색</button>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            <!-- /.card-body -->

          <div class="card">
            <!-- /.card-header -->
            <table class="table table-hover">
              <colgroup>
                <col/>
                <col width="30%"/>
              </colgroup>
              <tbody id="school_body">
                <tr>
                  <th class="text-center align-middle" colspan="2">검색해주세요</th>
                </tr>
              </tbody>
            </table>
            </div>
            <!-- /.card-body -->

            <div class="card-footer clearfix">
              <span class="float-right">
                <button type="button" class="btn btn-sm btn-default" onclick="closePop()">닫기</button>
              </span>
            </div>
        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</form>
</div>
<!-- /.content-wrapper -->
<script>
$(function(){
  search();
});

function search()
{
  var school_name = $('#school_name').val();

  if(school_name == ""){
    swal("기관명을 입력해주세요");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = {
    "school_name"           : school_name
  };

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/member/schoolSearchProc",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      if(data.result == "success"){
        var html = "";
        if(data.data.length>0){
          for(var i = 0; i <data.data.length; i++){
            var arr = data.data[i].addr_1.split(" ");
            html += '<tr>';
            html += '<th class="text-left align-middle">'+data.data[i].school_name+' ('+arr[0]+')</th>';
            html += '<td class="text-left align-middle">';
            html += '<button type="button" class="btn btn-sm btn-warning float-left col-sm-2" onclick="choiceSchool(this)" data-school_seq="'+data.data[i].school_seq+'" data-school_name="'+data.data[i].school_name+'">선택</button>';
            html += '</td>';
            html += '</tr>';
          }
        }
        $('#school_body').html(html);

      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });


}

function choiceSchool(obj)
{
  var school_name = $(obj).data("school_name");
  var school_seq = $(obj).data("school_seq");

  var data = {
    "school_name" : school_name,
    "school_seq" : school_seq
  };

  window.opener.choiceSchool(data);
  window.close();
}


  function closePop()
  {
    window.close();
  }

</script>
