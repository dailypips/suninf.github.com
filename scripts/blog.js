function addLoadEvent(func) {
    var oldload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    }
    else {
        window.onload = function () {
            oldload();
            func();
        }
    }
}

// animate bar function
function animateBar($item,noAni){
	var spanLeft = $item.find('span').offset().left;
	var conLeft = $item.parent().offset().left;
	var left = spanLeft - conLeft - 4;
	var width = $item.find('span').width() + 8;

	if(noAni){
		$('#cateBar').css({left:left,width:width})
	}else{
		$('#cateBar').stop().animate({left:left,width:width},300)
	}
}

$(function(){
	var waitForFinalEvent = (function () {
		var timers = {};
		return function (callback, ms, uniqueId) {
			if (!uniqueId) {
				uniqueId = "Don't call this twice without a uniqueId";
			}
			if (timers[uniqueId]) {
				clearTimeout (timers[uniqueId]);
			}
			timers[uniqueId] = setTimeout(callback, ms);
		};
	})();

	$('.artical-cate li').mouseenter(function(){
		animateBar($(this));
	}).mouseleave(function(){
				animateBar($('.artical-cate .on'));
			});

	$(window).resize(function(e){
		waitForFinalEvent(function(){
			animateBar($('.artical-cate .on'));
		})
	})

});

// bar status depends on location.pathname
function naviBarInit() {
    // remove class 'on'
	$(".artical-cate li").removeClass( "on" );

    // parse url
    var path_arg = location.pathname;

    if( path_arg == "/" ) {
        $("#nav_home_id").addClass("on");
    } else if( path_arg.indexOf("about.html") >= 0 ) {
        $("#nav_about_id").addClass("on");
    } else {
        // articles.html or posts
        $("#nav_articles_id").addClass("on");
    }

    $('.cate-bar').css( {visibility:"visible"} );
    animateBar($('.artical-cate .on'),true);
}


// window.onload
addLoadEvent( naviBarInit );
