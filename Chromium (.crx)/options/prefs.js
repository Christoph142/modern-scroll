window.addEventListener("DOMContentLoaded", restoreprefs, false);
window.addEventListener("DOMContentLoaded", localize, false);
window.addEventListener("mouseup", save_buttonposition, false);

window.addEventListener("change", function(e) // save preferences:
{
	if(e.target.id === "save_set" || e.target.id === "saved_sets") return; // handled via onclick funtions
	if(!e.target.validity.valid) // correct out-of-range inputs
	{
		e.target.style.transition = "box-shadow 500ms";
		e.target.style.boxShadow = "#F00 0 0 10px 0";
		window.setTimeout(function(){
			e.target.value = chrome.extension.getBackgroundPage().w[e.target.id];
			e.target.style.boxShadow = null;
		}, 500);
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
	if(e.target.id === "show_superbar")					 document.getElementById("superbar_container").style.height=(e.target.checked?"auto":"0");
	if(e.target.id === "show_buttons")					 document.getElementById("button_container").style.height=(e.target.value==="1"?"0":"auto");
	if(e.target.id === "use_own_scroll_functions")		 document.getElementById("keyscroll_velocity_container").style.display=(e.target.checked?null:"none");
	if(e.target.id === "use_own_scroll_functions_mouse") document.getElementById("mousescroll_container").style.display=(e.target.checked?null:"none");
	if(e.target.id === "animate_scroll")				 document.getElementById("scroll_container").style.display=(e.target.checked?null:"none");
	
	// update slider values:
	if(e.target.id === "opacity")				document.getElementById("storage.opacity").innerHTML				= e.target.value;
	if(e.target.id === "superbar_opacity")		document.getElementById("storage.superbar_opacity").innerHTML		= e.target.value;
	if(e.target.id === "button_opacity")		document.getElementById("storage.button_opacity").innerHTML			= e.target.value;
	if(e.target.id === "keyscroll_velocity")	document.getElementById("storage.keyscroll_velocity").innerHTML		= Math.round(100*e.target.value/2);
	if(e.target.id === "mousescroll_velocity")	document.getElementById("storage.mousescroll_velocity").innerHTML	= Math.round(100*e.target.value/3);
	if(e.target.id === "mousescroll_distance")	document.getElementById("storage.mousescroll_distance").innerHTML	= Math.round(100*e.target.value);
	if(e.target.id === "scroll_velocity")		document.getElementById("storage.scroll_velocity").innerHTML		= Math.round(100*e.target.value/5);
	
},false);

function save_new_value(key, value)
{
	var saveobject = {};
	saveobject[key] = value;
	chrome.storage.sync.set(saveobject);					// save it in Chrome's synced storage
	chrome.extension.getBackgroundPage().w[key] = value;	// update settings in background.js
	
	chrome.extension.sendMessage({data:"update_optionspage"});
}

function save_buttonposition(){
	if(document.getElementsByClassName("dragged_button")[0])
		save_new_value("buttonposition", (100 * document.getElementsByClassName("dragged_button")[0].offsetLeft / window.innerWidth));
}

function restoreprefs()
{
	var storage = chrome.extension.getBackgroundPage().w;
	chrome.storage.sync.get("saved_sets", function(s){
		storage.saved_sets = s.saved_sets;
		
		var selects = document.getElementsByTagName("select");
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
			else document.getElementsByTagName("select")[i].value = storage[selects[i].id];
		}
	});
	
	var inputs = document.getElementsByTagName("input");	
	for(var i=0; i<inputs.length; i++){
		if(!storage[inputs[i].id]) continue;
		if(inputs[i].type==="checkbox")	document.getElementsByTagName("input")[i].checked = (storage[inputs[i].id] === "0" ? false : true);
		else							document.getElementsByTagName("input")[i].value = storage[inputs[i].id];
	}
	
	if(document.getElementById("show_buttons").value !== "1")				document.getElementById("button_container").style.height				= "auto";
	if(document.getElementById("show_superbar").checked)					document.getElementById("superbar_container").style.height				= "auto";
	if(!document.getElementById("use_own_scroll_functions").checked)		document.getElementById("keyscroll_velocity_container").style.display	= "none";
	if(!document.getElementById("use_own_scroll_functions_mouse").checked)	document.getElementById("mousescroll_container").style.display			= "none";
	if(!document.getElementById("animate_scroll").checked)					document.getElementById("scroll_container").style.display				= "none";
	
	document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
	
	for(var i = 0; i < document.getElementsByClassName("slider_values").length; i++) // display slider values:
	{
		var which_value = document.getElementsByClassName("slider_values")[i].id.split(".")[1];
		var raw_value = (storage[which_value] ? storage[which_value] : document.getElementById(which_value).value);
		document.getElementsByClassName("slider_values")[i].innerHTML = (document.getElementById(which_value).dataset.defaultvalue ? Math.round(100*raw_value/document.getElementById(which_value).dataset.defaultvalue) : raw_value);
	}	
	
	add_page_handling(storage);
}

function add_page_handling(storage)
{
	/*################### use when Issue 247969 is fixed: ######################
	document.getElementById("save_set").addEventListener("focus",function(){
		if(this.innerHTML === chrome.i18n.getMessage("new_set_name")) this.innerHTML = "";
	},false);
	document.getElementById("save_set").addEventListener("blur",function(){
		if(this.innerHTML === "") this.innerHTML = chrome.i18n.getMessage("new_set_name");
	},false);*/
	
	document.getElementById("save_set_img").addEventListener("click", function(){ // save set:
		if(document.getElementById("save_set").innerHTML === "Default"){ alert(chrome.i18n.getMessage("default_change_impossible")); return; }
		
		for(var option = 0; option < document.getElementById("saved_sets").options.length; option++){
			if(document.getElementById("saved_sets").options[option].value === document.getElementById("save_set").innerHTML){
				var overwrite_confirmed = window.confirm(chrome.i18n.getMessage("confirm_overwrite"));
				if(!overwrite_confirmed) return;
				break;
			}
		}
		
		if(!storage.saved_sets) storage.saved_sets = {};
		storage.saved_sets[document.getElementById("save_set").innerHTML] = {};
		for(var setting in storage){
			if(setting === "saved_sets") continue;
			storage.saved_sets[document.getElementById("save_set").innerHTML][setting] = storage[setting];
		}
		
		chrome.storage.sync.set(storage);
		
		if(overwrite_confirmed) return; // don't add a new option if one gets overwritten
		document.getElementById("saved_sets").options[document.getElementById("saved_sets").options.length] =
			new Option(document.getElementById("save_set").innerHTML, document.getElementById("save_set").innerHTML);
	}, false);
	
	document.getElementById("delete_set_img").addEventListener("click", function(){ // delete set:
		if(document.getElementById("saved_sets").value === "Default"){
			alert(chrome.i18n.getMessage("default_delete_impossible"));
			return;
		}
		var delete_confirmed = window.confirm(chrome.i18n.getMessage("confirm_delete"));
		if (!delete_confirmed) return;
		
		delete storage.saved_sets[document.getElementById("saved_sets").value];
		chrome.storage.sync.set( {"saved_sets" : storage.saved_sets} );
		
		for(var i in document.getElementById("saved_sets").options){
			if(document.getElementById("saved_sets").options[i].value === document.getElementById("saved_sets").value)
			{
				document.getElementById("saved_sets").remove(i);
				break;
			}
		}
	}, false);
	
	document.getElementById("load_set_img").addEventListener("click", function(){ // load set
		chrome.extension.onMessage.addListener(function(msg){
			if(msg.data === "update_optionspage")
			{
				chrome.extension.onMessage.removeListener(arguments.callee);
				restoreprefs();
			}
		});
	
		if(storage.saved_sets) var sets = storage.saved_sets;
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
	}, false);
	
	document.getElementById("save_set").addEventListener("keydown", function(){ // Enter -> save configuration
		if(window.event.which === 13){
			window.event.preventDefault();
			window.event.target.blur();
			document.getElementById("save_set_img").click();
		}
	}, false);
	
	
	var info_bubbles = document.getElementsByClassName("i"); // info bubbles:
	
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
}

function localize()
{
	if(chrome.i18n.getMessage("lang") === "ar" || chrome.i18n.getMessage("lang") === "ur_PK") document.body.dir = "rtl";
	
	var strings = document.getElementsByClassName("i18n");
	for(var i = 0; i < strings.length; i++)
	{
		if(strings[i].tagName === "IMG")	strings[i].title = chrome.i18n.getMessage(strings[i].title); // tooltips
		else								strings[i].innerHTML += chrome.i18n.getMessage(strings[i].dataset.i18n);
	}
	
	//help:
	document.getElementById("help").addEventListener("click", function(){
		window.open("http://my.opera.com/christoph142/blog/2013/06/27/help");
	}, false);
	document.getElementById("close_help").addEventListener("click", function(e){
		e.stopPropagation();
		document.getElementById("help").style.display = "none";
	}, false);
}

var bubble_setback; // timeout for info bubbles