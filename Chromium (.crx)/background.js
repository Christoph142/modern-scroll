// remove when Chrome min version is 148 and switch to Promises
// see https://developer.chrome.com/docs/extensions/develop/concepts/browser-namespace
// and https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
if (!globalThis.browser) globalThis.browser = chrome;

browser.storage.onChanged.addListener((changes, area) => {
	if (area !== "sync") return;

	if (changes.saved_sets)
		recreate_contextmenus(changes.saved_sets.newValue);
});

async function handleMessage(request, sender, sendResponse)
{
	if (request.data === "get_zoom")
	{
		if (sender.tab) {
			browser.tabs.getZoom(sender.tab.id, zoomFactor => 
				browser.tabs.sendMessage(sender.tab.id, { "zoomFactor" : zoomFactor })
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

browser.runtime.onMessage.addListener(handleMessage);

browser.tabs.onZoomChange.addListener( zoomInfo =>
	browser.tabs.sendMessage(zoomInfo.tabId, { "zoomFactor" : zoomInfo.newZoomFactor })
			   .catch(e => {/*ignore; happens when injected script doesn't listen, e.g. old script after update*/})
);

browser.runtime.onInstalled.addListener(create_contextmenus);
async function create_contextmenus() {
	browser.storage.sync.get( { "saved_sets" : {} }, storage => recreate_contextmenus(storage.saved_sets));
}
async function recreate_contextmenus(saved_sets = {})
{
	browser.contextMenus.removeAll(() => {

	browser.contextMenus.create({ "id" : "ms_contextmenu_enable",
								 "title" : browser.i18n.getMessage("contextmenu_enable"),
								 "contexts" : ["all"],
								 "visible" : false});
	browser.contextMenus.create({ "id" : "ms_contextmenu_show",
								 "title" : browser.i18n.getMessage("contextmenu_show"),
								 "contexts" : ["all"],
								 "visible" : false});
	browser.contextMenus.create({ "id" : "ms_contextmenu_hide",
								 "title" : browser.i18n.getMessage("contextmenu_hide"),
								 "contexts" : ["all"],
								 "visible" : false});
	browser.contextMenus.create({ "id" : "ms_contextmenu_customize",
								 "title" : browser.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	
	//customization submenu items:
	browser.contextMenus.create({ "id" : "ms_contextmenu_customize_current_set",
								 "parentId" : "ms_contextmenu_customize",
								 //"type" : "radio",
								 "title" : browser.i18n.getMessage("contextmenu_customize_current_set"),
								 "contexts" : ["all"],
								 "visible" : true});
	browser.contextMenus.create({ "id" : "ms_contextmenu_disable",
								 "parentId" : "ms_contextmenu_customize",
								 //"type" : "radio",
								 "title" : browser.i18n.getMessage("contextmenu_disable"),
								 "contexts" : ["all"],
								 "visible" : true});
	browser.contextMenus.create({ "id" : "ms_contextmenu_customize_separator_list_begin",
								 "parentId" : "ms_contextmenu_customize",
								 "type" : "separator",
								 "contexts" : ["all"],
								 "visible" : true});
	for (const set in saved_sets) {
		browser.contextMenus.create({ "id" : "ms_contextmenu_customize_set_" + set,
									 "parentId" : "ms_contextmenu_customize",
								 	 //"type" : "radio",
									 "title" : set,
									 "contexts" : ["all"],
									 "visible" : true});
	}
	browser.contextMenus.create({ "id" : "ms_contextmenu_customize_separator_list_end",
								 "parentId" : "ms_contextmenu_customize",
								 "type" : "separator",
								 "contexts" : ["all"],
								 "visible" : true});
	browser.contextMenus.create({ "id" : "ms_contextmenu_customize_new_set",
								 "parentId" : "ms_contextmenu_customize",
								 "title" : browser.i18n.getMessage("contextmenu_new_set"),
								 "contexts" : ["all"],
								 "visible" : true});

	browser.contextMenus.create({ "id" : "ms_contextmenu_bookmark_create",
								 "title" : "CREATE BOOKMARK", //TODO: browser.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	browser.contextMenus.create({ "id" : "ms_contextmenu_bookmark_edit",
								 "title" : "EDIT BOOKMARK", //TODO: browser.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	browser.contextMenus.create({ "id" : "ms_contextmenu_bookmark_delete",
								 "title" : "DELETE BOOKMARK", //TODO: browser.i18n.getMessage("contextmenu_customize"),
								 "contexts" : ["all"],
								 "visible" : false});
	}); // end of removeAll
}

browser.contextMenus.onClicked.addListener(handle_contextmenu_click);
async function handle_contextmenu_click(info, tab) {
	if (info.menuItemId === "ms_contextmenu_customize_new_set")
	{
		browser.runtime.openOptionsPage();
	}
	else if (info.menuItemId === "ms_contextmenu_enable" || info.menuItemId === "ms_contextmenu_customize_current_set")
	{
		enable_on_domain(get_domain(info.pageUrl));
	}
	else if (info.menuItemId.includes("ms_contextmenu_customize_set_"))
	{
		browser.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			custom_domains[domain]["set"] = info.menuItemId.split("ms_contextmenu_customize_set_")[1];
			browser.storage.sync.set( { "custom_domains" : custom_domains });
		});
	}
	else if (info.menuItemId === "ms_contextmenu_disable")
	{
		disable_on_domain(get_domain(info.pageUrl));
	}
	else if (info.menuItemId === "ms_contextmenu_bookmark_create")
	{
		browser.storage.sync.get( { "custom_domains" : {} }, storage => {
			let custom_domains = storage.custom_domains;
			//TODO get current scroll pos from page
			let domain = get_domain(info.pageUrl);
			if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
			if (!custom_domains[domain].hasOwnProperty("bookmarks")) custom_domains[domain]["bookmarks"] = [];
			
			let new_bookmark = {"text": "TEST", "pos": Math.random()*100};
			custom_domains[domain]["bookmarks"].push(new_bookmark);
			browser.storage.sync.set( { "custom_domains" : custom_domains });
			
			console.log("New bookmark at " + domain + " (pos = " + new_bookmark.pos);
		});
	}
	else if (info.menuItemId === "ms_contextmenu_bookmark_edit" || info.menuItemId === "ms_contextmenu_bookmark_delete")
	{
		console.log(info.menuItemId + " at " + get_domain(info.pageUrl)); //TODO
	}
	else
	{
		browser.tabs.sendMessage(tab.id, { "data" : "ms_toggle_visibility" });
	}
}

async function add_contextmenu_set(set)
{
	recreate_contextmenus(); // need to recreate because API doesn't let you insert items in between
}

async function remove_contextmenu_set(set)
{
	browser.contextMenus.remove("ms_contextmenu_customize_set_" + set);
}

async function show_contextmenu(s)
{
	browser.contextMenus.update("ms_contextmenu_enable", {"visible" : s === "enable"});
	browser.contextMenus.update("ms_contextmenu_show", {"visible" : s === "show"});
	browser.contextMenus.update("ms_contextmenu_hide", {"visible" : s === "hide"});
	browser.contextMenus.update("ms_contextmenu_customize", {"visible" : s === "hide"});
}

async function hide_contextmenu()
{
	browser.contextMenus.update("ms_contextmenu_enable", {"visible" : false});
	browser.contextMenus.update("ms_contextmenu_show", {"visible" : false});
	browser.contextMenus.update("ms_contextmenu_hide", {"visible" : false});
	browser.contextMenus.update("ms_contextmenu_customize", {"visible" : false});
}

function get_domain(url) {
	return new URL(url).host;
}

async function enable_on_domain(domain) {
	browser.storage.sync.get( { "custom_domains" : {} }, storage => {
		let custom_domains = storage.custom_domains;
		delete custom_domains[domain]["set"];
		browser.storage.sync.set({ "custom_domains" : custom_domains });
	});
}

async function disable_on_domain(domain) {
	browser.storage.sync.get( { "custom_domains" : {} }, storage => {
		let custom_domains = storage.custom_domains;
		if (!custom_domains.hasOwnProperty(domain)) custom_domains[domain] = {};
		custom_domains[domain]["set"] = false;
		browser.storage.sync.set({ "custom_domains" : custom_domains });
		browser.tabs.create({ url : "options/options.html?domain=" + domain + "#disabled" });
	});
}

//check dialogs on startup and show if appropriate
browser.storage.sync.get({last_dialog_time: 0, dialogs_shown: {}}, s => {
	if (s.last_dialog_time === 0) {
		browser.tabs.create({ url : "options/options.html#welcome" }); // First run -> Show welcome page
	}
	else {
		const first_dialog_time = Object.keys(s.dialogs_shown)[0];

		if (Date.now() - first_dialog_time > 1000 * 60 * 60 * 24 * 30 && // 30 days after installation (once)
			!Object.values(s.dialogs_shown).includes("hello_again"))
			browser.tabs.create({ url : "options/options.html#hello_again" });
		else if (Date.now() - s.last_dialog_time > 1000 * 60 * 60 * 24 * 7 * 26) // 6 months after last dialog (recurring)
			browser.tabs.create({ url : "options/options.html#thanks_for_using" });
	}
});
