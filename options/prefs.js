// save preferences:
window.addEventListener("change",function(event){
	
	if(event.target.type == "checkbox") widget.preferences[event.target.id] = event.target.checked?1:0;
	else 								widget.preferences[event.target.id] = event.target.value;
	
	// show demo ################
	
	opera.extension.postMessage("update");
	
},false);

// restore preferences:
function getprefs(){
	var inputs = document.getElementsByTagName("input");
	var selects = document.getElementsByTagName("select");
	var textareas = document.getElementsByTagName("textarea");
	
	for(i=0; i<inputs.length; i++){
		if(inputs[i].type=="checkbox")	document.getElementsByTagName("input")[i].checked = widget.preferences[inputs[i].id]=="0"?0:1;
		else							document.getElementsByTagName("input")[i].value = widget.preferences[inputs[i].id];
	}
	for(i=0; i<selects.length; i++){ document.getElementsByTagName("select")[i].value = widget.preferences[selects[i].id]; }
	for(i=0; i<textareas.length; i++){ document.getElementsByTagName("textarea")[i].value = widget.preferences[textareas[i].id]; }
}