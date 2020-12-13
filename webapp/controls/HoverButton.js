sap.ui.define([
	"sap/m/Button"
], function(Button) {
	"use strict";
	return Button.extend("controls.HoverButton",{
		metadata:{
			properties:{
				"allowHover":{
					type: "boolean",
					defaultValue: false
				},
				
				"hoverText":{
					type:"string"
				}
			},
				events:{
					"hover":{}
				}
		},	
		onmouseover:function(evt){
			if (this.getAllowHover()){
				this.fireHover(arguments);
			}
		},
		renderer:{}
	});
});