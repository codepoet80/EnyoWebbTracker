enyo.kind({
	name: "enyo.WebbTracker",
	kind: enyo.VFlexBox,
	components: [
		{kind: "WebService", url: "https://api.jwst-hub.com/track", onSuccess: "queryResponse", onFailure: "queryFail"},
		{kind: "PageHeader", components: [
			{kind: "VFlexBox", flex: 1, align: "center", components: [
				{content: "James Webb Telescope Tracker"},
				//{content: "...", className: "enyo-item-secondary" }
			]}
		]},
		{kind: "Control", flex:1, layoutKind: "VFlexLayout", pack: "center", align: "middle", components: [
			{kind: "HFlexBox", flex: 1, components: [
				{kind: "Scroller", flex:1, domStyles: {"margin-top": "0px"}, components: [
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
						{kind: "Image", flex:1, name: "DeploymentImage", src: "jwtelescope.png", domStyles: {width: "500px", "margin-left": "auto", "margin-right": "auto"}},
					]},
					{w: "fill", name: "DeploymentDetail", content: "Current Deployment Stage: ", domStyles: {"text-align": "center", "margin-left": "100px", "margin-right": "100px"}}
				]},
			]},
			{kind: "Button", caption: "Update", onclick: "loadData"}
		]}
	],
	create: function() {
		enyo.warn("Starting up...");
		this.data = [
			{ caption: "Distance From Earth (km)", value: null },
			{ caption: "Time Since Launch", value: null },
			{ caption: "Distance to L2", value: null },
			{ caption: "Distance Completed (%)", value: null },
			{ caption: "Cruising Speed (km/s)", value: null },
			{ caption: "Sunshield Avg Temp", value: null },
			{ caption: "Equipment Panel Temp", value: null},
			{ caption: "Mirror Temp", value: null },
			{ caption: "Instrument Radiator Temp", value: null }
		];
		this.inherited(arguments);
		this.$.webService.call();
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
		enyo.warn("Querying data source...");
		this.$.webService.call();
	},
	queryResponse: function(inSender, inResponse) {
		this.data = inResponse;
		console.log("Parsing raw data: " + JSON.stringify(this.data));
		flattenedData = [
			{ caption: "Distance From Earth", value: this.data.distanceEarthKm + " km" },
			{ caption: "Time Since Launch", value: this.data.launchElapsedTime },
			{ caption: "Distance to L2", value: this.data.distanceL2Km },
			{ caption: "Distance Completed", value: this.data.percentageCompleted + " %"},
			{ caption: "Cruising Speed", value: this.data.speedKmS + "(km/s)" },
			{ caption: "Sunshield Avg Temp", value: this.data.tempC.tempWarmSide1C + " C" },
			{ caption: "Equipment Panel Temp", value: this.data.tempC.tempWarmSide2C + " C" },
			{ caption: "Mirror Temp", value: this.data.tempC.tempCoolSide1C + " C" },
			{ caption: "Instrument Radiator Temp", value: this.data.tempC.tempCoolSide2C + " C" }
		];
		console.log("Formatted data: " + JSON.stringify(flattenedData));
		enyo.warn("Updating UI...");
		this.$.DeploymentDetail.setContent(this.data.currentDeploymentStep);
		this.$.DeploymentImage.setSrc(this.data.deploymentImgURL)
		this.data = flattenedData;
		this.$.list.refresh();
	}
});