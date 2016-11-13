requirejs.config({
  appDir: ".",
  baseUrl: "res/vendor/js",
});

requirejs(["jquery.min", 'bootstrap.min'], function(jQuery, Bootstrap) {
  "use strict";
  
  // global
  var hasDev = false;
  var connId = false;
  $("nav input[name=disconnect]").hide();
  $("nav input[name=connect]").prop("disabled", true);
  
  // ui tools
  function output_text(bufview){
    $.each(bufview, function(i, data) {
        var value = "0x";
        if (data <= 15) {
          value += "0" + data.toString(16).toUpperCase();
        } else {
          value += data.toString(16).toUpperCase();
        }
        $(".revc-box textarea").append(value + " ");
    });
    $(".revc-box textarea").append("\n\n");
  }
  
  // list dev event bind
  chrome.serial.getDevices(function(devices) {

    $.each(devices, function(i, dev) {
      hasDev = true;
      $("nav select[name=port-path]").append($(
        "<option/>").html(dev.path).val(dev.path));
    });
    $("nav input[name=connect]").prop("disabled", !hasDev);
  })
  
  // disconnct event bind
  $("nav input[name=disconnect]").on('click', function() {
    if (connId) {
      chrome.serial.disconnect(connId, function() {
        $('#bottom #status').html(
          "disconnect success.");
        $("nav input[name=connect]").prop(
          "disabled", !hasDev);
        $("nav input[name=disconnect]").hide();
        $("nav input[name=connect]").show();
        connId = false;
      });
    }
  });

  // connect event bind
  $("nav input[name=connect]").on('click', function() {
    $(".revc-box textarea").html('');
    chrome.serial.connect($(
        "nav select[name=port-path]").val(), {
        'bitrate': parseInt($(
          "nav select[name=port-baud-rate]").val())
      },
      function(connInfo) {
        $("nav input[name=connect]").prop("disabled",
          true);
        $("nav input[name=connect]").hide();
        $("nav input[name=disconnect]").show();
        $('#bottom #status').html("connect success.");
        connId = connInfo.connectionId;
      });
  });
  
  // send event bind
  $('.send-box .send-button').on('click',
    function() {
      var value = $(this).parent().find('input').val();
      if (value && connId) {
        var bufArr = [];
        $.each(value.split(" "), function(i, item) {
          if (item) {
            bufArr.push(parseInt(item));
          }
        });
        if (bufArr) {
          var buf = new ArrayBuffer(bufArr.length);
          var int8View = new Uint8Array(buf);
          $.each(bufArr, function(i, data) {
            int8View[i] = data;
          });
        
          console.log("Send len: [" + int8View.length +
            "] ");
          output_text(int8View);
          chrome.serial.send(connId, buf, function(){});
        }
      }
    });
    
  // recv event bind
  chrome.serial.onReceive.addListener(function(stream) {
    var bufView = new Uint8Array(stream.data);
    console.log("Receive len: [" + bufView.length +
      "] ");
    output_text(bufView)
  });
});