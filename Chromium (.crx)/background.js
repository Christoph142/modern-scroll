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
	"border_width" :		(!storage["border_width"]			? "2"		: storage["border_width"]),
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
	"baseDevicePixelRatio" : 			window.devicePixelRatio, // for scaling

	"user_token" : 						(!storage["user_token"]						? ""	: storage["user_token"]),
	"license" : 						(!storage["license"]						? "none": storage["license"])
	};

	getLicense(false);

	chrome.extension.sendMessage( {"data" : "update_optionspage"} );
}); }
update_settings();

function getLicense(interactive, token)
{
	if(!token){
		getCurrentUserToken(interactive);
		return;
	}

	let req = new XMLHttpRequest();
	req.open("GET", "https://www.googleapis.com/chromewebstore/v1.1/userlicenses/" + chrome.runtime.id);
	req.setRequestHeader("Authorization", "Bearer " + token);
	req.onreadystatechange = function(){
		if (req.readyState === 4){
			if (req.status === 200){
				verifyAndSaveLicense( JSON.parse(req.responseText) );
				save_new_value("user_token", token); // token works -> cache it
			}
			else{
				console.log("Didn't get valid license from server:", JSON.parse(req.responseText));
				
				if (interactive)  // transfer token: interactive + token -> options page is already open & no need to check stored license
					chrome.extension.sendMessage( {"data" : "invalid_token"} );
				else if (w.license !== "none"){
					verifyAndSaveLicense( w.license );
					console.log("Checking stored one instead.");
				}
				else console.log("No stored one either.");
			}
		}
	}
	req.send();
}

function getCurrentUserToken(interactive)
{
	 chrome.identity.getAuthToken({ "interactive": interactive }, function(token){
		if (token) {
			save_new_value("user_token", token);
			chrome.extension.sendMessage( {"data" : "new_token", "token" : token} );
			getLicense(false, token);
		}
		else {
			let error = chrome.runtime.lastError;
			console.log("Failed getting user token "+(interactive ? "interactively" : "silently")+":", error);

			if (!isChrome()){
				if(w.user_token === "")
					chrome.tabs.create({ url : "options/options.html#transfer_token" }); // show dialog to make user transfer token from Chrome
				else{
					console.log("Using manually transferred user token instead.");
					getLicense(false, w.user_token);
				}
			}
			else if (!interactive) chrome.tabs.create({ url : "options/options.html#welcome" }); // show dialog to make user authorize modern scroll for Store
		}
	});
}

function verifyAndSaveLicense(license)
{
	let oldLicenseState = w.license.accessLevel;
	
	if (license.result && license.accessLevel === "FULL"){
		console.log("Fully paid & properly licensed.");
		save_new_value("license", license);
	}
	else if (license.result && license.accessLevel === "FREE_TRIAL"){
		let licenseAge = Date.now() - parseInt(license.createdTime, 10);
		if (licenseAge <= 7 * 1000*60*60*24 /*days*/) {
			console.log("Free trial:", licenseAge/1000/60/60/24, "of 7 days");
			save_new_value("license", license);
		}
		else{
			console.log("Trial expired. License issued", licenseAge/1000/60/60/24, "days ago.");
			license.accessLevel = "TRIAL_EXPIRED";
			save_new_value("license", license);
			chrome.tabs.create({ url : "options/options.html#trial_expired" });
		}
	}
	else if (license.result && license.accessLevel === "TRIAL_EXPIRED"){
		console.log("Trial expired. License issued", licenseAge/1000/60/60/24, "days ago.");
		chrome.tabs.create({ url : "options/options.html#trial_expired" });
	}

	if(w.license.accessLevel !== oldLicenseState) chrome.extension.sendMessage( {"data" : "update_licensing"} );
}

function save_new_value(key, value)
{
	let saveobject = {};
	saveobject[key] = value;
	chrome.storage.sync.set(saveobject);					// save it in Chrome's synced storage
	chrome.extension.getBackgroundPage().w[key] = value;	// update settings in background.js
	
	chrome.extension.sendMessage({data:"update_optionspage"});
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse)
{
	if (request.data === "settings")
	{
		if (w.license !== "none" && w.license.accessLevel !== "TRIAL_EXPIRED")	sendResponse(w);
		else																	sendResponse(false);
	}
	else if (request.data === "update_settings") 	update_settings(); // will request options page update when finished
	else if	(request.data === "show_contextmenu") 	show_contextmenu(request.string);
	else if	(request.data === "hide_contextmenu") 	hide_contextmenu();
});

// Zoom API = Chrome 38+
if(chrome.tabs.onZoomChange) chrome.tabs.onZoomChange.addListener( function(zoomInfo){
	w.baseDevicePixelRatio = window.devicePixelRatio;
	//chrome.tabs.sendMessage(zoomInfo.tabId, { "data" : "zoomed", "zoom" : zoomInfo.newZoomFactor });
});

let contextmenu = false;
/* dynamical context menu doesn't work anymore: https://code.google.com/p/chromium/issues/detail?id=467315 */
function show_contextmenu(s)
{
	if (!contextmenu)	chrome.contextMenus.create({ "id" : "ms_contextmenu",
													 "title" : chrome.i18n.getMessage("contextmenu_"+s),
													 "contexts" : ["all"],
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

function isChrome()
{
	if (navigator.appVersion.indexOf("OPR") > 0 || navigator.appVersion.indexOf("Vivaldi") > 0 || navigator.vendor === "Yandex")	return false;
	else																															return true;
}