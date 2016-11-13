requirejs.config({
  appDir: ".",
  baseUrl: "res/vendor/js",
});

requirejs(["jquery.min", 'bootstrap.min'], function(jQuery, Bootstrap) {
  "use strict";

  $("nav input[name=disconnect]").hide();
  $("nav input[name=connect]").prop("disabled", true);
  chrome.serial.getDevices(function(devices) {
    var hasDev = false;
    var connId = false;

    $.each(devices, function(i, dev) {
      hasDev = true;
      $("nav select[name=port-path]").append($(
        "<option/>").html(dev.path).val(dev.path));
    })
    $("nav input[name=connect]").prop("disabled", !hasDev);

    // event bind
    $("nav input[name=disconnect]").on('click', function() {
      if (connId) {
        chrome.serial.disconnect(connId, function() {
          $('#bottom #status').html(
            "disconnect success.");
          $("nav input[name=connect]").prop(
            "disabled", !hasDev);
          $("nav input[name=disconnect]").hide();
          connId = false;
        })
      }
    });

    $("nav input[name=connect]").on('click', function() {
      $("#center textarea").html('');
      chrome.serial.connect($(
          "nav select[name=port-path]").val(), {
          'bitrate': parseInt($(
            "nav select[name=port-baud-rate]").val())
        },
        function(connInfo) {
          $("nav input[name=connect]").prop("disabled",
            true);
          $("nav input[name=disconnect]").show();
          $('#bottom #status').html("connect success.");
          connId = connInfo.connectionId;

        });
    });


    $('#bottom #send-box input[name=send-bottom]').on('click',
      function() {
        var value = $(
          '#bottom #send-box input[name=send-data]').val();
        if (value && connId) {
          var bufArr = new Array();
          $.each(value.split(" "), function(i, item) {
            if (item) {
              bufArr.push(parseInt(item));
            }
          });
          if (bufArr) {
            var buf = new ArrayBuffer(bufArr.length);
            var int8View = new Uint8Array(buf);
            $.each(bufArr, function(i, data) {
              $("#center textarea").append("[" + i +
                "]" + data + " ");
              int8View[i] = data;
            });

            console.log("Send len: [" + bufArr.length +
              "] ");
            chrome.serial.send(connId, buf, function(info) {
              $("#center textarea").append("\n\n");
              $('#bottom #status').html(
                "send data success.");
            });
          }

        }
      });

    chrome.serial.onReceive.addListener(function(stream) {
      var bufView = new Uint8Array(stream.data);
      console.log("Receive len: [" + bufView.length +
        "] ");

      $.each(bufView, function(i, data) {
        var value = "0x";
        if (data <= 15) {
          value += "0" + data.toString(16);
        } else {
          value += data.toString(16);
        }
        $("#center textarea").append(value + " ");
      });
      $("#center textarea").append("\n\n");
    });
  })
});