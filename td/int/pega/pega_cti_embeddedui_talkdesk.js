pega.cti.embeddedApi.Talkdesk = function () {
  console.log("pega.cti.embeddedApi.Talkdesk constructor", arguments);
}

pega.cti.embeddedApi.Talkdesk.prototype = {
  load: function (link, success, failure) {
    console.log("pega.cti.embeddedApi.Talkdesk load", arguments);

    var getConfigProperty = function(property) {
      property = link.CustomProperties && link.CustomProperties.find(function(p) { return p.pyPropertyName === property });
      return property ? property.pyPropertyValue : property;
    }

    this._applyCallTreatment = getConfigProperty("applyCallTreatment");
    this._container = getConfigProperty("container") || "#EmbeddedCCP";
    this._containerStyle = getConfigProperty("style");
    var script = document.createElement('script');
    script.setAttribute("container", this._container);
    script.setAttribute("env", getConfigProperty("env") || "");
    script.setAttribute("int", getConfigProperty("int") || "");
    script.setAttribute("aid", pega.desktop.pyUID);
    script.setAttribute("handler", "pega.cti.API._eventHandler");
    script.src = link.contactCenterInstanceURL;
    document.head.appendChild(script);
    success();
  },

  unload: function () {
    console.warn("pega.cti.embeddedApi.Talkdesk unload not implemented", arguments);	
  },    

  makeCall:function (destination, options, success, failure)  {
    console.log("pega.cti.embeddedApi.Talkdesk makeCall", arguments);
    if (CTI) {
      CTI.clickToCall(destination);
      success();
    } else {
      failure({errCode: "ERR_PASS", errMessage: "Talkdesk CTI not present in the current document"});
    }
  },

  answerCall: function (callId, options,success,failure) {
    console.warn("pega.cti.embeddedApi.Talkdesk answerCall not implemented", arguments);
  },
  
  setTransferContext: function() {
    console.warn("pega.cti.embeddedApi.Talkdesk setTransferContext not implemented", arguments);	
  },

  expandCCP: function() {
    var cti = document.querySelector(this._container);
    cti.style.cssText = "display:block;";
    pega.cti.API._showCti();
  },
  
  collapseCCP: function() {

  },  

  _showCti: function() {
    var cti = document.querySelector(this._container);
    if (this._containerStyle) {
      cti.style.cssText = this._containerStyle + ";" + cti.style.cssText;
    }      
    if (cti.style.display !== 'block') {    
      pega.cti.embeddedEventHandler.showUIPanel();
    }
  },
  
  _eventHandler: function(event, data) {
    switch (event) {
      case "prompt":
        pega.cti.API._showCti();
        pega.cti.embeddedEventHandler.enableClickToCall();
        break;
      case "contact":
        pega.cti.API._showCti();
        !data.number && data.externalId && pega.cti.API._startScreenPop(data.externalId, true);
        break;
    }
  },

  _startScreenPop: function(contact, inbound) {
    contact = contact.split(" ");
    if (this._applyCallTreatment) {
      var applyCallTreamentCommand = Function("contact", "return " + this._applyCallTreatment);
      return eval(applyCallTreamentCommand(contact));
    }
    var event = {};
    event.pyCallId = contact[0];
    event.pyInteractionID = contact[0];
    event.pyMedia = "Phone";
    event.pyEventName = inbound ? "Offering" : "Initiated";
    event.pyEventString = inbound ? "Offering" : "Initiated";
    event.pyCallType = inbound ? "INBOUND" : "OUTBOUND";
    event.pyOtherDN = contact[0];
    event.pyANI = contact[0];
    pega.cti.embeddedEventHandler.applyCallTreatment(JSON.stringify(event));
  },
  
}
//static-content-hash-trigger-GCC
