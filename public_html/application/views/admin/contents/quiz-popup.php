<link href="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/css/bootstrap4-toggle.min.css" rel="stylesheet">
<style>
  .toggle.ios, .toggle-on.ios, .toggle-off.ios { border-radius: 20rem; }
  .toggle.ios .toggle-handle { border-radius: 20rem; }
  #quiz_list th {width:150px;background:#efefef;}
  #quiz_list #table-td {padding:0px}
  #quiz_list #table-td .table{margin-bottom:0px}
  .p-10 {padding:10px;}
  .data-view {width:200px;height:200px;display:inline-flex}
  .d-flex{line-height:40px;height:40px;}
  .content-wrapper {margin-left:0px;}
</style>
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
  <form id="quizForm" method="post" action="">
    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
    <input type="hidden" id="mode" name="mode" value="<?php echo @$data['quiz_seq']==""?"INSERT":"UPDATE";?>"/>
    <input type="hidden" id="quiz_seq" name="quiz_seq" value="<?php echo @$data['quiz_seq'];?>"/>
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
              <table class="table">
                <colgroup>
                  <col width="10%"/>
                  <col/>
                </colgroup>
                <tbody>
                  <tr>
                    <th class="text-center align-middle">도서명</th>
                    <td class="text-left align-middle">
                      <?php echo @$data['book_name'];?>
                    </td>
                  </tr>
                  <tr>
                    <th class="text-center align-middle">문제수</th>
                    <td class="text-left align-middle">
                        <?php echo @$data['quiz_cnt'];?>
                    </td>
                  </tr>
                  <tr>
                      <td colspan="2" id="quiz_list">
                          <?php 
                          $quiz_cnt = @$data['quiz_cnt']?@$data['quiz_cnt']:1;
                          $quiz = array();
                          if(@$data['quiz_contents'] != "") {
                              $quiz = unserialize($data['quiz_contents']);
                              //print_r($quiz);
                          }
                          for($i=1; $i<=$quiz_cnt; $i++){ ?>
                          <p><?php echo $i;?>번 문제</p>
                          <table class="table" id="quiz_<?php echo $i; ?>" style="border-top:0px">
                          <tr>
                            <td class="text-center align-middle" colspan="2" id="table-td">
                              <table class="table">
                                <tbody>
                                  <tr class="type1">
                                    <th class="text-center align-middle" >
                                        문제
                                    </th>                                    
                                    <td class="text-left align-middle" >
                                      <?php echo @$quiz['q'][$i];?>
                                    </td>
                                  </tr>
                                  <tr class="type1">
                                    <th class="text-center align-middle">
                                        자료
                                    </th>
                                    <td class="text-left align-middle">
                                      <div id="q_<?php echo $i; ?>_img_data_view" class="data-view">
                                         <?php if(@$quiz['img'][$i]!= "") {?>
                                            <?php if(@$quiz['ext'][$i] == "IMG"){?>
                                                <img src="/upload/quiz/<?php echo @$quiz['img'][$i];?>">
                                            <?php } else if(@$quiz['ext'][$i] == "MP3"){?>
                                                <audio src="/upload/quiz/<?php echo @$quiz['img'][$i];?>" controls></audio>
                                            <?php } else if(@$quiz['ext'][$i] == "MP4"){?>
                                                <video controls><source src='/upload/quiz/<?php echo @$quiz['img'][$i];?>' type='video/mp4' /></video>
                                            <?php } else if(@$quiz['ext'][$i] == "YOUTUBE"){?>
                                                <iframe width="560" height="315" src="<?php echo @$quiz['img'][$i];?>" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                                            <?php }?>       
                                         <?php }?>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr class="type1">
                                    <th class="text-center align-middle">
                                        정답
                                    </th>
                                    <td class="text-left align-middle">
                                      <?php echo @$quiz['a'][$i];?>
                                    </td>
                                  </tr>
                                  <tr class="type1" id="q_<?php echo $i; ?>_choice">
                                    <th class="text-center align-middle">
                                        보기
                                    </th>
                                    <td class="text-center align-middle">
                                      <div class="d-flex">
                                      <?php echo @$quiz['c1'][$i]!=""?"1. ".@$quiz['c1'][$i]:"";?>
                                      </div>
                                      <div class="d-flex">
                                      <?php echo @$quiz['c2'][$i]!=""?"2. ".@$quiz['c2'][$i]:"";?>
                                      </div>
                                      <div class="d-flex">
                                      <?php echo @$quiz['c3'][$i]!=""?"3. ".@$quiz['c3'][$i]:"";?>
                                      </div>
                                      <div class="d-flex">
                                      <?php echo @$quiz['c4'][$i]!=""?"4. ".@$quiz['c4'][$i]:"";?>
                                      </div>
                                      <div class="d-flex">
                                      <?php echo @$quiz['c5'][$i]!=""?"5. ".@$quiz['c5'][$i]:"";?>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          </table>
                          <?php } ?>
                    </td>
                </tr>
                </tbody>
              </table>
            </div>
            <!-- /.card-body -->

            <!-- /.card-header -->
              <table class="table">
                <tbody>
                  <tr>
                    <td class="text-center align-middle">
                      <?php if($this->session->userdata("admin_level") == "0" || $this->session->userdata("admin_level") == "director") {?>
                          <?php if($this->session->userdata("admin_id") == $data['user_id'] || $this->session->userdata("admin_level") == "admin"){?>
                          <?php if(@$_GET['no'] == "Y") {?>
                          <?php }else{?>
                              <button type="button" class="btn btn-primary float-left mr-3" onclick="editQuiz()">수정</button>
                              <button type="button" class="btn btn-primary float-left mr-3" onclick="deleteQuiz()">삭제</button>
                              <?php }?>
                          <?php }else{?>
                          <button type="button" class="btn btn-primary float-left mr-3" onclick="reportQuiz()">신고하기</button>
                          <?php } ?>
                      <?php }?>                        
                      <button type="button" class="btn btn-default float-left" onclick="window.close()">닫기</button>
                    </td>
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
  </form>

</div>
<!-- /.content-wrapper -->
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script src="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/js/bootstrap4-toggle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/4.3.0/jquery.form.min.js"></script>
<script>
    function editQuiz() {
        opener.location = "/admin/content/quiz_write/<?php echo @$data['quiz_seq'];?>";
        window.close();
    }
    function youtubeIframe(obj,i){
        //<iframe width="560" height="315" src="https://www.youtube.com/embed/6JUicG0729g?si=ncq_aqb2zVBSjhIy" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        $('#q_'+i+'_img_data_view').html('<iframe width="560" height="315" src="'+obj.value+'" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
    }
    function changeExt(obj, i){
        if(obj.value == "IMG") {
            $('#q_'+i+'_img').show();
            $('#q_'+i+'_img_data').hide();
        } else if(obj.value == "MP3") {
            $('#q_'+i+'_img').show();
            $('#q_'+i+'_img_data').hide();        
            //$('#q_'+i+'_img_data_view').html('<audio src="https://soribox.kr/upload/academy/163/content/163_sj21006_1_172313_The Scary Solo  - 010.mp3" controls></audio>');
            //console.log($('#q_'+i+'_img_data_view').html());

        } else if(obj.value == "MP4") {
            $('#q_'+i+'_img').show();
            $('#q_'+i+'_img_data').hide();        
        } else if(obj.value == "YOUTUBE") {
            $('#q_'+i+'_img').hide();
            $('#q_'+i+'_img_data').val('');
            $('#q_'+i+'_img_data').show();        
        }
        //console.log(obj.value);
    }    
var cnt = '<?php echo $quiz_cnt;?>';
    function addQuiz() {
        if(cnt >9) {
            alert('10 문항까지만 추가가 가능합니다.');
            return;
        }
        var html = document.querySelector("#template-list-item").innerHTML;
        
        var data = {title : "hello",
        		content : "lorem dkfief",
        		price : 2000
        	};    
        cnt++;
        
        var resultHtml = html.replace(/{i}/gi, cnt)
        	.replace("{content}", data.content)
        	.replace("{price}", data.price); //메서드 체이닝
        	
        console.log(resultHtml);
        	
        $('#quiz_list').append(resultHtml)
        //document.querySelector(".content").innerHTML = resultHtml;    
      
    	$('input[type=file]').not(".image").off('change').on('change', function() {
    		var target = $(this).data('target');
    		var seq = $(this).data('seq');
    		if(chk_file($(this).val()) == false){
    			$(this).val('');
    			return;
    		}
    		$thisfile = $(this);
            var fileName = $thisfile.val().split('\\').pop().toLowerCase();
            $thisfile.siblings(".file_text").text(fileName);
            
    		if (/(MSIE|Trident)/.test(navigator.userAgent)) {
    			$files = $(this);
    			
    			var real = $(this);
    			var cloned = real.clone(true);
    			real.hide();
    			cloned.insertAfter(real);

    			// Move the real element to the hidden form - you can then submit it
    			//real.appendTo("#some-hidden-form");			
    		} else {
    			$files = $(this).clone();
    		}	
    		
    	}); 	      
    }   
    $(function(){
       $('#status').bootstrapToggle();
       $.datepicker.regional['ko'] = {
           closeText: '닫기',
           prevText: '이전달',
           nextText: '다음달',
           currentText: 'X',
           monthNames: ['1월(JAN)','2월(FEB)','3월(MAR)','4월(APR)','5월(MAY)','6월(JUN)',
           '7월(JUL)','8월(AUG)','9월(SEP)','10월(OCT)','11월(NOV)','12월(DEC)'],
           monthNamesShort: ['1월','2월','3월','4월','5월','6월',
           '7월','8월','9월','10월','11월','12월'],
           dayNames: ['일','월','화','수','목','금','토'],
           dayNamesShort: ['일','월','화','수','목','금','토'],
           dayNamesMin: ['일','월','화','수','목','금','토'],
           weekHeader: 'Wk',
           dateFormat: 'yy-mm-dd',
           firstDay: 0,
           isRTL: false,
           showMonthAfterYear: true,
           yearSuffix: ''};
          $.datepicker.setDefaults($.datepicker.regional['ko']);
    
       $('.date').datepicker({
           changeMonth: true,
           changeYear: true,
           showButtonPanel: true,
           yearRange: 'c-99:c+99',
           minDate: '',
           maxDate: ''
       });
    
       $('#status').on("change",function(){
           if($(this).is(":checked")){
               $('#view_wrap').hide();
           }else{
               $('#view_wrap').show();
           }
       });
    
       if($('#status').is(":checked")){
           $('#view_wrap').hide();
       }else{
           $('#view_wrap').show();
       }
    });
    
    function typeChange($quiz_num,$type)
    {
        if($type == 1) 
        {
            $('#q_'+$quiz_num+'_choice').show();
        } else {
            $('#q_'+$quiz_num+'_choice').hide();
        }
    }
    
    function goList()
    {
        location.href="/admin/content/quiz_list{param}";
    }
    
    function writeQuiz()
    {
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        
        var formData = $('#quizForm').serialize();
        $.ajax({
            type: "POST",
            url : "/admin/content/quizWriteProc",
            data: formData,
            dataType:"json",
            success : function(data, status, xhr) {
                if(data.result=="success"){
                  alert(data.msg);
                  location.href = "/admin/content/quiz_list{param}";
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });
    
    }
    
    function searchBookPop() {
        window.open("/admin/content/book_list_popup?book_no=Y", "_book_pop", "width=800, height=600, left=100, top=50"); 
    }
    
    /* 첨부파일 검증 */
    function validation(obj){
        const fileTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/tif'];
        if (obj.name.length > 100) {
            alert("파일명이 100자 이상인 파일은 제외되었습니다.");
            return false;
        } else if (obj.size > (100 * 1024 * 1024)) {
            alert("최대 파일 용량인 100MB를 초과한 파일은 제외되었습니다.");
            return false;
        } else if (obj.name.lastIndexOf('.') == -1) {
            alert("확장자가 없는 파일은 제외되었습니다.");
            return false;
        } else if (!fileTypes.includes(obj.type)) {
            alert("첨부가 불가능한 파일은 제외되었습니다.");
            return false;
        } else {
            return true;
        }
    }    
  
	function uploadImg($this, obj, i){
		var target = $this.data('target');
		var seq = $this.data('seq');

		$thisfile = $this;
        var fileName = $thisfile.val().split('\\').pop().toLowerCase();
        $thisfile.siblings(".file_text").text(fileName);
        
		if (/(MSIE|Trident)/.test(navigator.userAgent)) {
			$files = $this;
			
			var real = $this;
			var cloned = real.clone(true);
			real.hide();
			cloned.insertAfter(real);

			// Move the real element to the hidden form - you can then submit it
			//real.appendTo("#some-hidden-form");			
		} else {
			$files = $this.clone();
		}	
		
		$("<form action='/admin/content/upload_file' enctype='multipart/form-data' method='post'/>")
			.ajaxForm({
				dataType: 'json',
				beforeSend: function() {
				},
				success: function(data){
                    console.log(data);
                    console.log(target);
                    console.log(seq);
				    if(data != "") {
				        $('#'+target).val(data.url);
				        if($('#q_'+seq+'_ext :selected').val() == "MP3")
				            $('#'+target+"_view").html('<audio src="/upload/quiz/'+data.url+'" controls></audio>');
				        else if($('#q_'+seq+'_ext :selected').val() == "MP4")
				            $('#'+target+"_view").html("<video controls><source src='/upload/quiz/"+data.url+"' type='video/mp4' /></video>");
				        else
				            $('#'+target+"_view").html("<img src='/upload/quiz/"+data.url+"'>");
				        
				        
				    }
				},
				complete: function(data) {
					//console.log(data);
				}
			})
			.append( $files )
			.submit();
	}
	function reportQuiz(){
	    opener.location = "/admin/etc/adminQnaWrite?book_no=<?php echo @$data['book_no'];?>&quiz_seq=<?php echo @$data['quiz_seq'];?>";
	}
	
    function deleteQuiz(){
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        if(confirm('정말 삭제하시겠습니까?')) {
            var formData = {"quiz_seq":"<?php echo @$data['quiz_seq'];?>", "<?=$this->security->get_csrf_token_name();?>":"<?=$this->security->get_csrf_hash();?>"};
            $.ajax({
              type: "POST",
              url : "/admin/content/deleteQuiz",
              data: formData,
              dataType:"json",
              success : function(data, status, xhr) {
                if( data.result == "success" ){
                  alert("삭제 되었습니다.");
                  opener.location = "/admin/content/quiz_list";
                  window.close();
                } else {
                    alert(data.msg);
                }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.responseText);
              }
            });
        }
    }    	
</script>