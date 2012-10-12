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
	add_buttons();
	initialize_bars();
	
	//document.getElementById("MS_v_container").addEventListener("mouseover", take_screenshot, false);
	
	document.getElementById("MS_vbar_bg").addEventListener("mousedown", scroll_bg_v, true);
	document.getElementById("MS_hbar_bg").addEventListener("mousedown", scroll_bg_h, true);
	
	document.getElementById("MS_vbar").addEventListener("mousedown", drag_v, true);
	document.getElementById("MS_hbar").addEventListener("mousedown", drag_h, true);
	
	document.getElementById("MS_upbutton").addEventListener("mousedown", function(){ handle_button("up"); }, true);
	document.getElementById("MS_downbutton").addEventListener("mousedown", function(){ handle_button("down"); }, true);
	
	window.addEventListener("DOMNodeInserted", adjust_bars_if_necessary, false);
	window.addEventListener("resize", adjust_bars, false);
	window.addEventListener("scroll", reposition_bars, false);
	
	opera.extension.onmessage = inject_css;
	
},false);

function inject_css(){
	var MS_style = "#MS_v_container, #MS_h_container{ position:fixed; z-index:99997; background-color:rgba(0,0,0,0); } #MS_v_container{ height:100%; width:30px; right:0px; top:0px; } #MS_h_container{ height:30px; width:100%; left:0px; bottom:0px; } #MS_v_container:hover #MS_vbar, #MS_v_container:hover #MS_vbar_bg{ width:"+widget.preferences.hover_size+"px; } #MS_h_container:hover #MS_hbar, #MS_h_container:hover #MS_hbar_bg{ height:"+widget.preferences.hover_size+"px; } #MS_v_container:hover #MS_vbar, #MS_v_container:hover #MS_minipage, #MS_h_container:hover #MS_hbar{ opacity:0.5; transition:opacity 0.1s 0s; -o-transition:opacity 0.1s 0s; } #MS_v_container:hover #MS_vbar_bg, #MS_h_container:hover #MS_hbar_bg{ opacity:"+((widget.preferences.no_bar_bg == "1")?"0":"0.5")+"; transition:opacity 0.1s 0s; -o-transition:opacity 0.1s 0s; } #MS_vbar_bg, #MS_hbar_bg{ background-color:#999; opacity:"+((widget.preferences.show_when=="3" && widget.preferences.no_bar_bg != "1")?"0.5":"0")+"; position:fixed; z-index:99998; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s, width 0.25s, height 0.25s; -o-transition:opacity 0.5s 1s, width 0.25s, height 0.25s; } #MS_vbar_bg{ right:0px; top:0px; height:100%; width:"+widget.preferences.size+"px; } #MS_hbar_bg{ left:0px; bottom:0px; height:"+widget.preferences.size+"px; width:100%; } #MS_vbar, #MS_hbar{ background-color:"+widget.preferences.color+"; opacity:"+((widget.preferences.show_when=="3")?"0.5":"0")+"; position:fixed; z-index:99999; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); border-radius:"+widget.preferences.border_radius+"px; display:none; transition:opacity 0.5s 1s, width 0.25s, height 0.25s; -o-transition:opacity 0.5s 1s, width 0.25s, height 0.25s; } #MS_vbar{ right:0px; top:0px; height:30px; min-height:30px; width:"+widget.preferences.size+"px; } #MS_vbar:hover, #MS_hbar:hover{ opacity:0.7; } #MS_hbar{ left:0px; bottom:0px; width:30px; min-width:30px; height:"+widget.preferences.size+"px; } #MS_page_cover{ display:none; position:fixed; left:0px; top:0px; width:100%; height:100%; z-index:99996; background-color:rgba(0,0,0,0); } #MS_minipage{ position:fixed; top:0px; right:0px; } #MS_upbutton, #MS_downbutton{ position:fixed; height:100px; width:100px; left:550px; opacity:0.1; background-color:"+widget.preferences.color+"; z-index:99999; border-radius:50px; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); transition:opacity 0.5s; -o-transition:opacity 0.5s; } #MS_upbutton{ top:-50px; } #MS_downbutton{ bottom:-50px; } #MS_upbutton:hover, #MS_downbutton:hover{ opacity:0.5; transition:opacity 0.1s; -o-transition:opacity 0.1s; }";
	
	if(document.getElementById("MS_style")) document.getElementById("MS_style").innerHTML = MS_style; // when options changed
	else{ // when website is initially loaded
		var style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.id = "MS_style";
		style.innerHTML = MS_style;
		document.getElementsByTagName("head")[0].appendChild(style);
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
	if(window.event.which != 1) return; //if it's not the left mouse button
	
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
		document.onmouseup = null;
	};
}

function drag_h(){
	if(window.event.which != 1) return; //if it's not the left mouse button
	
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
		document.onmouseup = null;
	};
}

function reposition_bars(){
	show_bars();
		
	if(document.getElementById("MS_vbar").style.display=="inline")
		document.getElementById("MS_vbar").style.top = Math.round(window.scrollY/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight)*(window.innerHeight-document.getElementById("MS_vbar").offsetHeight))+"px";
	if(document.getElementById("MS_hbar").style.display=="inline")
		document.getElementById("MS_hbar").style.left = Math.round(window.scrollX/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth)*(window.innerWidth-document.getElementById("MS_hbar").offsetWidth))+"px";
	
	if(window.scrollY > 0) document.getElementById("MS_upbutton").style.display = "inline";
	else document.getElementById("MS_upbutton").style.display = "none";
	if(window.scrollY+window.innerHeight < Math.max(document.body.scrollHeight,document.documentElement.scrollHeight))
		document.getElementById("MS_downbutton").style.display = "inline";
	else document.getElementById("MS_downbutton").style.display = "none";
	
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
	var button = document.getElementById("MS_"+whichone+"button");
	var x_start = window.event.clientX - button.offsetLeft;
	document.onmousemove = function(){
		var posx = window.event.clientX;
		button.style.left = ((posx - x_start)<=-50? -50 : ((posx - x_start)>=window.innerWidth+50-button.offsetWidth?window.innerWidth+50-button.offsetWidth : (posx - x_start))) + "px";
		document.onmouseup = function(){
			document.onmousemove = null;
			document.onmouseup = null;
		};
	}
	document.onmouseup = function(){
		window.scroll(window.scrollX,whichone=="up"?0:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

/*function take_screenshot(){

	document.getElementById("MS_v_container").removeEventListener("mouseover", take_screenshot, false);
	
	document.body.style.transformOrigin = "0% "+100*window.scrollY/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight)-window.innerHeight)+"%";
	document.body.style.transform = "scale("+(window.innerHeight/Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight))+")";
	opera.extension.getScreenshot(applyScreenshot);
}

function applyScreenshot(imageData) {
	document.body.style.transformOrigin = null;
	document.body.style.transform = null;
	
	if(document.getElementById("MS_minipage_canvas"))
		document.getElementById("MS_minipage_canvas").getContext('2d').putImageData(imageData, 0, 0)
	else{
		var canvas_div = document.createElement("div");
		canvas_div.id = "MS_minipage";
		var canvas = document.createElement('canvas');
		canvas.width = window.innerHeight/Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight)*imageData.width;
		canvas.height = imageData.height;
		canvas.id = "MS_minipage_canvas";
		
		var ctx = canvas.getContext('2d');
		ctx.putImageData(imageData, 0, 0);
		
		canvas_div.appendChild(canvas);
		document.body.appendChild(canvas_div);
	}
}*/