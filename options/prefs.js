// save preferences:
window.addEventListener("change", function(e)
{
	if(e.target.id === "save_set" || e.target.id === "saved_sets") return; // handled via onclick funtions
	
	if(e.target.type === "checkbox") widget.preferences[e.target.id] = e.target.checked?1:0;
	else 							 widget.preferences[e.target.id] = e.target.value;
	
	if(e.target.id === "border_color") widget.preferences.border_color_rgba = "rgba("+parseInt(e.target.value.substring(1,3),16)+","+parseInt(e.target.value.substring(3,5),16)+","+parseInt(e.target.value.substring(5,7),16)+",0.7)";
	
	if(e.target.id === "size" || e.target.id === "hover_size"){
		document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
		if(document.getElementById("border_radius").value > document.getElementById("border_radius").max){
			document.getElementById("border_radius").value = document.getElementById("border_radius").max;
			widget.preferences.border_radius = document.getElementById("border_radius").max;
		}
	}
	
	if(e.target.id === "contextmenu_show_when") opera.extension.bgProcess.update_contextmenu_show_when();
	else										queue_update();
	
},false);

window.addEventListener("mouseup", save_buttonposition, false);
function save_buttonposition(){
	if(document.getElementsByClassName("dragged_button")[0]){
		widget.preferences.buttonposition = 100 * document.getElementsByClassName("dragged_button")[0].offsetLeft / window.innerWidth;
		queue_update();
	}
}

function queue_update()
{
	opera.extension.postMessage("update_optionspage");
	return; // REST NOT NEEDED IF IT GETS INSERTED ON TAB SELECTION ANYWAY
	window.removeEventListener("blur", distribute_update, false);
	window.addEventListener("blur", distribute_update, false);
}
function distribute_update()
{
	window.removeEventListener("blur", distribute_update, false);
	opera.extension.bgProcess.distribute_update();
}

// restore preferences:
function getprefs()
{
	if(widget.preferences.show_buttons === "1") widget.preferences.show_buttons = 4; // changed from 0, 1 into 0, 2(fullscreen), 4
	
	if(!widget.preferences.saved_sets){ // save default configuration if it's missing:
		var default_set = {"Default":{}};
		for(var setting in widget.preferences){
			if(setting !== "length") default_set["Default"][setting] = widget.preferences[setting];
		}
		widget.preferences.saved_sets = JSON.stringify(default_set);
	}
	else{ // check if new options were added in an update and add those to the default set:
		var saved_sets = JSON.parse(widget.preferences.saved_sets);
		for(var setting in widget.preferences){
			if(setting !== "saved_sets" && setting !== "length" && !saved_sets["Default"][setting])
				saved_sets["Default"][setting] = widget.preferences[setting];
		}
		widget.preferences.saved_sets = JSON.stringify(saved_sets);
	}
	
	document.getElementById("save_set").innerHTML = strings["new set name"];
	document.getElementById("save_set").addEventListener("blur",function(){
		if(this.innerHTML === "") this.innerHTML = strings['new set name'];
	},false);
	document.getElementById("save_set").addEventListener("focus",function(){
		if(this.innerHTML === strings["new set name"]) this.innerHTML = "";
	},false);
	
	var inputs = document.getElementsByTagName("input");
	var selects = document.getElementsByTagName("select");
	
	for(var i=0; i<inputs.length; i++){
		if(inputs[i].type==="checkbox")	document.getElementsByTagName("input")[i].checked = widget.preferences[inputs[i].id]==="0"?0:1;
		else							document.getElementsByTagName("input")[i].value = widget.preferences[inputs[i].id];
	}
	for(var i=0; i<selects.length; i++){
		if(selects[i].id === "saved_sets"){
			if(selects[i].options.length < 2){
				for(var option in JSON.parse(widget.preferences.saved_sets)){
					if(option !== "Default") selects[i].options[selects[i].options.length] = new Option(option, option); // Option(name, value)
				}
			}
			else continue;
		}
		else document.getElementsByTagName("select")[i].value = widget.preferences[selects[i].id];
	}
	
	if(document.getElementById("show_buttons").value !== "0") document.getElementById("button_container").style.height = "auto";
	if(!document.getElementById("show_superbar").checked) document.getElementById("superbar_container").style.height = "0px";
	if(!document.getElementById("use_own_scroll_functions").checked)
		document.getElementById("keyscroll_velocity_container").style.display="none";
	if(!document.getElementById("use_own_scroll_functions_mouse").checked)
		document.getElementById("mousescroll_container").style.display="none";
	if(!document.getElementById('animate_scroll').checked) document.getElementById('scroll_container').style.display = "none";
	
	document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
	
	for(var i=0; i<document.getElementsByClassName("i").length; i++){ // information boxes:
		document.getElementsByClassName("i")[i].addEventListener("mouseover", function(){
			window.clearTimeout(timeout);
			document.getElementById(this.id+"_text").style.display = "inline";
			document.getElementById(this.id+"_text").style.opacity = "1";
		}, false);
		document.getElementsByClassName("i")[i].addEventListener("mouseout", function(){
			document.getElementById(this.id+"_text").style.opacity = "0";
			timeout = window.setTimeout("document.getElementById('"+this.id+"_text').style.display = 'none';", 200);
		}, false);
	}
	
	// save, restore & delete configurations:
	
	document.getElementById("save_set_img").onclick = function(){
		if(document.getElementById("save_set").innerHTML === "Default"){
			alert(strings["default change impossible"]);
			return;
		}
		
		for(var option = 0; option < document.getElementById("saved_sets").options.length; option++){
			if(document.getElementById("saved_sets").options[option].value === document.getElementById("save_set").innerHTML){
				var overwrite_confirmed = window.confirm(strings["confirm overwrite"]);
				if(!overwrite_confirmed) return;
				break;
			}
		}
		
		var sets = JSON.parse(widget.preferences.saved_sets);
		sets[document.getElementById("save_set").innerHTML] = {};
		for(var setting in widget.preferences){
			if(setting === "saved_sets") break;
			sets[document.getElementById("save_set").innerHTML][setting] = widget.preferences[setting];
		}
		widget.preferences.saved_sets = JSON.stringify(sets);
		
		if(overwrite_confirmed) return; // don't add a new option if one gets overwritten
		document.getElementById("saved_sets").options[document.getElementById("saved_sets").options.length] =
			new Option(document.getElementById("save_set").innerHTML, document.getElementById("save_set").innerHTML);
	}
	
	document.getElementById("delete_set_img").onclick = function(){
		if(document.getElementById("saved_sets").value === "Default"){
			alert(strings["default delete impossible"]);
			return;
		}
		var delete_confirmed = window.confirm(strings["confirm delete"]);
		if (!delete_confirmed) return;
		
		var sets = JSON.parse(widget.preferences.saved_sets);
		delete sets[document.getElementById("saved_sets").value];
		widget.preferences.saved_sets = JSON.stringify(sets);
		
		for(var i in document.getElementById("saved_sets").options){
			if(document.getElementById("saved_sets").options[i].value === document.getElementById("saved_sets").value)
				document.getElementById("saved_sets").remove(i);
		}
	}
	
	document.getElementById("load_set_img").onclick = function(){
		var sets = JSON.parse(widget.preferences.saved_sets);
		for(var setting in sets[document.getElementById("saved_sets").value]){
			widget.preferences[setting] = sets[document.getElementById("saved_sets").value][setting];
		}
		queue_update();
		getprefs();
	}
	
	document.getElementById("save_set").addEventListener("keydown", function(){ // Enter: save configuration
		if(window.event.which === 13){
			window.event.preventDefault();
			window.event.target.blur();
			document.getElementById("save_set_img").click();
		}
	}, false);
	
	var info_bubbles = document.getElementsByClassName("i");
	var bubble_setback;
	for(var i=0; i<info_bubbles.length; i++)
	{
		info_bubbles[i].addEventListener("mouseover", function(){
			window.clearTimeout(bubble_setback);
			if(this.offsetTop>window.scrollY+window.innerHeight/2) this.lastChild.style.marginTop = -this.lastChild.offsetHeight+"px";
		}, false);
		info_bubbles[i].addEventListener("mouseout", function(){
			bubble_setback = window.setTimeout(function(){this.lastChild.style.marginTop= null;}.bind(this),500);
		}, false);
	}
}

var timeout;