requirejs.config({
    appDir: ".",
    baseUrl: "res",
});

requirejs(["jquery.min"], function(jQuery) {
	"use strict";

    $("#top input[name=disconnect]").hide();
	$("#top input[name=connect]").prop("disabled", true);
	chrome.serial.getDevices(function(devices){
		var hasDev = false;
		var connId = false;

		$.each(devices, function(i, dev){
			hasDev = true;
			$("#top select[name=port-path]").append($("<option/>").html(dev.path).val(dev.path));
		})
		$("#top input[name=connect]").prop("disabled", !hasDev);

		// event bind
		$("#top input[name=disconnect]").on('click',function(){
			if (connId)
			{
				chrome.serial.disconnect(connId, function(){
					$('#bottom #status').html("disconnect success.");
					$("#top input[name=connect]").prop("disabled", !hasDev);
					$("#top input[name=disconnect]").hide();
					connId = false;
				})
			}
		});

		$("#top input[name=connect]").on('click', function(){
			$("#center textarea").html('');
			chrome.serial.connect($("#top select[name=port-path]").val(),
									{'bitrate': parseInt($("#top select[name=port-baud-rate]").val())},
									function(connInfo){
				                        $("#top input[name=connect]").prop("disabled", true);
										$("#top input[name=disconnect]").show();
										$('#bottom #status').html("connect success.");
										connId = connInfo.connectionId;

									});
		});
		$("#top input[name=close]").on('click', function(){
			window.close();
		});
		
		$('#bottom #send-box input[name=send-bottom]').on('click', function(){
			var value = $('#bottom #send-box input[name=send-data]').val();
			if (value && connId)
			{
				var bufArr = new Array();
				$.each(value.split(" "), function(i, item){
					if (item)
					{
						bufArr.push(parseInt(item));
					}
				});
				if (bufArr)
				{
					var buf = new ArrayBuffer(bufArr.length);
					var int8View = new Uint8Array(buf);
					$.each(bufArr,function(i, data){
						$("#center textarea").append("["+i+"]"+data+" ");
						int8View[i] = data;
					});

					console.log("Send len: ["+buf.length+"] ");
					chrome.serial.send(connId, buf, function(info){
						$("#center textarea").append("\n\n");
						$('#bottom #status').html("send data success.");
					});
				}

			}
		});

		chrome.serial.onReceive.addListener(function(stream){
			//console.log(stream);
			var bufView = new Uint8Array(stream.data);
			console.log("Receive len: ["+bufView.length+"] ");
			//console.log("==result==");
			
			$.each(bufView,function(i, data){
				$("#center textarea").append("["+i+"]"+data+" ");
			});
			$("#center textarea").append("\n\n");
		});
	})
});