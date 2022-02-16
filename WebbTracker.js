var useUrl = "http://www.webosarchive.com/jameswebb/weekly.json";
enyo.kind({
	name: "enyo.WebbTracker",
	kind: enyo.VFlexBox,
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "WebService", name:"wsQuery", url: useUrl, onSuccess: "queryResponse", onFailure: "queryFail"},
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
		
		//Detect environment for appropriate service paths
        enyo.log("Window location is " + JSON.stringify(window.location));
        if(window.location.href.indexOf("file:///media/cryptofs") != -1) { // Running on LuneOS
            enyo.log("LuneOS environment detected");
        }
        else if (window.location.hostname.indexOf(".media.cryptofs.apps") != -1) {   // Running on webOS
            enyo.log("webOS environment detected");
        } else {    // Running in a web browser
			enyo.warn("webOS environment not detected, assuming a web server!");
			useUrl = "localproxy.php?" + useUrl;			
        }
		//Get the data
		this.loadData();
		//Check for app updates
		this.$.myUpdater.CheckForUpdate("Webb Telescope Tracker");

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
		enyo.warn("Querying data source at: " + useUrl);
		this.$.wsQuery.setUrl(useUrl);
		this.$.wsQuery.call();
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
		this.data = inResponse;
		console.log("Parsing raw data: " + JSON.stringify(this.data));
		flattenedData = [];
		var pos = 0;
		for (var key in this.data) {
			//alert("value " + this.data[key] + " is label " + key); // "User john is #234"
			var label = key.replace(/\_/g, " ");
			if (key != "timestamp" && key != "image")
				flattenedData.push({ caption: label, value: this.data[key] });
			pos++;
		}
		console.log("Formatted data: " + JSON.stringify(flattenedData));
		enyo.warn("Updating UI...");
		imgUrl = useUrl.replace("weekly.json","") + this.data.image;
		deviceInfo = enyo.fetchDeviceInfo();
		
		var useWidth = screen.width - 350;
		enyo.warn("Window width is: " + useWidth);
		enyo.log(JSON.stringify(deviceInfo));

		this.$.DeploymentImage.applyStyle("width", (useWidth * 0.8) + "px");
		this.$.DeploymentImage.setSrc(imgUrl);
		this.data = flattenedData;
		this.$.list.refresh();
	},
	windowRotated: function() {
		enyo.error("window resized!");
		enyo.windows.addBannerMessage("Detecting rotation...", "{}");
	}
});