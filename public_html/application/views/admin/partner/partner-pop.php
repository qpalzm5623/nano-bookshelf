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
  <section class="content">
    <div class="container-fluid">
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속명</th>
                              <td >
                                  <?php echo $data['group_name'];?>
                              </td>
                              <th>대표원장</th>
                              <td >
                                <?php echo $data['user_name'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th>연락처</th>
                              <td >
                                <?php echo $data['cell_no'];?>
                              </td>
                              <th>주소</th>
                              <td >
                                <?php echo $data['address'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th>계정상태</th>
                              <td >
                                <?php echo $data['user_status'];?>
                              </td>
                              <th>이용 상품</th>
                              <td >
                                <?php echo $data['pricing_plan'];?>
                              </td>
                            </tr>  
                            <tr>
                              <th>계약일</th>
                              <td >
                                <?php echo $data['start_date'];?>
                              </td>
                              <th>만료일</th>
                              <td >
                                <?php echo $data['end_date'];?>
                              </td>
                            </tr>  
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div class="mt-10">* 선생 등록 내역</div>
                  <div class="card card-primary">
                      <div class="card-body">
                          <table class="table table-hover">
                            <colgroup>
                              <col width="10%"/>
                              <col width="20%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="20%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                            </colgroup>
                            <thead>
                              <tr>
                                <th class="text-center bg-lightgray">번호</th>
                                <th class="text-center bg-lightgray">이름</th>
                                <th class="text-center bg-lightgray">ID</th>
                                <th class="text-center bg-lightgray">휴대폰번호</th>
                                <th class="text-center bg-lightgray">등록일시</th>
                                <th class="text-center bg-lightgray">상태</th>
                                <th class="text-center bg-lightgray">삭제</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list}
                              <tr  style="cursor:pointer">
                                <td class="text-center align-middle">{count}</td>
                                <td class="text-center align-middle" onclick="teacherPopup('{user_seq}')">{user_name}</td>
                                <td class="text-center align-middle">{user_id}</td>
                                <td class="text-center align-middle">{cell_no}</td>
                                <td class="text-center align-middle">{reg_date}</td>
                                <td class="text-center align-middle">{user_status}</td>
                                <td class="text-center align-middle"  onclick="deleteUser('{user_seq}')">삭제</td>
                              </tr>
                              {/list}                                
                            </tbody>
                          </table>
                        </table>
                      </div>
                  </div>
                  <div class="mt-10">* 가맹점 대시보드</div>
                  <div class="card card-primary">
                  <!-- Main content -->
                  <section class="content">
                    <div class="container-fluid">
                      <div class="row">
                        <!-- 회원현황 -->
                 
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">학생 회원 현황</h1>
                            </div>
                            <div class="widget-user-image">
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['member_total']?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['search_member_total']?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $user['search_leave_member_total']?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">보유 도서 현황</h1>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-6 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book['total']?></h5>
                                    <span class="description-text">TOTAL</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-6">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book['my']?></h5>
                                    <span class="description-text">내 학원 보유 도서</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
 
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <!-- /.col -->

                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">북퀴즈 등록 현황</h1>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-6 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz['total']?></h5>
                                    <span class="description-text">TOTAL</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-6 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz['new']?></h5>
                                    <span class="description-text">신규</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
 
                              </div>
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">북퀴즈 인증 현황</h1>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-6 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz_confirm['total'] ?></h5>
                                    <span class="description-text">TOTAL</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-6">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo $book_quiz_confirm['confirm'] ?></h5>
                                    <span class="description-text">이번 달 인증</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->

                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">선호도 현황</h1>
                            </div>
                            <div class="card-footer pt-4">
                              <div >
                                <?php for($i=0;$i<count($book_list);$i++){
                                    $row = $book_list[$i];
                                ?>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text"><?php echo $row['book_name'];?></span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text"><?php echo number_format($row['quiz_use_cnt']);?></span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <?php }?>
                              </div>
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->        
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">랭킹 현황</h1>
                            </div>
                            <div class="card-footer pt-4">
                              <div >
                                <?php for($i=0;$i<count($user_list);$i++){
                                    $row = $user_list[$i];
                                ?>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text"><?php echo $row['user_name'];?></span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text"><?php echo number_format($row['point']);?></span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <?php }?>       
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
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<script>
  function deleteUser($seq) {
      if(confirm('삭제하시겠습니까?')) {
          var csrf_name = '<?=$this->security->get_csrf_token_name();?>';
          var csrf_val = '<?=$this->security->get_csrf_hash();?>';

          var data = {"ci_csrf_token":csrf_val, "user_seq":$seq }

          $.ajax({
            type: "POST",
            url : "/admin/partner/deleteUser",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              alert("삭제되었습니다.");
              location.reload();
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
          });        
      }
  }    
  function teacherPopup($seq) {
      window.open("/admin/partner/teacher_popup/"+$seq, "_teacher_pop", "width=1000, height=800, left=100, top=50"); 
  }    
      
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
       if(opener.isFind($('#book_no'+seq).val()) == false) {
           opener.book_info_list.push(data);
           
           opener.book_list.push($('#book_no'+seq).val());
           var html = '<tr style="cursor:pointer" class="book_'+$('#book_no'+seq).val()+'">';
           html += '  <td class="text-center align-middle">'+$('#book_name'+seq).val()+'</td>';
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
