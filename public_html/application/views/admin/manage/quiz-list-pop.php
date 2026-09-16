<!-- Content Wrapper. Contains page content -->
<style>
.ml-m1 {margin-left:-1px;margin: 5px 0px 5px -1px;}
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
  <section class="content">
    <form id="search_form">
    <div class="container-fluid">
        <div class="card mb-12">
            <div class="card-body">
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        주제
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle ml-m1">
                        <select name="subject" id="subject" class="form-control col-sm-3">
                            <option value="">전체</option>
                            <?php if( count($topicList) > 0 ){ ?>
                            <?php for($i=0;$i < count($topicList);$i++){?>
                                <option value="<?php echo $topicList[$i]['code_type'];?>" data-tags="<?php echo $topicList[$i]['code_tags'];?>" <?php echo @$topicList[$i]['code_type']==@$_GET['subject']?"selected":""?>><?php echo $topicList[$i]['code_name'];?></option>
                            <?php }?>
                            <?php }?>
                        </select>
                    </div>
                </div>  
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        권장학년
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle ml-m1">
                        <select name="grade" id="grade" class="form-control col-sm-3">
                            <option value="">전체</option>
                            <option value="0" <?php echo @$_GET['grade']=="0"?"selected":""?>>미취학</option>
                            <option value="1" <?php echo @$_GET['grade']=="1"?"selected":""?>>초1</option>
                            <option value="2" <?php echo @$_GET['grade']=="2"?"selected":""?>>초2</option>
                            <option value="3" <?php echo @$_GET['grade']=="3"?"selected":""?>>초3</option>
                            <option value="4" <?php echo @$_GET['grade']=="4"?"selected":""?>>초4</option>
                            <option value="5" <?php echo @$_GET['grade']=="5"?"selected":""?>>초5</option>
                            <option value="6" <?php echo @$_GET['grade']=="6"?"selected":""?>>초6</option>
                            <option value="7" <?php echo @$_GET['grade']=="7"?"selected":""?>>중1</option>
                            <option value="8" <?php echo @$_GET['grade']=="8"?"selected":""?>>중2</option>
                            <option value="9" <?php echo @$_GET['grade']=="9"?"selected":""?>>중3</option>
                            <option value="10" <?php echo @$_GET['grade']=="10"?"selected":""?>>고1</option>
                            <option value="11" <?php echo @$_GET['grade']=="11"?"selected":""?>>고2</option>
                            <option value="12" <?php echo @$_GET['grade']=="12"?"selected":""?>>고3</option>
                        </select>
                    </div>
                </div>                                  
                <div class="row row-search">
                    <div class="col-sm-1" >
                        <div class="col-form-label">
                        검색어
                        </div>
                    </div>
                    <div class="col-sm-8 row align-middle">
                            <input type="text" class="form-control col-8 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_GET['keyword'];?>" placeholder="도서명을 입력해주세요.">
                            <button type="submit" class="btn  btn-primary" >검색</button>
                            
                    </div>
                </div>  
            </div>
        </div>                
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
              <input type="hidden" id="openYn"  name="openYn" value="<?php echo @$_REQUEST['openYn'];?>">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <div class="card-body table-responsive p-0">
                  <table class="table table-hover">
                    <colgroup>
                      <col width="10%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">도서명</th>
                        <th class="text-center">시리즈명(or 단권)</th>
                        <th class="text-center">지은이</th>
                        <th class="text-center">출판사</th>
                        <th class="text-center">주제</th>
                        <th class="text-center">권장학년</th>
                        <th class="text-center">등록인<BR>아이디</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <?php /*  이미 등록된 도서의 경우 해당 도서의 기본 정보(시리즈명/지은이/출판사/ISBN/카테고리1/카테고리2/주제/세부태그/권장학년/책표지) */?>
                      <tr >
                        <td class="text-center align-middle"><input type="checkbox" name="check[]" value="{count}" /></td>
                        <td class="text-center align-middle">{book_name}</td>
                        <td class="text-center">{serise}</td>
                        <td class="text-center">{author}</td>
                        <td class="text-center">{publisher}</td>
                        <td class="text-center">{subject}</td>
                        <td class="text-center">{recommend_class}</td>
                        <td class="text-center">{user_id}
                        <input type="hidden" id="book_no{count}" value="{book_no}" />
                        <input type="hidden" id="book_name{count}" value="{book_name}" />
                        <input type="hidden" id="serise{count}" value="{serise}" />
                        <input type="hidden" id="author{count}" value="{author}" />
                        <input type="hidden" id="publisher{count}" value="{publisher}" />
                        <input type="hidden" id="isbn{count}" value="{isbn}" />
                        <input type="hidden" id="category{count}" value="{category}" />
                        <input type="hidden" id="sub_category{count}" value="{sub_category}" />
                        <input type="hidden" id="subject{count}" value="{subject}" />
                        <input type="hidden" id="tags{count}" value="{tags}" />
                        <input type="hidden" id="recommend_class{count}" value="{recommend_class}" />
                        <input type="hidden" id="book_cover{count}" value="{book_cover}" />
                        <input type="hidden" id="user_id{count}" value="{user_id}" />
                        <input type="hidden" id="quiz_seq{count}" value="{quiz_seq}" />
                        </td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="8">등록된 도서가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
              <span class="float-right" style="margin-right:5px">
                <button type="button" class="btn btn-block btn-warning" onclick="window.close();">닫기</button>
              </span>
              <span class="float-right" style="margin-right:5px">
                <button type="button" class="btn btn-block btn-success" onclick="choice();">선택</button>
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
function choice() {
    $("input[name='check[]']:checked").each(function(){
        var seq = $(this).val();
       //console.log($(this).val()) 
       //opener.$('#book_no').val($('#book_no'+seq).val());
       //opener.$('#book_name').val($('#book_name'+seq).val());
       //opener.$('#serise').val($('#serise'+seq).val());
       //opener.$('#author').val($('#author'+seq).val());
       //opener.$('#publisher').val($('#publisher'+seq).val());
       //opener.$('#isbn').val($('#isbn'+seq).val());
       //opener.$('#category').val($('#category'+seq).val());
       //opener.$('#sub_category').val($('#sub_category'+seq).val());
       //opener.$('#subject').val($('#subject'+seq).val());
       //opener.$('#tags').val($('#tags'+seq).val());
       //opener.$('#recommend_class').val($('#recommend_class'+seq).val());
       //opener.$('#book_cover').val($('#book_cover'+seq).val());       
       var data = {
           "book_no" : $('#book_no'+seq).val(),
           "book_name" : $('#book_name'+seq).val(),
           "serise" : $('#serise'+seq).val(),
           "author" : $('#author'+seq).val(),
           "publisher" : $('#publisher'+seq).val(),
           "subject" : $('#subject'+seq).val(),
           "recommend_class" : $('#recommend_class'+seq).val(),
           "user_id" : $('#user_id'+seq).val(),
       }
       //console.log(opener.isFind($('#book_no'+seq).val()));
       if(opener.isFind($('#book_no'+seq).val()) == false) {
           opener.book_info_list.push(data);
           
           opener.book_list.push($('#book_no'+seq).val());
           var html = '<tr style="cursor:pointer" class="book_'+$('#book_no'+seq).val()+'">';
           html += '  <td class="text-center align-middle"><input type="hidden" name="book_no[]" value="'+$('#book_no'+seq).val()+'"><input type="hidden" name="quiz_seq[]" value="'+$('#quiz_seq'+seq).val()+'">'+$('#book_name'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#serise'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#author'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#publisher'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#subject'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#recommend_class'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle">'+$('#user_id'+seq).val()+'</td>';
           html += '  <td class="text-center align-middle"><button type="button" class="btn btn-warning float-right" style="margin-right:10px;" onclick="deleteBook(\''+$('#book_no'+seq).val()+'\')">삭제</button></td>';
           html += '</tr>';
           opener.$('#book_list').append(html);
       }
    });
    alert('선택되었습니다.');
    return;


}
$(function(){
    $('#allCheck').on("click",function(){
      allCheckClick();
    });
});

function allCheckClick()
{
  if($('#allCheck').is(":checked") == true ){
    $('input[name="chk[]"]').prop("checked",true);
  }else{
    $('input[name="chk[]"]').prop("checked",false);
  }
}

function choiceReadChange()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("공개변경 교육정보를 선택해주세요.");
    return;
  }

  var notice_read_type = $('#notice_read_type').val();
  if(notice_read_type == ""){
    alert("변경할 공개상태를 선택해주세요.");
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etcAdm/updateNoticeDisplay",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      alert("상태가 변경되었습니다.");
      location.reload();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}

function deleteNotice()
{
  var chkBool = false;
  $('input[name="chk[]"]').each(function(){
    if($(this).is(":checked")){
      chkBool = true;
      return;
    }
  });


  if(chkBool == false){
    alert("삭제할 공지사항을 선택해주세요."); 
    return;
  }

  var csrf_name = $('#csrf').attr("name");
  var csrf_val = $('#csrf').val();

  var data = $('#search_form').serialize();

  data[csrf_name] = csrf_val;

  $.ajax({
    type: "POST",
    url : "/admin/etcAdm/deleteNotice",
    data: data,
    dataType:"json",
    success : function(data, status, xhr) {
      alert("삭제 되었습니다.");
      location.reload();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseText);
    }
  });
}
  function goModify($seq)
  {
      location.href="book_modify/"+$seq+"{param}";
  }

  function goView($seq)
  {
      location.href="book_write/"+$seq+"{param}";
  }

  function writeNotice()
  {
    location.href="book_write/{param}";
  }
</script>
