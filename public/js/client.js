var module = (function () {
	$(document).ready(function () {
		fetch();
		setInterval(fetch, 5000);

		setTimeout(function () {
			window.location.reload();
		}, 1000 * 60 * 15);
	});

	var fetch = function () {
		$.getJSON('/data.json', function (data) {
			var incidents = data.incidents;
			var north     = data.north;
			var south     = data.south;
			var weather   = data.weather;
			var NY_ave    = data.B35;
			var RI_ave    = data.B04;

			// Incidents fixed at top
			displayIncidents(incidents);

			// These will display in the order they are entered here
			displayBusInfo(south);
			displayBusInfo(north);

			displayTrainInfo(NY_ave);
			displayTrainInfo(RI_ave);

			// displayWeather(weather);
		});
	};

	var displayIncidents = function (data) {
		var $incidents = $('#incidents');
		if (data == undefined || data.length == 0) {
			$incidents.hide();
			return;
		} else {
			$incidents.show();
			var output = "<h2>Metro Incidents</h2>";
			for(var i = 0; i < data.length; i++) {
				output += "<div class='incident'>" + data[i].Description + "</div>";
			}
			$incidents.html(output);
		}
	};

	var displayBusInfo = function (data) {
		data.id = data.StopName.replace(/ /g, '_').replace(/\+/g, '');
		data.StopName = data.StopName.replace(/Ne/g, 'NE');
		data.StopName = data.StopName.replace(/\+/g, '&amp;');

		var transitTemplate = $('#' + data.id);
		if (!transitTemplate.length) {
			transitTemplate = $("#transit").clone();
			transitTemplate.attr('id', data.id);
			transitTemplate.find('h2').html(data.StopName);
			transitTemplate.removeClass('template');
			$('#transit-container').append(transitTemplate);
		}

		var output = "";
		for (var i = 0; i < data.Predictions.length; i++) {
			var pred = data.Predictions[i];
			output += "<tr><td>" + pred.RouteID + "</td>";
			output += "<td>" + pred.DirectionText + "</td>";
			output += "<td>" + pred.Minutes + " Min</td></tr>";
		}
		transitTemplate.find('.predictions').html(output);
	};

	var displayTrainInfo = function (data) {
		data.id = data.StationName.replace(/ /g, '_').replace(/\+/g, '');

		var transitTemplate = $('#' + data.id);
		if (!transitTemplate.length) {
			transitTemplate = $("#transit").clone();
			transitTemplate.attr('id', data.id);
			transitTemplate.find('h2').html(data.StationName);
			transitTemplate.removeClass('template');
			transitTemplate.html(transitTemplate.html().replace('Route', 'Line'));
			transitTemplate.html(transitTemplate.html().replace('Direction', 'Destination'));
			$('#transit-container').append(transitTemplate);
		}

		var output = "";
		for (var i = 0; i < data.Predictions.length; i++) {
			var pred = data.Predictions[i];
			if (pred.DestinationCode && pred.Min) {
				output += "<tr><td>" + pred.Line + "</td>";
				output += "<td>" + pred.DestinationName + "</td>";
				if (isNaN(parseInt(pred.Min))) {
					output += "<td>" + pred.Min + "</td></tr>";
				} else {
					output += "<td>" + pred.Min + " Min</td></tr>";
				}
				
			}
		}
		transitTemplate.find('.predictions').html(output);
	};


})();
