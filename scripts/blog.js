
// $(document).ready()
$(function(){
    // sidebar event
    (function(document) {
        var toggle = document.querySelector('.sidebar-toggle');
        var sidebar = document.querySelector('#sidebar');
        var checkbox = document.querySelector('#sidebar-checkbox');

        document.addEventListener('click', function(e) {
            var target = e.target;

            if(!checkbox.checked || sidebar.contains(target) || (target === checkbox || target === toggle)) {
                localStorage.sidebar_checked = checkbox.checked ? '1' : '0';
                return;
            }

            localStorage.sidebar_checked = '0';
            checkbox.checked = false;
        }, false);
    })(document);
    
    // load last remember status
    if ( localStorage.sidebar_checked == '1' ) {
        $(".sidebar-checkbox").prop('checked', true);
    }
});
