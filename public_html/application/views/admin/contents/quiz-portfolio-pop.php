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
.answer_area {display:inline;}
.answer_box {display:flex;}
</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"/>
<div class="content">

  <!-- Main content -->
  <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
  <input type="hidden" id="user_seq" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
  <section class="content">
    <div class="row">
              <span class="btn float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-primary" onclick="window.scrollTo({ top: 0, behavior: 'auto' });;window.print()">인쇄</button>
              </span>
              <span class="btn float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-primary" onclick="kakaotalk()">카톡 발송</button>
              </span>            
    </div>
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
                      <th class="bg-">이름</th>
                      <td >
                        <?php echo $data['user_name'];?>
                      </td>
                      <th>성별</th>
                      <td >
                        <?php echo $data['gender']=="M"?"남":"여";?>
                      </td>
                    </tr>  
                    <tr>
                      <th>학년</th>
                      <td >
                        <?php echo $data['grade'];?>
                      </td>
                      <th>소속</th>
                      <td >
                        <?php echo $data['group_name'];?>
                      </td>
                    </tr>  
                    <tr>
                      <th>반/선생님</th>
                      <td >
                        <?php echo $data['class_name'];?> / 
                        <?php echo $data['teacher_name'];?>
                      </td>
                      <th>조회일</th>
                      <td >
                        <?php echo date("Y-m-d H:i:s");?>
                      </td>
                    </tr>                              
                  </tbody>
              </table>
          </div>
      </div>
      <div class="card card-primary">
          <div class="card-body">
              <div class="swiper">
                  <ul class="book_list swiper-wrapper">
      	    <?php 
      	    for($i=0;$i<count(@$list);$i++) {
      	        
      	        $row = @$list[$i];    
      	        if(empty($book[$row['book_no']]) ) {
      	        $book[$row['book_no']] = $row['book_no'];
      	        
      	    ?>						    
      		<li class="book swiper-slide">
      			<img src="/upload/book/<?php echo $row['book_cover'];?>"  style="width:120px;" alt="" onError="this.src='/resources/images/common/no_image.png'">
      		</li>
      		    <?php }?>
      		<?php }?>
                  </ul>    
              </div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>                          
          </div>
      </div>
      <div class="card card-primary">
          <div class="card-body">
              <table class="table table-hover">
                <colgroup>
                  <col width="20%"/>
                  <col width="20%"/>
                  <col width="20%"/>
                  <col width="20%"/>
                  <col width="20%"/>
                </colgroup>
                <thead>
                  <tr>
                    <th class="text-center bg-lightgray">북퀴즈 응시일</th>
                    <th class="text-center bg-lightgray">도서명</th>
                    <th class="text-center bg-lightgray">출제자</th>
                    <th class="text-center bg-lightgray">정답 수/전체문항 수</th>
                    <th class="text-center bg-lightgray">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {list}
                  <tr  style="cursor:pointer">
                    <td class="text-center align-middle">{reg_date}</td>
                    <td class="text-center align-middle">{book_name}</td>
                    <td class="text-center align-middle">{setter}</td>
                    <td class="text-center align-middle">{correct_cnt}/{quiz_cnt}</td>
                    <td class="text-center align-middle">{score}</td>
                  </tr>
                  {/list}                                
                </tbody>
              </table>
          </div>
      </div>
      <p class="bg-gray-light" style="height:30px;line-height:30px;">생각 담기</p>
      <div class="card card-primary">
          <div class="card-body">
              <?php 
              for($i=0;$i<count($list);$i++) {
                 $info = $list[$i];
              ?>
                  <div>
                      도서명 : <?php echo $info['book_name'];?>
                  </div>
                  <div style="margin-top:10px;">
                      Q : <?php 
                            if($info['think_quiz_seq'] < 7) {
                                echo @$questionList[$info['think_quiz_seq']];
                            } else {
                                echo $info['think_quiz'];
                            }
                            
                        ?>
                  </div>
                  <div style="margin-top:10px;">
                    <?php echo nl2br($info['think_reply']);?>
                    <?php echo $info['think_reply_file']!=""?"<a href='/upload/user_quiz/{$info['think_reply_file']}' target='_blank'><img src='/upload/user_quiz/{$info['think_reply_file']}' style='width:300px;'></a>":"";?>
                  </div>
                  <hr>
              <?php }?>
          </div>
      </div>

      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
  <form method="post" id="kakaoForm">
    <input type="hidden" name="mode" value="portfolio"/>
    <input type="hidden" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
    
    <input type="hidden" name="user_seq" value="<?php echo $data['user_seq'];?>"/>
    <input type="hidden" name="user_id" value="<?php echo $data['user_id'];?>"/>
    <input type="hidden" name="start_date" value="<?php echo @$_REQUEST['startDate'];?>"/>
    <input type="hidden" name="end_date" value="<?php echo @$_REQUEST['endDate'];?>"/>
    <input type="hidden" name="count" value="<?php echo count($list);?>"/>
  </form>
</div>
<!-- /.content-wrapper -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<script>
  var csrf_name = '<?=$this->security->get_csrf_token_name();?>';
  var csrf_val = '<?=$this->security->get_csrf_hash();?>';    
    $(function(){
        $('#hide').on("change",function(){
            if($('#hide').is(":checked") == true)
                $('.correct').hide();
            else
                $('.correct').show();
        });
    });
    
    function kakaotalk() {
        if(confirm('카톡을 발송하시겠습니까?')) {
            var data = $('#kakaoForm').serialize();
            
            data[csrf_name] = csrf_val;
            
            $.ajax({
                type: "POST",
                url : "/admin/content/kakao",
                data: data,
                dataType:"json",
                success : function(data, status, xhr) {
                    alert('발송되었습니다.');
                    //location.reload();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.responseText);
                }
            });        
        } else {
            alert('발송이 취소되었습니다.');
        }
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
    var swiper = new Swiper('.swiper', {
      slidesPerView: 7,
      direction: getDirection(),
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      on: {
        resize: function () {
          swiper.changeDirection(getDirection());
        },
      },
    });

    function getDirection() {
      var windowWidth = window.innerWidth;
      var direction = window.innerWidth <= 760 ? 'vertical' : 'horizontal';

      return direction;
    }
</script>

  