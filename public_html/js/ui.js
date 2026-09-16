// 사이드메뉴-버튼
function handleSideMenuOpen(){
	jQuery('html').addClass('sideMenuOpen');
};
function handleSideMenuClose(){
	jQuery('html').removeClass('sideMenuOpen');
};
jQuery(function(){
	jQuery('.aside_dimmed').bind('click', function(){
		handleSideMenuClose();
	});
});

// 레이어
window.uiLayer = {
	open: function(target){
		jQuery(target).addClass('view');
	},
	close: function(target){
		jQuery(target).removeClass('view');
	}
}

// 비밀번호 타입변경
function pwTypeToggle(btn, target){
	if(jQuery(btn).hasClass('active')){
		jQuery(btn).removeClass('active');
		jQuery(target).attr('type', 'password');
		return;
	}
	jQuery(btn).addClass('active');
	jQuery(target).attr('type', 'text');
}

// 공지사항
function handleNoticeToggle(ele){
	jQuery(ele).parents('li').toggleClass('open');
}

// 레이어페이지
var _uiPageScrollValue=0;
window.uiPage={
	open: function(target){
		_uiPageScrollValue=jQuery(window).scrollTop();
		jQuery(target).addClass('view');
		jQuery('html').addClass('uipage_fix').addClass('uipage_move_open');
		setTimeout(function(){
			jQuery('html').removeClass('uipage_fix').removeClass('uipage_move_open').addClass('uipage_view');
			jQuery(window).scrollTop(0);
		}, 500);
	},
	close: function(target){
		jQuery('html').addClass('uipage_fix').addClass('uipage_move_close');
		jQuery('html').removeClass('uipage_view');
		jQuery(window).scrollTop(_uiPageScrollValue);
		setTimeout(function(){
			jQuery('html').removeClass('uipage_fix').removeClass('uipage_move_close');
			jQuery(target).removeClass('view');
		}, 500);
	}
}











