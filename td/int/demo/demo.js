!(function(global) {

  var CTI_CONTAINER = "#cticontainer";
  var ANIMATION = "wiggle";

  var createContact = function(tel) {
    return isNaN(tel) ? "" : "<div><div id='" + tel + "'>👤 Contact: 📞 <a href=\"javascript:CTI.clickToCall('+" + tel + "')\" title='Click to call'>+" + tel + "</a></div></div>";
  };

  var addContact = function(tel) {
    tel = +(tel.trim());
    var contact = document.getElementById(tel);
    if (!contact) {
      document.getElementById("contacts").innerHTML += createContact(tel);
    }
    return contact || document.getElementById(tel);
  }

  var animate = function(animation, elem, timeout) {
    elem && elem.classList.add(animation);
    elem && timeout && setTimeout(function() {elem.classList.remove(animation)}, timeout);
  }

  var inanimate = function(animation, elem) {
    elem = document.getElementById(elem);
    elem && elem.classList.remove(animation);
  }

  var contactCalling = function(tel) {
    animate(ANIMATION, addContact(tel));
  }

  var contactCallEnd = function(tel) {
    inanimate(ANIMATION, +(tel.trim()));
  }

  var getTextWidth = function(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = 'italic 10px sans-serif';
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width) + 5;
  };

  var getBackgroundImage = function(text) {
    return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='14px' width='" + getTextWidth(text) + "px'><text x='1' y='10' fill='lightgray' font-style='italic' font-size='10' font-family='sans-serif'>" + text + "</text></svg>\")";
  };

  var toggle = function(ctiContainer, minimize) {
    ctiContainer.minimized = minimize === undefined ? !ctiContainer.minimized : minimize;
    ctiContainer.style.height  = ctiContainer.minimized ? CTI.minHeight : CTI.maxHeight;
  };

  var ctiEventHandler = function(event, data) {
    var ctiContainer = document.querySelector(CTI_CONTAINER);
    switch (event) {
      case "prompt":
        animate(ANIMATION, ctiContainer, 950);
        toggle(ctiContainer, false);
        break;
      case "toggle":
        toggle(ctiContainer);
        break;        
      case "contact":
        toggle(ctiContainer, false);
        contactCalling(data.number || data.externalId);
        break;
      case "data":
        data.action === 'endcall' && contactCallEnd(data.number);
        break;  
    }
  };

  var init = function() {
    var urlSearchParams = new URLSearchParams(window.location.search);
    var params = Object.fromEntries(urlSearchParams.entries());

    if (params.site) {
      document.title = params.site;
      document.body.style.backgroundImage = getBackgroundImage(params.site);
    }

    var tels = params.tels && params.tels.split(",") || [];
    for(var i=0; i<tels.length; i++) {
      addContact(tels[i]);
    }

    CTI.start(ctiEventHandler, CTI_CONTAINER, params.env, params.aid, params.int, params.acc);
  };

  init();
}(this));