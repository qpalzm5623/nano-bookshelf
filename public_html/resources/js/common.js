$(function() {
	/* 팝업 */
	$('.open_confirm').on('click', function(e) {
		e.preventDefault();
		//$('.layer_popup_wrap.confirm').show();
	})
	$('.layer_popup .popup_close').on('click', function(e) {
		e.preventDefault();
		$(this).closest('.layer_popup_wrap').hide();
	})

	/* 목록 타입 선택 */
  $(".list_view_type a").on("click", function (e) {
    e.preventDefault();
    var _this = $(this);
    var parentBox = _this.parent();
    var listType = _this.data("type");
    var list = parentBox.data("list");
		// var removeClass = $(list).attr("class").split(" ")[1];
		var removeClass = $(list).attr("class").split(" ").reverse()[0];

		$(list).removeClass(removeClass).addClass(listType);
    _this.closest(".list_view_type").find("a").not(_this).addClass("on");
    _this.removeClass("on");
  });

	/* 게시판 */
	$('.board_item .board_title').on("click", function (e) {
    e.preventDefault();
    var _this = $(this);
    var itemBox = _this.parent();
		$('.board_item').not(itemBox).removeClass('on');
		itemBox.toggleClass('on');
  });
	
	/* 탭 */
	$('.tab_box .tab').on('click', function(e) {
		e.preventDefault();
		const tabIndex = $(this).index();
		$('.tab_box .tab').not($(this)).removeClass('on');
		$(this).addClass('on');

		$('.tab_contents').hide();
		$('.tab_contents').eq(tabIndex).show();
	})
});