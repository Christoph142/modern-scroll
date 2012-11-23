// ==UserScript==
// @name          modern scroll
// @description	  An up-to-date alternative to Opera's standard scrollbars
// @author        Christoph D.
// @exclude http://acid3.acidtests.org/
// @exclude http://www.megalab.it/*
// ==/UserScript==

var timeout;		// scrolling animation
var hide_timeout;	// hide bars

window.opera.addEventListener("BeforeEvent.DOMContentLoaded", call_on_load, false);
window.addEventListener("DOMContentLoaded", function(){ // local files except options page:
	if(!document.getElementById("vbar") && !document.URL.match("widget://")){ call_on_load(); }
}, false);

function call_on_load(){
	if(window.matchMedia("all and (view-mode: minimized)").matches) return; // don't do anything if it's a speed dial
	if(window.self != window.top) return; // only treat main page not iframes, ads, etc.
	
	inject_css();
	
	if(widget.preferences.fullscreen_only == 0 || window.screen.height === window.outerHeight){
		add_ui();
		window.opera.addEventListener("AfterEvent.DOMContentLoaded", resize_bars, false);
	}
	
	opera.extension.onmessage = function(){
		remove_ui();
		inject_css();
		add_or_remove_ui(); // re-adds it if appropriate
	}
	
	opera.extension.postMessage("reset_contextmenu");
	window.addEventListener("mousedown", adjust_contextmenu, false);
	opera.contexts.menu.onclick = contextmenu_click;
}

function inject_css(){
	//console.log(document.body.scrollbarFaceColor);
	var w = widget.preferences;
	var ms_style =
		"#ms_v_container{ height:100%; width:"+(w.container=="1"?w.container_size:"1")+"px; "+(w.vbar_at_left=="1"?"left":"right")+":0px; top:0px; background:rgba(0,0,0,0); }"+
		"#ms_h_container{ height:"+(w.container=="1"?w.container_size:"1")+"px; width:100%; left:0px; "+(w.hbar_at_top=="1"?"top":"bottom")+":0px; background:rgba(0,0,0,0); }"+
		"#ms_vbar_bg, #ms_hbar_bg{ opacity:"+((w.show_when=="3" && w.no_bar_bg != "1")?"0.5":"0")+"; transition:opacity 0.5s 1s; }"+
		"#ms_vbar_bg{ top:0px; height:100%; "+(w.vbar_at_left=="1"?"left":"right")+":0px; }"+
		"#ms_hbar_bg{ left:0px; width:100%; "+(w.hbar_at_top=="1"?"top":"bottom")+":0px; }"+
		"#ms_vbar_bg_ui, #ms_hbar_bg_ui{ background:"+w.color_bg+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }"+
		"#ms_vbar_bg_ui{ margin-"+(w.vbar_at_left=="1"?"left":"right")+":"+(w.gap)+"px; height:100%; width:"+w.size+"px; transition:width 0.25s; }"+
		"#ms_hbar_bg_ui{ margin-"+(w.hbar_at_top=="1"?"top":"bottom")+":"+(w.gap)+"px; width:100%; height:"+w.size+"px; transition:height 0.25s; }"+
		"#ms_vbar, #ms_hbar{ opacity:"+((w.show_when=="3")?"0.5":"0")+"; transition:opacity 0.5s 1s; }"+
		"#ms_vbar{ top:0px; height:30px; min-height:30px; "+(w.vbar_at_left=="1"?"left":"right")+":0px; }"+
		"#ms_hbar{ left:0px; width:30px; min-width:30px; "+(w.hbar_at_top=="1"?"top":"bottom")+":0px; }"+
		"#ms_vbar_ui, #ms_hbar_ui{ background:"+w.color+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }"+
		"#ms_vbar_ui{ height:100%; width:"+w.size+"px; margin-"+(w.vbar_at_left=="1"?"left":"right")+":"+(w.gap)+"px; transition:width 0.25s; }"+
		"#ms_hbar_ui{ width:100%; height:"+w.size+"px; margin-"+(w.hbar_at_top=="1"?"top":"bottom")+":"+(w.gap)+"px; transition:height 0.25s; }"+
		"#ms_superbar{ width:100px; background:"+(w.show_superbar_minipage==0?w.color:"rgba(0,0,0,0)")+"; opacity:"+((w.show_when=="3")?"0.5":"0")+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" "+(w.show_superbar_minipage==1?", 0 0 200px 10px #999":"")+" !important; border-radius:"+w.border_radius+"px; transition:opacity 0.5s 1s; min-width:30px; min-height:30px; }"+
		"#ms_page_cover{ left:0px; top:0px; width:100%; height:100%; background:rgba(0,0,0,0); padding:0px; margin:0px; }"+
		"#ms_upbutton, #ms_downbutton{ height:"+w.button_height*2+"px; width:"+w.button_width+"px; left:"+w.buttonposition+"%; opacity:"+w.button_opacity/100+"; background:"+w.color+"; border-radius:50px; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); transition:opacity 0.5s; }"+
		"#ms_upbutton{ top:-"+w.button_height+"px; }"+
		"#ms_downbutton{ bottom:-"+w.button_height+"px; }"+
		"#ms_minipage_canvas{ top:0px; left:0px; background:#000; }"+
		
		"#ms_v_container:hover #ms_vbar_ui, #ms_v_container:hover #ms_vbar_bg_ui{ width:"+w.hover_size+"px; transition:width 0.1s; }"+
		"#ms_h_container:hover #ms_hbar_ui, #ms_h_container:hover #ms_hbar_bg_ui{ height:"+w.hover_size+"px; transition:height 0.1s; }"+
		"#ms_v_container:hover #ms_vbar, #ms_h_container:hover #ms_hbar, #ms_v_container:hover #ms_superbar, #ms_h_container:hover #ms_superbar{ opacity:0.5; transition:opacity 0.1s 0s; }"+
		"#ms_v_container:hover #ms_vbar_bg, #ms_h_container:hover #ms_hbar_bg{ opacity:"+((w.no_bar_bg == "1")?"0":"0.5")+"; transition:opacity 0.1s 0s; }"+
		"#ms_v_container #ms_vbar:hover, #ms_h_container #ms_hbar:hover, #ms_upbutton:hover, #ms_downbutton:hover{ opacity:0.7; transition:opacity 0.1s 0s; }"+
		"#ms_v_container #ms_vbar_bg:hover, #ms_h_container #ms_hbar_bg:hover{ opacity:"+((w.no_bar_bg == "1")?"0":"0.51")+"; transition:opacity 0.1s 0s; }"+
		"#ms_superbar:hover{ opacity:"+w.superbar_opacity/100+"; transition:opacity 0.25s 0s; }"+
		
<<<<<<< HEAD
		".dragged #ms_vbar, .dragged #ms_hbar, .dragged #ms_vbar_bg, .dragged #ms_hbar_bg{ opacity:0.7; }"+
		".dragged #ms_vbar_ui, .dragged #ms_vbar_bg_ui{ width:"+w.hover_size+"px; }"+
		".dragged #ms_hbar_ui, .dragged #ms_hbar_bg_ui{ height:"+w.hover_size+"px; }"+
		"#ms_superbar.dragged{ opacity:"+(w.show_superbar_minipage=="1"?1:(w.superbar_opacity/100))+"; }"+
=======
		".show #ms_vbar_bg, .show #ms_hbar_bg{ opacity:"+(w.no_bar_bg=="1"?"0":"0.5")+"; transition:opacity 0.25s 0s; }"+
		".show #ms_vbar, .show #ms_hbar{ opacity:0.5; transition:opacity 0.25s 0s; }"+
		
		".dragged #ms_vbar_bg, .dragged #ms_hbar_bg{ opacity:"+(w.no_bar_bg=="1"?"0":"0.7")+"; }"+
		".dragged #ms_vbar, .dragged #ms_hbar{ opacity:0.7; }"+
		".dragged #ms_vbar_ui, .dragged #ms_vbar_bg_ui{ width:"+w.hover_size+"px; }"+
		".dragged #ms_hbar_ui, .dragged #ms_hbar_bg_ui{ height:"+w.hover_size+"px; }"+
		"#ms_superbar.dragged{ opacity:"+(w.show_superbar_minipage=="1"?"1":(w.superbar_opacity/100))+"; }"+
>>>>>>> more JS to CSS
		
		"#ms_v_container, #ms_h_container, #ms_vbar_bg, #ms_hbar_bg, #ms_vbar, #ms_hbar, #ms_superbar, #ms_page_cover, #ms_upbutton, #ms_downbutton, #ms_minipage_canvas{ position:fixed; z-index:2147483647; border:none; padding:0; margin:0; display:none; }";
	
	if(document.getElementById("ms_style")) document.getElementById("ms_style").innerHTML = ms_style; // when options changed
	else{ // when website is initially loaded
		var style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.id = "ms_style";
		style.innerHTML = ms_style;
		document.getElementsByTagName("head")[0].appendChild(style);
	}
}

function add_bars(){	
	var v_container = document.createElement("div");
	v_container.id = "ms_v_container";
	v_container.innerHTML = "<div id='ms_vbar_bg'><div id='ms_vbar_bg_ui'></div></div><div id='ms_vbar'><div id='ms_vbar_ui'></div></div>";
	
	var h_container = document.createElement("div");
	h_container.id = "ms_h_container";
	h_container.innerHTML = "<div id='ms_hbar_bg'><div id='ms_hbar_bg_ui'></div></div><div id='ms_hbar'><div id='ms_hbar_ui'></div></div>";
	
	var superbar = document.createElement("div");
	superbar.id = "ms_superbar";
	
	var page_cover = document.createElement("div"); // covers the page and thus prevents cursor changes when dragging
	page_cover.innerHTML = "<canvas id='ms_minipage_canvas' width='"+window.innerWidth+"' height='"+window.innerHeight+"'></canvas>";
	page_cover.id = "ms_page_cover";
	
	document.body.appendChild(page_cover);
	document.body.appendChild(superbar);
	document.body.appendChild(h_container);
	document.body.appendChild(v_container); // last in DOM gets displayed top
}

function add_functionality(){
	document.getElementById("ms_vbar_bg").addEventListener("mousedown", scroll_bg_v, true);
	document.getElementById("ms_hbar_bg").addEventListener("mousedown", scroll_bg_h, true);
	
	document.getElementById("ms_superbar").addEventListener("mousedown", drag_super, true);
	document.getElementById("ms_vbar").addEventListener("mousedown", drag_v, true);
	document.getElementById("ms_hbar").addEventListener("mousedown", drag_h, true);
	
	document.getElementById("ms_h_container").addEventListener("mousewheel", mouse_scroll_x, true);
	document.getElementById("ms_hbar_bg").addEventListener("mousewheel", mouse_scroll_x, true);
	document.getElementById("ms_hbar").addEventListener("mousewheel", mouse_scroll_x, true);
	
	if(document.getElementById("ms_upbutton")){
		document.getElementById("ms_upbutton").addEventListener("mousedown", function(){ handle_button("up"); }, true);
		document.getElementById("ms_downbutton").addEventListener("mousedown", function(){ handle_button("down"); }, true);
	}
	
	window.addEventListener("DOMNodeInserted", onDOMNode, false);
	window.addEventListener("DOMNodeRemoved", onDOMNode, false);
	window.addEventListener("resize", resize_bars, false);
	window.addEventListener("resize", add_or_remove_ui, false);
	window.addEventListener("mouseup", check_resize, false);
	if(widget.preferences.animate_mousescroll == "1") window.addEventListener("scroll", reposition_bars, false);
	else window.addEventListener("scroll", onScroll, false);
}

function check_resize(){ window.setTimeout(resize_bars, 200); } // needs some time to affect page height if click expands element
function resize_bars(){
	resize_vbar();
	resize_hbar();
	reposition_bars();
}

function resize_vbar(){
	//don't display if content fits into window:
	if(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight) <= window.innerHeight){
		if(document.getElementById("ms_vbar").style.display == "inline"){
			document.getElementById("ms_v_container").style.display = null;
			document.getElementById("ms_vbar_bg").style.display = null;
			document.getElementById("ms_vbar").style.display = null;
		}
		return;
	}
	var vbar_height_before = document.getElementById("ms_vbar").style.height;
	document.getElementById("ms_vbar").style.height = Math.round(window.innerHeight/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)/window.innerHeight))+"px"; // resize it
	
	if(document.getElementById("ms_vbar").style.display != "inline"){
		document.getElementById("ms_v_container").style.display = "inline";
		document.getElementById("ms_vbar_bg").style.display = "inline";
		document.getElementById("ms_vbar").style.display = "inline";
		show_bar("v");
		opera.extension.postMessage("reset_contextmenu");
	}
	else if(vbar_height_before != document.getElementById("ms_vbar").style.height) show_bar("v");
}

function resize_hbar(){
	//don't display if content fits into window:
	if(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)<=window.innerWidth){
		if(document.getElementById("ms_hbar").style.display == "inline"){
			document.getElementById("ms_h_container").style.display = null;
			document.getElementById("ms_hbar_bg").style.display = null;
			document.getElementById("ms_hbar").style.display = null;
		}
		return 0;
	}
	
	var hbar_width_before = document.getElementById("ms_hbar").style.width;
	document.getElementById("ms_hbar").style.width = Math.round(window.innerWidth/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)/window.innerWidth))+"px"; // resize it
	
	if(document.getElementById("ms_hbar").style.display != "inline"){
		document.getElementById("ms_h_container").style.display = "inline";
		document.getElementById("ms_hbar_bg").style.display = "inline";
		document.getElementById("ms_hbar").style.display = "inline";
		show_bar("h");
		opera.extension.postMessage("reset_contextmenu");
	}
	else if(hbar_width_before != document.getElementById("ms_hbar").style.width) show_bar("h");
}

function drag_v(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	document.getElementById("ms_page_cover").style.display = "inline";
	document.getElementById("ms_v_container").className = "dragged";
<<<<<<< HEAD
		
=======
	
>>>>>>> more JS to CSS
	var bar = document.getElementById("ms_vbar");
	var dragy = window.event.clientY - parseInt(bar.style.top);
	document.onmousemove = function(){
		window.event.preventDefault(); window.event.stopPropagation();
		
		var posy = window.event.clientY;
		bar.style.top = ((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-bar.offsetHeight?window.innerHeight-bar.offsetHeight : (posy - dragy))) + "px";
		
		window.scroll(window.pageXOffset, parseInt(bar.style.top)/(window.innerHeight-bar.offsetHeight)*(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight));
	}
	document.onmouseup = function(){
		document.getElementById("ms_page_cover").style.display = null;
		document.getElementById("ms_v_container").className = null;
		
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_h(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	document.getElementById("ms_page_cover").style.display = "inline";
	document.getElementById("ms_h_container").className = "dragged";
		
	var bar = document.getElementById("ms_hbar");
	var dragx = window.event.clientX - parseInt(bar.style.left);
	document.onmousemove = function(){
		var posx = window.event.clientX;
		bar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-bar.offsetWidth?window.innerWidth-bar.offsetWidth : (posx - dragx))) + "px";
		
		window.scroll(parseInt(bar.style.left)/(window.innerWidth-bar.offsetWidth)*(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth), window.pageYOffset);
	};
	document.onmouseup = function(){
		document.getElementById("ms_page_cover").style.display = null;
		document.getElementById("ms_h_container").className = null;
		
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_super(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(widget.preferences.show_superbar_minipage=="1") show_minipage();
	
	document.getElementById("ms_superbar").className = "dragged";
	document.getElementById("ms_page_cover").style.display = "inline";
	
	var vbar = document.getElementById("ms_vbar");
	var hbar = document.getElementById("ms_hbar");
	var superbar = document.getElementById("ms_superbar");
	var dragy = window.event.clientY - parseInt(superbar.style.top);
	var dragx = window.event.clientX - parseInt(superbar.style.left);
	document.onmousemove = function(){
		superbar.style.display = "inline";
		var posx = window.event.clientX;
		var posy = window.event.clientY;
		superbar.style.top = ((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-superbar.offsetHeight?window.innerHeight-superbar.offsetHeight : (posy - dragy))) + "px";
		superbar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth?window.innerWidth-superbar.offsetWidth : (posx - dragx))) + "px";
		
		if(widget.preferences.show_superbar_minipage=="0"){
			window.scroll(parseInt(superbar.style.left)/(window.innerWidth-superbar.offsetWidth)*(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth), parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight));
			vbar.style.top = superbar.style.top;
			hbar.style.left = superbar.style.left;
		}
	};
	document.onmouseup = function(){
		if(widget.preferences.show_superbar_minipage=="1"){
			window.scroll(parseInt(superbar.style.left)/(window.innerWidth-superbar.offsetWidth)*(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth), parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight));
			if(window.scrollX == 0 && window.scrollY == 0){ // doesn't update position automatically cause of scrolling to 0,0 before screenshot
				document.getElementById("ms_vbar").style.top = "0px";
				document.getElementById("ms_hbar").style.left = "0px";
			}
			document.getElementById("ms_vbar_bg").style.display = "inline";
			document.getElementById("ms_hbar_bg").style.display = "inline";
			document.getElementById("ms_vbar").style.display = "inline";
			document.getElementById("ms_hbar").style.display = "inline";
			document.getElementById("ms_minipage_canvas").style.display = null;
		}
		document.getElementById("ms_superbar").className = null;
		document.getElementById("ms_page_cover").style.display = null;
		
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function reposition_bars(){
	var vbar_top_before = document.getElementById("ms_vbar").style.top;
	var hbar_left_before = document.getElementById("ms_hbar").style.left;
	
	if(document.getElementById("ms_vbar").style.display=="inline")
		document.getElementById("ms_vbar").style.top = Math.round(window.pageYOffset/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight)*(window.innerHeight-document.getElementById("ms_vbar").offsetHeight))+"px";
	if(document.getElementById("ms_hbar").style.display=="inline")
		document.getElementById("ms_hbar").style.left = Math.round(window.pageXOffset/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth)*(window.innerWidth-document.getElementById("ms_hbar").offsetWidth))+"px";
	
	if(window.pageYOffset > 0 && document.getElementById("ms_upbutton")) document.getElementById("ms_upbutton").style.display = "inline";
	else if(document.getElementById("ms_upbutton")) document.getElementById("ms_upbutton").style.display = null;
	if(window.pageYOffset+window.innerHeight < Math.max(document.body.scrollHeight,document.documentElement.scrollHeight) && document.getElementById("ms_downbutton"))
		document.getElementById("ms_downbutton").style.display = "inline";
	else if(document.getElementById("ms_downbutton")) document.getElementById("ms_downbutton").style.display = null;
	
	if(document.getElementById("ms_vbar").style.display == "inline" && document.getElementById("ms_hbar").style.display == "inline" && widget.preferences.show_superbar=="1"){
		document.getElementById("ms_superbar").style.top = document.getElementById("ms_vbar").style.top;
		document.getElementById("ms_superbar").style.height = document.getElementById("ms_vbar").style.height;
		document.getElementById("ms_superbar").style.left = document.getElementById("ms_hbar").style.left;
		document.getElementById("ms_superbar").style.width = document.getElementById("ms_hbar").style.width;
		document.getElementById("ms_superbar").style.display = "inline";
	}
	else if(widget.preferences.show_superbar=="1" && document.getElementById("ms_superbar").style.opacity!="1") //if superbar doesn't get dragged (minipage only -> no bars)
		window.setTimeout(function(){ document.getElementById("ms_superbar").style.display = null; }, 1500);
	
	if(vbar_top_before != document.getElementById("ms_vbar").style.top) show_bar("v");
	if(hbar_left_before != document.getElementById("ms_hbar").style.left) show_bar("h");
	
	window.clearTimeout(hide_timeout);
	hide_timeout = window.setTimeout(hide_bars, 500);
}

function scroll_bg_v(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(window.event.clientY < 50 && widget.preferences.bg_special_ends == "1") window.scrollTo(window.event.clientX, 0);
	else if((window.innerHeight-window.event.clientY) < 50 && widget.preferences.bg_special_ends == "1")
		window.scrollTo(window.event.clientX, Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));
	else if(window.event.clientY > parseInt(document.getElementById("ms_vbar").style.top)) window.scrollBy(0, window.innerHeight);
	else window.scrollBy(0, -window.innerHeight);
}

function scroll_bg_h(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(window.event.clientX < 50 && widget.preferences.bg_special_ends == "1") window.scrollTo(0, window.event.clientY);
	else if((window.innerWidth-window.event.clientX) < 50 && widget.preferences.bg_special_ends == "1")
		window.scrollTo(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth), window.event.clientY);
	if(window.event.clientX > parseInt(document.getElementById("ms_hbar").style.left)) window.scrollBy(window.innerWidth, 0);
	else window.scrollBy(-window.innerWidth, 0);
}

function show_bars(){ show_bar("v"); show_bar("h"); }
<<<<<<< HEAD
function hide_bars(){
	if(document.getElementById("ms_v_container").className == "dragged" || document.getElementById("ms_h_container").className == "dragged")
		return;
	hide_bar("v"); hide_bar("h");
}

function show_bar(whichone){
	if(widget.preferences.show_when == "1") return; // 1 = only onmouseover
	document.getElementById("ms_"+whichone+"bar_bg").style.transition = "opacity 0.25s 0s";
	if(widget.preferences.no_bar_bg != "1") document.getElementById("ms_"+whichone+"bar_bg").style.opacity = "0.5";
	if(document.getElementById("ms_"+whichone+"_container").className == "dragged") return;
	document.getElementById("ms_"+whichone+"bar").style.transition = "opacity 0.25s 0s";
	document.getElementById("ms_"+whichone+"bar").style.opacity = "0.5";
=======
function hide_bars(){ hide_bar("v"); hide_bar("h"); }

function show_bar(whichone){ // 1 = only onmouseover
	if(widget.preferences.show_when != "1" && document.getElementById("ms_"+whichone+"_container").className != "dragged")
		document.getElementById("ms_"+whichone+"_container").className = "show";
>>>>>>> more JS to CSS
}
function hide_bar(whichone){
	if(document.getElementById("ms_"+whichone+"_container").className == "show")
		document.getElementById("ms_"+whichone+"_container").className = null;
}

function mouse_scroll_x(){
	window.event.preventDefault();
	window.scrollBy(-window.event.wheelDelta*2,0);
}

function add_buttons(){
	var upbutton = document.createElement("div");
	upbutton.id = "ms_upbutton";
	
	var downbutton = document.createElement("div");
	downbutton.id = "ms_downbutton";
	
	document.body.appendChild(upbutton);
	document.body.appendChild(downbutton);
}

function handle_button(whichone){
	window.event.preventDefault();	// prevent focus-loss in site
	if(window.event.which != 1) return;	// if it's not the left mouse button
	if(!document.URL.match("widget://")) window.event.stopPropagation(); // prevent bubbling (e.g. prevent drag being triggered on separately opened images); provide event in options page (to save dragged button position)
		
	var button = document.getElementById("ms_"+whichone+"button");
	var otherbutton = document.getElementById("ms_"+(whichone=="up"?"down":"up")+"button");
	var x_start = window.event.clientX - Math.floor(button.style.left?parseInt(button.style.left):widget.preferences.buttonposition/100*window.innerWidth);
	document.onmousemove = function(){
		button.style.opacity = "0.5";
		otherbutton.style.opacity = "0.5";
		var posx = window.event.clientX;
		button.style.left = ((posx - x_start)<=-50? -50 : ((posx - x_start)>=window.innerWidth+50-button.offsetWidth?window.innerWidth+50-button.offsetWidth : (posx - x_start))) + "px";
		otherbutton.style.left = button.style.left;
		document.onmouseup = function(){
			document.onmousemove = null;
			document.onmouseup = null;
			button.style.opacity = null;
			otherbutton.style.opacity = null;
		};
	}
	document.onmouseup = function(){
		window.scroll(window.pageXOffset,whichone=="up"?0:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function show_minipage(){
	document.getElementById("ms_vbar_bg").style.display = null;
	document.getElementById("ms_hbar_bg").style.display = null;
	document.getElementById("ms_vbar").style.display = null;
	document.getElementById("ms_hbar").style.display = null;
	if(document.getElementById("ms_upbutton")){
		document.getElementById("ms_upbutton").style.display = null;
		document.getElementById("ms_downbutton").style.display = null;
	}
	
	document.body.style.transformOrigin = "0% 0%";
	document.body.style.transform = "scale("+(window.innerWidth/Math.max(document.body.scrollWidth,document.documentElement.scrollWidth,window.innerWidth))+","+(window.innerHeight/Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight))+")";
	window.scroll(0,0);
	if(document.body.className=="zoom"){
		var img = document.body.firstChild;
		img.style.transformOrigin = "0% 0%";
		img.style.transform = "scale("+(window.innerWidth/img.scrollWidth)+","+(window.innerHeight/img.scrollHeight)+")";
		window.scroll(img.offsetLeft,img.offsetTop);
	}	
	document.getElementById("ms_superbar").style.display = null;
	
	opera.extension.getScreenshot(function(imageData){
		if(document.body.className=="zoom"){
			document.body.firstChild.style.transformOrigin = null;
			document.body.firstChild.style.transform = null;
		}
		document.body.style.transform = null;
		document.body.style.transformOrigin = null;
		document.getElementById("ms_superbar").style.display = "inline";
		document.getElementById("ms_minipage_canvas").getContext('2d').putImageData(imageData, 0, 0);
		document.getElementById("ms_minipage_canvas").style.display = "inline";
	});
}

function onDOMNode(){
	window.clearTimeout(timeout);
	timeout = window.setTimeout(resize_bars, 100);
}
function onScroll(){
	window.clearTimeout(timeout);
	timeout = window.setTimeout(reposition_bars, 50);
}

function adjust_contextmenu(){
	window.event.stopPropagation();	// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	if(window.event.which != 3 || widget.preferences.contextmenu_show_when != "2") return; // only right mouse button:
	if(window.event.target.id.substr(0,3) == "ms_") opera.extension.postMessage("show_contextmenu");
	else opera.extension.postMessage("hide_contextmenu");
}
	
function contextmenu_click(){
	if(document.getElementById("ms_v_container")) remove_ui();
	else add_ui();
}

<<<<<<< HEAD
function add_or_remove_ui(){ 
	//alert(window.outerHeight+"\n"+window.innerHeight);
	if((widget.preferences.fullscreen_only == 0 || window.screen.height === window.outerHeight) && !document.getElementById("ms_v_container"))
		add_ui();
	else if(widget.preferences.fullscreen_only == 1 && window.screen.height !== window.outerHeight && document.getElementById("ms_v_container"))
		remove_ui();
=======
function add_or_remove_ui(){
	//alert(window.outerHeight+"\n"+window.innerHeight);
	if(widget.preferences.fullscreen_only == 0 || window.screen.height === window.outerHeight) add_ui();
	else if(widget.preferences.fullscreen_only == 1 && window.screen.height !== window.outerHeight)	remove_ui();
>>>>>>> more JS to CSS
}

function add_ui(){
	if(document.getElementById("ms_v_container")) return; // stop if ui is already available
	add_bars();
	if(widget.preferences.show_buttons == "1") add_buttons(); // have to be inserted before resize_bars()
	resize_bars();	
	add_functionality();
}

function remove_ui(){
	if(!document.getElementById("ms_v_container")) return;
	window.removeEventListener("DOMNodeInserted", onDOMNode, false);
	window.removeEventListener("DOMNodeRemoved", onDOMNode, false);
	window.removeEventListener("resize", resize_bars, false);
	window.removeEventListener("resize", add_or_remove_ui, false);
	window.removeEventListener("mouseup", check_resize, false);
	window.removeEventListener("scroll", onScroll, false);
	window.removeEventListener("scroll", reposition_bars, false);
	
	window.clearTimeout(timeout);
	window.clearTimeout(hide_timeout);
	
	document.body.removeChild(document.getElementById("ms_v_container"));
	document.body.removeChild(document.getElementById("ms_h_container"));
	document.body.removeChild(document.getElementById("ms_page_cover"));
	document.body.removeChild(document.getElementById("ms_superbar"));
	if(document.getElementById("ms_upbutton")){
		document.body.removeChild(document.getElementById("ms_upbutton"));
		document.body.removeChild(document.getElementById("ms_downbutton"));
	}
}