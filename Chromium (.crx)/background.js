chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "sync") return;

	if (changes.saved_sets)
		recreate_contextmenus(changes.saved_sets.newValue);
});

async function handleMessage(request, sender, sendResponse)
{
	if (request.data === "get_zoom")
	{
		if (sender.tab) {
			chrome.tabs.getZoom(sender.tab.id, zoomFactor => 
				chrome.tabs.sendMessage(sender.tab.id, { "zoomFactor" : zoomFactor })
			);
		}
	}
	else if (request.data === "bookmarks")
	{
		//TODO
		custom_domains = {};
		if (!custom_domains.hasOwnProperty(request.domain)) { sendResponse([]); return; }

		let domain_props = custom_domains[request.domain];
		sendResponse(domain_props.hasOwnProperty("bookmarks") ? domain_props.bookmarks : []);
	}
	else if	(request.data === "show_contextmenu") 	show_contextmenu(request.string);
	else if	(request.data === "hide_contextmenu") 	hide_contextmenu();
}

chrome.runtime.onMessage.addListener(handleMessage);

chrome.tabs.onZoomChange.addListener( zoomInfo =>
	chrome.tabs.sendMessage(zoomInfo.tabId, { "zoomFactor" : zoomInfo.newZoomFactor })
);

chrome.runtime.onInstalled.addListener(create_contextmenus);
async function create_contextmenus() {
	chrome.storage.sync.get( { "saved_sets" : {} }, storage => recreate_contextmenus(storage.saved_sets));
}
async function recreate_contextmenus(saved_sets = {})
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

	chrome.contextMenus.create({ "id" : "ms_contextmenu_bookmark_create",
								 "title" : "CREATE BOOKMARK", //TODO: chrome.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_bookmark_edit",
								 "title" : "EDIT BOOKMARK", //TODO: chrome.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	chrome.contextMenus.create({ "id" : "ms_contextmenu_bookmark_delete",
								 "title" : "DELETE BOOKMARK", //TODO: chrome.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	}); // end of removeAll
}

chrome.contextMenus.onClicked.addListener(handle_contextmenu_click);
async function handle_contextmenu_click(info, tab) {
	if (info.menuItemId === "ms_contextmenu_customize_new_set")
	{
		chrome.runtime.openOptionsPage();
	}
	else if (info.menuItemId === "ms_contextmenu_enable" || info.menuItemId === "ms_contextmenu_customize_current_set")
	{
		chrome.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			delete custom_domains[get_domain(info.pageUrl)]["set"];
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
		});
	}
	else if (info.menuItemId.includes("ms_contextmenu_customize_set_"))
	{
		chrome.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			custom_domains[domain]["set"] = info.menuItemId.split("ms_contextmenu_customize_set_")[1];
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
		});
	}
	else if (info.menuItemId === "ms_contextmenu_disable")
	{
		chrome.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			custom_domains[domain]["set"] = false;
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
			chrome.tabs.create({ url : "options/options.html#disabled?" + get_domain(info.pageUrl) });
		});
	}
	else if (info.menuItemId === "ms_contextmenu_bookmark_create")
	{
		chrome.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			//TODO get current scroll pos from page
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			if (!custom_domains[domain].hasOwnProperty("bookmarks")) custom_domains[domain]["bookmarks"] = [];
			
			let new_bookmark = {"text": "TEST", "pos": Math.random()*100};
			custom_domains[domain]["bookmarks"].push(new_bookmark);
			chrome.storage.sync.set( { "custom_domains" : custom_domains });
			
			console.log("New bookmark at " + domain + " (pos = " + new_bookmark.pos);
		});
	}
	else if (info.menuItemId === "ms_contextmenu_bookmark_edit" || info.menuItemId === "ms_contextmenu_bookmark_delete")
	{
		console.log(info.menuItemId + " at " + get_domain(info.pageUrl)); //TODO
	}
	else
	{
		chrome.tabs.sendMessage(tab.id, { "data" : "ms_toggle_visibility" });
	}
}

async function add_contextmenu_set(set)
{
	recreate_contextmenus(); // need to recreate because API doesn't let you insert items in between
}

async function remove_contextmenu_set(set)
{
	chrome.contextMenus.remove("ms_contextmenu_customize_set_" + set);
}

async function show_contextmenu(s)
{
	chrome.contextMenus.update("ms_contextmenu_enable", {"visible" : s === "enable"});
	chrome.contextMenus.update("ms_contextmenu_show", {"visible" : s === "show"});
	chrome.contextMenus.update("ms_contextmenu_hide", {"visible" : s === "hide"});
	chrome.contextMenus.update("ms_contextmenu_customize", {"visible" : s === "hide"});
}

async function hide_contextmenu()
{
	chrome.contextMenus.update("ms_contextmenu_enable", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_show", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_hide", {"visible" : false});
	chrome.contextMenus.update("ms_contextmenu_customize", {"visible" : false});
}

function get_domain(url) {
	return url.split("?")[0].split("#")[0].split("/")[2];
}

//check dialogs on startup and show if appropriate
chrome.storage.sync.get({last_dialog_time: 0, dialogs_shown: {}}, s => {
	console.log("last_dialog_time: " + s.last_dialog_time);
	if (s.last_dialog_time === 0) {
		chrome.tabs.create({ url : "options/options.html#welcome" }); // First run -> Show welcome page
	}
	else {
		const first_dialog_time = Object.keys(s.dialogs_shown)[0];
		console.log("First dialog ever shown " + (Date.now() - first_dialog_time)/1000/60/60/24 + " days ago");
		console.log("Last dialog has been shown " + (Date.now() - s.last_dialog_time)/1000/60/60/24 + " days ago");

		if (Date.now() - first_dialog_time > 1000 * 60 * 60 * 24 * 30 && // 30 days after installation (once)
			!Object.values(s.dialogs_shown).includes("#hello_again"))
			chrome.tabs.create({ url : "options/options.html#hello_again" });
		else if (Date.now() - s.last_dialog_time > 1000 * 60 * 60 * 24 * 7 * 6) // 6 weeks after last dialog (recurring)
			chrome.tabs.create({ url : "options/options.html#thanks_for_using" });
	}
});
