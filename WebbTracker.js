var shareServiceUrl = "http://share.webosarchive.org/get-shares.php?username=jameswebb";
var useDate;
var downloadDone = false;
enyo.kind({
	name: "enyo.WebbTracker",
	kind: enyo.VFlexBox,
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "WebService", name:"shareServiceQuery", url: shareServiceUrl, 
			headers: { 
				"client-id": window.atob(appKeys.clientId),
				"credential":  window.atob(appKeys.clientCreds)
			}, 
			onSuccess: "queryResponse", 
			onFailure: "queryFail"
		},
		{kind: "PalmService", name: "downloadService", service: "palm://com.palm.downloadmanager/", method: "download", onSuccess: "downloadSuccess", onFailure: "downloadFailure", subscribe: true },
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
								{w: "fill", flex: 1, name: "itemValue", domStyles: {"text-align": "right"}}
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
		{
            kind: "Popup",
            name: "deadappPopup",
            lazy: false,
            layoutKind: "VFlexLayout",
            style: "width: 80%;height:240px",
            components: [
                { content: "<b>James Webb is in position!</b>" },
                {
                    kind: "BasicScroller",
                    flex: 1,
                    components: [
                        { name: "deadappMessage", kind: "HtmlContent", flex: 1, pack: "center", align: "left", style: "text-align: left;padding-top:10px;padding-bottom: 10px" }
                    ]
                },
                {
                    layoutKind: "HFlexLayout",
                    pack: "center",
                    components: [
                        { kind: "Button", caption: "OK", onclick: "closePopup" },
                    ]
                }
            ]
        },
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
	listSetupRow: function(inSender, inIndex) {
		if (this.data) {
			var record = this.data[inIndex];
			if (record) {
				this.$.itemCaption.setContent(record.caption);
				this.$.itemValue.setContent(record.value);
				return true;
			}
		}
	},
	closePopup: function(inSender) {
		this.$.deadappPopup.close();
	},
	loadData: function(inSender) {
		this.$.shareServiceQuery.call();
	},
	periodicUpdate: function(inSender) {
		message = "Now that the telescope is in position, the API this app was using has gone offline. In its place, and until I find a replacement, I'm doing periodic manual updates (roughly weekly). As a result, this Update button currently does nothing. Launch the app another time to see if there's a new image or details.";
		this.$.deadappMessage.setContent(message);
		this.$.deadappPopup.openAtCenter();
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
	queryResponse: function(inSender, inResponse) {
		var shareList = inResponse;
		var imgUrl;
		enyo.log("Parsing raw data: " + JSON.stringify(shareList));
		flattenedData = [];
		for (var key in shareList.shares) {
			enyo.log(shareList.shares[key]);
			if (shareList.shares[key].contenttype && shareList.shares[key].contenttype == "application/json")
				this.data = shareList.shares[key].content;
			if (!imgUrl && shareList.shares[key].contenttype.indexOf("image/png") != -1)
				imgUrl = shareList.shares[key].content;
		}
		for (var key in this.data) {
			var label = key.replace(/\_/g, " ");
			if (key == "Time_Since_Launch") {
				date1 = new Date("12/25/2021");  
				date2 = new Date(); 
				var time_difference = date2.getTime() - date1.getTime();  
				var days_difference = time_difference / (1000 * 60 * 60 * 24);  
				this.data[key] = Math.round(days_difference) + " Days";
			}
			if (key != "timestamp" && key != "image")
				flattenedData.push({ caption: label, value: this.data[key] });
		}
		enyo.log("Formatted data: " + JSON.stringify(flattenedData));
		this.data = flattenedData;
		this.$.list.refresh();

		this.$.DeploymentImage.setSrc(imgUrl);
		window.setTimeout(function() { 
			this.$.btnWallpaper.setDisabled(false);
		}.bind(this), 3000);
		this.resizeImage();
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
		var useImg = this.$.DeploymentImage.src.replace("i.php?", "image.php?");
		enyo.log("trying to set wallpaper to: " + this.$.DeploymentImage.src);
		this.$.downloadService.call({ target: this.$.DeploymentImage.src, targetFilename: "jameswebb-wallpaper-" + useDate + ".png" });
	},

	//Service calls related to getting and setting wallpaper
	downloadSuccess: function(sender, data) {
		if (data.completed && data.completed == true) {
			enyo.log("Download wallpaper success: " + JSON.stringify(data));
			enyo.log("Importing as wallpaper...");
			this.$.wallpaperService.call( {target: "/media/internal/downloads/jameswebb-wallpaper-" + useDate + ".png" } );
		}
	},
	downloadFailure: function(sender, data) {
		enyo.error("Download wallpaper failure: " + JSON.stringify(data));
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