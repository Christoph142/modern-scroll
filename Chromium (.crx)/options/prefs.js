window.addEventListener("DOMContentLoaded", populateOptions, false);
window.addEventListener("msButtonPositionChange", saveButtonPosition, true);
window.addEventListener("change", savePrefs, false);

let prefs = null;

async function populateOptions(){
	localize();
	await restorePrefs();
	if (window.location.search) document.querySelector("#domain_specific").style.display = "flex";
	if (window.location.hash && document.querySelector(window.location.hash).tagName === "DIALOG")
		showDialog(window.location.hash);
}

function savePrefs(e) // save preferences:
{
	if(e.target.id === "save_set" || e.target.id === "saved_sets") return; // handled via onclick functions
	if(!e.target.validity.valid) // correct out-of-range inputs
	{
		e.target.value = prefs[e.target.id];
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

async function save_new_value(key, value)
{
	if (!prefs) return;

	let saveobject = {};
	saveobject[key] = value;
	prefs[key] = value;
	chrome.storage.sync.set(saveobject);
}

function saveButtonPosition(e){ save_new_value("buttonposition", e.detail); }

async function restorePrefs() {
	return new Promise((resolve, reject) =>
	chrome.storage.sync.get({// default settings:
		color:					"#000000",
		color_bg:				"#999999",
		auto_coloring:			"1",
		size:					"8",
		hover_size:				"12",
		border_radius:			"6",
		gap:					"2",
		opacity:				"50",
		border_width:			"1",
		border_blur:			"0",
		border_color:			"#FFFFFF",
		border_color_rgba:		"rgba(255,255,255,0.5)",
		vbar_at_left:			"0",
		hbar_at_top:			"0",

		show_when:				"2", // 1 = onmouseover only, 2 = normal, 3 = always
		show_bg_bars_when:		"2", // 1 = never, 2 = onmouseover only, 3 = like bars
		show_how_long:			"1000",
		squeeze_bars: 			"0",
		overscroll_actions:		"0",
		fullscreen_only:		"0",
		bg_special_ends:		"1",
		container:				"0",
		container_size:			"30",
		
		contextmenu_show_when:	"2", // 1 = never, 2 = only over interface, 3 = always
		
		style_element_bars:		"1",
		autohide_element_bars:	"0", // largely broken in Blink
		
		show_superbar:			"0",
		show_superbar_minipage: "1",
		superbar_opacity:		"70",

		bookmark_text_color:	"#FFFFFF",
		show_bookmarks:			"2", // 1 = none, 2 = bookmarks, 3 = all headings

		show_buttons:			"1", // 1 = no, 2 = only fullscreen, 3 = yes
		button_height:			"50",
		button_width:			"100",
		button_opacity:			"10",
		buttonposition:			"48",
		
		use_own_scroll_functions:		"1",
		use_own_scroll_functions_mouse:	"0",
		own_scroll_functions_middle:	"0",
		scroll_velocity:				"5",
		keyscroll_velocity:				"2",
		mousescroll_velocity:			"3",
		mousescroll_distance:			"1",
		middlescroll_velocity:			"1",
		endMiddlescrollByTurningWheel:	"0",
		animate_scroll:					"1",
		animate_scroll_max:				"2",

		external_interface:				"0",

		// general stuff:
		last_dialog_time:				0,
		dialogs_shown:					{}, // time : type
		saved_sets : 					{},
		custom_domains :				{}
		}, storage => {
			prefs = storage;
			resolve();

			document.querySelectorAll("select").forEach(select => {
				if(!prefs[select.id]) return;
				if(select.id === "saved_sets")
				{
					if(select.options.length === 1) // prevent attaching sets multiple times on update
					{
						for(let option in prefs.saved_sets){
							select.options[select.options.length] = new Option(option, option); // Option(name, value)
						}
					}
					else return;
				}
				else select.value = prefs[select.id];
			});

			document.querySelectorAll("input").forEach(input => {
				if(!prefs[input.id]) return;
				if(input.type==="checkbox")	input.checked = (prefs[input.id] === "0" ? false : true);
				else						input.value = prefs[input.id];
			});
			
			if(window.onoverscroll === undefined)									document.querySelector("#overscroll_container").style.display			= "none";
			if(document.querySelector("#show_buttons").value !== "1")				document.querySelector("#button_container").style.height				= "auto";
			if(!document.querySelector("#use_own_scroll_functions").checked)		document.querySelector("#keyscroll_velocity_container").style.display	= "none";
			if(document.querySelector("#use_own_scroll_functions_mouse").checked)	document.querySelector("#mousescroll_container").style.display			= "inline";
			if(document.querySelector("#own_scroll_functions_middle").checked)		document.querySelector("#middlescroll_container").style.display			= "inline";
			if(!document.querySelector("#animate_scroll").checked)					document.querySelector("#scroll_container").style.display				= "none";
			
			document.querySelector("#border_radius").max = Math.round(Math.max(document.querySelector("#size").value, document.querySelector("#hover_size").value)/2);
			
			document.querySelectorAll(".slider_values").forEach(slider => { // display slider values:
				let which_value = slider.id.split(".")[1];
				let raw_value = (prefs[which_value] ? prefs[which_value] : document.getElementById(which_value).value);
				slider.textContent = (document.getElementById(which_value).dataset.defaultvalue ? Math.round(100*raw_value/document.getElementById(which_value).dataset.defaultvalue) : raw_value);
			});
			
			add_page_handling();
		}
	));
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

	document.querySelectorAll(".i").forEach(info_bubble => { // position top/bottom:
		info_bubble.addEventListener("pointerover", function(){
			window.clearTimeout(bubble_setback);
			if(this.offsetTop>window.scrollY+window.innerHeight/2) this.lastChild.style.marginTop = (-this.lastChild.offsetHeight+8)+"px";
		}, false);
		info_bubble.addEventListener("pointerout", function(){
			bubble_setback = window.setTimeout(function(){this.lastChild.style.marginTop= null;}.bind(this),500);
		}, false);
	});

	// ################
	// ### dialogs: ###
	// ################

	document.querySelectorAll("dialog .close, dialog .hide_dialog").forEach(dialog_close_button =>
		dialog_close_button.addEventListener("click", hideDialog, false)
	);

	document.querySelector("#confirm_overwrite_button").addEventListener("click", () => save_set(true), false);
	document.querySelector("#confirm_delete_button").addEventListener("click", delete_set, false);
	document.querySelector("#confirm_load_button").addEventListener("click", load_set, false);
	document.querySelectorAll("#hello_again button").forEach(button =>
		button.addEventListener("click", switchDialog, false)
	);

	// make sliders update during drag:
	document.querySelectorAll("input[type=range]").forEach(slider => {
		if (document.getElementById("storage." + slider.id))
			slider.addEventListener("input", () => update_slider_value(slider), false);
	});
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
	if(!prefs.saved_sets) prefs.saved_sets = {};
	prefs.saved_sets[document.querySelector("#save_set").textContent] = {};
	
	for(let setting in prefs){
		if(["saved_sets", "custom_domains", "baseDevicePixelRatio", "last_dialog_time", "dialogs_shown"].includes(setting)) continue;
		prefs.saved_sets[document.querySelector("#save_set").textContent][setting] = prefs[setting];
	}
	
	chrome.storage.sync.set({ "saved_sets" : prefs.saved_sets });
	
	if(!overwrite) { // don't add a new option if one gets overwritten
		let set_name = document.querySelector("#save_set").textContent;
		document.querySelector("#saved_sets").options[document.querySelector("#saved_sets").options.length] = new Option(set_name, set_name);
	}

	document.querySelector("#saved_sets").value = document.querySelector("#save_set").textContent; // select option	
}

function confirm_delete_set(){
	if(document.querySelector("#saved_sets").value === "Default"){
		showDialog("default_delete_impossible");
		return;
	}

	showDialog("confirm_delete");
}
function delete_set(){
	let set_name = document.querySelector("#saved_sets").value;

	delete prefs.saved_sets[set_name];
	chrome.storage.sync.set({ "saved_sets": prefs.saved_sets });

	for(let option in document.querySelector("#saved_sets").options){
		if(document.querySelector("#saved_sets").options[option].value === set_name)
		{
			document.querySelector("#saved_sets").remove(option);
			break;
		}
	}
}

function confirm_load_set(){ showDialog("confirm_load"); }
function load_set(){
	if(document.querySelector("#saved_sets").value === "Default")
	{
		let prefsToBeDeleted = Object.keys(prefs).filter(pref => !["saved_sets", "custom_domains", "last_dialog_time", "dialogs_shown"].includes(pref));
		chrome.storage.sync.remove( prefsToBeDeleted );
	}
	else
	{
		chrome.storage.sync.set(prefs.saved_sets[document.querySelector("#saved_sets").value]);
	}

	restorePrefs();
}

function localize()
{
	document.querySelectorAll("[data-i18n]").forEach(string => {
		if (string.tagName === "IMG")	string.title	  = getString(string.dataset.i18n); // tooltips
		else							string.innerHTML += getString(string.dataset.i18n, string.dataset.substitutions); // innerHTML because of links and linebreaks
	});

	// insert extension id in Web Store URLs:
	document.querySelectorAll("a[href*='@@extension_id']").forEach(link =>
		link.href = link.href.replace("@@extension_id", getString("@@extension_id"))
	);
}

function getString(string, substitutions = "")
{
	let substitutes = [];
	if (substitutions) {
		const urlParams = new URLSearchParams(window.location.search);
		substitutions.split(",").forEach(s => substitutes.push(urlParams.get(s)));
	}
	return chrome.i18n.getMessage(string, substitutes).split("\n").join("<br>");
}

function showDialog(id)
{
	if(document.querySelector(window.location.hash+"[open]")) return;
	
	document.querySelector(window.location.hash).showModal();
	document.addEventListener("keydown", handleKeyboardEvents, false);

	let now = Date.now();
	prefs.dialogs_shown[now] = id;
	save_new_value("dialogs_shown", prefs.dialogs_shown);
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

function switchDialog(e)
{
	const id = e.target.getAttribute("data-i18n");
	hideDialog();
	window.setTimeout(() => showDialog(id), 300);
}

function handleKeyboardEvents(e)
{
	if(!document.querySelector("dialog[open]") || e.which !== 27 /*Esc*/) return;

	if(document.querySelector("dialog[open]").querySelector(".close"))	hideDialog();
	else {																e.preventDefault();	e.stopPropagation(); }
}
