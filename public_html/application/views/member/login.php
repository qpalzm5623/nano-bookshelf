<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<link rel="stylesheet" href="/resources/css/normalize.css">
	<link rel="stylesheet" href="/resources/css/common.css">
	<link rel="stylesheet" href="/resources/css/sub.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script>
	<script src="/resources/js/common.js"></script>
	<title>나노의책장 - 통합 로그인</title>
	<style>
		/* ─── 통합 로그인 프리미엄 반응형 스타일 ─── */
		html, body {
			height: 100%;
			margin: 0;
			padding: 0;
			background: #f8fafc;
			font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
		}

		.login_unified_wrap {
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 30px 16px;
			background: radial-gradient(circle at 10% 20%, rgba(239, 246, 255, 0.9) 0%, rgba(243, 244, 246, 0.8) 90%);
			box-sizing: border-box;
		}

		.login_card {
			width: 100%;
			max-width: 440px;
			background: #ffffff;
			border-radius: 24px;
			padding: 44px 36px 36px;
			box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04);
			box-sizing: border-box;
			position: relative;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
		}

		/* 브랜드 로고 및 헤더 영역 */
		.brand_header {
			text-align: center;
			margin-bottom: 32px;
		}

		.brand_header .logo_img {
			max-width: 190px;
			height: auto;
			display: inline-block;
			margin-bottom: 14px;
			transition: transform 0.2s ease;
		}

		.brand_header .logo_img:hover {
			transform: scale(1.02);
		}

		.brand_header .service_title {
			font-size: 20px;
			font-weight: 700;
			color: #1e293b;
			margin: 0 0 6px;
			letter-spacing: -0.5px;
		}

		.brand_header .service_desc {
			font-size: 13px;
			color: #64748b;
			margin: 0;
			line-height: 1.4;
		}

		/* 입력 폼 필드 */
		.login_form_group {
			display: flex;
			flex-direction: column;
			gap: 14px;
			margin-bottom: 20px;
		}

		.input_field_box {
			position: relative;
			display: flex;
			align-items: center;
		}

		.input_field_box .icon_lead {
			position: absolute;
			left: 16px;
			color: #94a3b8;
			pointer-events: none;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.input_field_box input[type="text"],
		.input_field_box input[type="password"] {
			width: 100%;
			height: 52px;
			padding: 0 46px 0 44px;
			border: 1.5px solid #e2e8f0;
			border-radius: 14px;
			font-size: 15px;
			color: #1e293b;
			background: #f8fafc;
			box-sizing: border-box;
			outline: none;
			transition: all 0.2s ease;
		}

		.input_field_box input:focus {
			background: #ffffff;
			border-color: #3b82f6;
			box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
		}

		.input_field_box input::placeholder {
			color: #94a3b8;
			font-size: 14px;
		}

		/* 비밀번호 보기/숨기기 토글 */
		.btn_pw_toggle {
			position: absolute;
			right: 14px;
			background: none;
			border: none;
			padding: 6px;
			cursor: pointer;
			color: #94a3b8;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 8px;
			transition: color 0.15s ease, background-color 0.15s ease;
		}

		.btn_pw_toggle:hover {
			color: #475569;
			background: #f1f5f9;
		}

		/* 옵션 체크박스 영역 */
		.login_options {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 24px;
			padding: 0 4px;
		}

		.custom_check {
			display: flex;
			align-items: center;
			cursor: pointer;
			user-select: none;
			font-size: 14px;
			color: #475569;
		}

		.custom_check input[type="checkbox"] {
			appearance: none;
			-webkit-appearance: none;
			width: 18px;
			height: 18px;
			border: 1.5px solid #cbd5e1;
			border-radius: 5px;
			margin: 0 8px 0 0;
			cursor: pointer;
			position: relative;
			background: #fff;
			transition: all 0.15s ease;
		}

		.custom_check input[type="checkbox"]:checked {
			background: #3b82f6;
			border-color: #3b82f6;
		}

		.custom_check input[type="checkbox"]:checked::after {
			content: '';
			position: absolute;
			left: 5px;
			top: 2px;
			width: 5px;
			height: 9px;
			border: solid white;
			border-width: 0 2px 2px 0;
			transform: rotate(45deg);
		}

		/* 로그인 실행 버튼 */
		.btn_login_submit {
			width: 100%;
			height: 52px;
			background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
			color: #ffffff;
			border: none;
			border-radius: 14px;
			font-size: 16px;
			font-weight: 700;
			cursor: pointer;
			box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.35);
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
		}

		.btn_login_submit:hover {
			background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
			transform: translateY(-1px);
			box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.45);
		}

		.btn_login_submit:active {
			transform: translateY(1px);
			box-shadow: 0 4px 12px -2px rgba(37, 99, 235, 0.3);
		}

		.btn_login_submit:disabled {
			background: #94a3b8;
			cursor: not-allowed;
			transform: none;
			box-shadow: none;
		}

		/* 알림 모달 팝업 */
		.unified_modal {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(15, 23, 42, 0.5);
			backdrop-filter: blur(4px);
			z-index: 99999;
			display: none;
			align-items: center;
			justify-content: center;
			padding: 20px;
			box-sizing: border-box;
		}

		.unified_modal_body {
			width: 100%;
			max-width: 360px;
			background: #ffffff;
			border-radius: 20px;
			padding: 28px 24px 20px;
			text-align: center;
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16);
			animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		}

		@keyframes modalPop {
			from { opacity: 0; transform: scale(0.92); }
			to { opacity: 1; transform: scale(1); }
		}

		.unified_modal_msg {
			font-size: 15px;
			font-weight: 600;
			color: #1e293b;
			line-height: 1.5;
			margin-bottom: 22px;
			word-break: keep-all;
		}

		.unified_modal_btn {
			width: 100%;
			height: 44px;
			background: #2563eb;
			color: #fff;
			border: none;
			border-radius: 12px;
			font-size: 15px;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.15s ease;
		}

		.unified_modal_btn:hover {
			background: #1d4ed8;
		}

		/* 모바일 디바이스 최적화 */
		@media (max-width: 480px) {
			.login_unified_wrap {
				padding: 16px 12px;
			}
			.login_card {
				padding: 32px 22px 26px;
				border-radius: 20px;
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
			}
			.brand_header .logo_img {
				max-width: 165px;
			}
			.brand_header .service_title {
				font-size: 19px;
			}
		}
	</style>
</head>
<body>

	<div class="login_unified_wrap">
		<div class="login_card">
			
			<!-- 브랜드 로고 및 서비스 안내 -->
			<div class="brand_header">
				<a href="/login">
					<img src="/resources/images/common/logo.png" alt="나노의책장 로고" class="logo_img" onError="this.src='/logo.png'">
				</a>
				<h1 class="service_title">통합 로그인</h1>
				<p class="service_desc">학생, 학원 관리자, 본사 관리자 통합 계정 접속</p>
			</div>

			<!-- CSRF 및 앱 토큰 히든값 -->
			<input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
			<input type="hidden" id="app_key" name="app_key"/>

			<!-- 로그인 폼 영역 -->
			<form id="unifiedLoginForm" onsubmit="return false;">
				<div class="login_form_group">
					<!-- 아이디 입력 -->
					<div class="input_field_box">
						<span class="icon_lead">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
						</span>
						<input type="text" id="user_id" name="user_id" placeholder="아이디를 입력해 주세요." autocomplete="username" autofocus>
					</div>

					<!-- 비밀번호 입력 -->
					<div class="input_field_box">
						<span class="icon_lead">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
						</span>
						<input type="password" id="user_password" name="user_password" placeholder="비밀번호를 입력해 주세요." autocomplete="current-password">
						<button type="button" class="btn_pw_toggle" id="btnPwToggle" title="비밀번호 표시/숨김">
							<svg id="iconEye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
						</button>
					</div>
				</div>

				<!-- 유틸 옵션 (아이디 저장 / 자동 로그인) -->
				<div class="login_options">
					<label class="custom_check">
						<input type="checkbox" id="idSave" value="Y">
						<span>아이디 저장</span>
					</label>
					<label class="custom_check">
						<input type="checkbox" id="autoLogin" name="autoLogin" value="Y">
						<span>자동 로그인</span>
					</label>
				</div>

				<!-- 로그인 버튼 -->
				<button type="button" class="btn_login_submit" id="btnLoginSubmit" onclick="goLogin()">
					<span>로그인</span>
				</button>
			</form>
		</div>
	</div>

	<!-- 공통 알림 모달 -->
	<div class="unified_modal" id="unifiedModal">
		<div class="unified_modal_body">
			<div class="unified_modal_msg" id="unifiedModalMsg"></div>
			<button type="button" class="unified_modal_btn" id="unifiedModalBtn">확 인</button>
		</div>
	</div>

	<script>
		var app_key = "";
		var login_str = "";
		var isLoginFailed = false;

		// 알림 모달 제어 함수
		function showModal(msg, isFailed) {
			$('#unifiedModalMsg').html(msg);
			$('#unifiedModal').css('display', 'flex');
			isLoginFailed = !!isFailed;
		}

		function closeModal() {
			$('#unifiedModal').hide();
			if (isLoginFailed) {
				$('#user_password').val('').focus();
				isLoginFailed = false;
			}
		}

		// 비밀번호 표시 토글
		$('#btnPwToggle').on('click', function(e) {
			e.preventDefault();
			var $pw = $('#user_password');
			var currentType = $pw.attr('type');
			if (currentType === 'password') {
				$pw.attr('type', 'text');
				$('#iconEye').css('color', '#2563eb');
			} else {
				$pw.attr('type', 'password');
				$('#iconEye').css('color', '#94a3b8');
			}
		});

		// 엔터키 제출 바인딩
		$('#user_id, #user_password').on('keypress', function(e) {
			if (e.which === 13 || e.keyCode === 13) {
				e.preventDefault();
				goLogin();
			}
		});

		$('#unifiedModalBtn').on('click', function() {
			closeModal();
		});

		// 로그인 유효성 검사 및 실행 시작
		function goLogin() {
			var userId = $.trim($('#user_id').val());
			var userPw = $.trim($('#user_password').val());

			if (userId === "") {
				showModal("아이디를 입력해 주세요.", false);
				$('#user_id').focus();
				return;
			}
			if (userPw === "") {
				showModal("비밀번호를 입력해 주세요.", false);
				$('#user_password').focus();
				return;
			}

			// 버튼 비활성화 (중복 제출 방지)
			$('#btnLoginSubmit').prop('disabled', true).text('로그인 확인 중...');

			osCheck();
		}

		// 로그인 실제 처리 (통합 login_proc 호출)
		function loginProc() {
			var userId = $.trim($('#user_id').val());
			var userPw = $.trim($('#user_password').val());
			var autoLogin = $('#autoLogin').is(':checked') ? 'Y' : 'N';
			var csrfName = $('#csrf').attr("name");
			var csrfVal = $('#csrf').val();

			// 아이디 저장 쿠키 처리
			if ($("#idSave").is(":checked")) {
				setCookie("id_save", userId, 7);
			} else {
				deleteCookie("id_save");
			}

			var reqData = {
				"user_id": userId,
				"user_password": userPw,
				"auto_login": autoLogin,
				"app_key": app_key
			};
			reqData[csrfName] = csrfVal;

			$.ajax({
				type: "POST",
				url: "/home/login_proc",
				data: reqData,
				dataType: "json",
				success: function(data) {
					$('#btnLoginSubmit').prop('disabled', false).text('로그인');

					if (data.result === "success") {
						// CSRF 갱신
						if (data.csrf) {
							$('#csrf').val(data.csrf);
						}

						// 권한별 목적지 URL 결정 (기본: /main)
						var targetUrl = data.target_url || "/main";
						location.href = targetUrl;
					} else {
						showModal(data.msg || "아이디 또는 비밀번호를 확인해 주세요.", true);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					$('#btnLoginSubmit').prop('disabled', false).text('로그인');
					showModal("서버와 통신 중 오류가 발생했습니다.<br>잠시 후 다시 시도해 주세요.", false);
					console.log(jqXHR.responseText);
				}
			});
		}

		// 모바일 OS 및 웹 환경 분기
		function osCheck() {
			var varUA = navigator.userAgent.toLowerCase();
			if (varUA.indexOf('android') > -1) {
				// 안드로이드 웹뷰 앱 브릿지
				try {
					app_key = window.androidbridge.getAndroidToken();
					loginProc();
				} catch (e) {
					app_key = "";
					loginProc();
				}
			} else if (varUA.indexOf("iphone") > -1 || varUA.indexOf("ipad") > -1 || varUA.indexOf("ipod") > -1) {
				// iOS 웹뷰 앱 브릿지
				try {
					login_str = "login";
					webkit.messageHandlers.tokenHandler.postMessage("");
				} catch (e) {
					loginProc();
				}
			} else {
				// 데스크톱 / PC / 일반 모바일 웹 브라우저
				loginProc();
			}
		}

		// iOS 네이티브에서 토큰 수신 콜백
		function receiveToken(r) {
			app_key = (r && r.token) ? r.token + "" : "";
			if (login_str === "login") {
				loginProc();
			} else {
				autoLogin();
			}
		}

		// 초기화 및 쿠키 세팅
		$(document).ready(function() {
			// 저장된 아이디 불러오기
			var savedId = getCookie("id_save");
			if (savedId) {
				$("#user_id").val(savedId);
				$("#idSave").prop("checked", true);
				$("#user_password").focus();
			} else {
				$("#user_id").focus();
			}

			// 아이디 저장 체크박스 이벤트
			$("#idSave").on('change', function() {
				if (!$(this).is(":checked")) {
					deleteCookie("id_save");
				} else if ($("#user_id").val()) {
					setCookie("id_save", $("#user_id").val(), 7);
				}
			});

			// 자동 로그인 체크 (앱 전용)
			autoLoginCheck();
		});

		// 쿠키 헬퍼 함수
		function setCookie(cookieName, value, exdays) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var cookieValue = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toGMTString()) + "; path=/";
			document.cookie = cookieName + "=" + cookieValue;
		}

		function deleteCookie(cookieName) {
			var expireDate = new Date();
			expireDate.setDate(expireDate.getDate() - 1);
			document.cookie = cookieName + "= ; expires=" + expireDate.toGMTString() + "; path=/";
		}

		function getCookie(cookieName) {
			cookieName = cookieName + '=';
			var cookieData = document.cookie;
			var start = cookieData.indexOf(cookieName);
			var cookieValue = '';
			if (start != -1) {
				start += cookieName.length;
				var end = cookieData.indexOf(';', start);
				if (end == -1) end = cookieData.length;
				cookieValue = cookieData.substring(start, end);
			}
			return unescape(cookieValue);
		}

		function autoLoginCheck() {
			var varUA = navigator.userAgent.toLowerCase();
			if (varUA.indexOf('android') > -1) {
				try {
					app_key = window.androidbridge.getAndroidToken();
					autoLogin();
				} catch (e) {}
			} else if (varUA.indexOf("iphone") > -1 || varUA.indexOf("ipad") > -1 || varUA.indexOf("ipod") > -1) {
				try {
					login_str = "";
					webkit.messageHandlers.tokenHandler.postMessage("");
				} catch (e) {}
			}
		}

		function autoLogin() {
			if (!app_key) return;
			var csrfName = $('#csrf').attr("name");
			var csrfVal = $('#csrf').val();
			var data = { "app_key": app_key };
			data[csrfName] = csrfVal;

			$.ajax({
				type: "POST",
				url: "/home/autoLoginCheck",
				data: data,
				dataType: "json",
				success: function(data) {
					if (data.result === "success") {
						var targetUrl = data.target_url || "/main";
						location.href = targetUrl;
					}
				}
			});
		}
	</script>
</body>
</html>
