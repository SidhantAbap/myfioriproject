/*global location history */
/* global Quagga:true */
sap.ui.define([
	"sidhant/myapp/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast"
], function(BaseController, History, MessageBox, Fragment, MessageToast) {
	"use strict";
	return BaseController.extend("sidhant.myapp.Component.controller.Detail", {
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sidhant.myapp.view.view.Detail
		 */
		onInit: function() {
			// Register to the add route matched
			this.getRouter().getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sidhant.myapp.view.view.Detail
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sidhant.myapp.view.view.Detail
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sidhant.myapp.view.view.Detail
		 */
		onExit: function() {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		// Custom Method to bind the elements using the Event Arguments
		_onRouteMatched: function(oEvt) {
			var oArgument = oEvt.getParameter("arguments");
			var oView = this.getView().byId("smartFormPage");
			oView.bindElement({
				path: "/EmployeeSet('" + oArgument.EmployeeId + "')"
			});
		},

		//Navigate back to the main view
		onNavBack: function() {
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("main", {}, bReplace);
			}
		},

		//Scan the asset id from barcode
		onScanForValue: function(oEvent) {
			if (!this._oScanDialog) {
				this._oScanDialog = new sap.m.Dialog({
					title: "Scan barcode",
					contentWidth: "640px",
					contentHeight: "480px",
					horizontalScrolling: false,
					verticalScrolling: false,
					stretchOnPhone: true,
					content: [new sap.ui.core.HTML({
						id: this.createId("scanContainer"),
						content: "<div />"
					})],
					endButton: new sap.m.Button({
						text: "Cancel",
						press: function(oEvent) {
							this._oScanDialog.close();
						}.bind(this)
					}),
					afterOpen: function() {
						// TODO: Investigate why Quagga.init needs to be called every time...possibly because DOM 
						// element is destroyed each time dialog is closed
						this._initQuagga(this.getView().byId("scanContainer").getDomRef()).done(function() {
							// Initialisation done, start Quagga
							Quagga.start();
						}).fail(function(oError) {
							// Failed to initialise, show message and close dialog...this should not happen as we have
							// already checked for camera device ni /model/models.js and hidden the scan button if none detected
							MessageBox.error(oError.message.length ? oError.message : ("Failed to initialise Quagga with reason code " + oError.name), {
								onClose: function() {
									this._oScanDialog.close();
								}.bind(this)
							});
						}.bind(this));
					}.bind(this),
					afterClose: function() {
						// Dialog closed, stop Quagga
						Quagga.stop();
					}
				});

				this.getView().addDependent(this._oScanDialog);
			}

			this._oScanDialog.open();
		},

		_initQuagga: function(oTarget) {
			var oDeferred = jQuery.Deferred();

			// Initialise Quagga plugin - see https://serratus.github.io/quaggaJS/#configobject for details
			Quagga.init({
				inputStream: {
					type: "LiveStream",
					target: oTarget,
					constraints: {
						width: {
							min: 640
						},
						height: {
							min: 480
						},
						facingMode: "environment"
					}
				},
				locator: {
					patchSize: "medium",
					halfSample: true
				},
				numOfWorkers: 2,
				frequency: 10,
				decoder: {
					readers: [{
						format: "code_128_reader",
						config: {}
					}]
				},
				locate: true
			}, function(error) {
				if (error) {
					oDeferred.reject(error);
				} else {
					oDeferred.resolve();
				}
			});

			if (!this._bQuaggaEventHandlersAttached) {
				// Attach event handlers...

				Quagga.onProcessed(function(result) {
					var drawingCtx = Quagga.canvas.ctx.overlay,
						drawingCanvas = Quagga.canvas.dom.overlay;

					if (result) {
						// The following will attempt to draw boxes around detected barcodes
						if (result.boxes) {
							drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
							result.boxes.filter(function(box) {
								return box !== result.box;
							}).forEach(function(box) {
								Quagga.ImageDebug.drawPath(box, {
									x: 0,
									y: 1
								}, drawingCtx, {
									color: "green",
									lineWidth: 2
								});
							});
						}

						if (result.box) {
							Quagga.ImageDebug.drawPath(result.box, {
								x: 0,
								y: 1
							}, drawingCtx, {
								color: "#00F",
								lineWidth: 2
							});
						}

						if (result.codeResult && result.codeResult.code) {
							Quagga.ImageDebug.drawPath(result.line, {
								x: 'x',
								y: 'y'
							}, drawingCtx, {
								color: 'red',
								lineWidth: 3
							});
						}
					}
				}.bind(this));

				Quagga.onDetected(function(result) {
					// Barcode has been detected, value will be in result.codeResult.code. If requierd, validations can be done 
					// on result.codeResult.code to ensure the correct format/type of barcode value has been picked up

					// Set barcode value in input field
					this.getView().byId("assetId").setValue(result.codeResult.code);

					// Close dialog
					this._oScanDialog.close();
				}.bind(this));

				// Set flag so that event handlers are only attached once...
				this._bQuaggaEventHandlersAttached = true;
			}

			return oDeferred.promise();
		},

		onPressOnDetail: function(oEvent) {
			var oView = this.getView();
			var model = oView.getModel();
			var path = oEvent.getSource().getBindingContext().getPath();
			var obj = model.getProperty(path);
			if (!this.byId("openDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "sidhant.myapp.view.Dialog",
					controller: this
				}).then(function(oDialog) {
					// connect dialog to the root view 
					//of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.bindElement({
						path: "/EmployeeSet('" + obj.EmpId + "')"
					});
					oDialog.open();
				});

				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
				//this._oDialog.open();
			}
		},

		onPressOnSave: function(oEvent) {
			//Check asset id field should not be blank
			var oValue = this.getView().byId("assetId").getValue();
			if (!oValue) {
				this.getView().byId("assetId").setValueState(sap.ui.core.ValueState.Error);
				//Message to display mandatory field
				var sMessage = this.getResourceBundle().getText("MandatoryField");
				MessageToast.show(sMessage, {
					closeOnBrowserNavigation: false
				});
			} else {
				this.getView().byId("assetId").setValueState(sap.ui.core.ValueState.Success);
				// register for metadata loaded events
				var oModel = this.getModel();
				var path = oEvent.getSource().getBindingContext().getPath();
				oModel.metadataLoaded().then(this._onMetadataLoaded.bind(this, path, oValue));
			}
		},
		_onMetadataLoaded: function(oPath, oValue, oEvent) {
			//Get properties
			var oView = this.getView();
			var oModel = oView.getModel();
			var obj = oModel.getProperty(oPath);
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth() + 1; //January is 0!
			var yyyy = today.getFullYear();
			var hour = today.getHours();
			var Minutes = today.getMinutes();
			var Seconds = today.getSeconds();
			var today1 = (yyyy + '-' + mm + '-' + dd + 'T' + hour + ':' + Minutes + ':' + Seconds);
			// create default properties
			var oProperties = {
				AstId: oValue,
				EmpId: obj.EmpId,
				AstDescr: "TEST DESCRIPTION",
				ValidFrom: today1,
				ValidTo: "9999-12-01T00:00:00"
			};

			// create new entry in the model
			//Method 1
			/*oModel.create("/EmployeeAssetSet", oProperties, {
				success: function(oData, oResponse) {
					// Success
					sap.m.MessageToast.show(" Created Successfully");
				},
				error: function(oError) {
					// Error
					sap.m.MessageToast.show(" Creation failed");
				}
			});*/

			// create an entry of the Products collection with the specified properties and values
			//Method 2
			var oContext = oModel.createEntry("/EmployeeAssetSet", {
				properties: oProperties
			});

			// submit the changes (creates entity at the backend)
			oModel.submitChanges({
				success: this._onCreateSuccess.bind(this),
				error: this._myErrorHandler.bind(this)
			});
			// delete the created entity
			//oModel.deleteCreatedEntry(oContext);
		},
		_onCreateSuccess: function(oData, response) {
			// response header
			var oStatus = response.data.__batchResponses[0].response.statusCode;

			if (oStatus == "200") {
				// show success message
				var sMessage = this.getResourceBundle().getText("newObjectCreated");
				MessageToast.show(sMessage, {
					closeOnBrowserNavigation: false
				});
			} else {
				// show error message
				var sMessage = this.getResourceBundle().getText("objectNotCreated");
				MessageToast.show(sMessage, {
					closeOnBrowserNavigation: false
				});
			}
		},
		_myErrorHandler: function(oError) {
			// show error messge
			var sMessage = this.getResourceBundle().getText("objectNotCreated");
			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
		}

	});

});