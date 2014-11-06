
// $(document).ready()
$(function(){
    // animate bar function
    var animateBar = function($item,noAni){
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

	$('.artical-cate li')
        .mouseenter(function(){
		    animateBar($(this));
	    })
        .mouseleave(function(){
			animateBar($('.artical-cate .on'));
		});

	$(window).resize(function(e) {
		waitForFinalEvent( function(){ animateBar($('.artical-cate .on')); } );
	});

    // bar config
    var bar_config = {
        homepage : {
            id : "#nav_home_id",
            pathname : "/"
        },
        articles : {
            id : "#nav_articles_id",
            pathname : "articles.html"
        },
        works : {
            id : "#nav_works_id",
            pathname : "works.html"
        },
        about : {
            id : "#nav_about_id",
            pathname : "about.html"
        }
    };
    
    // bar status depends on location.pathname
    var naviBarInit = function (){
        // remove class 'on'
        $(".artical-cate li").removeClass( "on" );

        // Match pathname
        var path_arg = location.pathname;

        if( path_arg == bar_config.homepage.pathname ) {
            $(bar_config.homepage.id).addClass("on");
        } else if( path_arg.indexOf(bar_config.works.pathname) >= 0 ) {
            $(bar_config.works.id).addClass("on");
        } else if( path_arg.indexOf(bar_config.about.pathname) >= 0 ) {
            $(bar_config.about.id).addClass("on");
        } else {
            // default: articles or posts
            $(bar_config.articles.id).addClass("on");
        }

        $('.cate-bar').css( {visibility:"visible"} );
        animateBar($('.artical-cate .on'),true);
    };

    naviBarInit();
});
