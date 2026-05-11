var localImages = [
	"images/cf19ea28.png",
	"images/f36afbad.png",
	"images/ibbebecf.png",
	"images/nbd947ae.png",
	"images/vc625f06.png",
	"images/w7dd68c8.png",
	"images/xf9dd2ad.png"
];
var useDate;
var downloadDone = false;
enyo.kind({
	name: "enyo.WebbTracker",
	kind: enyo.VFlexBox,
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "WebService", name:"localDataQuery", url: "spaceshipdata.json", onSuccess: "localDataResponse", onFailure: "localDataFail"},
		{kind: "PalmService", name: "wallpaperService", service: "palm://com.palm.systemservice/wallpaper", method: "importWallpaper", onSuccess: "wallpaperSuccess", onFailure: "wallpaperFailure", subscribe: true },
		{kind: "PalmService", name: "preferencesService", service: "palm://com.palm.systemservice", method: "setPreferences", onSuccess: "preferencesSuccess", onFailure: "preferencesFailure", subscribe: true },
		{kind: "Helpers.Updater", name: "myUpdater" },
		//UI Elements
		{kind: "PageHeader", components: [
			{kind: "VFlexBox", flex: 1, align: "center", components: [
				{content: "James Webb Telescope Tracker", domStyles: {"font-weight": "bold"}},
				//{content: "...", className: "enyo-item-secondary" }
			]},
		]},
		{name: "slidingPane", kind: "SlidingPane", flex: 1, onSelectView: "slidingSelected", components: [
			{name: "panelRooms", width: "350px", components: [
				{name: "headerRoom", kind: "Header", components: [
					{w: "fill", content:"Recent Details", domStyles: {"font-weight": "bold"}},
					//{kind: "Image", flex:1, name: "spinnerRoom", src: "images/spinner.gif", domStyles: {width: "20px"}},
				]},
				{kind: "Scroller", flex:1, domStyles: {"margin-top": "0px", "min-width": "130px"}, components: [
					{flex: 1, name: "list", kind: enyo.VirtualList, className: "list", onSetupRow: "listSetupRow", components: [
						{kind: "Item", className: "item", onclick:"selectNextView", components: [
							{kind: "HFlexBox", components: [
								{name: "itemCaption", flex: 2},
								/*{w: "fill", flex: 1, name: "itemValue", domStyles: {"text-align": "right"}}*/
							]},
						]}
					]},
				]},
				{kind: "Toolbar", components: [
					{kind: "GrabButton", onclick: "selectNextView"},
					{caption: "Update", onclick: "periodicUpdate"}
				]}
			]},
			{name: "panelImage", /*fixedWidth: true,*/ components: [
				{kind: "Scroller", flex:1, domStyles: {"margin-top": "0px", "min-width": "130px"}, components: [
					{kind: "VFlexBox", flex: 2, pack: "center", components: [
						{w: "fill", domStyles: {"text-align": "center"}, components: [
							{kind: "Image", flex:1, name: "DeploymentImage", src: "jwtelescope.png", domStyles: { width: "400px", "margin-left": "auto", "margin-right": "auto"}},
						]},
					]},
				]},
				{kind: "Toolbar", components: [
					{kind: "GrabButton"},
					{name: "btnWallpaper", disabled:true, caption: "Set Wallpaper", onclick: "setWallpaper"}
				]}
			]},
		]},
	],
	create: function() {
		this.inherited(arguments);
		var today = new Date();
		useDate = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
		enyo.log("using date: " + useDate);

		//Detect environment for appropriate service paths
        enyo.log("Window location is " + JSON.stringify(window.location));
        if(window.location.href.indexOf("file:///media/cryptofs") != -1) { // Running on LuneOS
            enyo.log("LuneOS environment detected");
        }
        else if (window.location.hostname.indexOf(".media.cryptofs.apps") != -1) {   // Running on webOS
            enyo.log("webOS environment detected");
        } else {    // Running in a web browser
			enyo.warn("webOS environment not detected, assuming a web server!");
        }
		//Get the data
		this.loadData();
		//Check for app updates
		this.$.myUpdater.CheckForUpdate("Webb Telescope Tracker");
		this.$.btnWallpaper.disabled = true;

	},
	pickRandomImage: function() {
		var idx = Math.floor(Math.random() * localImages.length);
		this.currentImgSrc = localImages[idx];
		this.$.DeploymentImage.setSrc(this.currentImgSrc);
		this.$.btnWallpaper.setDisabled(false);
		this.resizeImage();
	},
	listSetupRow: function(inSender, inIndex) {
		if (this.data) {
			var record = this.data[inIndex];
			if (record) {
				this.$.itemCaption.setContent(record.caption + ": " + record.value);
				//this.$.itemValue.setContent(record.value);
				return true;
			}
		}
	},
	loadData: function() {
		this.pickRandomImage();
		this.$.localDataQuery.call();
	},
	periodicUpdate: function() {
		this.pickRandomImage();
	},
	selectNextView: function () {
		var pane    = this.$.slidingPane;
		var viewIdx = pane.getViewIndex();
		if (viewIdx < pane.views.length - 1) {
			viewIdx = viewIdx + 1;
		} else {
			return;	// we've selected the last available view.
		}
		pane.selectViewByIndex(viewIdx);
	},
	localDataResponse: function(inSender, inResponse) {
		enyo.log("Parsing local data: " + JSON.stringify(inResponse));
		var flattenedData = [];
		for (var key in inResponse) {
			var label = key.replace(/\_/g, " ");
			if (key == "Time_Since_Launch") {
				var date1 = new Date("12/25/2021");
				var date2 = new Date();
				var days_difference = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
				inResponse[key] = Math.round(days_difference) + " Days";
			}
			if (key != "timestamp" && key != "image")
				flattenedData.push({ caption: label, value: inResponse[key] });
		}
		enyo.log("Formatted data: " + JSON.stringify(flattenedData));
		this.data = flattenedData;
		this.$.list.refresh();
	},
	localDataFail: function(inSender, inResponse) {
		enyo.error("Failed to load local data: " + JSON.stringify(inResponse));
	},
	windowRotated: function() {
		enyo.warn("window resized!");
		this.resizeImage();
	},
	resizeImage: function() {
		enyo.log("Updating UI...");
		deviceInfo = enyo.fetchDeviceInfo();
		
		var useWidth = screen.width - 350;
		enyo.warn("Window width is now: " + useWidth);
		enyo.log(JSON.stringify(deviceInfo));

		this.$.DeploymentImage.applyStyle("width", (useWidth * 0.8) + "px");
	},

	setWallpaper: function() {
		downloadDone = false;
		// Derive the absolute filesystem path from the app's location
		var base = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
		var imgPath = (base + this.currentImgSrc).replace(/^file:\/\//, "");
		enyo.log("trying to set wallpaper to: " + imgPath);
		this.$.wallpaperService.call({ target: imgPath });
	},
	wallpaperSuccess: function(sender, data) {
		enyo.log("Import wallpaper success: " + JSON.stringify(data));
		enyo.log("Setting as wallpaper...");
		this.$.preferencesService.call( {wallpaper: data.wallpaper });
	},
	wallpaperFailure: function(sender, data) {
		enyo.error("Import wallpaper failure: " + JSON.stringify(data));
	},
	preferencesSuccess: function(sender, data) {
		if (!downloadDone) {
			enyo.log("Set wallpaper success: " + JSON.stringify(data));
			enyo.windows.addBannerMessage("Wallpaper set!", "{}");
			downloadDone = true;
		}
	},
	preferencesFailure: function(sender, data) {
		enyo.error("Set wallpaper failure: " + JSON.stringify(data));
	}
});