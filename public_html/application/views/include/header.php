<!-- header -->
<header class="main_header">
	<div class="inner">
		<h1 class="logo"><img src="/resources/images/common/logo_white.png" alt=""></h1>
		<a href="javascript:logout();" class="btn_logout">로그아웃</a>
	</div>
</header>
<!-- //header -->
<script>
var varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기
if ( varUA.indexOf('android') > -1) {
	//안드로이드
	try {
		app_key = window.androidbridge.getAndroidToken();
		//alert("앱입니다.");
	} catch(e) {
		//alert("웹입니다.");
	}
} else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
	//IOS
	try {
		webkit.messageHandlers.tokenHandler.postMessage("");
	} catch(e) {
		//alert("웹입니다");
	}
}

function receiveToken(r)
{
	//alert("앱입니다.");
}


</script>
