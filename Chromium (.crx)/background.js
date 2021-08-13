//retrieve and store settings (filled with default values) for all pages:
function update_settings(){ chrome.storage.sync.get( null, function(storage){
	w = {
	// standard settings:
	"color" :				(!storage["color"]					? "#000000"	: storage["color"]),
	"color_bg" :			(!storage["color_bg"]				? "#999999"	: storage["color_bg"]),
	"auto_coloring" :		(!storage["auto_coloring"]			? "1"		: storage["auto_coloring"]),
	"size" :				(!storage["size"]					? "8"		: storage["size"]),
	"hover_size" :			(!storage["hover_size"]				? "12"		: storage["hover_size"]),
	"border_radius" :		(!storage["border_radius"]			? "6"		: storage["border_radius"]),
	"gap" :					(!storage["gap"]					? "2"		: storage["gap"]),
	"opacity" :				(!storage["opacity"]				? "50"		: storage["opacity"]),
	"border_width" :		(!storage["border_width"]			? "1"		: storage["border_width"]),
	"border_blur" :			(!storage["border_blur"]			? "0"		: storage["border_blur"]),
	"border_color" :		(!storage["border_color"]			? "#FFFFFF"	: storage["border_color"]),
	"border_color_rgba" :	(!storage["border_color_rgba"]		? "rgba(255,255,255,0.5)" : storage["border_color_rgba"]),
	"vbar_at_left" :		(!storage["vbar_at_left"]			? "0"		: storage["vbar_at_left"]),
	"hbar_at_top" :			(!storage["hbar_at_top"]			? "0"		: storage["hbar_at_top"]),

	"show_when" :			(!storage["show_when"]				? "2"		: storage["show_when"]), // 1 = onmouseover only, 2 = normal, 3 = always
	"show_bg_bars_when" :	(!storage["show_bg_bars_when"]		? "2"		: storage["show_bg_bars_when"]), // 1 = never, 2 = onmouseover only, 3 = like bars
	"show_how_long" :		(!storage["show_how_long"]			? "1000"	: storage["show_how_long"]),
	"fullscreen_only" :		(!storage["fullscreen_only"]		? "0"		: storage["fullscreen_only"]),
	"bg_special_ends" :		(!storage["bg_special_ends"]		? "1"		: storage["bg_special_ends"]),
	"container" :			(!storage["container"]				? "0"		: storage["container"]),
	"container_size" :		(!storage["container_size"]			? "30"		: storage["container_size"]),
	
	"contextmenu_show_when":(!storage["contextmenu_show_when"]	? "2"		: storage["contextmenu_show_when"]), // 1 = never, 2 = only over interface, 3 = always
	
	"style_element_bars" :				(!storage["style_element_bars"]				? "1"	: storage["style_element_bars"]),
	"autohide_element_bars" :			(!storage["autohide_element_bars"]			? "0"	: storage["autohide_element_bars"]), // largely broken in Blink
	
	"show_superbar" :					(!storage["show_superbar"]					? "0"	: storage["show_superbar"]),
	"show_superbar_minipage" : 			(!storage["show_superbar_minipage"] 		? "1"	: storage["show_superbar_minipage"]),
	"superbar_opacity" :				(!storage["superbar_opacity"]				? "70"	: storage["superbar_opacity"]),

	"bookmark_text_color" :				(!storage["bookmark_text_color"]			? "#FFFFFF": storage["bookmark_text_color"]),
	"show_bookmarks" :					(!storage["show_bookmarks"]					? "2"	: storage["show_bookmarks"]), // 1 = none, 2 = bookmarks, 3 = all headings

	"show_buttons" :					(!storage["show_buttons"]					? "1"	: storage["show_buttons"]), // 1 = no, 2 = only fullscreen, 3 = yes
	"button_height" :					(!storage["button_height"]					? "50"	: storage["button_height"]),
	"button_width" :					(!storage["button_width"]					? "100"	: storage["button_width"]),
	"button_opacity" :					(!storage["button_opacity"]					? "10"	: storage["button_opacity"]),
	"buttonposition" :					(!storage["buttonposition"]					? "48"	: storage["buttonposition"]),
	
	"use_own_scroll_functions" :		(!storage["use_own_scroll_functions"] 		? "1"	: storage["use_own_scroll_functions"]),
	"use_own_scroll_functions_mouse" :	(!storage["use_own_scroll_functions_mouse"] ? "0"	: storage["use_own_scroll_functions_mouse"]),
	"own_scroll_functions_middle" :		(!storage["own_scroll_functions_middle"] 	? "0"	: storage["own_scroll_functions_middle"]),
	"scroll_velocity" :					(!storage["scroll_velocity"]				? "5"	: storage["scroll_velocity"]),
	"keyscroll_velocity" :				(!storage["keyscroll_velocity"]				? "2"	: storage["keyscroll_velocity"]),
	"mousescroll_velocity" :			(!storage["mousescroll_velocity"]			? "3"	: storage["mousescroll_velocity"]),
	"mousescroll_distance" :			(!storage["mousescroll_distance"]			? "1"	: storage["mousescroll_distance"]),
	"middlescroll_velocity" :			(!storage["middlescroll_velocity"]			? "1"	: storage["middlescroll_velocity"]),
	"endMiddlescrollByTurningWheel" :	(!storage["endMiddlescrollByTurningWheel"]	? "0"	: storage["endMiddlescrollByTurningWheel"]),
	"animate_scroll" :					(!storage["animate_scroll"]					? "1"	: storage["animate_scroll"]),
	"animate_scroll_max" :				(!storage["animate_scroll_max"]				? "2"	: storage["animate_scroll_max"]),

	"external_interface" :				(!storage["external_interface"]				? "0"	: storage["external_interface"]),

	// general stuff:
	"last_dialog_time" :				(!storage["last_dialog_time"]				? 0		: storage["last_dialog_time"]),
	"dialogs_shown" :					(!storage["dialogs_shown"]					? {}	: storage["dialogs_shown"]), // time : type
	};
	
	saved_sets = 						(!storage["saved_sets"]					? {}	: storage["saved_sets"]);
	custom_domains =					(!storage["custom_domains"]				? {}	: storage["custom_domains"]);

	console.log("last_dialog_time: " + w.last_dialog_time);
	if (w.last_dialog_time === 0) {
		chrome.tabs.create({ url : "options/options.html#welcome" }); // First run -> Show welcome page
		save_new_value("last_dialog_time", Date.now());
		console.log("No dialog ever shown. Setting last_dialog_time to " + w.last_dialog_time);
	}
	else {
		let first_dialog_time = Object.keys(w.dialogs_shown)[0];
		console.log("First dialog ever shown " + (Date.now() - first_dialog_time)/1000/60/60/24 + " days ago");
		console.log("Last dialog has been shown " + (Date.now() - w.last_dialog_time)/1000/60/60/24 + " days ago");

		if (Date.now() - first_dialog_time > 1000 * 60 * 60 * 24 * 30 && // 30 days after installation (once)
			Object.values(w.dialogs_shown).indexOf("#hello_again") === -1)
			chrome.tabs.create({ url : "options/options.html#hello_again" });
		else if (Date.now() - w.last_dialog_time > 1000 * 60 * 60 * 24 * 7 * 6) // 6 weeks after last dialog (recurring)
			chrome.tabs.create({ url : "options/options.html#thanks_for_using" });
	}

	recreate_contextmenus();
	send_update_request();
}); }
update_settings();

function save_new_value(key, value)
{
	let saveobject = {};
	saveobject[key] = value;
	chrome.storage.sync.set(saveobject);							// save it in Chrome's synced storage
	chrome.runtime.getBackgroundPage( (bg) => bg.w[key] = value );	// update settings in background.js
	
	send_update_request();
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse)
{
	if (request.data === "settings")
	{
		chrome.tabs.getZoom(sender.tab.id, zoomFactor =>
			chrome.tabs.sendMessage(sender.tab.id, { "zoomFactor" : zoomFactor })
		);

		if (!request.domain) { sendResponse(w); return; }

		if (!custom_domains.hasOwnProperty(request.domain)) { sendResponse(w); return; }

		let domain_props = custom_domains[request.domain];
		if (!domain_props.hasOwnProperty("set")) { sendResponse(w); return; }

		let set_name = domain_props.set;
		if (set_name === false) sendResponse(false); // blacklisted pages
		else if (saved_sets[set_name]) sendResponse(saved_sets[set_name]);
		else {
			console.warn("Custom set '" + set_name + "' for domain '" + request.domain + "' not found." );
			sendResponse(w);
		}
	}
	else if (request.data === "update_settings") 	update_settings(); // will request options page update when finished
	else if	(request.data === "show_contextmenu") 	show_contextmenu(request.string);
	else if	(request.data === "hide_contextmenu") 	hide_contextmenu();
});

chrome.tabs.onZoomChange.addListener( zoomInfo =>
	chrome.tabs.sendMessage(zoomInfo.tabId, { "zoomFactor" : zoomInfo.newZoomFactor })
);

function recreate_contextmenus()
{
	chrome.contextMenus.removeAll(() => {

	chrome.contextMenus.create({ "id" : "ms_contextmenu_enable",
								 "title" : chrome.i18n.getMessage("contextmenu_enable"),
								 "contexts" : ["all"],
								 "visible" : false});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_show",
								 "title" : chrome.i18n.getMessage("contextmenu_show"),
								 "contexts" : ["all"],
								 "visible" : false});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_hide",
								 "title" : chrome.i18n.getMessage("contextmenu_hide"),
								 "contexts" : ["all"],
								 "visible" : false});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_customize",
								 "title" : chrome.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	
	//customization submenu items:
	chrome.contextMenus.create({ "id" : "ms_contextmenu_customize_current_set",
								 "parentId" : "ms_contextmenu_customize",
								 //"type" : "radio",
								 "title" : chrome.i18n.getMessage("contextmenu_customize_current_set"),
								 "contexts" : ["all"],
								 "visible" : true});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_disable",
								 "parentId" : "ms_contextmenu_customize",
								 //"type" : "radio",
								 "title" : chrome.i18n.getMessage("contextmenu_disable"),
								 "contexts" : ["all"],
								 "visible" : true});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_customize_separator_list_begin",
								 "parentId" : "ms_contextmenu_customize",
								 "type" : "separator",
								 "contexts" : ["all"],
								 "visible" : true});
	for (const set in saved_sets) {
		chrome.contextMenus.create({ "id" : "ms_contextmenu_customize_set_" + set,
									 "parentId" : "ms_contextmenu_customize",
								 	 //"type" : "radio",
									 "title" : set,
									 "contexts" : ["all"],
									 "visible" : true});
	}
	chrome.contextMenus.create({ "id" : "ms_contextmenu_customize_separator_list_end",
								 "parentId" : "ms_contextmenu_customize",
								 "type" : "separator",
								 "contexts" : ["all"],
								 "visible" : true});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_customize_new_set",
								 "parentId" : "ms_contextmenu_customize",
								 "title" : chrome.i18n.getMessage("contextmenu_new_set"),
								 "contexts" : ["all"],
								 "visible" : true});

	chrome.contextMenus.onClicked.addListener( function(info, tab) {
		if (info.menuItemId === "ms_contextmenu_customize_new_set")
		{
			chrome.runtime.openOptionsPage();
			//chrome.tabs.create({ url : "options/options.html?domain=" + get_domain(info.pageUrl) });
		}
		else if (info.menuItemId === "ms_contextmenu_enable" || info.menuItemId === "ms_contextmenu_customize_current_set")
		{
			delete custom_domains[get_domain(info.pageUrl)]["set"];
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
			//console.log(get_domain(info.pageUrl) + " now UNSET.");
			send_update_request();
		}
		else if (info.menuItemId.indexOf("ms_contextmenu_customize_set_") > -1)
		{
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			custom_domains[domain]["set"] = info.menuItemId.split("ms_contextmenu_customize_set_")[1];
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
			//console.log(get_domain(info.pageUrl) + " now set to " + custom_domains[get_domain(info.pageUrl)]["set"]);
			send_update_request();
		}
		else if (info.menuItemId === "ms_contextmenu_disable")
		{
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			custom_domains[domain]["set"] = false;
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
			//console.log(get_domain(info.pageUrl) + " now not using modern scroll");
			send_update_request();
			chrome.tabs.create({ url : "options/options.html#disabled?" + get_domain(info.pageUrl) });
		}
		else
		{
			//console.log(get_domain(info.pageUrl) + " in tab " + tab.id + " is now " + (info.menuItemId === "ms_contextmenu_hide" ? "invisible" : "visible"));
			chrome.tabs.sendMessage(tab.id, { "data" : "ms_toggle_visibility" });
		}
	});

	}); // end of removeAll
}

function add_contextmenu_set(set)
{
	recreate_contextmenus(); // need to recreate because API doesn't let you insert items in between
}

function remove_contextmenu_set(set)
{
	chrome.contextMenus.remove("ms_contextmenu_customize_set_" + set);
}

function show_contextmenu(s)
{
	chrome.contextMenus.update("ms_contextmenu_enable", {"visible" : s === "enable"});
	chrome.contextMenus.update("ms_contextmenu_show", {"visible" : s === "show"});
	chrome.contextMenus.update("ms_contextmenu_hide", {"visible" : s === "hide"});
	chrome.contextMenus.update("ms_contextmenu_customize", {"visible" : s === "hide"});
}

function hide_contextmenu()
{
	chrome.contextMenus.update("ms_contextmenu_enable", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_show", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_hide", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_customize", {"visible" : false});
}

function get_domain(url) {
	return url.split("?")[0].split("#")[0].split("/")[2];
}

function send_update_request() {
	chrome.runtime.sendMessage( {"data" : "update_ms"} );
	chrome.tabs.query({discarded: false}, function(tabs) {
		for (let tab of tabs) { // send to all tabs & let them decide whether they need to refresh
	  		chrome.tabs.sendMessage(tab.id, {"data" : "update_ms"});
		}
	});
}
