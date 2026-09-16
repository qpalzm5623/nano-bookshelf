
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<a href="#" class="btn_back"><i class="icon_back"></i>이전</a>
				<h2 class="header_title">관심 주제 수정</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
			<div class="inner">

				<!-- 관심 주제 수정 -->
				<div class="my_bookcase_wrap modify_interest_topic">

					<div class="title_explain">
						<h3>관심있는 주제를 3개 선택해 주세요.<br><strong class="font_blue_green">맞춤 도서를 추천</strong>해 드립니다. </h3>
					</div>
					
					<!-- 관심 주제 수정 목록 -->
					<div class="check_area">
					    <?php for($i=0;$i<count($topicList);$i++) {?>
						<div class="check_button lg">
							<input type="checkbox"  name="topic[]" value="<?php echo $topicList[$i]['code_type'];?>" id="check<?php echo $i;?>" <?php if(@in_array($topicList[$i]['code_type'],$topic)){?>checked<?php }?> >
							<label for="check<?php echo $i;?>"><?php echo $topicList[$i]['code_type'];?></label>
						</div>
						<?php } ?>  
					</div>
					<!-- // 관심 주제 수정 목록 -->

					<div class="btn_area">
						<button class="btn_basic bg_blue_green"onclick="saveData();">저장</button>
					</div>
				</div>
				<!-- // 관심 주제 수정 -->

			</div>
		</div>
		<!-- // contents -->
    <script>
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            if (checkedCheckboxes.length > 3) {
                swal("최대 3개의 체크박스만 선택할 수 있습니다.");
                //uiLayer.close('#mainContentReport');                    
                //alert("최대 3개의 체크박스만 선택할 수 있습니다.");
                this.checked = false; // 체크박스 선택 해제
            }
        });
    });
    
    function saveData()
    {
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();
        
         var i=0;
        var dataArray=new Array();
        $('input:checkbox[name="topic[]"]').each(function() {
            if(this.checked){//checked 처리된 항목의 값
                //alert(this.value);
                dataArray[i]=this.value;//배열로 저장
                i++;
            }
        });        
        
        var data = {
            "topic" : JSON.stringify(dataArray),
        };
        
        data[csrf_name] = csrf_val;
        
        $.ajax({
            type: "POST",
            url : "/mypage/topicSaveProc",
            data: data,
            dataType:"json",
            success : function(data, status, xhr) {
              if(data.result == "success"){
                swal("저장되었습니다.", {
                  icon: "success",
                }).then((value)=>{
                  location='/';
                });
        		
              }else{
              }
            
            
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(jqXHR.responseText);
            }
        });
      
    }    
    </script>		 
	</div>
