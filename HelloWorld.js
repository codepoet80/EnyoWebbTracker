enyo.kind({
	name: "enyo.Canon.HelloWorld",
	kind: enyo.VFlexBox,
	components: [
		{kind: "PageHeader", components: [
			{kind: "VFlexBox", flex: 1, align: "center", components: [
				{content: "James Webb Telescope Tracker"},
				{content: "a compendium of enyo styles, guidelines, tips and techniques you'll need to build a good-looking app.", className: "enyo-item-secondary"}
			]}
		]},
		{kind: "Control", flex:1, layoutKind: "VFlexLayout", pack: "center", align: "middle", components: [
			{kind: "HFlexBox", flex: 1, components: [
				{kind: "VirtualRepeater", onSetupRow: "getItem", components: [
					{kind: "Item", layoutKind: "HFlexLayout", components: [
						{name: "caption", flex: 1},
						{kind: "Button", onclick: "buttonClick"}
					]}
				]},
				{kind: "ImageView", flex: 2, "images": [
					"jwtelescope.png"
				]},	
			]},
			{kind: "Button", caption: "Update"}
		]}
	],
	getItem: function(inSender, inIndex) {
		if (inIndex < 100) {
			this.$.caption.setContent("I am item: " + inIndex);
			this.$.button.setCaption("Button" + inIndex);
			return true;
		}
	}
});