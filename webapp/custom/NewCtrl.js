sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";
	return Control.extend("custom.NewCtrl",{
		metadata:{
			properties:{
				"prodId":"string",
				"prodName":"string",
				"quantity":"int",
				"unitPrice":"float",
				"width":{ type:"sap.ui.core.CSSSize", defaultValue:"100px"},
				"height":{ type:"sap.ui.core.CSSSize", defaultValue:"100px"}
			}
		}
	});
});