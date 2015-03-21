window.addEventListener("DOMContentLoaded", populateOptions, false);
window.addEventListener("msButtonPositionChange", saveButtonPosition, true);
window.addEventListener("change", savePrefs, false);

function populateOptions(){
	localize();
	checkLicensing();
	restorePrefs();
}

function savePrefs(e) // save preferences:
{
	if(e.target.id === "save_set" || e.target.id === "saved_sets") return; // handled via onclick funtions
	if(!e.target.validity.valid) // correct out-of-range inputs
	{
		e.target.value = chrome.extension.getBackgroundPage().w[e.target.id];
		return;
	}
	
	if(e.target.type === "checkbox") save_new_value(e.target.id, e.target.checked?"1":"0");
	else 							 save_new_value(e.target.id, e.target.value);
	
	if(e.target.id === "border_color") save_new_value("border_color_rgba", "rgba("+parseInt(e.target.value.substring(1,3),16)+","+parseInt(e.target.value.substring(3,5),16)+","+parseInt(e.target.value.substring(5,7),16)+",0.7)");
	
	if(e.target.id === "size" || e.target.id === "hover_size"){
		document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
		if(document.getElementById("border_radius").value > document.getElementById("border_radius").max){
			document.getElementById("border_radius").value = document.getElementById("border_radius").max;
			save_new_value("border_radius", document.getElementById("border_radius").max);
		}
	}
	
	if(e.target.id === "contextmenu_show_when") chrome.extension.sendMessage({data:"update_contextmenu_show_when"});
	else										chrome.extension.sendMessage({data:"update_optionspage"});
	
	// show/hide containers:
	if(e.target.id === "show_buttons")					 document.getElementById("button_container").style.height=(e.target.value==="1"?"0":"auto");
	if(e.target.id === "use_own_scroll_functions")		 document.getElementById("keyscroll_velocity_container").style.display=(e.target.checked?null:"none");
	if(e.target.id === "use_own_scroll_functions_mouse") document.getElementById("mousescroll_container").style.display=(e.target.checked?"inline":"none");
	if(e.target.id === "own_scroll_functions_middle")	 document.getElementById("middlescroll_container").style.display=(e.target.checked?"inline":"none");
	if(e.target.id === "animate_scroll")				 document.getElementById("scroll_container").style.display=(e.target.checked?null:"none");
	
	// update slider values:
	if(e.target.id === "opacity")				document.getElementById("storage.opacity").innerHTML				= e.target.value;
	if(e.target.id === "superbar_opacity")		document.getElementById("storage.superbar_opacity").innerHTML		= e.target.value;
	if(e.target.id === "button_opacity")		document.getElementById("storage.button_opacity").innerHTML			= e.target.value;
	if(e.target.id === "keyscroll_velocity")	document.getElementById("storage.keyscroll_velocity").innerHTML		= Math.round(100*e.target.value/2);
	if(e.target.id === "mousescroll_velocity")	document.getElementById("storage.mousescroll_velocity").innerHTML	= Math.round(100*e.target.value/3);
	if(e.target.id === "mousescroll_distance")	document.getElementById("storage.mousescroll_distance").innerHTML	= Math.round(100*e.target.value);
	if(e.target.id === "middlescroll_velocity")	document.getElementById("storage.middlescroll_velocity").innerHTML	= Math.round(100*e.target.value);
	if(e.target.id === "scroll_velocity")		document.getElementById("storage.scroll_velocity").innerHTML		= Math.round(100*e.target.value/5);
}

function save_new_value(key, value){ chrome.extension.getBackgroundPage().save_new_value(key, value); }

function saveButtonPosition(e){ save_new_value("buttonposition", e.detail); }

function restorePrefs()
{
	var storage = chrome.extension.getBackgroundPage().w;
	chrome.storage.sync.get("saved_sets", function(s){
		storage.saved_sets = s.saved_sets;
		
		var selects = document.querySelectorAll("select");
		for(var i=0; i<selects.length; i++){
			if(!storage[selects[i].id]) continue;
			if(selects[i].id === "saved_sets")
			{
				if(selects[i].options.length === 1) // prevent attaching sets multiple times on update
				{
					for(var option in storage.saved_sets){
						selects[i].options[selects[i].options.length] = new Option(option, option); // Option(name, value)
					}
				}
				else continue;
			}
			else selects[i].value = storage[selects[i].id];
		}
	});
	
	var inputs = document.querySelectorAll("input");	
	for(var i=0; i<inputs.length; i++){
		if(!storage[inputs[i].id]) continue;
		if(inputs[i].type==="checkbox")	inputs[i].checked = (storage[inputs[i].id] === "0" ? false : true);
		else							inputs[i].value = storage[inputs[i].id];
	}
	
	if(document.getElementById("show_buttons").value !== "1")				document.getElementById("button_container").style.height				= "auto";
	if(!document.getElementById("use_own_scroll_functions").checked)		document.getElementById("keyscroll_velocity_container").style.display	= "none";
	if(document.getElementById("use_own_scroll_functions_mouse").checked)	document.getElementById("mousescroll_container").style.display			= "inline";
	if(document.getElementById("own_scroll_functions_middle").checked)		document.getElementById("middlescroll_container").style.display			= "inline";
	if(!document.getElementById("animate_scroll").checked)					document.getElementById("scroll_container").style.display				= "none";
	
	document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
	
	var sliders = document.querySelectorAll(".slider_values");
	for(var i = 0; i < sliders.length; i++) // display slider values:
	{
		var which_value = sliders[i].id.split(".")[1];
		var raw_value = (storage[which_value] ? storage[which_value] : document.getElementById(which_value).value);
		sliders[i].innerHTML = (document.getElementById(which_value).dataset.defaultvalue ? Math.round(100*raw_value/document.getElementById(which_value).dataset.defaultvalue) : raw_value);
	}	
	
	add_page_handling();
}

function add_page_handling()
{
	/*################### use when Issue 247969 is fixed: ######################
	document.getElementById("save_set").addEventListener("focus",function(){
		if(this.innerHTML === getString("new_set_name")) this.innerHTML = "";
	},false);
	document.getElementById("save_set").addEventListener("blur",function(){
		if(this.innerHTML === "") this.innerHTML = getString("new_set_name");
	},false);*/

	// ##############################
	// ##### settings profiles: #####
	// ##############################

	document.getElementById("save_set_img").addEventListener("click", confirm_save_set, false);
	document.getElementById("delete_set_img").addEventListener("click", confirm_delete_set, false);
	document.getElementById("load_set_img").addEventListener("click", confirm_load_set, false);
	
	document.getElementById("save_set").addEventListener("keydown", function(){ // Enter -> save configuration
		if(window.event.which !== 13) return;

		window.event.preventDefault();
		window.event.target.blur();
		document.getElementById("save_set_img").click();
	}, false);
	
	// #########################
	// ##### info bubbles: #####
	// #########################

	var info_bubbles = document.querySelectorAll(".i");
	
	for(var i=0; i<info_bubbles.length; i++) // position top/bottom:
	{
		info_bubbles[i].addEventListener("mouseover", function(){
			window.clearTimeout(bubble_setback);
			if(this.offsetTop>window.scrollY+window.innerHeight/2) this.lastChild.style.marginTop = (-this.lastChild.offsetHeight+8)+"px";
		}, false);
		info_bubbles[i].addEventListener("mouseout", function(){
			bubble_setback = window.setTimeout(function(){this.lastChild.style.marginTop= null;}.bind(this),500);
		}, false);
	}

	// ################
	// ### dialogs: ###
	// ################

	var dialog_close_buttons = document.querySelectorAll("dialog .close, dialog .hide_dialog");
	for(var i = 0; i < dialog_close_buttons.length; i++) dialog_close_buttons[i].addEventListener("click", hideDialog, false);

	document.querySelector("#confirm_overwrite_button").addEventListener("click", function(){ save_set(true); }, false);
	document.querySelector("#confirm_delete_button").addEventListener("click", delete_set, false);
	document.querySelector("#confirm_load_button").addEventListener("click", load_set, false);

	document.querySelector("#authorize").addEventListener("click", function(){
		chrome.runtime.getBackgroundPage( function(bg){ bg.updateLicense(true); } );
	}, false);
	document.querySelector("#get_more").addEventListener("click", function(){ showDialog("iaps"); }, false);
}
var bubble_setback; // timeout for info bubbles

function confirm_save_set(){
	if(document.getElementById("save_set").innerHTML === "Default"){
		showDialog("default_change_impossible");
		return;
	}
	
	for(var option = 0; option < document.getElementById("saved_sets").options.length; option++){
		if(document.getElementById("saved_sets").options[option].value === document.getElementById("save_set").innerHTML){
			showDialog("confirm_overwrite");
			return;
		}
	}

	save_set(false);
}
function save_set(overwrite){
	chrome.runtime.getBackgroundPage( function(bg){
		if(!bg.w.saved_sets) bg.w.saved_sets = {};
		bg.w.saved_sets[document.getElementById("save_set").innerHTML] = {};
		
		for(var setting in bg.w){
			if(setting === "saved_sets") continue;
			bg.w.saved_sets[document.getElementById("save_set").innerHTML][setting] = bg.w[setting];
		}
		
		chrome.storage.sync.set(bg.w);
		
		if(!overwrite) // don't add a new option if one gets overwritten
			document.getElementById("saved_sets").options[document.getElementById("saved_sets").options.length] =
				new Option(document.getElementById("save_set").innerHTML, document.getElementById("save_set").innerHTML);

		document.getElementById("saved_sets").value = document.getElementById("save_set").innerHTML; // select option
	});
}

function confirm_delete_set(){
	if(document.getElementById("saved_sets").value === "Default"){
		showDialog("default_delete_impossible");
		return;
	}

	showDialog("confirm_delete");
}
function delete_set(){
	chrome.runtime.getBackgroundPage( function(bg){
		delete bg.w.saved_sets[document.getElementById("saved_sets").value];
		chrome.storage.sync.set( {"saved_sets" : bg.w.saved_sets} );
		
		for(var i in document.getElementById("saved_sets").options){
			if(document.getElementById("saved_sets").options[i].value === document.getElementById("saved_sets").value)
			{
				document.getElementById("saved_sets").remove(i);
				break;
			}
		}
	});
}

function confirm_load_set(){ showDialog("confirm_load"); }
function load_set(){
	chrome.runtime.getBackgroundPage( function(bg){
		chrome.extension.onMessage.addListener(function(msg){
			if(msg.data === "update_optionspage")
			{
				chrome.extension.onMessage.removeListener(arguments.callee);
				restorePrefs();
			}
		});

		if(bg.w.saved_sets) var sets = bg.w.saved_sets;
		if(document.getElementById("saved_sets").value === "Default")
		{
			chrome.storage.sync.clear(); // delete everything
			if(sets) chrome.storage.sync.set( {"saved_sets" : sets} ); // restore saved sets (if any)
		}
		else
		{
			var temp_obj = {};
			for(var setting in sets[document.getElementById("saved_sets").value]){
				temp_obj[setting] = sets[document.getElementById("saved_sets").value][setting];
			}
			chrome.storage.sync.set(temp_obj);
		}
		chrome.extension.sendMessage({data:"update_settings"});
	});
}

function localize()
{
	var strings = document.querySelectorAll("[data-i18n]");
	for(var i = 0; i < strings.length; i++)
	{
		if(strings[i].tagName === "IMG")	strings[i].title	  = getString(strings[i].dataset.i18n); // tooltips
		else								strings[i].innerHTML += getString(strings[i].dataset.i18n);
	}
}
function getString(string){	return chrome.i18n.getMessage(string).split("\n").join("<br>"); }

function showDialog(id)
{
	window.location.hash = id;
	if(document.querySelector(window.location.hash).open) return;

	document.querySelector(window.location.hash).showModal();
	document.addEventListener("keydown", handleKeyboardEvents, false);
}

function hideDialog()
{
	if(window.location.hash.length < 2 || !document.querySelector(window.location.hash)) return;

	document.querySelector(window.location.hash).className = "close";
	document.removeEventListener("keydown", handleKeyboardEvents, false);

	window.setTimeout( function(){
		if(document.querySelector(window.location.hash+"[open]")) document.querySelector(window.location.hash).close();
		window.location.hash = "";
	}, 200);
}

function handleKeyboardEvents(e)
{
	if(!document.querySelector("dialog[open]") || e.which !== 27 /*Esc*/) return;

	if(document.querySelector("dialog[open]").querySelector(".close"))	hideDialog();
	else {																e.preventDefault();	e.stopPropagation(); }
}