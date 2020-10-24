window.addEventListener("DOMContentLoaded", populateOptions, false);
window.addEventListener("msButtonPositionChange", saveButtonPosition, true);
window.addEventListener("change", savePrefs, false);

function populateOptions(){
	localize();
	restorePrefs();
	if (window.location.hash && document.querySelector(window.location.hash.split("?")[0]).tagName === "DIALOG") showDialog(window.location.hash.split("?")[0]);
}

function savePrefs(e) // save preferences:
{
	if(e.target.id === "save_set" || e.target.id === "saved_sets") return; // handled via onclick functions
	if(!e.target.validity.valid) // correct out-of-range inputs
	{
		e.target.value = chrome.extension.getBackgroundPage().w[e.target.id];
		return;
	}
	
	if(e.target.type === "checkbox") save_new_value(e.target.id, e.target.checked?"1":"0");
	else 							 save_new_value(e.target.id, e.target.value);
	
	if(e.target.id === "border_color") save_new_value("border_color_rgba", "rgba("+parseInt(e.target.value.substring(1,3),16)+","+parseInt(e.target.value.substring(3,5),16)+","+parseInt(e.target.value.substring(5,7),16)+",0.7)");
	
	if(e.target.id === "size" || e.target.id === "hover_size"){
		document.querySelector("#border_radius").max = Math.round(Math.max(document.querySelector("#size").value, document.querySelector("#hover_size").value)/2);
		if(document.querySelector("#border_radius").value > document.querySelector("#border_radius").max){
			document.querySelector("#border_radius").value = document.querySelector("#border_radius").max;
			save_new_value("border_radius", document.querySelector("#border_radius").max);
		}
	}
	
	if(e.target.id === "contextmenu_show_when") chrome.runtime.sendMessage({data:"update_contextmenu_show_when"});
	else										chrome.runtime.sendMessage({data:"update_ms"});
	
	// show/hide containers:
	if(e.target.id === "show_buttons")					 document.querySelector("#button_container").style.height=(e.target.value==="1"?"0":"auto");
	if(e.target.id === "use_own_scroll_functions")		 document.querySelector("#keyscroll_velocity_container").style.display=(e.target.checked?null:"none");
	if(e.target.id === "use_own_scroll_functions_mouse") document.querySelector("#mousescroll_container").style.display=(e.target.checked?"inline":"none");
	if(e.target.id === "own_scroll_functions_middle")	 document.querySelector("#middlescroll_container").style.display=(e.target.checked?"inline":"none");
	if(e.target.id === "animate_scroll")				 document.querySelector("#scroll_container").style.display=(e.target.checked?null:"none");
	
	update_slider_value(e.target);
}

function update_slider_value(target)
{
	if(target.id === "opacity")					document.getElementById("storage.opacity").textContent				= target.value;
	if(target.id === "superbar_opacity")		document.getElementById("storage.superbar_opacity").textContent		= target.value;
	if(target.id === "button_opacity")			document.getElementById("storage.button_opacity").textContent		= target.value;
	if(target.id === "keyscroll_velocity")		document.getElementById("storage.keyscroll_velocity").textContent	= Math.round(100*target.value/2);
	if(target.id === "mousescroll_velocity")	document.getElementById("storage.mousescroll_velocity").textContent	= Math.round(100*target.value/3);
	if(target.id === "mousescroll_distance")	document.getElementById("storage.mousescroll_distance").textContent	= Math.round(100*target.value);
	if(target.id === "middlescroll_velocity")	document.getElementById("storage.middlescroll_velocity").textContent= Math.round(100*target.value);
	if(target.id === "scroll_velocity")			document.getElementById("storage.scroll_velocity").textContent		= Math.round(100*target.value/5);
}

function save_new_value(key, value){ chrome.extension.getBackgroundPage().save_new_value(key, value); }

function saveButtonPosition(e){ save_new_value("buttonposition", e.detail); }

function restorePrefs()
{
	let storage = chrome.extension.getBackgroundPage().w;
	chrome.storage.sync.get("saved_sets", function(s){
		storage.saved_sets = s.saved_sets;
		
		let selects = document.querySelectorAll("select");
		for(let select of selects){
			if(!storage[select.id]) continue;
			if(select.id === "saved_sets")
			{
				if(select.options.length === 1) // prevent attaching sets multiple times on update
				{
					for(let option in storage.saved_sets){
						select.options[select.options.length] = new Option(option, option); // Option(name, value)
					}
				}
				else continue;
			}
			else select.value = storage[select.id];
		}
	});
	
	let inputs = document.querySelectorAll("input");	
	for(let input of inputs){
		if(!storage[input.id]) continue;
		if(input.type==="checkbox")	input.checked = (storage[input.id] === "0" ? false : true);
		else						input.value = storage[input.id];
	}
	
	if(document.querySelector("#show_buttons").value !== "1")				document.querySelector("#button_container").style.height				= "auto";
	if(!document.querySelector("#use_own_scroll_functions").checked)		document.querySelector("#keyscroll_velocity_container").style.display	= "none";
	if(document.querySelector("#use_own_scroll_functions_mouse").checked)	document.querySelector("#mousescroll_container").style.display			= "inline";
	if(document.querySelector("#own_scroll_functions_middle").checked)		document.querySelector("#middlescroll_container").style.display			= "inline";
	if(!document.querySelector("#animate_scroll").checked)					document.querySelector("#scroll_container").style.display				= "none";
	
	document.querySelector("#border_radius").max = Math.round(Math.max(document.querySelector("#size").value, document.querySelector("#hover_size").value)/2);
	
	let sliders = document.querySelectorAll(".slider_values");
	for(let slider of sliders) // display slider values:
	{
		let which_value = slider.id.split(".")[1];
		let raw_value = (storage[which_value] ? storage[which_value] : document.getElementById(which_value).value);
		slider.textContent = (document.getElementById(which_value).dataset.defaultvalue ? Math.round(100*raw_value/document.getElementById(which_value).dataset.defaultvalue) : raw_value);
	}	
	
	add_page_handling();
}

function add_page_handling()
{
	document.querySelector("#save_set").addEventListener("focus", () => {
		if(this.textContent !== getString("new_set_name")) return;

	    let range = document.createRange();
	    let selection = window.getSelection();
	    
	    range.selectNodeContents(this);
	    
	    selection.removeAllRanges();
	    selection.addRange(range);
	},false);
	document.querySelector("#save_set").addEventListener("blur", () => {
		if(this.textContent === "") this.textContent = getString("new_set_name");
	},false);

	// ##############################
	// ##### settings profiles: #####
	// ##############################

	document.querySelector("#save_set_img").addEventListener("click", confirm_save_set, false);
	document.querySelector("#delete_set_img").addEventListener("click", confirm_delete_set, false);
	document.querySelector("#load_set_img").addEventListener("click", confirm_load_set, false);
	
	document.querySelector("#save_set").addEventListener("keydown", () => { // Enter -> save configuration
		if(window.event.which !== 13) return;

		window.event.preventDefault();
		window.event.target.blur();
		document.querySelector("#save_set_img").click();
	}, false);
	
	// #########################
	// ##### info bubbles: #####
	// #########################

	let info_bubbles = document.querySelectorAll(".i");
	
	for(let info_bubble of info_bubbles) // position top/bottom:
	{
		info_bubble.addEventListener("pointerover", function(){
			window.clearTimeout(bubble_setback);
			if(this.offsetTop>window.scrollY+window.innerHeight/2) this.lastChild.style.marginTop = (-this.lastChild.offsetHeight+8)+"px";
		}, false);
		info_bubble.addEventListener("pointerout", function(){
			bubble_setback = window.setTimeout(function(){this.lastChild.style.marginTop= null;}.bind(this),500);
		}, false);
	}

	// ################
	// ### dialogs: ###
	// ################

	let dialog_close_buttons = document.querySelectorAll("dialog .close, dialog .hide_dialog");
	for(let dcb of dialog_close_buttons) dcb.addEventListener("click", hideDialog, false);

	document.querySelector("#confirm_overwrite_button").addEventListener("click", () => save_set(true), false);
	document.querySelector("#confirm_delete_button").addEventListener("click", delete_set, false);
	document.querySelector("#confirm_load_button").addEventListener("click", load_set, false);

	// make sliders update during drag:
	let sliders = document.querySelectorAll("input[type=range]");
	for (let slider of sliders)
	{
		if (document.getElementById("storage." + slider.id))
			slider.addEventListener("input", () => update_slider_value(slider), false);
	}
}

let bubble_setback; // timeout for info bubbles

function confirm_save_set(){
	if(document.querySelector("#save_set").textContent === "Default"){
		showDialog("default_change_impossible");
		return;
	}
	
	for(let option of document.querySelector("#saved_sets").options){
		if(option.value === document.querySelector("#save_set").textContent){
			showDialog("confirm_overwrite");
			return;
		}
	}

	save_set(false);
}
function save_set(overwrite){
	chrome.runtime.getBackgroundPage( function(bg){
		if(!bg.saved_sets) bg.saved_sets = {};
		bg.saved_sets[document.querySelector("#save_set").textContent] = {};
		
		for(let setting in bg.w){
			if(setting === "saved_sets" || setting === "baseDevicePixelRatio" || setting === "last_dialog_time" || setting === "dialogs_shown") continue;
			bg.saved_sets[document.querySelector("#save_set").textContent][setting] = bg.w[setting];
		}
		
		chrome.storage.sync.set({ "saved_sets" : bg.saved_sets });
		
		if(!overwrite) { // don't add a new option if one gets overwritten
			let set_name = document.querySelector("#save_set").textContent;
			document.querySelector("#saved_sets").options[document.querySelector("#saved_sets").options.length] = new Option(set_name, set_name);
			bg.add_contextmenu_set(set_name);
		}

		document.querySelector("#saved_sets").value = document.querySelector("#save_set").textContent; // select option
	});
}

function confirm_delete_set(){
	if(document.querySelector("#saved_sets").value === "Default"){
		showDialog("default_delete_impossible");
		return;
	}

	showDialog("confirm_delete");
}
function delete_set(){
	chrome.runtime.getBackgroundPage( function(bg){
		let set_name = document.querySelector("#saved_sets").value;

		delete bg.saved_sets[set_name];
		chrome.storage.sync.set( {"saved_sets" : bg.saved_sets} );
		bg.remove_contextmenu_set(set_name);

		for(let option in document.querySelector("#saved_sets").options){
			if(document.querySelector("#saved_sets").options[option].value === set_name)
			{
				document.querySelector("#saved_sets").remove(option);
				break;
			}
		}
	});
}

function confirm_load_set(){ showDialog("confirm_load"); }
function load_set(){
	chrome.runtime.getBackgroundPage( function(bg){
		chrome.runtime.onMessage.addListener(function(msg){
			if(msg.data === "update_ms")
			{
				chrome.runtime.onMessage.removeListener(arguments.callee);
				restorePrefs();
			}
		});

		let temp_prefs = {
			"saved_sets" 		: bg.saved_sets,
			"last_dialog_time" 	: bg.w.last_dialog_time,
			"dialogs_shown" 	: bg.w.dialogs_shown
		};
		if(document.querySelector("#saved_sets").value === "Default")
		{
			chrome.storage.sync.clear(); // delete everything
			chrome.storage.sync.set( temp_prefs ); // restore prefs that are not saved per set
		}
		else
		{
			let temp_obj = {};
			for(let setting in temp_prefs.saved_sets[document.querySelector("#saved_sets").value]){
				temp_obj[setting] = temp_prefs.saved_sets[document.querySelector("#saved_sets").value][setting];
			}
			chrome.storage.sync.set(temp_obj);
		}
		chrome.runtime.sendMessage({data:"update_settings"});
	});
}

function localize()
{
	let strings = document.querySelectorAll("[data-i18n]");
	for(let string of strings)
	{
		if (string.tagName === "IMG")	string.title	  = getString(string.dataset.i18n); // tooltips
		else							string.innerHTML += getString(string.dataset.i18n); // innerHTML because of links and linebreaks
	}

	// insert extension id in Web Store URLs:
	let webstorelinks = document.querySelectorAll("a[href*='@@extension_id']");
	for (let link of webstorelinks) {
		link.href = link.href.replace("@@extension_id", getString("@@extension_id"));
	};
}
function getString(string){					return chrome.i18n.getMessage(string).split("\n").join("<br>"); }
function getString(string, substitutes){	return chrome.i18n.getMessage(string, substitutes).split("\n").join("<br>"); }

function showDialog(id)
{
	let substitutes = window.location.hash.split("?")[1]?.split(",");
	window.location.hash = id;

	if(document.querySelector(window.location.hash+"[open]")) return;
	
	let stringsWithSubstitutions = document.querySelectorAll(window.location.hash + " [data-substitutions]");
	for (let string of stringsWithSubstitutions)
	{
		string.innerHTML = getString(string.dataset.i18n, substitutes);
	}

	document.querySelector(window.location.hash).showModal();
	document.addEventListener("keydown", handleKeyboardEvents, false);

	let now = Date.now();
	let dialogs_shown = chrome.extension.getBackgroundPage().w.dialogs_shown;
	dialogs_shown[now] = id;
	save_new_value("dialogs_shown", dialogs_shown);
	save_new_value("last_dialog_time", now);
}

function hideDialog()
{
	if(window.location.hash.length < 2 || !document.querySelector(window.location.hash+"[open]")) return;

	document.querySelector(window.location.hash).className = "close";
	document.removeEventListener("keydown", handleKeyboardEvents, false);

	window.setTimeout(() => {
		if(document.querySelector(window.location.hash+"[open]")) document.querySelector(window.location.hash).close();
		window.location.hash = "";
	}, 200);
}

function switchDialog(id)
{
	hideDialog();
	window.setTimeout(() => showDialog(id), 300);
}

function handleKeyboardEvents(e)
{
	if(!document.querySelector("dialog[open]") || e.which !== 27 /*Esc*/) return;

	if(document.querySelector("dialog[open]").querySelector(".close"))	hideDialog();
	else {																e.preventDefault();	e.stopPropagation(); }
}
