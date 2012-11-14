// save preferences:
window.addEventListener("change",function(event){
	
	if(event.target.type == "checkbox") widget.preferences[event.target.id] = event.target.checked?1:0;
	else 								widget.preferences[event.target.id] = event.target.value;
	
	if(event.target.id == "border_color") widget.preferences.border_color_rgba = "rgba("+parseInt(event.target.value.substring(1,3),16)+","+parseInt(event.target.value.substring(3,5),16)+","+parseInt(event.target.value.substring(5,7),16)+",0.7)";
	
	if(event.target.id == "size" || event.target.id == "hover_size"){
		document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
		if(document.getElementById("border_radius").value > document.getElementById("border_radius").max){
			document.getElementById("border_radius").value = document.getElementById("border_radius").max;
			widget.preferences.border_radius = document.getElementById("border_radius").max;
		}
	}
	
	if(event.target.id == "contextmenu_show_when") opera.extension.postMessage("contextmenu_show_when_update");
	else opera.extension.postMessage("update");
	
},false);

window.addEventListener("mousedown",function(){
	if(event.target.id == "MS_upbutton" || event.target.id == "MS_downbutton"){
		window.onmouseup = function(){
			widget.preferences.buttonposition = 100*document.getElementById("MS_downbutton").offsetLeft/window.innerWidth;
			opera.extension.postMessage("update");
			window.onmouseup = null;
		}
	}
},false);

// restore preferences:
function getprefs(){
	var inputs = document.getElementsByTagName("input");
	var selects = document.getElementsByTagName("select");
	
	for(i=0; i<inputs.length; i++){
		if(inputs[i].type=="checkbox")	document.getElementsByTagName("input")[i].checked = widget.preferences[inputs[i].id]=="0"?0:1;
		else							document.getElementsByTagName("input")[i].value = widget.preferences[inputs[i].id];
	}
	for(i=0; i<selects.length; i++){ document.getElementsByTagName("select")[i].value = widget.preferences[selects[i].id]; }
	
	document.getElementById("border_radius").max = Math.round(Math.max(document.getElementById("size").value, document.getElementById("hover_size").value)/2);
}