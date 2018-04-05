'use strict';

var appUrl = window.location.origin;

var ajaxFunctions = {
   ready: function ready (fn) {
      if (typeof fn !== 'function') {
         return;
      }

      if (document.readyState === 'complete') {
         return fn();
      }

      document.addEventListener('DOMContentLoaded', fn, false);
   },
   ajaxRequest: function ajaxRequest (method, url, callback) {
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = function () {
         if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            callback(xmlhttp.response);
         }
      };

      xmlhttp.open(method, url, true);
      xmlhttp.send();
   }
};

function logIntoTwitter() {
  var childWindow = window.open("/auth/twitter", "OAuth", "channelmode=0,directories=0,fullscreen=0,height=300,location=0,menubar=0,resizable=0,scrollbars=0,status=0,titlebar=0,toolbar=0,width=400", true);
}