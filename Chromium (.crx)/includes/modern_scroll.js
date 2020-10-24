(function(){

"use strict";

let timeout;				// scrolling animation
let w = {};					// settings -> updated when tab gets activated
let vbar;					// \ pass by reference!
let hbar;					// /
let ms_shadow;				// shadow DOM root
let isFullscreen = true;

(function check_if_tab_needs_bars()
{
	if(window.matchMedia("all and (view-mode: minimized)").matches) return; // stop if it's a speed dial
	if(window.self !== window.top){ // only treat main & iframes
		try{
			if(window.self.frameElement && window.self.frameElement.tagName === "IFRAME"){
				if(!document.URL.match("//translate.google.")) window.self.frameElement.scrolling = "no";
			}
			else return;
		}catch(e){ console.log("Error thrown trying to access frame:", e); return; /* window.self.frameElement == protected variable */ }
	}

	(function check_if_tab_is_ready()
	{
		if		(document.hidden)		document.addEventListener("visibilitychange", initialize, false);
		else if (document.body)			initialize();
		else							window.setTimeout(check_if_tab_is_ready, 50);
	}());
}());

function initialize()
{
	document.removeEventListener("visibilitychange", initialize, false);
	document.addEventListener("visibilitychange", add_or_remove_ms, false);
	
	add_ms();
}

function add_ms()
{
	if(document.getElementById("modern_scroll")) return;
	
	let ms_container = document.createElement("div");
	ms_container.id = "modern_scroll";
	ms_shadow = typeof ms_container.attachShadow == "function" ? ms_container.attachShadow({mode: "open"}) : ms_container.createShadowRoot();
	try{ document.documentElement.appendChild(ms_container); }catch(e){ document.body.appendChild(ms_container); }
	
	chrome.runtime.onMessage.addListener(handleRuntimeMessage);
	chrome.runtime.sendMessage({data : "settings", domain : window.location.hostname}, function(response){ // get settings (filled with default values) from background.js
		if(response === false) { // blacklisted page
			if (document.querySelector("#ms_style"))
				document.querySelector("head").removeChild(document.querySelector("#ms_style"));
			chrome.runtime.sendMessage({data:"show_contextmenu", string:"enable"});
			return;
		}
		w = response;
		continue_add_ms();
	});
}
function continue_add_ms()
{
	inject_css();
	
	add_bars();
	add_buttons();
	add_scrollingfunctions();
	window.addEventListener("click", check_if_element_is_scrollable, false);
	
	add_external_interface();
	add_dimension_checkers();
	add_contextmenu();
}

function remove_ms()
{
	if(!document.getElementById("modern_scroll")) return;
	
	chrome.runtime.onMessage.removeListener(handleRuntimeMessage);

	window.removeEventListener("resize", adjust_ui_fullscreen_change, false);
	document.removeEventListener( document.fullscreenEnabled !== null ? "fullscreenchange" : "webkitfullscreenchange", adjust_ui_fullscreen_change, false);
	document.removeEventListener("readystatechange", add_dimension_checkers, false);

	if (resize_observer) resize_observer.disconnect();
	DOM_observer.disconnect();
	height_observer.disconnect();
	document.body.removeEventListener("transitionend", check_dimensions, false);
	 	
	window.removeEventListener("load", check_dimensions, false);
	window.removeEventListener("resize", check_dimensions, false);
	window.removeEventListener("pointerup", check_dimensions_after_click, false);
	
	window.removeEventListener("keydown", arrowkeyscroll, false);
	window.removeEventListener("keydown", otherkeyscroll, false);
	window.removeEventListener("mousewheel", mousescroll_y, { passive : false, capture : false });
	window.removeEventListener("pointerdown", middlebuttonscroll, true);
	window.removeEventListener("click", check_if_element_is_scrollable, false);
	
	window.removeEventListener("scroll", show_or_hide_buttons, false);
	window.removeEventListener("scroll", reposition_bars, { passive: false });
	
	window.clearTimeout(timeout);					timeout = null;
	window.clearTimeout(hide_timeout);				hide_timeout = null;
	window.clearTimeout(dimension_check_timeout);	dimension_check_timeout = null;
	
	delete window.modernscroll;
	
	try		 { document.documentElement.removeChild(document.getElementById("modern_scroll"));
	}catch(e){ document.body.removeChild(document.getElementById("modern_scroll")); }
	
	delete window.scrollMaxX; delete window.scrollMaxY; delete window.devicePixelRatio_old;
	isFullscreen = null;
}

function update_ms(){ remove_ms(); add_ms(); }
function add_or_remove_ms(){
	if(document.hidden) 	remove_ms();
	else 					add_ms();
}

function inject_css()
{
	let themecolor = document.querySelector("meta[name='theme-color']");
	let color = themecolor !== null && w.auto_coloring === "1" ? themecolor.content : w.color;
	let color_bg = themecolor !== null && w.auto_coloring === "1" ? themecolor.content : w.color_bg;
	let ms_style = 
		":host, #ms_v_container, #ms_h_container, #ms_vbar_bg, #ms_hbar_bg, #ms_vbar, #ms_hbar, #ms_superbar, #ms_page_cover, #ms_upbutton, #ms_downbutton, #ms_middleclick_cursor{ position:fixed; z-index:2147483647; border:none; padding:0; margin:0; display:none; background:none; }\n\n"+
		
		/* set values (most general first - can be overwritten by following rules): */
		":host, #modern_scroll_bars, #modern_scroll_buttons{ display:inline; }\n\
		 #ms_v_container{ height:100%; width:"+(w.container==="1"?w.container_size:"1")+"px; "+(w.vbar_at_left=="1"?"left":"right")+":0px; top:0px; background:rgba(0,0,0,0); transform-origin:100% 0 0; }\n\
		 #ms_h_container{ height:"+(w.container==="1"?w.container_size:"1")+"px; width:100%; left:0px; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; background:rgba(0,0,0,0); transform-origin:0 100% 0; }\n\
		 #ms_vbar_bg, #ms_hbar_bg{ opacity:"+((w.show_when==="3" && w.show_bg_bars_when==="3")?(w.opacity/100):"0")+"; transition:opacity 0.5s "+w.show_how_long+"ms; }\n\
		 #ms_vbar_bg{ top:"+w.gap+"px; bottom:"+w.gap+"px; height:calc(100% - 2*"+w.gap+"px); width:auto; "+(w.vbar_at_left==="1"?"left":"right")+":0px; "+(w.vbar_at_left==="0"?"left":"right")+":auto; }\n\
		 #ms_hbar_bg{ "+(w.vbar_at_left==="0"?"left":"right")+":0px; "+(w.vbar_at_left==="1"?"left":"right")+":"+(parseInt(w.hover_size)+parseInt(w.gap))+"px; "+(w.vbar_at_left==="0"?"left":"right")+":"+w.gap+"px; width:calc(100% - "+(2*parseInt(w.gap)+parseInt(w.hover_size))+"px); height:auto; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; "+(w.hbar_at_top==="0"?"top":"bottom")+":auto; }\n\
		 #ms_vbar_bg_ui, #ms_hbar_bg_ui{ background:"+color_bg+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }\n\
		 #ms_vbar_bg_ui{ margin-"+(w.vbar_at_left==="1"?"left":"right")+":"+(w.gap)+"px; height:100%; width:"+w.size+"px; transition:width 0.25s; }\n\
		 #ms_hbar_bg_ui{ margin-"+(w.hbar_at_top==="1"?"top":"bottom")+":"+(w.gap)+"px; width:100%; height:"+w.size+"px; transition:height 0.25s; }\n\
		 #ms_vbar, #ms_hbar, .bookmarkIndicator{ opacity:"+((w.show_when==="3")?(w.opacity/100):"0")+"; transition:opacity 0.5s "+w.show_how_long+"ms; }\n\
		 #ms_vbar{ top:0px; height:"+(30+2*w.gap)+"px; min-height:"+(30+2*w.gap)+"px; width:auto; "+(w.vbar_at_left==="1"?"left":"right")+":0px; "+(w.vbar_at_left==="0"?"left":"right")+":auto; }\n\
		 #ms_hbar{ left:0px; width:"+(30+2*w.gap)+"px; min-width:"+(30+2*w.gap)+"px; height:auto; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; "+(w.hbar_at_top==="0"?"top":"bottom")+":auto; }\n\
		 #ms_vbar_ui, #ms_hbar_ui, .bookmarkIndicator{ background:"+color+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }\n\
		 #ms_vbar_ui{ height:30px; min-height:30px; width:"+w.size+"px; margin-top:"+w.gap+"px; margin-bottom:"+w.gap+"px; margin-"+(w.vbar_at_left=="1"?"left":"right")+":"+w.gap+"px; transition:width 0.25s; }\n\
		 #ms_hbar_ui{ width:30px; min-width:30px; height:"+w.size+"px; margin-left:"+w.gap+"px; margin-right:"+w.gap+"px; margin-"+(w.hbar_at_top=="1"?"top":"bottom")+":"+(w.gap)+"px; transition:height 0.25s; }\n\
		 #ms_superbar{ width:100px; background:"+(w.show_superbar_minipage==="0"?color:"rgba(0,0,0,0)")+"; opacity:"+((w.show_when==="3")?"0.5":"0")+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" "+(w.show_superbar_minipage==="1"?", 0 0 200px 10px #999":"")+" !important; border-radius:"+w.border_radius+"px; transition:opacity 0.5s "+w.show_how_long+"ms; min-width:30px; min-height:30px; }\n\
		 #ms_page_cover{ left:0px; top:0px; width:100%; height:100%; background:rgba(0,0,0,0); padding:0px; margin:0px; }\n\
		\n\
		 #ms_upbutton, #ms_downbutton{ height:"+w.button_height*2+"px; width:"+w.button_width+"px; left:"+w.buttonposition+"%; opacity:"+w.button_opacity/100+"; background:"+color+"; border-radius:50px; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+"; transition:opacity 0.5s; }\n\
		 #ms_upbutton{ top:-"+w.button_height+"px; }\n\
		 #ms_downbutton{ bottom:-"+w.button_height+"px; }\n\
		 #ms_upbutton.dragged_button, #ms_downbutton.dragged_button{ opacity:0.5; }\n\
		\n\
		 #ms_v_container:hover #ms_vbar_ui, #ms_v_container:hover #ms_vbar_bg_ui{ width:"+w.hover_size+"px; transition:width 0.1s; }\n\
		 #ms_h_container:hover #ms_hbar_ui, #ms_h_container:hover #ms_hbar_bg_ui{ height:"+w.hover_size+"px; transition:height 0.1s; }\n\
		 #ms_v_container:hover #ms_vbar, #ms_h_container:hover #ms_hbar, #ms_v_container:hover .bookmarkIndicator{ opacity:"+(w.opacity/100)+"; transition:opacity 0.1s 0s; }\n\
		 #ms_v_container:hover #ms_vbar_bg, #ms_h_container:hover #ms_hbar_bg{ opacity:"+(w.show_bg_bars_when==="1"?"0":(w.opacity/100))+"; transition:opacity 0.1s 0s; }\n\
		 #ms_v_container #ms_vbar:hover, #ms_h_container #ms_hbar:hover, #ms_upbutton:hover, #ms_downbutton:hover, #ms_v_container .bookmarkIndicator:hover{ opacity:"+((parseInt(w.opacity)+20)/100)+"; transition:opacity 0.1s 0s; }\n\
		 #ms_superbar:hover{ opacity:"+w.superbar_opacity/100+"; transition:opacity 0.25s 0s; }\n\
		\n\
		 .bookmarkIndicator { line-height:20px; height: 20px; color: "+w.bookmark_text_color+"; position: absolute; "+(w.vbar_at_left==="1"?"left:":"right:")+(parseInt(w.hover_size)+5)+"px; padding: 3px 5px; display: block; text-decoration:none; }\n\
		 .bookmarkIndicator > span { white-space: nowrap; max-width: 20em; overflow: hidden; text-overflow: ellipsis; display: block; }\n\
		 .bookmarkIndicator::after { content: ''; position: absolute; "+(w.vbar_at_left==="1"?"left":"right")+":-4px; top: 6px; border-top: 5px solid transparent; border-"+(w.vbar_at_left==="1"?"right":"left")+": 5px solid "+color+"; border-bottom: 5px solid transparent; }\n\
		 .bookmarkIndicator:hover { z-index: 1; }\n\
		 #ms_v_container #ms_bookmarks{ opacity: 0; transition:opacity 0.5s "+w.show_how_long+"ms; }\n\
		 #ms_v_container:hover #ms_bookmarks{ opacity: 1; transition: opacity 0.1s; }\n\
		\n\
		 .dragged #ms_vbar_bg, .dragged #ms_hbar_bg{ opacity:"+(w.show_bg_bars_when==="1"?"0":(w.opacity/100))+"; }\n\
		 .dragged #ms_vbar, .dragged #ms_hbar{ opacity:"+(w.opacity>80?"1":((parseInt(w.opacity)+20)/100))+"; }\n\
		 .dragged #ms_vbar_ui, .dragged #ms_vbar_bg_ui{ width:"+w.hover_size+"px; }\n\
		 .dragged #ms_hbar_ui, .dragged #ms_hbar_bg_ui{ height:"+w.hover_size+"px; }\n\
		 #ms_superbar.dragged{ opacity:"+(w.show_superbar_minipage === "1" ? 1 : (w.superbar_opacity/100))+"; }\n\
		 #ms_middleclick_cursor{ width:64px; height:64px; cursor:none; background:url(data:image/png;base64,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); }\n\n"+
		// hide in print preview and printouts:
		"@media print{ :host{ display:none !important; } }";

	if(ms_shadow.querySelector("style")) ms_shadow.querySelector("style").innerHTML = ms_style;
	else{
		let style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.innerHTML = ms_style;
		ms_shadow.appendChild(style);
	}

	/* hide page's default bars and style all scrollbars within the page (optionally autohide when not hovered or focused): */
	if(w.style_element_bars === "0" && w.fullscreen_only === "1") return;
	
	/* hide page's default scroll bars: */
	let global_ms_style = (w.fullscreen_only === "0" ? "html, body { scrollbar-width: none !important; }\n\
		html::-webkit-scrollbar, body::-webkit-scrollbar{ display:none !important; width:0 !important; height:0 !important; }\n" : "");

	if(w.style_element_bars === "1"){ global_ms_style +=
		(w.autohide_element_bars === "1" ? "body *:not(:hover):not(:focus)::-webkit-scrollbar{ display:none !important; width:0 !important; height:0 !important; }\n" : "")+
		"body *::-webkit-scrollbar{ width:"+w.size+"px; height:"+w.size+"px; }\n\
		 body *::-webkit-scrollbar-button{ display:none; }\n\
		 body *::-webkit-scrollbar-track { background:none; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }\n\
		 body *::-webkit-scrollbar-thumb { background:"+color+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }\n\
		 body *::-webkit-scrollbar-thumb:hover { background:"+color+"; }";
	}

	if(document.getElementById("ms_style")){ // switched tabs -> update style (settings may have changed)
		document.getElementById("ms_style").innerHTML = global_ms_style;
	}
	else{ // when website is initially loaded
		let global_style = document.createElement("style");
		global_style.setAttribute("type","text/css");
		global_style.id = "ms_style";
		global_style.innerHTML = global_ms_style;
		document.querySelector("head").appendChild(global_style);
	}
}

function add_bars()
{
	let bars_container = document.createElement("div");
	bars_container.id = "modern_scroll_bars";
	bars_container.innerHTML =
		"<div id='ms_page_cover'></div>\n\
		<div id='ms_middleclick_cursor'></div>\n\
		<div id='ms_superbar'></div>\n\
		<div id='ms_h_container'>\n\
			<div id='ms_hbar_bg'><div id='ms_hbar_bg_ui'></div></div>\n\
			<div id='ms_hbar'><div id='ms_hbar_ui'></div></div>\n\
		</div>\n\
		<div id='ms_v_container'>\n"+ // last in DOM gets displayed top
			"<div id='ms_vbar_bg'><div id='ms_vbar_bg_ui'></div></div>\n\
			<div id='ms_vbar'><div id='ms_vbar_ui'></div></div>\n\
			<div id='ms_bookmarks' />\n\
		</div>";
		
	if(!ms_shadow.querySelector("#modern_scroll_bars")) ms_shadow.appendChild(bars_container);
	
	vbar = ms_shadow.getElementById("ms_vbar");
	hbar = ms_shadow.getElementById("ms_hbar");
	
	add_functionality_2_bars();
}

function add_functionality_2_bars(){
	ms_shadow.getElementById("ms_vbar_bg").addEventListener("pointerdown", scroll_bg_v, true);
	ms_shadow.getElementById("ms_hbar_bg").addEventListener("pointerdown", scroll_bg_h, true);
	
	ms_shadow.getElementById("ms_superbar").addEventListener("pointerdown", drag_super, true);
	vbar.addEventListener("pointerdown", drag_v, true);
	hbar.addEventListener("pointerdown", drag_h, true);
	
	ms_shadow.getElementById("ms_h_container").addEventListener("mousewheel", mousescroll_x, { passive : false, capture : true });
	ms_shadow.getElementById("ms_hbar_bg").addEventListener("mousewheel", mousescroll_x, { passive : false, capture : true });
	hbar.addEventListener("mousewheel", mousescroll_x, { passive : false, capture : true });
	
	if(w.container === "1"){
		ms_shadow.getElementById("ms_v_container").addEventListener("pointerenter", function(e){
			ms_shadow.getElementById("ms_v_container").style.width = "1px";
			ms_shadow.getElementById("ms_vbar_ui").style.width = w.hover_size+"px";
			ms_shadow.getElementById("ms_vbar_bg_ui").style.width = w.hover_size+"px";
			show_bar("v");
			window.addEventListener("pointermove", restore_v_trigger_area, false);
			function restore_v_trigger_area(){
				if(window.innerWidth-e.clientX > w.container_size){
					hide_bar("v");
					ms_shadow.getElementById("ms_vbar_ui").style.width = null;
					ms_shadow.getElementById("ms_vbar_bg_ui").style.width = null;
					ms_shadow.getElementById("ms_v_container").style.width = null;
					window.removeEventListener("pointermove", restore_v_trigger_area, false);
				}
			}
		}, false);
		ms_shadow.getElementById("ms_h_container").addEventListener("pointerenter", function(e){
			ms_shadow.getElementById("ms_h_container").style.height = "1px";
			ms_shadow.getElementById("ms_hbar_ui").style.height = w.hover_size+"px";
			ms_shadow.getElementById("ms_hbar_bg_ui").style.height = w.hover_size+"px";
			show_bar("h");
			window.addEventListener("pointermove", restore_h_trigger_area, false);
			function restore_h_trigger_area(){
				if(window.innerHeight-e.clientY > w.container_size){
					hide_bar("h");
					ms_shadow.getElementById("ms_hbar_ui").style.height = null;
					ms_shadow.getElementById("ms_hbar_bg_ui").style.height = null;
					ms_shadow.getElementById("ms_h_container").style.height = null;
					window.removeEventListener("pointermove", restore_h_trigger_area, false);
				}
			}
		}, false);
	}
	
	if (w.show_bookmarks !== "1") {
		ms_shadow.addEventListener("mouseover", function(e) {
			window.clearTimeout(bookmarks_timeout);
			ms_shadow.getElementById("ms_bookmarks").style.display = null;
		}, false);
		ms_shadow.addEventListener("mouseout", function(e) {
			bookmarks_timeout = window.setTimeout(function() {
				if (ms_shadow.getElementById("ms_bookmarks") !== null) // ms may have been removed via context menu
					ms_shadow.getElementById("ms_bookmarks").style.display = "none";
			}, parseInt(w.show_how_long) + 200);
		}, false);
	}

	window.addEventListener("scroll", reposition_bars, { passive: false });
}

let resize_observer = window.ResizeObserver ? new ResizeObserver(check_dimensions) : null;
let DOM_observer = new MutationObserver(check_dimensions);
let height_observer = new MutationObserver(check_dimensions); // Disqus
function add_dimension_checkers()
{
	if(document.readyState !== "complete")
	{
		window.addEventListener("load", check_dimensions, false);
		document.addEventListener("readystatechange", add_dimension_checkers, false); // fires when all resources, i.e. images are loaded
	}
	else // add listeners after page has finished loading to avoid slowdown of page loading
	{
		window.addEventListener("resize", check_dimensions, false);
		if(document.URL.substr(0,19) !== "chrome-extension://") window.addEventListener("resize", adjust_ui_fullscreen_change, false);
		document.addEventListener( document.fullscreenEnabled !== null ? "fullscreenchange" : "webkitfullscreenchange", adjust_ui_fullscreen_change, false);
		
		if (resize_observer) resize_observer.observe(document.body);
		document.body.addEventListener("transitionend", check_dimensions, false);
		DOM_observer.observe(document.body, { childList:true, subtree:true });
		height_observer.observe(document.body, { subtree:true, attributes:true, attributeFilter:["height", "style"] });
	}
	window.addEventListener("pointerup", check_dimensions_after_click, false);

	check_dimensions();
	adjust_ui_fullscreen_change();
}

let dimension_check_timeout;
function check_dimensions_after_click(e)
{
	if(e.target.id.substr(0,3) === "ms_") return;
	last_clicked_element_is_scrollable = is_scrollable(e.target, 2) ? true : false;
	
	window.clearTimeout(dimension_check_timeout);
	dimension_check_timeout = window.setTimeout(check_dimensions, 200); // needs some time to affect page height if click expands element
}
	
function add_scrollingfunctions()
{
	if(window.self.frameElement || w.use_own_scroll_functions === "1")
	{
		window.addEventListener("keydown", arrowkeyscroll, false);
		window.addEventListener("keydown", otherkeyscroll, false);
	}
	
	if(w.own_scroll_functions_middle === "1")
	{
		window.addEventListener("pointerdown", middlebuttonscroll, true);
	}

	//window.addEventListener("mousewheel", mousescroll_y, false); // -> set in resize_vbar()
}

function add_contextmenu()
{	
	if(w.contextmenu_show_when !== "1")	show_ui(); // if contextmenu is not set to "never show up":
	else 								chrome.runtime.sendMessage({data:"hide_contextmenu"});
}
function contextmenu_click()
{
	if(document.getElementById("modern_scroll").style.display === "none")	show_ui();
	else																	hide_ui();
}

function handleRuntimeMessage(msg)
{
	if 		(msg.data === "ms_toggle_visibility") 			contextmenu_click();
	else if (msg.data === "update_ms" && !document.hidden)	update_ms();
}

function add_external_interface()
{
	if(w.external_interface === "0") return;
	
	window.modernscroll = {};
	window.modernscroll.show = show_ui;
	window.modernscroll.hide = hide_ui;
	window.modernscroll.scroll_2_top = scroll_Pos1;
	window.modernscroll.scroll_2_bottom = scroll_End;
	window.modernscroll.toggle_superbar = function(){ // overwrite show_superbar in this page's copy of settings:
		if(w.show_superbar === "1")
		{
			w.show_superbar = "0";
			ms_shadow.getElementById("ms_superbar").style.display = null;
		}
		else
		{
			w.show_superbar = "1";
			resize_superbar();
			reposition_bars();
		}
	};
}

function show_ui()
{
	document.getElementById("modern_scroll").style.display = null;
	
	if(w.contextmenu_show_when === "2") // only over interface:
	{
		send_contextmenu_hide_msg_to_bg();
		document.getElementById("modern_scroll").addEventListener("pointerover", send_contextmenu_show_msg_to_bg, false);
		document.getElementById("modern_scroll").addEventListener("pointerout", send_contextmenu_hide_msg_to_bg, false);
	}
	else if(w.contextmenu_show_when === "3") send_contextmenu_show_msg_to_bg();
	
	show_bars();
	hide_bars();
}
function hide_ui()
{
	document.getElementById("modern_scroll").style.display = "none";
	if(w.contextmenu_show_when !== "1") chrome.runtime.sendMessage({data:"show_contextmenu", string:"show"});
	document.getElementById("modern_scroll").removeEventListener("pointerover", send_contextmenu_show_msg_to_bg, false);
	document.getElementById("modern_scroll").removeEventListener("pointerout", send_contextmenu_hide_msg_to_bg, false);
}
function send_contextmenu_show_msg_to_bg(){ chrome.runtime.sendMessage({data:"show_contextmenu", string:"hide"}); }
function send_contextmenu_hide_msg_to_bg(){ chrome.runtime.sendMessage({data:"hide_contextmenu"}); }

function check_if_element_is_scrollable(e){ last_clicked_element_is_scrollable = is_scrollable(e.target, 2) ? true : false; }

function check_dimensions()
{
	let scrollMaxX_old = window.scrollMaxX;
	let scrollMaxY_old = window.scrollMaxY;
	
	set_new_scrollMax_values();
	
	if(scrollMaxX_old !== window.scrollMaxX || scrollMaxY_old !== window.scrollMaxY) adjust_ui_new_size();

	// zoomed:
	if(window.devicePixelRatio_old !== window.devicePixelRatio) scaleUI();
}
function set_new_scrollMax_values()
{
	let new_scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
	let new_scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
	
	window.scrollMaxX = (new_scrollWidth > window.innerWidth+1 &&
						 window.getComputedStyle(document.documentElement).overflowX !== "hidden" &&
						 (window.getComputedStyle(document.body).overflowX !== "hidden" ||
						  window.getComputedStyle(document.documentElement).overflowX !== "visible") ? new_scrollWidth-window.innerWidth : 0);
	window.scrollMaxY = (new_scrollHeight > window.innerHeight+1 &&
						 window.getComputedStyle(document.documentElement).overflowY !== "hidden" &&
						 (window.getComputedStyle(document.body).overflowY !== "hidden" ||
						  window.getComputedStyle(document.documentElement).overflowY !== "visible") ? new_scrollHeight-window.innerHeight : 0);
}

function scaleUI(){
	window.devicePixelRatio_old = window.devicePixelRatio;
	let scaleFactor = w.baseDevicePixelRatio / window.devicePixelRatio;
	ms_shadow.getElementById("ms_v_container").style.transform = "scale("+scaleFactor+",1)";
	ms_shadow.getElementById("ms_h_container").style.transform = "scale(1,"+scaleFactor+")";
}

function adjust_ui_new_size()
{
	resize_bars();
	update_bookmarks();
	if(ms_shadow.getElementById("modern_scroll_buttons")) show_or_hide_buttons();
}
function adjust_ui_fullscreen_change()
{
	if(window.innerWidth === window.screen.width && window.innerHeight === window.screen.height && !isFullscreen) isFullscreen = true;
	else if((window.innerWidth !== window.screen.width || window.innerHeight !== window.screen.height) && isFullscreen) isFullscreen = false;
	else return;
	
	ms_shadow.getElementById("modern_scroll_bars").style.display = w.fullscreen_only === "1" && !isFullscreen ? "none" : null;
	if(ms_shadow.getElementById("modern_scroll_buttons")) ms_shadow.getElementById("modern_scroll_buttons").style.display = w.show_buttons === "2" && !isFullscreen ? "none" : null;
}

function resize_bars()
{
	resize_vbar();
	resize_hbar();
	resize_superbar();
	reposition_bars();
}

let bookmarks_timeout;
async function update_bookmarks()
{
	if (w.show_bookmarks === "1") return;

	let bookmarks = ms_shadow.getElementById("ms_bookmarks");
	ms_shadow.getElementById("ms_v_container").replaceChild(bookmarks.cloneNode(false), bookmarks); // remove all children
	document.querySelectorAll(w.show_bookmarks === "2" ? "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]" : "h1, h2, h3, h4, h5, h6").forEach(bookmark => {
		if (bookmark.innerText === "") return;
		let bounds = bookmark.getBoundingClientRect();
		if (bounds.height === 0 || bounds.width === 0) return;

		let bookmarkIndicator = bookmark.hasAttribute("id") ? document.createElement("a") : document.createElement("div");
		let bookmarkTitle = document.createElement("span");
		bookmarkIndicator.href = "#" + bookmark.id;
		bookmarkIndicator.className = "bookmarkIndicator";
		bookmarkIndicator.style.top = "calc(" + ((bounds.top + window.scrollY) / document.body.getBoundingClientRect().height * 100) + "vh - 13px)";
		bookmarkTitle.innerText = bookmark.innerText.replace("\n", "");
		bookmarkIndicator.appendChild(bookmarkTitle);
		ms_shadow.getElementById("ms_bookmarks").appendChild(bookmarkIndicator);
	});
}

function resize_vbar()
{
	if(window.scrollMaxY === 0) // don't display and stop if content fits into window:
	{
		if(vbar.style.display === "inline"){
			ms_shadow.getElementById("ms_v_container").style.display = ms_shadow.getElementById("ms_vbar_bg").style.display = vbar.style.display = null;
			window.removeEventListener("mousewheel", mousescroll_y, { passive : false, capture : false });
		}
		return;
	}

	let vbar_height_before = vbar.style.height;
	let vbar_new_height = Math.max(Math.round(window.innerHeight/(Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)/window.innerHeight)), 30+2*w.gap);
	vbar.style.height = vbar_new_height+"px";
	
	if(vbar.style.display !== "inline"){
		ms_shadow.getElementById("ms_vbar_ui").style.height = vbar_new_height-2*w.gap+"px";
		ms_shadow.getElementById("ms_v_container").style.display = ms_shadow.getElementById("ms_vbar_bg").style.display = vbar.style.display = "inline";
		show_bar("v");
		chrome.runtime.sendMessage({data:"reset_contextmenu"});
		
		if(window.self.frameElement || w.use_own_scroll_functions_mouse === "1") window.addEventListener("mousewheel", mousescroll_y, { passive : false, capture : false });
	}
	else if(vbar_height_before !== vbar_new_height+"px"){
		ms_shadow.getElementById("ms_vbar_ui").style.height = vbar_new_height-2*w.gap+"px";
		show_bar("v");
	}
}

function resize_hbar()
{
	if(window.scrollMaxX === 0) // don't display and stop if content fits into window:
	{
		if(hbar.style.display === "inline")
			ms_shadow.getElementById("ms_h_container").style.display = ms_shadow.getElementById("ms_hbar_bg").style.display = hbar.style.display = null;
		return;
	}
	let hbar_width_before = hbar.style.width;
	let hbar_new_width = Math.max(Math.round(window.innerWidth/(Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)/window.innerWidth)), 30+2*w.gap);
	hbar.style.width = hbar_new_width+"px";
	
	if(hbar.style.display !== "inline"){
		ms_shadow.getElementById("ms_hbar_ui").style.width = hbar_new_width-2*w.gap+"px";
		ms_shadow.getElementById("ms_h_container").style.display = ms_shadow.getElementById("ms_hbar_bg").style.display = hbar.style.display = "inline";
		show_bar("h");
		chrome.runtime.sendMessage({data:"reset_contextmenu"});
	}
	else if(hbar_width_before !== hbar_new_width+"px"){
		ms_shadow.getElementById("ms_hbar_ui").style.width = hbar_new_width-2*w.gap+"px";
		show_bar("h");
	}
}

function resize_superbar()
{
	if(w.show_superbar === "0") return;
	
	if(vbar.style.display === "inline" && hbar.style.display === "inline")
	{
		ms_shadow.getElementById("ms_superbar").style.height = vbar.style.height;
		ms_shadow.getElementById("ms_superbar").style.width = hbar.style.width;
		
		if(w.show_superbar_minipage === "0")
			ms_shadow.getElementById("ms_superbar").style.transform = "scale("+(window.innerWidth/10)/parseInt(ms_shadow.getElementById("ms_superbar").style.width)+","+(window.innerHeight/10)/parseInt(ms_shadow.getElementById("ms_superbar").style.height)+")";
		
		ms_shadow.getElementById("ms_superbar").style.display = "inline";
	}
	else ms_shadow.getElementById("ms_superbar").style.display = null;
}

function drag_mode(which_bar){
	if(which_bar){
		window.removeEventListener("scroll", reposition_bars, { passive: false });
		ms_shadow.getElementById("ms_page_cover").style.display = "inline";
		ms_shadow.getElementById("ms_"+which_bar).className = "dragged";
	}
	else{
		window.addEventListener("scroll", reposition_bars, { passive: false });
		ms_shadow.getElementById("ms_page_cover").style.display = null;
		ms_shadow.querySelector(".dragged").className = null;
	}
}

function drag_v(e)
{
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	e.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	vbar.setPointerCapture(e.pointerId); // keep getting the events even when moving outside the containing page's scope

	drag_mode("v_container");
	let dragy = e.clientY - parseInt(vbar.style.top);
	
	document.addEventListener("pointermove", drag_v_move, true);
	function drag_v_move(e)
	{
		let posy = e.clientY;
		let new_top = Math.round((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-vbar.offsetHeight?window.innerHeight-vbar.offsetHeight : (posy - dragy)));
		vbar.style.top = new_top+"px";
		window.scroll(window.pageXOffset, Math.round(new_top/(window.innerHeight-vbar.offsetHeight)*window.scrollMaxY));
	}
	
	document.addEventListener("pointerup", function (e){
		drag_mode(0);
		vbar.releasePointerCapture(e.pointerId);
		document.removeEventListener("pointermove", drag_v_move, true);
	}, { once: true, passive: true, capture: true });
}

function drag_h(e)
{
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	e.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	hbar.setPointerCapture(e.pointerId);

	drag_mode("h_container");
	let dragx = e.clientX - parseInt(hbar.style.left);
	
	document.addEventListener("pointermove", drag_h_move, true);
	function drag_h_move(e)
	{
		let posx = e.clientX;
		let new_left;

		if(w.vbar_at_left=="0"){
			new_left = Math.round((posx - dragx)<=0 ? 0 : ((posx - dragx)>=window.innerWidth-hbar.offsetWidth-w.hover_size ? window.innerWidth-hbar.offsetWidth-w.hover_size : posx-dragx));
			hbar.style.left = new_left+"px";
		}else{
			new_left = Math.round((posx - dragx)<=parseInt(w.hover_size) ? 0 : ((posx - dragx)>=window.innerWidth-hbar.offsetWidth ? window.innerWidth-hbar.offsetWidth-w.hover_size : posx-dragx-w.hover_size));
			hbar.style.left = new_left+parseInt(w.hover_size)+"px";
		}
		window.scroll(Math.round((new_left/(window.innerWidth-hbar.offsetWidth-w.hover_size)*window.scrollMaxX)), window.pageYOffset);
	}
	
	document.addEventListener("pointerup", function (e){
		drag_mode(0);
		hbar.releasePointerCapture(e.pointerId);	
		document.removeEventListener("pointermove", drag_h_move, true);
	}, { once: true, passive: true, capture: true });
}

function drag_super(e)
{
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	e.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(w.show_superbar_minipage === "1") show_minipage();
	else show_bars();
	
	drag_mode("superbar");
	let superbar = ms_shadow.getElementById("ms_superbar");
	superbar.setPointerCapture(e.pointerId);

	let dragy = e.clientY - parseInt(superbar.style.top);
	let dragx = e.clientX - parseInt(superbar.style.left);
	
	document.addEventListener("pointermove", drag_super_move, true);
	function drag_super_move()
	{
		superbar.style.display = "inline";
		let posx = e.clientX;
		let posy = e.clientY;
		
		let new_top = Math.round((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-superbar.offsetHeight?window.innerHeight-superbar.offsetHeight : (posy - dragy)));
		superbar.style.top =  new_top+"px";
		
		if(w.show_superbar_minipage === "0"){
			let new_left;
			if(w.vbar_at_left === "0"){
				new_left = Math.round(((posx - dragx)<=0 ? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth-w.hover_size ? window.innerWidth-superbar.offsetWidth-w.hover_size : posx-dragx)));
				superbar.style.left = new_left+"px";
			}else{
				new_left = Math.round((posx - dragx)<=parseInt(w.hover_size) ? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth ? window.innerWidth-superbar.offsetWidth-w.hover_size : posx-dragx-w.hover_size));
				superbar.style.left = new_left+parseInt(w.hover_size)+"px";
			}
			window.scroll(new_left/(window.innerWidth-superbar.offsetWidth-w.hover_size)*window.scrollMaxX, parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*window.scrollMaxY);
			
			vbar.style.top = superbar.style.top;
			hbar.style.left = superbar.style.left;
		}
		else
			superbar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth?window.innerWidth-superbar.offsetWidth : (posx - dragx))) + "px";		
	}
	
	document.addEventListener("pointerup", drag_super_end, { once: true, capture: true });
	function drag_super_end()
	{
		if(w.show_superbar_minipage === "1"){
			document.body.style.transform = null;
			document.body.style.transformOrigin = null;
			window.scroll(parseInt(superbar.style.left)/(window.innerWidth-superbar.offsetWidth)*window.scrollMaxX, parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*window.scrollMaxY);
			
			ms_shadow.getElementById("ms_vbar_bg").style.display = ms_shadow.getElementById("ms_hbar_bg").style.display = "inline";
			vbar.style.display = hbar.style.display = "inline";
		}
		
		superbar.releasePointerCapture(e.pointerId);
		drag_mode(0);
		reposition_bars();
		document.removeEventListener("pointermove", drag_super_move, true);
	}
}

function reposition_bars()
{
	let vbar_top_before = vbar.style.top;
	let hbar_left_before = hbar.style.left;
	
	if(vbar.style.display === "inline")
		vbar.style.top = Math.round(window.pageYOffset/window.scrollMaxY*(window.innerHeight-vbar.offsetHeight))+"px";
	if(hbar.style.display === "inline")
	{
		let left = Math.round(window.pageXOffset/window.scrollMaxX*(window.innerWidth-w.hover_size-hbar.offsetWidth));
		hbar.style.left = left+(w.vbar_at_left === "1" ? parseInt(w.hover_size) : 0)+"px";
	}
	
	if(w.show_superbar === "1")
	{
		if(vbar.style.display === "inline" && hbar.style.display === "inline")
		{
			ms_shadow.getElementById("ms_superbar").style.top = vbar.style.top;
			ms_shadow.getElementById("ms_superbar").style.left = hbar.style.left;
		}
		else if(ms_shadow.getElementById("ms_superbar").style.opacity !== "1") //if superbar doesn't get dragged (minipage only -> no bars)
			window.setTimeout(function(){ ms_shadow.getElementById("ms_superbar").style.display = null; }, parseInt(w.show_how_long));
	}
	if(vbar_top_before !== vbar.style.top)		show_bar("v");
	if(hbar_left_before !== hbar.style.left)	show_bar("h");
	
	hide_bars();
}

let t; // timeout
function scroll_bg_v(e)
{
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	e.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if		(e.clientY < 50 && w.bg_special_ends === "1")						scroll_Pos1();
	else if	((window.innerHeight-e.clientY) < 50 && w.bg_special_ends === "1")	scroll_End();
	else // scroll one more page until mouse position is reached if mouse is kept pressed:
	{
		window.addEventListener("pointerup", () => window.clearTimeout(t), {capture: true, once: true});
		scroll_bg_v_inner(e.clientY, parseInt(vbar.style.top), Math.round(window.innerHeight/w.scroll_velocity));
	}
}
function scroll_bg_v_inner(mouse, vbar_top, timeout)
{
	let vbar_height = parseInt(vbar.style.height);

	if(mouse > vbar_top + vbar_height)
	{
		scroll_PageDown();
		vbar_top += vbar_height;
	}
	else if(mouse < vbar_top)
	{
		scroll_PageUp();
		vbar_top -= vbar_height;
	}
	
	t = window.setTimeout(scroll_bg_v_inner, timeout, mouse, vbar_top, timeout);
}

function scroll_bg_h(e){
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	e.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(e.clientX < 50 && w.bg_special_ends === "1"){
		if(w.animate_scroll === "1") ms_scrollBy_x(-window.pageXOffset);
		else window.scrollBy(-window.pageXOffset, 0);
	}
	else if((window.innerWidth-e.clientX) < 50 && w.bg_special_ends === "1"){
		if(w.animate_scroll === "1") ms_scrollBy_x(window.scrollMaxX-window.pageXOffset);
		else window.scrollBy(window.scrollMaxX-window.pageXOffset, 0);
	}
	else if(e.clientX > parseInt(hbar.style.left)){
		if(w.animate_scroll === "1") ms_scrollBy_x(window.innerWidth);
		else window.scrollBy(window.innerWidth, 0);
	}
	else if(w.animate_scroll === "1") ms_scrollBy_x(-window.innerWidth);
	else window.scrollBy(-window.innerWidth, 0);
}

function show_bars(){ show_bar("v"); show_bar("h"); }
function hide_bars()
{
	if(ms_shadow.querySelector(".dragged")) return;
	hide_bar("v"); hide_bar("h");
}

function show_bar(whichone)
{
	window.clearTimeout(hide_timeout); hide_timeout = null;
	if(w.show_when === "1") return;		// 1 = only on hover
	if(w.show_bg_bars_when === "3"){	// 3 = like scroll bars
		ms_shadow.getElementById("ms_"+whichone+"bar_bg").style.transition = "opacity 0s 0s";
		ms_shadow.getElementById("ms_"+whichone+"bar_bg").style.opacity = w.opacity/100;
	}
	if(ms_shadow.getElementById("ms_"+whichone+"_container").className === "dragged") return;
	ms_shadow.getElementById("ms_"+whichone+"bar").style.transition = "opacity 0s 0s";
	ms_shadow.getElementById("ms_"+whichone+"bar").style.opacity = w.opacity/100;
}
let hide_timeout;
function hide_bar(whichone)
{
	hide_timeout = window.setTimeout(function(){ // set timeout to prevent bar from not showing up at all
		if(!hide_timeout) return; // hide_bar got fired for v & h -> only h is cancelable -> check if show_bars() canceled hide_timeout
		ms_shadow.getElementById("ms_"+whichone+"bar_bg").style.transition = ms_shadow.getElementById("ms_"+whichone+"bar").style.transition = null;
		ms_shadow.getElementById("ms_"+whichone+"bar_bg").style.opacity = ms_shadow.getElementById("ms_"+whichone+"bar").style.opacity = null;
	}, 0);
}

function show_minipage()
{
	ms_shadow.getElementById("ms_vbar_bg").style.display = ms_shadow.getElementById("ms_hbar_bg").style.display = vbar.style.display = hbar.style.display = null;
	if(ms_shadow.getElementById("ms_upbutton"))
		ms_shadow.getElementById("ms_upbutton").style.display = ms_shadow.getElementById("ms_downbutton").style.display = null;
	
	document.body.style.transformOrigin = "0% 0%";
	document.body.style.transform = "scale("+(window.innerWidth/Math.max(document.documentElement.scrollWidth,window.innerWidth))+","+(window.innerHeight/Math.max(document.documentElement.scrollHeight,window.innerHeight))+")";
	window.scrollBy(-window.pageXOffset, -window.pageYOffset);
}



// #################################
// ######## scroll buttons: ########
// #################################

function add_buttons()
{
	if(w.show_buttons === "1") return;
	
	let upbutton = document.createElement("div");
	upbutton.id = "ms_upbutton";
	upbutton.addEventListener("pointerdown", function(e){ handle_button("up", e); }, true);

	let downbutton = document.createElement("div");
	downbutton.id = "ms_downbutton";
	downbutton.addEventListener("pointerdown", function(e){ handle_button("down", e); }, true);
	
	let button_container = document.createElement("div");
	button_container.id = "modern_scroll_buttons";
	
	button_container.appendChild(upbutton);
	button_container.appendChild(downbutton);
	
	if(!ms_shadow.querySelector("#modern_scroll_buttons")) ms_shadow.appendChild(button_container);
	
	window.addEventListener("scroll", show_or_hide_buttons, false);
}

function handle_button(whichone, e)
{
	e.preventDefault();			// prevent focus-loss in site
	if(e.which !== 1) return;	// if it's not the left mouse button
	if(document.URL.substr(0,19) !== "chrome-extension://") e.stopPropagation(); // prevent bubbling (e.g. prevent drag being triggered on separately opened images); provide event in options page (to save dragged button position)
	
	let button = ms_shadow.getElementById("ms_"+whichone+"button");
	let otherbutton = ms_shadow.getElementById("ms_"+(whichone==="up"?"down":"up")+"button");
	let x_start = e.clientX - Math.floor(button.style.left?parseInt(button.style.left):w.buttonposition/100*window.innerWidth);
	
	document.addEventListener("pointerup", handle_button_click, true);
	document.addEventListener("pointermove", handle_button_drag, true);

	function handle_button_click()
	{
		if(whichone === "up")	scroll_Pos1();
		else					scroll_End();
		document.removeEventListener("pointermove", handle_button_drag, true);
		document.removeEventListener("pointerup", handle_button_click, true);
	}

	function handle_button_drag(e)
	{
		let posx = e.clientX;
		button.style.left = otherbutton.style.left = ((posx - x_start)<=-50? -50 : ((posx - x_start)>=window.innerWidth+50-button.offsetWidth?window.innerWidth+50-button.offsetWidth : (posx - x_start))) + "px";
		
		if(document.querySelector(".dragged_button")) return; // set up only once:

		button.className = "dragged_button";
		otherbutton.style.opacity = "0.5";
		
		document.removeEventListener("pointerup", handle_button_click, true);
		document.addEventListener("pointerup", handle_button_drag_end, false);
	}
	function handle_button_drag_end()
	{
		document.removeEventListener("pointermove", handle_button_drag, true);
		document.removeEventListener("pointerup", handle_button_drag_end, false);

		button.className = null;
		otherbutton.style.opacity = null;

		// fire custom event for saving button position in options page:
		if(document.URL.substr(0,19) === "chrome-extension://")
			this.dispatchEvent(	new CustomEvent("msButtonPositionChange", {	detail : 100 * button.offsetLeft / window.innerWidth })	);
	}
}

let button_timeout;
function show_or_hide_buttons()
{
	window.clearTimeout(button_timeout);
	button_timeout = window.setTimeout(() => {
		if (!ms_shadow.getElementById("ms_upbutton")) return;

		if(window.pageYOffset > 0)					ms_shadow.getElementById("ms_upbutton").style.display = "inline";
		else										ms_shadow.getElementById("ms_upbutton").style.display = null;
		
		if(window.pageYOffset < window.scrollMaxY)	ms_shadow.getElementById("ms_downbutton").style.display = "inline";
		else										ms_shadow.getElementById("ms_downbutton").style.display = null;
	}, 200);
}



// ######################################
// ######## scrolling functions: ########
// ######################################

let scroll_velocity;
let scroll_timeout_id_x; let by_x = 0;
let scroll_timeout_id_y; let by_y = 0;

/*function ms_scrollTo(x, y){
	x = x - window.pageXOffset;
	y = y - window.pageYOffset;
	ms_scrollBy(x, y);
}*/
function ms_scrollBy(x, y){ if(x !== 0) ms_scrollBy_x(x);	if(y !== 0) ms_scrollBy_y(y); }

function ms_scrollBy_x_mouse(x)
{
	if((by_x >= 0 && x > 0) || (by_x <= 0 && x < 0)){
		by_x += Math.round(parseFloat(w.mousescroll_distance)*(x > 120 ? 120 : (x < -120 ? -120 : x)));
		if(window.pageXOffset + by_x < 0) by_x = -window.pageXOffset;
		else if(window.pageXOffset + by_x > window.scrollMaxX) by_x = window.scrollMaxX - window.pageXOffset;
		
		if(by_x !== 0 && !scroll_timeout_id_x){
			scroll_velocity = w.mousescroll_velocity;
			ms_scroll_start_x();
		}
	}
	else by_x = 0;
}
function ms_scrollBy_y_mouse(y)
{
	if((by_y >= 0 && y > 0) || (by_y <= 0 && y < 0)){
		by_y += Math.round(parseFloat(w.mousescroll_distance)*(y > 120 ? 120 : (y < -120 ? -120 : y)));
		if(window.pageYOffset + by_y < 0) by_y = -window.pageYOffset;
		else if(window.pageYOffset + by_y > window.scrollMaxY) by_y = window.scrollMaxY - window.pageYOffset;
		
		if(by_y !== 0 && !scroll_timeout_id_y){
			scroll_velocity = w.mousescroll_velocity;
			ms_scroll_start_y();
		}
	}
	else by_y = 0;
}

function ms_scrollBy_x(x)
{
	if((by_x >= 0 && x > 0) || (by_x <= 0 && x < 0)){
		by_x += x;
		if(window.pageXOffset + by_x < 0) by_x = -window.pageXOffset;
		else if(window.pageXOffset + by_x > window.scrollMaxX) by_x = window.scrollMaxX - window.pageXOffset;
		
		if(w.animate_scroll_max !== "0" && Math.abs(by_x) > w.animate_scroll_max * window.innerWidth) // 0 = infinite
		{
			window.scrollBy(by_x, 0);
			by_x = 0;
		}
		else if(by_x !== 0 && !scroll_timeout_id_x){
			scroll_velocity = w.scroll_velocity;
			ms_scroll_start_x();
		}
	}
	else by_x = 0;
}
function ms_scrollBy_y(y)
{
	if((by_y >= 0 && y > 0) || (by_y <= 0 && y < 0))
	{
		by_y += y;
		if(window.pageYOffset + by_y < 0) by_y = -window.pageYOffset;
		else if(window.pageYOffset + by_y > window.scrollMaxY) by_y = window.scrollMaxY - window.pageYOffset;
		
		if(w.animate_scroll_max !== "0" && Math.abs(by_y) > w.animate_scroll_max * window.innerHeight) // 0 = infinite
		{
			window.scrollBy(0, by_y);
			by_y = 0;
		}
		else if(by_y !== 0 && !scroll_timeout_id_y){
			scroll_velocity = w.scroll_velocity;
			ms_scroll_start_y();
		}
	}
	else by_y = 0;
}

function ms_scroll_start_x()
{
	window.removeEventListener("scroll", reposition_bars, { passive: false });
	
	show_bar("h");
	if(by_x <0){
		hbar.style.transition = "left "+window.pageXOffset/scroll_velocity+"ms linear";
		hbar.style.left = "0px";
	}
	else{
		hbar.style.transition = "left "+(window.scrollMaxX-window.pageXOffset)/scroll_velocity+"ms linear";
		hbar.style.left = window.innerWidth-parseInt(hbar.style.width)-(w.vbar_at_left==="0"?parseInt(w.gap)+parseInt(w.hover_size):0)+"px";
	}
	ms_scroll_inner_x(Date.now());
	function ms_scroll_inner_x(lastTick)
	{
		let curTick = Date.now();
		let scrollamount = (curTick - lastTick) * scroll_velocity;
		
		if(by_x < 0){ scrollamount = -scrollamount; if(scrollamount < by_x) scrollamount = by_x; }
		else		{								if(scrollamount > by_x) scrollamount = by_x; }
		
		by_x -= scrollamount;
		window.scrollBy(scrollamount, 0);
		
		if(by_x !== 0)	scroll_timeout_id_x = window.requestAnimationFrame( function(){ ms_scroll_inner_x(curTick); } );
		else			ms_scroll_end("x");
	}
}

function ms_scroll_start_y()
{
	window.removeEventListener("scroll", reposition_bars, { passive: false });
	
	show_bar("v");
	if(by_y < 0){
		vbar.style.transition = "top "+window.pageYOffset/scroll_velocity+"ms linear";
		vbar.style.top = "0px";
	}
	else{
		vbar.style.transition = "top "+(window.scrollMaxY-window.pageYOffset)/scroll_velocity+"ms linear";
		vbar.style.top = window.innerHeight-parseInt(vbar.style.height)+"px";
	}
	ms_scroll_inner_y(Date.now());
	function ms_scroll_inner_y(lastTick)
	{
		let curTick = Date.now();
		let scrollamount = (curTick - lastTick) * scroll_velocity;
		
		if(by_y < 0){ scrollamount = -scrollamount; if(scrollamount < by_y) scrollamount = by_y; }
		else		{								if(scrollamount > by_y) scrollamount = by_y; }
		
		by_y -= scrollamount;
		window.scrollBy(0, scrollamount);
		
		if(by_y !== 0)	scroll_timeout_id_y = window.requestAnimationFrame( function(){ ms_scroll_inner_y(curTick); } );
		else			ms_scroll_end("y");
	}
}

function ms_scroll_end(direction)
{
	if(direction === "y"){
		window.cancelAnimationFrame(scroll_timeout_id_y); scroll_timeout_id_y = null;
		if(window.self.frameElement || w.use_own_scroll_functions === "1") vbar.style.transition = null;
	}else{
		window.cancelAnimationFrame(scroll_timeout_id_x); scroll_timeout_id_x = null;
		if(window.self.frameElement || w.use_own_scroll_functions === "1") hbar.style.transition = null;
	}
	
	reposition_bars();
	
	window.addEventListener("scroll", reposition_bars, { passive: false });
}

let last_clicked_element_is_scrollable;
//let scroll_start_time;
//let test = 0;
function arrowkeyscroll(e)
{
	if(e.which < 37 || e.which > 40 || modifierkey_pressed(e) || target_is_input(e)) return;
	
	window.removeEventListener("keydown", arrowkeyscroll, false);
	
	if(scroll_timeout_id_x){ window.cancelAnimationFrame(scroll_timeout_id_x); scroll_timeout_id_x = null; }
	if(scroll_timeout_id_y){ window.cancelAnimationFrame(scroll_timeout_id_y); scroll_timeout_id_y = null; }
	
	if(last_clicked_element_is_scrollable) window.addEventListener("scroll", element_finished_scrolling, false);
	else{
		stopEvent(e);
		window.removeEventListener("scroll", reposition_bars, { passive: false });
		
		//if(test ===0){
		if		(e.which === 40) scroll_timeout_id_y = window.requestAnimationFrame( function(){ arrowkeyscroll_down(Date.now()); } );
		else if	(e.which === 38) scroll_timeout_id_y = window.requestAnimationFrame( function(){ arrowkeyscroll_up(Date.now()); } );
		else if	(e.which === 39) scroll_timeout_id_x = window.requestAnimationFrame( function(){ arrowkeyscroll_right(Date.now()); } );
		else					 scroll_timeout_id_x = window.requestAnimationFrame( function(){ arrowkeyscroll_left(Date.now()); } );
		//}
		if(ms_shadow.getElementById("modern_scroll_bars"))
		{
			if(e.which === 40){
				show_bar("v");/*
				vbar.style.transition = "top "+(window.scrollMaxY-window.pageYOffset)/w.keyscroll_velocity+"ms linear";
				vbar.style.top = window.innerHeight-parseInt(vbar.style.height)+"px";
				
				if(test === 1)
				{
					scroll_start_time = Date.now();
					document.body.style.transition = "all "+(window.scrollMaxY-window.pageYOffset)/w.keyscroll_velocity+"ms linear";
					document.body.style.marginTop = window.pageYOffset-window.scrollMaxY+"px";
				}*/
			}
			else if(e.which === 38){
				show_bar("v");
				/*vbar.style.transition = "top "+window.pageYOffset/w.keyscroll_velocity+"ms linear";
				vbar.style.top = "0px";
				
				if(test === 1)
				{
					scroll_start_time = Date.now();
					document.body.style.transition = "margin-top "+window.pageYOffset/w.keyscroll_velocity+"ms linear";
					document.body.style.marginTop = window.pageYOffset+"px";
				}*/
			}
			else if(e.which === 39){
				show_bar("h");
				/*hbar.style.transition = "left "+(window.scrollMaxX-window.pageXOffset)/w.keyscroll_velocity+"ms linear";
				hbar.style.left = window.innerWidth-parseInt(hbar.style.width)-(w.vbar_at_left === "0" ? w.hover_size : 0)+"px";*/
			}
			else if(e.which === 37){
				show_bar("h");
				/*hbar.style.transition = "left "+window.pageXOffset/w.keyscroll_velocity+"ms linear";
				hbar.style.left = (w.vbar_at_left === "1" ? w.hover_size : 0)+"px";*/
			}
		}
	}
	
	window.addEventListener("keyup", arrowkeyscroll_end, false);
	function arrowkeyscroll_end()
	{
		// CSS scrolling:
		/*if(test === 1)
		{
			let scrollamount = (Date.now()-scroll_start_time)*w.keyscroll_velocity;
			document.body.style.marginTop = null;
			window.scrollBy(0,(e.which===40?scrollamount:-scrollamount));
			document.body.style.transition = null;
		}
		*/
		// JS scrolling:
		if(scroll_timeout_id_x){ window.cancelAnimationFrame(scroll_timeout_id_x); scroll_timeout_id_x = null; }
		window.cancelAnimationFrame(scroll_timeout_id_y); scroll_timeout_id_y = null;
		
		window.addEventListener("keydown", arrowkeyscroll, false);
		window.removeEventListener("keydown", stopEvent, true);
		window.removeEventListener("scroll", element_finished_scrolling, false);
		window.removeEventListener("keyup", arrowkeyscroll_end, false);
		
		if(!ms_shadow.getElementById("modern_scroll_bars")) return;
		
		reposition_bars();
		vbar.style.transition = null;
		hbar.style.transition = null;
		window.addEventListener("scroll", reposition_bars, { passive: false });
	}
	
	function arrowkeyscroll_down(lastTick)
	{
		let curTick = Date.now();
		window.scrollBy(0, (curTick - lastTick)*w.keyscroll_velocity);
		vbar.style.top = (window.pageYOffset/window.scrollMaxY*(window.innerHeight-parseInt(vbar.style.height)))+"px";
		scroll_timeout_id_y = window.requestAnimationFrame( function(){ arrowkeyscroll_down(curTick); } );
	}
	function arrowkeyscroll_up(lastTick)
	{
		let curTick = Date.now();
		window.scrollBy(0, (lastTick - curTick)*w.keyscroll_velocity);
		vbar.style.top = (window.pageYOffset/window.scrollMaxY*(window.innerHeight-parseInt(vbar.style.height)))+"px";
		scroll_timeout_id_y = window.requestAnimationFrame( function(){ arrowkeyscroll_up(curTick); } );
	}
	function arrowkeyscroll_right(lastTick)
	{
		let curTick = Date.now();
		window.scrollBy((curTick - lastTick)*w.keyscroll_velocity, 0);
		hbar.style.left = window.pageXOffset/window.scrollMaxX*(window.innerWidth-w.hover_size-parseInt(hbar.style.width))+(w.vbar_at_left === "1" ? parseInt(w.hover_size) : 0)+"px";
		scroll_timeout_id_x = window.requestAnimationFrame( function(){ arrowkeyscroll_right(curTick); } );
	}
	function arrowkeyscroll_left(lastTick)
	{
		let curTick = Date.now();
		window.scrollBy((lastTick - curTick)*w.keyscroll_velocity, 0);
		hbar.style.left = window.pageXOffset/window.scrollMaxX*(window.innerWidth-w.hover_size-parseInt(hbar.style.width))+(w.vbar_at_left === "1" ? parseInt(w.hover_size) : 0)+"px";
		scroll_timeout_id_x = window.requestAnimationFrame( function(){ arrowkeyscroll_left(curTick); } );
	}
}

function otherkeyscroll(e)
{
	if(e.which > 32 && e.which < 37 && !modifierkey_pressed(e) && !target_is_input(e))
	{
		stopEvent(e);
		
		if		(e.which === 34)	scroll_PageDown();
		else if	(e.which === 33)	scroll_PageUp();
		else if	(e.which === 36) 	scroll_Pos1();
		else					 	scroll_End();
	}
	else if(e.which === 32 && !e.altKey && !e.metaKey && !e.ctrlKey && !target_is_input(e)) // 32 = space bar
	{
		stopEvent(e);
		
		if		(!e.shiftKey)		scroll_PageDown();
		else						scroll_PageUp();
	}
}
function scroll_PageDown(){
	if(w.animate_scroll === "1") ms_scrollBy_y(window.innerHeight);
	else						 window.scrollBy(0, window.innerHeight);
}
function scroll_PageUp(){
	if(w.animate_scroll === "1") ms_scrollBy_y(-window.innerHeight);
	else						 window.scrollBy(0, -window.innerHeight);
}
function scroll_Pos1(){
	if(w.animate_scroll === "1") ms_scrollBy_y(-window.pageYOffset);
	else						 window.scrollBy(0, -window.pageYOffset);
}
function scroll_End(){
	if(w.animate_scroll === "1") ms_scrollBy_y(window.scrollMaxY-window.pageYOffset);
	else						 window.scrollBy(0, window.scrollMaxY-window.pageYOffset);
}

function mousescroll_x(e){
	if(modifierkey_pressed(e)) return;
	stopEvent(e);
	ms_scrollBy_x_mouse(-e.wheelDelta);
}

function mousescroll_y(e){
	if(e.wheelDeltaY === 0 || is_scrollable(e.target, (e.wheelDeltaY < 0 ? 1 : 0)) || modifierkey_pressed(e)) return;
	stopEvent(e);
	ms_scrollBy_y_mouse(-e.wheelDeltaY);
}

let scroll_timeout_id_middlebutton = null;
function middlebuttonscroll(e)
{
	if(e.button !== 1 || isLink(e.target)) return; // only scroll wheel / middle button clicks
	stopEvent(e);

	ms_shadow.getElementById("ms_page_cover").style.cursor = "url(data:image/png;base64,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), crosshair";
	ms_shadow.getElementById("ms_page_cover").style.display = "inline";
	ms_shadow.getElementById("ms_middleclick_cursor").style.top = (e.y-27)+"px"; // 32 (half the size of the pic) - 5 (cursor dot target isn't middle)
	ms_shadow.getElementById("ms_middleclick_cursor").style.left = (e.x-27)+"px";
	ms_shadow.getElementById("ms_middleclick_cursor").style.display = "inline";

	let x = window.pageXOffset;
	let x_start = e.x;
	let x_delta = 0;
	let x_max 	= window.innerWidth;
	let y = window.pageYOffset;
	let y_start = e.y;
	let y_delta = 0;
	let y_max 	= window.innerHeight;

	// determine scrolling mode:
	window.addEventListener("pointermove", determineMiddleButtonScrollingMode, true);
	window.addEventListener("pointerup", determineMiddleButtonScrollingMode, true);
	function determineMiddleButtonScrollingMode(e){
		window.removeEventListener("pointermove", determineMiddleButtonScrollingMode, true);
		window.removeEventListener("pointerup", determineMiddleButtonScrollingMode, true);

		if(e.type === "pointerup"){
			window.removeEventListener("pointerdown", middlebuttonscroll, true);
			window.addEventListener("pointerdown", middlebuttonscrollend, true);
			if( w.endMiddlescrollByTurningWheel === "1" ) window.addEventListener("mousewheel", middlebuttonscrollend, true);
		}
		else{ //pointermove
			window.addEventListener("pointerup", middlebuttonscrollend, true);
		}
	}

	function middlebuttonscrollend(e)
	{
		e.preventDefault();

		window.removeEventListener("pointermove", getmousepos, false);
		window.removeEventListener("pointerdown", middlebuttonscrollend, true);
		window.removeEventListener("mousewheel", middlebuttonscrollend, true);
		window.removeEventListener("pointerup", middlebuttonscrollend, true);
		window.addEventListener("pointerdown", middlebuttonscroll, true);

		window.cancelAnimationFrame( scroll_timeout_id_middlebutton ); scroll_timeout_id_middlebutton = null;

		ms_shadow.getElementById("ms_middleclick_cursor").style.display = null;
		ms_shadow.getElementById("ms_page_cover").style.display = "none";
		ms_shadow.getElementById("ms_page_cover").style.cursor = "default";
	}
	window.addEventListener("pointermove", getmousepos, false);
	function getmousepos(e)
	{
		x_delta = e.x - x_start;
		y_delta = e.y - y_start;
		let rad = -Math.atan2(x_delta, y_delta);
		ms_shadow.getElementById("ms_middleclick_cursor").style.transform = "rotate("+rad+"rad)";
	}
	
	scroll_timeout_id_middlebutton = window.requestAnimationFrame( function(){ middlebuttonscroll_inner( Date.now()-1 ); } );
	function middlebuttonscroll_inner(lastTick)
	{
		let curTick = Date.now();
		let amount = w.middlescroll_velocity * (curTick - lastTick) / 20000;
		x += x_delta*amount*Math.abs(x_delta);  // abs deltas -> fine grained control for small movements & fast for bigger ones
		y += y_delta*amount*Math.abs(y_delta);
		if(x < 0) x = 0; else if (x > window.scrollMaxX) x = window.scrollMaxX;
		if(y < 0) y = 0; else if (y > window.scrollMaxY) y = window.scrollMaxY;

		window.scrollTo( x, y );
		scroll_timeout_id_middlebutton = window.requestAnimationFrame( function(){ middlebuttonscroll_inner(curTick); } );
	}
}

function is_scrollable(element, direction) // direction: 0 = up, 1 = down, 2 = all
{
	if(!element.parentNode || element.tagName === "BODY") return false;
	else if((window.getComputedStyle(element, null).overflow === "scroll" || window.getComputedStyle(element, null).overflow === "auto" || window.getComputedStyle(element, null).overflow === "" || element.tagName === "TEXTAREA") && element.offsetHeight < element.scrollHeight)
	{
		let max_scrollTop = element.scrollHeight /*+ parseInt(window.getComputedStyle(element, null).borderTopWidth) + parseInt(window.getComputedStyle(element, null).borderBottomWidth)*/ - element.offsetHeight; //+(element.offsetWidth < element.scrollWidth?0:0)
		if((direction === 0 && element.scrollTop > 0) || (direction === 1 && element.scrollTop < max_scrollTop) || direction === 2)
			return true;
		else return is_scrollable(element.parentNode, direction);
	}
	else if(element.tagName === "SELECT")					return true;
	else if(element.className === "uiScrollableAreaBody")	return true; // Facebook's scrolling implementation
	else if(element.parentNode.id === "layer_wrap")			return true; // vKontakte's scrolling implementation
	else													return is_scrollable(element.parentNode, direction);
}

function element_finished_scrolling(){
	window.addEventListener("keydown", preventScrolling, false);
	window.removeEventListener("scroll", element_finished_scrolling, false);
}
function preventScrolling(e){ stopEvent(e); window.removeEventListener("keydown", preventScrolling, false); }

function modifierkey_pressed(e){ return (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) ? true : false; }

function target_is_input(e){
	if( e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" ||
	   (e.target.tagName === "INPUT" && e.target.type !== "submit" && e.target.type !== "reset" && e.target.type !== "button" && e.target.type !== "image" && e.target.type !== "checkbox" && (e.target.type !== "range" || e.which === 37 || e.which === 39)) ||
		e.target.contentEditable === "true" || e.target.contentEditable === "plaintext-only" || e.target.parentNode.contentEditable === "true" ||
		e.target.shadowRoot !== null /* don't handle custom widgets */)
		 return true;
	else return false;
}

function isLink(node){
	if		(node.href)			return true;
	else if (!node.parentNode)	return false;
	else						return isLink( node.parentNode );
}

function stopEvent(e){ e.preventDefault(); e.stopPropagation(); }

}());