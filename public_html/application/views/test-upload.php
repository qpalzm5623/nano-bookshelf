<!DOCTYPE html>
<html lang="ko" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>업로드 테스트</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jstree/3.2.1/jstree.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jstree/3.2.1/themes/default/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.css"/>
<script src="https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.js"></script>
<script src="https://kit.fontawesome.com/ab06f23d17.js" crossorigin="anonymous"></script>

<style>
.container {
  display: flex;
  flex-direction: row;
  border: 1px solid red;
}

.item{
  padding: .5em;
}

.flexBox{
  display:flex;
  align-items:center; /* 방향이 row 기준: 세로 중앙 정렬*/
}

.gridBox{
  display:grid;
  align-items:center; /* 방향이 row 기준: 세로 중앙 정렬*/
  margin-top:30px;

}

.jstree i{
  color : green;
}

.boxItem{
  display:inline-block;
  margin-top:10px;
}
</style>
  </head>
  <body>
    <div class="container">
      <div class="item" id="tree">
      </div>
      <div class="item">
        <button style="clear:both;float:left;" id="save_btn">저장</button>
        <button style="clear:both;float:left;" id="d1_add_btn">대메뉴 추가</button>
        <button style="clear:both;float:left;" id="d2_add_btn">소메뉴 추가</button>
        <button style="clear:both;float:left;" id="modi_btn">수정</button>
        <button style="clear:both;float:left;" id="del_btn">삭제</button>
      </div>
      <div class="item">
        <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
        <div class="flexBox">
          <span class="boxItem">이미지선택</span>
        </div>
        <div class="flexBox">
          <input class="boxItem" type="file" id="img_file"/>
        </div>
        <div class="flexBox">
          <span class="boxItem">텍스트입력</span>
        </div>
        <div class="flexBox">
          <textarea class="boxItem" rows="3" type="text" id="txt" onkeyup="onKeyUp()" style="width:500px;"></textarea>
        </div>
        <div class="flexBox">
          <span class="boxItem">폰트크기</span>
        </div>
        <div class="flexBox">
          <select id="txt_size" onchange="onSizeChange()">
            <option value="18">18pt</option>
            <option value="20">20pt</option>
            <option value="22">22pt</option>
            <option value="24">24pt</option>
            <option value="26">26pt</option>
            <option value="28">28pt</option>
            <option value="30">30pt</option>
          </select>
        </div>
        <div class="flexBox">
          <span class="boxItem">텍스트 색상</span>
        </div>
        <div class="flexBox">
          <input type="text" id="txt_color" data-coloris value="#000000"/>
        </div>

        <div class="flexBox">
          <span class="boxItem">이미지 미리보기</span>
        </div>
        <div class="flexBox">
          <canvas class="boxItem" id="canvas" width="500" height="300" style="border:1px solid #ff0000;"></canvas>
        </div>
        <div class="flexBox">
          <button class="boxItem" id="imgBtn" onclick="btnClick()" style="display:none;">이미지 전송</button>
        </div>
      </div>
    </div>





    <script>
var total_count = 0;
var first_data = [];
var del_seq = [];

function treeLoad($data)
{
  $('#tree').jstree({
    'core' : {
    'data' : $data,
    "check_callback" : true
  },
  "plugins" : ["dnd","types"],
  "types" : {
    "#" : {
      "max_depth" : 2,
      "valid_children" : ["root"]
    },
    "root" : {
      "icon":"fa-solid fa-leaf",
      "valid_children" : ["default","file"]
    },
    "default" : {
      "valid_children" : ["default","file"]
    },
    "file" : {
      "icon":"fa-solid fa-bolt",
      "valid_children" : []
    }
  }
  })
  .bind('loaded.jstree', function(evt, data) {
    //로딩
    $('#tree').jstree("open_all");
  })
  .bind('move_node.jstree', function(evt,data){
    //이동
    var org_parent = data.old_parent;
    var new_parent = data.parent;

    if(org_parent != '#' && new_parent == '#'){
      alert('1차 카테고리로 이동할 수 없습니다.');
      $('#tree').jstree(true).refresh(true);
    }
    //console.log($('#tree').jstree(true).get_json('#',{flat:true}));

    $('#tree').jstree(true).open_node(new_parent);
    return true;
  })
  .bind('rename_node.jstree',function(evt,data){
    //수정
  })
  .bind('create_node.jstree',function(evt,data){
    //생성
  })
}
    $(function(){

      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();

      var data = {};

      data[csrf_name] = csrf_val;

      $.ajax({
        type: "POST",
        url: "/home/loadCategory",
        data: data,
        dataType:"json",
      }).done(function(o) {
        if(o.length>0){

          console.log(typeof(o));
          var obj = JSON.parse(JSON.stringify(o));
          var obj2 = obj.sort((a,b) => {
                if(a.id > b.id) return 1;
                if(a.id < b.id) return -1;
                return 0;
              });

          var id_num = obj2[obj2.length-1].id;

          total_count = Number(id_num.substr(1));

        }else{
          total_count = 0;
        }

        console.log(obj);

        console.log(total_count);
        console.log(o);
        treeLoad(o);




      });


    });

    $('#d1_add_btn').on("click",function(){
      var id = 'c'+(total_count+1);
      total_count++;
      var new_node = { "id" : id, "parent" : "#", "type" : "root", "icon":"fa-solid fa-leaf" };
      $('#tree').jstree(true).create_node('#',new_node,"last");
      $('#tree').jstree('edit',id);
      console.log($('#tree').jstree(true).get_json('#',{flat:true}));
      console.log(id);
    });

    $('#d2_add_btn').on("click",function(){
      var node = $('#tree').jstree('get_selected',true);
      if(node.length == 0 || node[0].parent != '#'){
        alert("대메뉴를 선택해 주세요.");
        return;
      }

      var new_id = 'c'+(total_count+1);
      total_count++;
      var new_node = { "id" : new_id, "parent" : node[0].id, type:"file","icon":"fa-solid fa-bolt" };
      $('#tree').jstree(true).create_node(node[0].id,new_node,"last");
      $('#tree').jstree('edit',new_id);

    });

    $('#modi_btn').on("click",function(){
      var node = $('#tree').jstree('get_selected',true);
      $('#tree').jstree('edit',node[0].id);

    });

    $('#del_btn').on("click",function(){
      var node = $('#tree').jstree('get_selected',true);
      if(node[0].parent == "#"){
        if(!confirm("하위카테고리도 삭제됩니다. 삭제하시겠습니까?")){
          return;
        }
      }

      if(node[0].data){
        del_seq.push(node[0].data.challenge_seq);
      }



      $('#tree').jstree(true).delete_node(node[0].id);
    });


    $('#save_btn').on("click",function(){
      saveCategory($('#tree').jstree(true).get_json('#', {flat:true}));
      console.log( $('#tree').jstree(true).get_json('#', {flat:true}));
    });

    function saveCategory($json)
    {
      var csrf_name = $('#csrf').attr("name");
      var csrf_val = $('#csrf').val();

      var data = {
        "cate" : $json,
        "del"  : del_seq
      };

      data[csrf_name] = csrf_val;

      $.ajax({
        type: "POST",
        url: "/home/saveCategory",
        data: data,
        dataType:"json",
      }).done(function(o) {
          alert("저장되었습니다.");
          location.reload();
      });
    }

    function onSizeChange()
    {
      var font_px_size = $('#txt_size').val() * 1.33;
      ctx.font = font_px_size + "px verdana";
      draw();
    }

    Coloris({
        el:'#txt_color',
        theme: 'default',     //default, large, polaroid, pill
        themeMode: 'light',   //light , dark 모드
        margin: 2,            //입력 필드와 색선택시 사이 여백
        alpha: false,          //불투명도 조절
        format: 'hex',        //포맷  hex rgb hsl auto mixed
        formatToggle: false,   //포맷 토글
        clearButton: true,
        clearLabel: 'Clear',
        swatches: [
          '#264653',
          '#2a9d8f',
          '#e9c46a',
          'rgb(244,162,97)',
          '#e76f51',
          '#d62828',
          'navy',
          '#07b',
          '#0096c7',
          '#00b4d880',
          'rgba(0,119,182,0.8)'
        ],
        inline: false,
        defaultColor: '#000000',
      });

      document.addEventListener('coloris:pick', event => {
        font_color = event.detail.color;
        ctx.fillStyle = font_color;
        draw();
      });

      var canvas = document.getElementById("canvas");
      var ctx = canvas.getContext("2d");

      var font_color = '#000000';

      var $canvas = $("#canvas");
      var canvasOffset = $canvas.offset();
      var offsetX = canvasOffset.left;
      var offsetY = canvasOffset.top;
      var scrollX = $canvas.scrollLeft();
      var scrollY = $canvas.scrollTop();

      var font_size = 18 * 1.33;

      var startX;
      var startY;

      var fontX = 0;
      var fontY = 0;

      var texts = [];
      var selectedText = -1;

      function draw() {
        //지우고
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //이미지 그리고
        ctx.drawImage(img, 0, 0,canvas.width, canvas.height);
        for (var i = 0; i < texts.length; i++) {
            var text = texts[i];
            //텍스트 그리고
            ctx.fillText(text.text, text.x, text.y);
        }

      }

      function textHittest(x, y, textIndex) {
        var text = texts[textIndex];
        return (x >= text.x && x <= text.x + text.width && y >= text.y - text.height && y <= text.y);
      }

      function handleMouseDown(e) {
        e.preventDefault();
        startX = parseInt(e.clientX - offsetX);
        startY = parseInt(e.clientY - offsetY);
        // Put your mousedown stuff here
        for (var i = 0; i < texts.length; i++) {
            if (textHittest(startX, startY, i)) {
                selectedText = i;
            }
        }
        console.log("??");
      }

      function handleMouseUp(e) {
        e.preventDefault();
        selectedText = -1;

      }

      function handleMouseOut(e) {
        e.preventDefault();
        selectedText = -1;
      }

      function handleMouseMove(e) {
        if (selectedText < 0) {
            return;
        }
        e.preventDefault();
        mouseX = parseInt(e.clientX - offsetX);
        mouseY = parseInt(e.clientY - offsetY);

        var dx = mouseX - startX;
        var dy = mouseY - startY;
        startX = mouseX;
        startY = mouseY;

        var text = texts[selectedText];
        text.x += dx;
        text.y += dy;
        draw();
      }

      $("#canvas").mousedown(function (e) {
        handleMouseDown(e);
      });
      $("#canvas").mousemove(function (e) {
        handleMouseMove(e);
      });
      $("#canvas").mouseup(function (e) {
        handleMouseUp(e);
      });
      $("#canvas").mouseout(function (e) {
        handleMouseOut(e);
      });

      function onKeyUp() {
        var is_img = $('#img_file').val();

        if(is_img == ""){
          $('#txt').val("");
          alert("이미지부터 첨부해주세요.");
          return;
        }

        var lineheight = 50;
        var lines = $("#txt").val().split('\n');
        texts.length = 0
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i<lines.length; i++)
        {
          y = (i+1)*lineheight;
          // get the text from the input element
          var text = {
            text: lines[i],
            x: 0,
            y: y
          };

          ctx.fillText(text.text, text.x, y );
          // calc the size of this text for hit-testing purposes
          var font_px_size = $('#txt_size').val() * 1.33;
          ctx.font = font_px_size + "px verdana";
          ctx.fillStyle = font_color;
          text.width = ctx.measureText(text.text).width;
          text.height = font_px_size;
          texts.push(text);

          draw();

        }
      }

      var img = new Image();

      function btnClick()
      {
        var csrf_name = $('#csrf').attr("name");
        var csrf_val = $('#csrf').val();

        var data = {
          "challenge_thumb":canvas.toDataURL()
        };

        data[csrf_name] = csrf_val;

        $.ajax({
          type: "POST",
          url: "/home/uploadTest",
          data: data,
          dataType:"json",
        }).done(function(o) {
          console.log(o.imgUrl);
          alert('업로드가 완료되었습니다.');
          downloadImg(o.imgUrl);
        });
      }

      const readInput = document.querySelector('#img_file');

      readInput.addEventListener("change",readInputFile);

      function readInputFile(e){
        var fileForm = /(.*?)\.(jpg|jpeg|png|gif|bmp|pdf)$/;
        var file = e.target.files;

        if (!file[0].type.match("image/.*")) {
          alert('이미지 파일만 업로드가 가능합니다.');
          document.querySelector("#img_file").value = "";
          return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {

          img.onload = function () {
            $('#imgBtn').show();
            ctx.drawImage(img, 0, 0,canvas.width, canvas.height);

          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file[0]);

      }




      function dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
          type: mime
        });
      }

      function downloadImg(imgSrc) {
        var image = new Image();
        image.crossOrigin = "anonymous";
        image.src = imgSrc;
        var fileName = image.src.split("/").pop();
        image.onload = function() {
          var canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          canvas.getContext('2d').drawImage(this, 0, 0);
          if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(dataURLtoBlob(canvas.toDataURL()), fileName);
          } else {
            var link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = fileName;
            link.click();
          }
        };
      }



    </script>
  </body>
</html>
