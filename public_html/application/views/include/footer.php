</html>

<script type="text/javascript">

function logout(){
	if(!confirm("로그아웃 하시겠습니까?")){
		return;
	}
	var csrf_name = $('#csrf').attr("name");
	var csrf_val = $('#csrf').val();

	var data = {};

	data[csrf_name] = csrf_val;

	$.ajax({
		type: "POST",
		url : "/home/logout",
		data: data,
		dataType:"json",
		success : function(data, status, xhr) {
		    location.href="/login";
			//swal("로그아웃 되었습니다.", {
			//	icon: "success",
			//}).then((value)=>{
			//	location.href="/login";
			//});

		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(jqXHR.responseText);
		}
	});
}

function setCookie( name, value, expiredays ) {
	var todayDate = new Date();
	todayDate.setDate( todayDate.getDate() + expiredays );
	document.cookie = name + '=' + escape( value ) + '; path=/; expires=' + todayDate.toGMTString() + ';'
}

//쿠키 불러오기
function getCookie(name)
{
    var obj = name + "=";
    var x = 0;
    while ( x <= document.cookie.length )
    {
        var y = (x+obj.length);
        if ( document.cookie.substring( x, y ) == obj )
        {
            if ((endOfCookie=document.cookie.indexOf( ";", y )) == -1 )
                endOfCookie = document.cookie.length;
            return unescape( document.cookie.substring( y, endOfCookie ) );
        }
        x = document.cookie.indexOf( " ", x ) + 1;

        if ( x == 0 ) break;
    }
    return "";
}
function deleteCookie(cookieName){
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1999 00:00:10 GMT;';
}
</script>
<script>
$(function(){
    if(document.clientHeight>document.scrollHeight-document.scrollTop){
    return;
    }        
});

</script>