// ==UserScript==
// @name          Modern Scroll
// @description	  An up-to-date alternative to Opera's standard scrollbars
// @author        Christoph D.
// @exclude http://acid3.acidtests.org/
// ==/UserScript==

var last_docsize;

window.addEventListener("DOMContentLoaded", function(){
	
	if(window.self != window.top) return; // only treat main page not iframes, ads, etc.
	
	inject_css();	
	initialize_bars();

	document.getElementById("MS_vbar_bg").addEventListener("mousedown", scroll_bg_v, true);
	document.getElementById("MS_hbar_bg").addEventListener("mousedown", scroll_bg_h, true);
	
	document.getElementById("MS_vbar").addEventListener("mousedown", drag_v, true);
	document.getElementById("MS_hbar").addEventListener("mousedown", drag_h, true);
	
	window.addEventListener("DOMNodeInserted", adjust_bars_if_necessary, false);
	window.addEventListener("resize", adjust_bars, false);
	window.addEventListener("scroll", reposition_bars, false);
	
	opera.extension.onmessage = inject_css;

},false);

function inject_css(){
	var MS_style = "#MS_v_container{ position:fixed; height:100%; width:30px; right:0px; top:0px; z-index:99997; } #MS_v_container:hover #MS_vbar, #MS_v_container:hover #MS_vbar_bg{ width:"+widget.preferences.hover_size+"px; } #MS_h_container:hover #MS_hbar, #MS_h_container:hover #MS_hbar_bg{ height:"+widget.preferences.hover_size+"px; } #MS_v_container:hover #MS_vbar, #MS_h_container:hover #MS_hbar{ opacity:0.5; transition:opacity 0.1s 0s; -o-transition:opacity 0.1s 0s; } #MS_v_container:hover #MS_vbar_bg, #MS_h_container:hover #MS_hbar_bg{ opacity:"+((widget.preferences.no_bar_bg == "1")?"0":"0.5")+"; transition:opacity 0.1s 0s; -o-transition:opacity 0.1s 0s; } #MS_h_container{ position:fixed; height:30px; width:100%; left:0px; bottom:0px; z-index:9997; } #MS_vbar_bg, #MS_hbar_bg{ background-color:#999; opacity:"+((widget.preferences.show_when=="3" && widget.preferences.no_bar_bg != "1")?"0.5":"0")+"; position:fixed; z-index:99998; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s; -o-transition:opacity 0.5s 1s; } #MS_vbar_bg{ right:0px; top:0px; height:100%; width:"+widget.preferences.size+"px; } #MS_hbar_bg{ left:0px; bottom:0px; height:"+widget.preferences.size+"px; width:100%; } #MS_vbar, #MS_hbar{ background-color:"+widget.preferences.color+"; opacity:"+((widget.preferences.show_when=="3")?"0.5":"0")+"; position:fixed; z-index:99999; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s; -o-transition:opacity 0.5s 1s; } #MS_vbar{ right:0px; top:0px; height:30px; min-height:30px; width:"+widget.preferences.size+"px; } #MS_vbar:hover, #MS_hbar:hover{ opacity:0.7; } #MS_hbar{ left:0px; bottom:0px; width:30px; min-width:30px; height:"+widget.preferences.size+"px; } #MS_page_cover{ display:none; position:fixed; left:0px; top:0px; width:100%; height:100%; z-index:99996; background-color:rgba(0,0,0,0); }";
	
	if(document.getElementById("MS_style")) document.getElementById("MS_style").innerHTML = MS_style;
	else{
		var style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.id = "MS_style";
		style.innerHTML = MS_style;
		try{ document.getElementsByTagName("head")[0].appendChild(style); }
		catch(e){
			try{
				var head = document.createElement("head");
				head.appendChild(style);
				document.body.appendChild(head);
			}catch(e){ opera.postError("Slim Scrollbar failed to inject its style"); }
		}
	}
}

function initialize_bars(){
	
	var v_container = document.createElement("div");
	v_container.id = "MS_v_container";
	v_container.innerHTML = "<div id='MS_vbar_bg'></div><div id='MS_vbar'></div>";
	
	var h_container = document.createElement("div");
	h_container.id = "MS_h_container";
	h_container.innerHTML = "<div id='MS_hbar_bg'></div><div id='MS_hbar'></div>";
	
	var page_cover = document.createElement("div"); // covers the page and thus prevents cursor changes when dragging
	page_cover.id = "MS_page_cover";
	
	document.body.appendChild(v_container);
	document.body.appendChild(h_container);
	document.body.appendChild(page_cover);
	
	adjust_bars();
}

function adjust_bars_if_necessary(){
	if(last_docsize != Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)){
		last_docsize = Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
		resize_bars();
		reposition_bars();
	}
}

function adjust_bars(){
	resize_bars();
	reposition_bars();
}

function resize_bars(){
	resize_vbar();
	resize_hbar();
}

function resize_vbar(){
	//don't display if content fits into window:
	if(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)<=window.innerHeight){
		if(document.getElementById("MS_vbar").style.display = "inline"){
			document.getElementById("MS_v_container").style.display = "none";
			document.getElementById("MS_vbar_bg").style.display = "none";
			document.getElementById("MS_vbar").style.display = "none";
		}
		return;
	}
	
	document.getElementById("MS_vbar").style.height = Math.round(window.innerHeight/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)/window.innerHeight))+"px"; // resize it
	
	if(document.getElementById("MS_vbar").style.display = "none"){
		document.getElementById("MS_v_container").style.display = "inline";
		document.getElementById("MS_vbar_bg").style.display = "inline";
		document.getElementById("MS_vbar").style.display = "inline";
	}
}

function resize_hbar(){
	//don't display if content fits into window:
	if(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)<=window.innerWidth){
		if(document.getElementById("MS_hbar").style.display = "inline"){
			document.getElementById("MS_h_container").style.display = "none";
			document.getElementById("MS_hbar_bg").style.display = "none";
			document.getElementById("MS_hbar").style.display = "none";
		}
		return 0;
	}
	
	document.getElementById("MS_hbar").style.width = Math.round(window.innerWidth/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)/window.innerWidth))+"px"; // resize it
	
	if(document.getElementById("MS_hbar").style.display = "none"){
		document.getElementById("MS_h_container").style.display = "inline";
		document.getElementById("MS_hbar_bg").style.display = "inline";
		document.getElementById("MS_hbar").style.display = "inline";
	}
}

function drag_v(){
	document.getElementById("MS_vbar").style.opacity = 0.7;
	document.getElementById("MS_vbar").style.width = widget.preferences.hover_size+"px";
	document.getElementById("MS_vbar_bg").style.width = widget.preferences.hover_size+"px";
	window.event.preventDefault(); // prevent focus-loss in site
	var bar = document.getElementById("MS_vbar");
	var dragy = window.event.clientY - parseInt(bar.style.top);
	document.onmousemove = function(){
		document.getElementById("MS_page_cover").style.display = "inline";
		show_bars();
		var posy = window.event.clientY;
		bar.style.top = ((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-bar.offsetHeight?window.innerHeight-bar.offsetHeight : (posy - dragy))) + "px";
		
		window.scrollTo(window.scrollX, parseInt(bar.style.top)/(window.innerHeight-bar.offsetHeight)*(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight));
	}
	document.onmouseup = function(){
		document.getElementById("MS_page_cover").style.display = "none";
		document.getElementById("MS_vbar").style.opacity = null;
		document.getElementById("MS_vbar").style.width = null;
		document.getElementById("MS_vbar_bg").style.width = null;
		hide_bars();
		document.onmousemove = null;
	};
}

function drag_h(){
	document.getElementById("MS_hbar").style.opacity = 0.7;
	document.getElementById("MS_hbar").style.height = widget.preferences.hover_size+"px";
	document.getElementById("MS_hbar_bg").style.height = widget.preferences.hover_size+"px";
	window.event.preventDefault(); // prevent focus-loss in site
	var bar = document.getElementById("MS_hbar");
	var dragx = window.event.clientX - parseInt(bar.style.left);
	document.onmousemove = function(){
		document.getElementById("MS_page_cover").style.display = "inline";
		show_bars();
		var posx = window.event.clientX;
		bar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-bar.offsetWidth?window.innerWidth-bar.offsetWidth : (posx - dragx))) + "px";
		
		window.scrollTo(parseInt(bar.style.left)/(window.innerWidth-bar.offsetWidth)*(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth), window.scrollY);
	};
	document.onmouseup = function(){
		document.getElementById("MS_page_cover").style.display = "none";
		document.getElementById("MS_hbar").style.opacity = null;
		document.getElementById("MS_hbar").style.height = null;
		document.getElementById("MS_hbar_bg").style.height = null;
		hide_bars();
		document.onmousemove = null;
	};
}

function reposition_bars(){
	show_bars();
		
	if(document.getElementById("MS_vbar").style.display=="inline")
		document.getElementById("MS_vbar").style.top = Math.round(window.scrollY/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight)*(window.innerHeight-document.getElementById("MS_vbar").offsetHeight))+"px";
	if(document.getElementById("MS_hbar").style.display=="inline")
		document.getElementById("MS_hbar").style.left = Math.round(window.scrollX/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth)*(window.innerWidth-document.getElementById("MS_hbar").offsetWidth))+"px";
		
	window.setTimeout(hide_bars, 1000);
}

function scroll_bg_v(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.clientY>parseInt(document.getElementById("MS_vbar").style.top)) window.scrollBy(0, window.innerHeight);
	else window.scrollBy(0, -window.innerHeight);
}

function scroll_bg_h(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.clientX>parseInt(document.getElementById("MS_hbar").style.left)) window.scrollBy(window.innerWidth, 0);
	else window.scrollBy(-window.innerWidth, 0);
}

function show_bars(){
	if(widget.preferences.show_when == "1") return; // 1 = only onmouseover
	show_bar("v"); show_bar("h");
}
function hide_bars(){
	if(document.getElementById("MS_vbar").style.opacity == 0.7 || document.getElementById("MS_hbar").style.opacity == 0.7) return; // don't hide if bar is dragged
	hide_bar("v"); hide_bar("h");
}

function show_bar(whichone){
	document.getElementById("MS_"+whichone+"bar_bg").style.transition = "opacity 0.25s 0s";
	document.getElementById("MS_"+whichone+"bar_bg").style.oTransition = "opacity 0.25s 0s";
	if(widget.preferences.no_bar_bg != "1") document.getElementById("MS_"+whichone+"bar_bg").style.opacity = "0.5";
	if(document.getElementById("MS_"+whichone+"bar").style.opacity == 0.7) return; // don't alter if bar is dragged
	document.getElementById("MS_"+whichone+"bar").style.transition = "opacity 0.25s 0s";
	document.getElementById("MS_"+whichone+"bar").style.oTransition = "opacity 0.25s 0s";
	document.getElementById("MS_"+whichone+"bar").style.opacity = "0.5";
}
function hide_bar(whichone){
	document.getElementById("MS_"+whichone+"bar_bg").style.transition = null;
	document.getElementById("MS_"+whichone+"bar_bg").style.oTransition = null;
	document.getElementById("MS_"+whichone+"bar_bg").style.opacity = null;
	document.getElementById("MS_"+whichone+"bar").style.transition = null;
	document.getElementById("MS_"+whichone+"bar").style.oTransition = null;
	document.getElementById("MS_"+whichone+"bar").style.opacity = null;
}