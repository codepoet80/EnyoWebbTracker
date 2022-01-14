var useUrl = "https://api.jwst-hub.com/track";
enyo.kind({
	name: "enyo.WebbTracker",
	kind: enyo.VFlexBox,
	components: [
		{kind: "WebService", name:"wsQuery", url: useUrl, onSuccess: "queryResponse", onFailure: "queryFail"},
		{kind: "Helpers.Updater", name: "myUpdater" },
		//UI Elements
		{kind: "PageHeader", components: [
			{kind: "VFlexBox", flex: 1, align: "center", components: [
				{content: "James Webb Telescope Tracker"},
				//{content: "...", className: "enyo-item-secondary" }
			]}
		]},
		{kind: "Control", flex:1, layoutKind: "VFlexLayout", pack: "center", align: "middle", components: [
			{kind: "HFlexBox", flex: 1, components: [
				{kind: "Scroller", flex:1, domStyles: {"margin-top": "0px", "min-width": "130px"}, components: [
					{flex: 1, name: "list", kind: enyo.VirtualList, className: "list", onSetupRow: "listSetupRow", components: [
							{kind: "Item", className: "item", components: [
								{kind: "HFlexBox", components: [
									{name: "itemCaption", flex: 2},
									{w: "fill", flex: 1, name: "itemValue", domStyles: {"text-align": "right"}}
								]},
						]}
					]},
				]},
				{kind: "VFlexBox", flex: 2, pack: "center", components: [
					{w: "fill", domStyles: {"text-align": "center"}, components: [
						{kind: "Image", flex:1, name: "DeploymentImage", src: "jwtelescope.png", domStyles: {width: "400px", "margin-left": "auto", "margin-right": "auto"}},
					]},
					{w: "fill", name: "DeploymentDetail", content: "Current Deployment Stage: ", domStyles: {"text-align": "center", "margin-left": "100px", "margin-right": "100px"}}
				]},
			]},
			{kind: "Button", caption: "Update", onclick: "loadData"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		//Detect environment for appropriate service paths
		enyo.log("Starting up on " + window.location.hostname);
		if (window.location.hostname != ".media.cryptofs.apps.usr.palm.applications.com.jonandnic.enyo.webbtracker") {
			enyo.warn("webOS environment not detected, assuming a web server!");
			useUrl = "localproxy.php?" + useUrl;			
		}
		//Setup the data list
		this.data = [];
		this.captions.forEach(function(currVal, index) {
			this.data.push({caption: currVal, value: "" + this.units[index]});
		}.bind(this));
		//Get the data
		this.loadData();
		//Check for app updates
		this.$.myUpdater.CheckForUpdate("Webb Telescope Tracker");
	},
	listSetupRow: function(inSender, inIndex) {
		var record = this.data[inIndex];
		if (record) {
			this.$.itemCaption.setContent(record.caption);
			this.$.itemValue.setContent(record.value);
			return true;
		}
	},
	loadData: function(inSender) {
		enyo.warn("Querying data source at: " + useUrl);
		this.$.wsQuery.setUrl(useUrl);
		this.$.wsQuery.call();
	},
	queryResponse: function(inSender, inResponse) {
		this.data = inResponse;
		console.log("Parsing raw data: " + JSON.stringify(this.data));
		flattenedData = [
			{ caption: this.captions[0], value: this.data.distanceEarthKm + this.units[0] },
			{ caption: this.captions[1], value: this.data.launchElapsedTime + this.units[1]},
			{ caption: this.captions[2], value: this.data.distanceL2Km + this.units[2]},
			{ caption: this.captions[3], value: this.data.percentageCompleted + this.units[3]},
			{ caption: this.captions[4], value: this.data.speedKmS + this.units[4]},
			{ caption: this.captions[5], value: this.data.tempC.tempWarmSide1C + this.units[5]},
			{ caption: this.captions[6], value: this.data.tempC.tempWarmSide2C + this.units[6]},
			{ caption: this.captions[7], value: this.data.tempC.tempCoolSide1C + this.units[7]},
			{ caption: this.captions[8], value: this.data.tempC.tempCoolSide2C + this.units[8]}
		];
		console.log("Formatted data: " + JSON.stringify(flattenedData));
		enyo.warn("Updating UI...");
		this.$.DeploymentDetail.setContent(this.data.currentDeploymentStep);
		this.$.DeploymentImage.setSrc(this.data.deploymentImgURL)
		this.data = flattenedData;
		this.$.list.refresh();
	},
	captions: [
		"Distance From Earth",
		"Time Since Launch",
		"Distance to L2",
		"Distance Completed",
		"Cruising Speed",
		"Sunshield Avg Temp",
		"Equipment Panel Temp",
		"Mirror Temp",
		"Instrument Radiator Temp",
	],
	units: [
		" km",
		"",
		"",
		"%",
		" km/s",
		" °C",
		" °C",
		" °C",
		" °C"
	]
});