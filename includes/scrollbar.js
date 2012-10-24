// ==UserScript==
// @name          Modern Scroll
// @description	  An up-to-date alternative to Opera's standard scrollbars
// @author        Christoph D.
// @exclude http://acid3.acidtests.org/
// ==/UserScript==

var timeout;

window.addEventListener("DOMContentLoaded", function(){
	
	if(window.self != window.top) return; // only treat main page not iframes, ads, etc.
	
	inject_css();	
	add_bars();
	add_buttons();
	adjust_bars();
	workaround_for_dsk();
	
	document.getElementById("MS_vbar_bg").addEventListener("mousedown", scroll_bg_v, true);
	document.getElementById("MS_hbar_bg").addEventListener("mousedown", scroll_bg_h, true);
	
	document.getElementById("MS_superbar").addEventListener("mousedown", drag_super, true);
	document.getElementById("MS_vbar").addEventListener("mousedown", drag_v, true);
	document.getElementById("MS_hbar").addEventListener("mousedown", drag_h, true);
	
	document.getElementById("MS_h_container").addEventListener("mousewheel", mouse_scroll_x, true);
	document.getElementById("MS_hbar_bg").addEventListener("mousewheel", mouse_scroll_x, true);
	document.getElementById("MS_hbar").addEventListener("mousewheel", mouse_scroll_x, true);
	
	document.getElementById("MS_upbutton").addEventListener("mousedown", function(){ handle_button("up"); }, true);
	document.getElementById("MS_downbutton").addEventListener("mousedown", function(){ handle_button("down"); }, true);
	
	window.addEventListener("DOMNodeInserted", function(){
		window.clearTimeout(timeout);
		timeout = window.setTimeout(adjust_bars, 100);
	}, false);
	window.addEventListener("resize", adjust_bars, false);
	window.addEventListener("scroll", function(){
		window.clearTimeout(timeout);
		timeout = window.setTimeout(reposition_bars, 50);
	}, false);
	
	opera.extension.onmessage = inject_css;
	opera.contexts.menu.onclick = function(menuEvent){
		if(menuEvent.srcElement.id=="MS_upbutton" || menuEvent.srcElement.id=="MS_downbutton") menuEvent.srcElement.style.display = "none";
	};
	
},false);

function inject_css(){
	var MS_style =
		"#MS_v_container{ height:100%; width:30px; right:0px; top:0px; background:rgba(0,0,0,0); }"+
		"#MS_h_container{ height:30px; width:100%; left:0px; bottom:0px; background:rgba(0,0,0,0); }"+
		"#MS_vbar_bg, #MS_hbar_bg{ background:#999; opacity:"+((widget.preferences.show_when=="3" && widget.preferences.no_bar_bg != "1")?"0.5":"0")+"; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s, width 0.25s, height 0.25s; }"+
		"#MS_vbar_bg{ right:0px; top:0px; height:100%; width:"+widget.preferences.size+"px; }"+
		"#MS_hbar_bg{ left:0px; bottom:0px; height:"+widget.preferences.size+"px; width:100%; }"+
		"#MS_vbar, #MS_hbar{ background:"+widget.preferences.color+"; opacity:"+((widget.preferences.show_when=="3")?"0.5":"0")+"; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s, width 0.25s, height 0.25s; }"+
		"#MS_vbar{ right:0px; top:0px; height:30px; min-height:30px; width:"+widget.preferences.size+"px; }"+
		"#MS_hbar{ left:0px; bottom:0px; width:30px; min-width:30px; height:"+widget.preferences.size+"px; }"+
		"#MS_superbar{ width:100px; background:"+(widget.preferences.show_superbar_minipage==0?widget.preferences.color:"rgba(0,0,0,0)")+"; opacity:"+((widget.preferences.show_when=="3")?"0.5":"0")+"; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5)"+(widget.preferences.show_superbar_minipage==1?", 0 0 200px 10px #999":"")+"; border-radius:"+widget.preferences.border_radius+"px; transition:opacity 0.5s 1s; display:none; }"+
		"#MS_page_cover{ display:none; left:0px; top:0px; width:100%; height:100%; background:rgba(0,0,0,0); padding:0px; margin:0px; }"+
		"#MS_upbutton, #MS_downbutton{ height:"+widget.preferences.button_height*2+"px; width:"+widget.preferences.button_width+"px; left:"+widget.preferences.buttonposition+"%; opacity:0.1; background:"+widget.preferences.color+"; border-radius:50px; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); transition:opacity 0.5s; display:none; }"+
		"#MS_upbutton{ top:-"+widget.preferences.button_height+"px; }"+
		"#MS_downbutton{ bottom:-"+widget.preferences.button_height+"px; }"+
		"#MS_minipage_canvas{ position:fixed; top:0px; left:0px; background:#000; display:none; }"+
		
		"#MS_v_container:hover #MS_vbar, #MS_v_container:hover #MS_vbar_bg{ width:"+widget.preferences.hover_size+"px; }"+
		"#MS_h_container:hover #MS_hbar, #MS_h_container:hover #MS_hbar_bg{ height:"+widget.preferences.hover_size+"px; }"+
		"#MS_v_container:hover #MS_vbar:not(:hover), #MS_h_container:hover #MS_hbar:not(:hover), #MS_v_container:hover #MS_superbar, #MS_h_container:hover #MS_superbar{ opacity:0.5; transition:opacity 0.1s 0s; }"+
		"#MS_v_container:hover #MS_vbar_bg:not(:hover), #MS_h_container:hover #MS_hbar_bg:not(:hover){ opacity:"+((widget.preferences.no_bar_bg == "1")?"0":"0.5")+"; transition:opacity 0.1s 0s; }"+
		"#MS_vbar:hover, #MS_hbar:hover, #MS_upbutton:hover, #MS_downbutton:hover{ opacity:0.7; transition:opacity 0.1s 0s; }"+
		"#MS_vbar_bg:hover, #MS_hbar_bg:hover{ opacity:0.51; transition:opacity 0.1s 0s; }"+
		"#MS_superbar:hover{ opacity:0.7; transition:opacity 0.25s 0s; }"+
		
		"#MS_v_container, #MS_h_container, #MS_vbar_bg, #MS_hbar_bg, #MS_vbar, #MS_hbar, #MS_superbar, #MS_page_cover, #MS_upbutton, #MS_downbutton{ position:fixed; z-index:2147483647; border:none; padding:0; margin:0; }"+
		"@media print, screen and (view-mode: minimized){ #MS_vbar_bg, #MS_hbar_bg, #MS_vbar, #MS_hbar, #MS_superbar, #MS_page_cover, #MS_upbutton, #MS_downbutton{ background:rgba(0,0,0,0); box-shadow:none; }}";
	
	if(document.getElementById("MS_style")) document.getElementById("MS_style").innerHTML = MS_style; // when options changed
	else{ // when website is initially loaded
		var style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.id = "MS_style";
		style.innerHTML = MS_style;
		document.getElementsByTagName("head")[0].appendChild(style);
	}
	window.scrollBy(1,1);	// makes certain prefs show effect
	window.scrollBy(-1,-1);	// e.g. button (dis)appearing
}

function add_bars(){
	
	var v_container = document.createElement("div");
	v_container.id = "MS_v_container";
	v_container.innerHTML = "<div id='MS_vbar_bg'></div><div id='MS_vbar'></div>";
	
	var h_container = document.createElement("div");
	h_container.id = "MS_h_container";
	h_container.innerHTML = "<div id='MS_hbar_bg'></div><div id='MS_hbar'></div>";
	
	var superbar = document.createElement("div");
	superbar.id = "MS_superbar";
	
	var page_cover = document.createElement("div"); // covers the page and thus prevents cursor changes when dragging
	page_cover.innerHTML = "<canvas id='MS_minipage_canvas' width='"+window.innerWidth+"' height='"+window.innerHeight+"'></canvas>";
	page_cover.id = "MS_page_cover";
	
	document.body.appendChild(page_cover);
	document.body.appendChild(superbar);
	document.body.appendChild(h_container);
	document.body.appendChild(v_container); // last in DOM gets displayed top
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
			document.getElementById("MS_v_container").style.display = null;
			document.getElementById("MS_vbar_bg").style.display = null;
			document.getElementById("MS_vbar").style.display = null;
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
			document.getElementById("MS_h_container").style.display = null;
			document.getElementById("MS_hbar_bg").style.display = null;
			document.getElementById("MS_hbar").style.display = null;
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
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.which != 1) return; //if it's not the left mouse button
	
	document.getElementById("MS_vbar").style.opacity = 0.7;
	document.getElementById("MS_vbar").style.width = widget.preferences.hover_size+"px";
	document.getElementById("MS_vbar_bg").style.width = widget.preferences.hover_size+"px";
	document.getElementById("MS_page_cover").style.display = "inline";
	show_bars();
		
	var bar = document.getElementById("MS_vbar");
	var dragy = window.event.clientY - parseInt(bar.style.top);
	document.onmousemove = function(){
		var posy = window.event.clientY;
		bar.style.top = ((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-bar.offsetHeight?window.innerHeight-bar.offsetHeight : (posy - dragy))) + "px";

		window.scroll(window.pageXOffset, parseInt(bar.style.top)/(window.innerHeight-bar.offsetHeight)*(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight));
	}
	document.onmouseup = function(){
		document.getElementById("MS_page_cover").style.display = null;
		document.getElementById("MS_vbar").style.opacity = null;
		document.getElementById("MS_vbar").style.width = null;
		document.getElementById("MS_vbar_bg").style.width = null;
		hide_bars();
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_h(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.which != 1) return; //if it's not the left mouse button
	
	document.getElementById("MS_hbar").style.opacity = 0.7;
	document.getElementById("MS_hbar").style.height = widget.preferences.hover_size+"px";
	document.getElementById("MS_hbar_bg").style.height = widget.preferences.hover_size+"px";
	document.getElementById("MS_page_cover").style.display = "inline";
	show_bars();
		
	var bar = document.getElementById("MS_hbar");
	var dragx = window.event.clientX - parseInt(bar.style.left);
	document.onmousemove = function(){
		var posx = window.event.clientX;
		bar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-bar.offsetWidth?window.innerWidth-bar.offsetWidth : (posx - dragx))) + "px";
		
		window.scroll(parseInt(bar.style.left)/(window.innerWidth-bar.offsetWidth)*(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth), window.pageYOffset);
	};
	document.onmouseup = function(){
		document.getElementById("MS_page_cover").style.display = null;
		document.getElementById("MS_hbar").style.opacity = null;
		document.getElementById("MS_hbar").style.height = null;
		document.getElementById("MS_hbar_bg").style.height = null;
		hide_bars();
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_super(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.which != 1) return; //if it's not the left mouse button
	
	if(widget.preferences.show_superbar_minipage=="1") show_minipage();
	
	document.getElementById("MS_superbar").style.opacity = widget.preferences.show_superbar_minipage=="1"?1:0.7;
	document.getElementById("MS_page_cover").style.display = "inline";
	
	var vbar = document.getElementById("MS_vbar");
	var hbar = document.getElementById("MS_hbar");
	var superbar = document.getElementById("MS_superbar");
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
			document.getElementById("MS_vbar_bg").style.display = "inline";
			document.getElementById("MS_hbar_bg").style.display = "inline";
			document.getElementById("MS_vbar").style.display = "inline";
			document.getElementById("MS_hbar").style.display = "inline";
			document.getElementById("MS_minipage_canvas").style.display = null;
		}
		document.getElementById("MS_superbar").style.opacity = null;
		document.getElementById("MS_page_cover").style.display = null;
		
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function reposition_bars(){
	show_bars();
		
	if(document.getElementById("MS_vbar").style.display=="inline")
		document.getElementById("MS_vbar").style.top = Math.round(window.pageYOffset/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight)*(window.innerHeight-document.getElementById("MS_vbar").offsetHeight))+"px";
	if(document.getElementById("MS_hbar").style.display=="inline")
		document.getElementById("MS_hbar").style.left = Math.round(window.pageXOffset/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth)*(window.innerWidth-document.getElementById("MS_hbar").offsetWidth))+"px";
	
	if(window.pageYOffset > 0 && widget.preferences.show_buttons=="1") document.getElementById("MS_upbutton").style.display = "inline";
	else document.getElementById("MS_upbutton").style.display = null;
	if(window.pageYOffset+window.innerHeight < Math.max(document.body.scrollHeight,document.documentElement.scrollHeight) && widget.preferences.show_buttons=="1")
		document.getElementById("MS_downbutton").style.display = "inline";
	else document.getElementById("MS_downbutton").style.display = null;
	
	if(document.getElementById("MS_vbar").style.display == "inline" && document.getElementById("MS_hbar").style.display == "inline" && widget.preferences.show_superbar=="1"){
		document.getElementById("MS_superbar").style.top = document.getElementById("MS_vbar").style.top;
		document.getElementById("MS_superbar").style.height = document.getElementById("MS_vbar").style.height;
		document.getElementById("MS_superbar").style.left = document.getElementById("MS_hbar").style.left;
		document.getElementById("MS_superbar").style.width = document.getElementById("MS_hbar").style.width;
		document.getElementById("MS_superbar").style.display = "inline";
	}
	else if(document.getElementById("MS_superbar").style.opacity!="1") //if superbar doesn't get dragged
		window.setTimeout(function(){ document.getElementById("MS_superbar").style.display = null }, 1500);
	
	window.setTimeout(hide_bars, 1000);
}

function scroll_bg_v(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.which != 1) return; //if it's not the left mouse button
	if(window.event.clientY>parseInt(document.getElementById("MS_vbar").style.top)) window.scrollBy(0, window.innerHeight);
	else window.scrollBy(0, -window.innerHeight);
}

function scroll_bg_h(){
	window.event.preventDefault(); // prevent focus-loss in site
	if(window.event.which != 1) return; //if it's not the left mouse button
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
	if(widget.preferences.no_bar_bg != "1") document.getElementById("MS_"+whichone+"bar_bg").style.opacity = "0.5";
	if(document.getElementById("MS_"+whichone+"bar").style.opacity == 0.7) return; // don't alter if bar is dragged
	document.getElementById("MS_"+whichone+"bar").style.transition = "opacity 0.25s 0s";
	document.getElementById("MS_"+whichone+"bar").style.opacity = "0.5";
}
function hide_bar(whichone){
	document.getElementById("MS_"+whichone+"bar_bg").style.transition = null;
	document.getElementById("MS_"+whichone+"bar_bg").style.opacity = null;
	document.getElementById("MS_"+whichone+"bar").style.transition = null;
	document.getElementById("MS_"+whichone+"bar").style.opacity = null;
}

function mouse_scroll_x(){
	window.event.preventDefault();
	window.scrollBy(-window.event.wheelDelta*2,0);
}

function add_buttons(){
	var upbutton = document.createElement("div");
	upbutton.id = "MS_upbutton";
	
	var downbutton = document.createElement("div");
	downbutton.id = "MS_downbutton";
	
	document.body.appendChild(upbutton);
	document.body.appendChild(downbutton);
}

function handle_button(whichone){
	window.event.preventDefault();
	if(window.event.which != 1) return; //if it's not the left mouse button
	
	var button = document.getElementById("MS_"+whichone+"button");
	var otherbutton = document.getElementById("MS_"+(whichone=="up"?"down":"up")+"button");
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
	document.getElementById("MS_vbar_bg").style.display = null;
	document.getElementById("MS_hbar_bg").style.display = null;
	document.getElementById("MS_vbar").style.display = null;
	document.getElementById("MS_hbar").style.display = null;
	document.getElementById("MS_upbutton").style.display = null;
	document.getElementById("MS_downbutton").style.display = null;
	
	document.body.style.transformOrigin = "0% 0%";
	document.body.style.transform = "scale("+(window.innerWidth/Math.max(document.body.scrollWidth,document.documentElement.scrollWidth,window.innerWidth))+","+(window.innerHeight/Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight))+")";
	window.scroll(0,0);
	document.getElementById("MS_superbar").style.display = null;
	
	opera.extension.getScreenshot(function(imageData){
		document.body.style.transform = null;
		document.body.style.transformOrigin = null;
		document.getElementById("MS_superbar").style.display = "inline";
		document.getElementById("MS_minipage_canvas").getContext('2d').putImageData(imageData, 0, 0);
		document.getElementById("MS_minipage_canvas").style.display = "inline";
	});
}

function workaround_for_dsk(){
	document.getElementById("MS_v_container").addEventListener("mouseover", function(){
		document.getElementById("MS_vbar_bg").style.opacity="0.7";
		document.getElementById("MS_vbar").style.opacity="0.7";
	}, true);
	document.getElementById("MS_v_container").addEventListener("mouseout", function(){
		document.getElementById("MS_vbar_bg").style.opacity=null;
		document.getElementById("MS_vbar").style.opacity=null;
	}, true);
}