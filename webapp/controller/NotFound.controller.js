sap.ui.define([
		"sidhant/myapp/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("sidhant.myapp.Component.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("main");
			}

		});

	}
);