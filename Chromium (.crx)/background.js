//retrieve and store settings (filled with default values) for all pages:
function update_settings(){ chrome.storage.sync.get( null, function(storage){
	w = {
	"size" :				(!storage["size"]					? "8" : storage["size"]),
	"hover_size" :			(!storage["hover_size"]				? "12" : storage["hover_size"]),
	"opacity" :				(!storage["opacity"]				? "50" : storage["opacity"]),
	"color" :				(!storage["color"]					? "#000000" : storage["color"]),
	"color_bg" :			(!storage["color_bg"]				? "#999999" : storage["color_bg"]),
	"border_radius" :		(!storage["border_radius"]			? "7" : storage["border_radius"]),
	"border_width" :		(!storage["border_width"]			? "2" : storage["border_width"]),
	"border_color" :		(!storage["border_color"]			? "#FFFFFF" : storage["border_color"]),
	"border_color_rgba" :	(!storage["border_color_rgba"]		? "rgba(255,255,255,0.5)" : storage["border_color_rgba"]),
	"border_blur" :			(!storage["border_blur"]			? "0" : storage["border_blur"]),
	"show_when" :			(!storage["show_when"]				? "2" : storage["show_when"]), // 1 = onmouseover only, 2 = normal, 3 = always
	"show_how_long" :		(!storage["show_how_long"]			? "1000" : storage["show_how_long"]),
	"show_bg_bars_when" :	(!storage["show_bg_bars_when"]		? "2" : storage["show_bg_bars_when"]), // 1 = never, 2 = onmouseover only, 3 = like bars
	"fullscreen_only" :		(!storage["fullscreen_only"]		? "0" : storage["fullscreen_only"]),
	"bg_special_ends" :		(!storage["bg_special_ends"]		? "1" : storage["bg_special_ends"]),
	"show_superbar" :		(!storage["show_superbar"]			? "0" : storage["show_superbar"]),
	"show_superbar_minipage" : (!storage["show_superbar_minipage"] ? "1" : storage["show_superbar_minipage"]),
	"superbar_opacity" :	(!storage["superbar_opacity"]		? "70" : storage["superbar_opacity"]),
	"vbar_at_left" :		(!storage["vbar_at_left"]			? "0" : storage["vbar_at_left"]),
	"hbar_at_top" :			(!storage["hbar_at_top"]			? "0" : storage["hbar_at_top"]),
	"container" :			(!storage["container"]				? "0" : storage["container"]),
	"container_size" :		(!storage["container_size"]			? "30" : storage["container_size"]),
	"gap" :					(!storage["gap"]					? "2" : storage["gap"]),
	
	"show_buttons" :		(!storage["show_buttons"]			? "1" : storage["show_buttons"]), // 1 = no, 2 = only fullscreen, 3 = yes
	"buttonposition" :		(!storage["buttonposition"]			? "48" : storage["buttonposition"]),
	"button_height" :		(!storage["button_height"]			? "50" : storage["button_height"]),
	"button_width" :		(!storage["button_width"]			? "100" : storage["button_width"]),
	"button_opacity" :		(!storage["button_opacity"]			? "10" : storage["button_opacity"]),
	
	"animate_scroll" :		(!storage["animate_scroll"]			? "1" : storage["animate_scroll"]),
	"animate_scroll_max" :	(!storage["animate_scroll_max"]		? "2" : storage["animate_scroll_max"]),
	
	"use_own_scroll_functions" :		(!storage["use_own_scroll_functions"] 		? "1" : storage["use_own_scroll_functions"]),
	"use_own_scroll_functions_mouse" :	(!storage["use_own_scroll_functions_mouse"] ? "0" : storage["use_own_scroll_functions_mouse"]),
	"own_scroll_functions_middle" :		(!storage["own_scroll_functions_middle"] 	? "0" : storage["own_scroll_functions_middle"]),
	"scroll_velocity" :					(!storage["scroll_velocity"]				? "5" : storage["scroll_velocity"]),
	"keyscroll_velocity" :				(!storage["keyscroll_velocity"]				? "2" : storage["keyscroll_velocity"]),
	"mousescroll_velocity" :			(!storage["mousescroll_velocity"]			? "3" : storage["mousescroll_velocity"]),
	"mousescroll_distance" :			(!storage["mousescroll_distance"]			? "1" : storage["mousescroll_distance"]),
	"middlescroll_velocity" :			(!storage["middlescroll_velocity"]			? "1" : storage["middlescroll_velocity"]),
	"endMiddlescrollByTurningWheel" :	(!storage["endMiddlescrollByTurningWheel"]	? "0" : storage["endMiddlescrollByTurningWheel"]),

	"contextmenu_show_when":(!storage["contextmenu_show_when"]	? "2" : storage["contextmenu_show_when"]), // 1 = never, 2 = only over interface, 3 = always
	
	"external_interface" :	(!storage["external_interface"]		? "1" : storage["external_interface"]),

	"baseDevicePixelRatio" : window.devicePixelRatio // for scaling
	};
	
	chrome.extension.sendMessage( {"data" : "update_optionspage"} );
}); }
update_settings();

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse){
	if		(request.data === "settings") 			sendResponse(w);
	else if (request.data === "update_settings") 	update_settings(); // will request options page update when finished
	else if	(request.data === "show_contextmenu") 	show_contextmenu(request.string);
	else if	(request.data === "hide_contextmenu") 	hide_contextmenu();
});

// zoom API currently only available in Dev channel:
if(chrome.tabs.onZoomChange) chrome.tabs.onZoomChange.addListener( function(zoomInfo){
	w.baseDevicePixelRatio = window.devicePixelRatio;
	//chrome.tabs.sendMessage(zoomInfo.tabId, { "data" : "zoomed", "zoom" : zoomInfo.newZoomFactor });
});

var contextmenu = false;
function show_contextmenu(s)
{
	if (!contextmenu)	chrome.contextMenus.create({ "id" : "ms_contextmenu",
													 "title" : chrome.i18n.getMessage("contextmenu_"+s),
													 "onclick" : contextmenu_click});
	else				chrome.contextMenus.update("ms_contextmenu", {"title" : chrome.i18n.getMessage("contextmenu_"+s)});
	contextmenu = true;
}
function contextmenu_click(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		chrome.tabs.sendMessage(tabs[0].id, { "data" : "ms_toggle_visibility" });
	});
}
function hide_contextmenu()
{
	if(!contextmenu) return;
	chrome.contextMenus.remove("ms_contextmenu"); contextmenu = false;
}