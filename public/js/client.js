var module = (function () {
	$(document).ready(function () {
		fetch();
		setInterval(fetch, 5000);
	});

	var fetch = function () {
		$.getJSON('/data.json', function (data) {
			var north = data.north;
			var south = data.south;
			var incidents = data.incidents;

			displayTransit(south);
			displayTransit(north);
			displayIncidents(incidents);
		});
	};

	var displayIncidents = function (data) {
		var $incidents = $('#incidents');
		if (data.length == 0) {
			$incidents.hide();
			return;
		} else {
			$incidents.show();
			var output = "<h2>Metro Incidents</h2>";
			for(var i = 0; i < data.length; i++) {
				output += "<div>" + data[i].Description + "</div>";
			}
			$incidents.html(output);
		}
	};

	var displayTransit = function (data) {
		data.id = data.StopName.replace(/ /g, '_').replace(/\+/g, '');
		
		$('#' + data.id).remove();

		data.StopName = data.StopName.replace(/Ne/g, 'NE');
		data.StopName = data.StopName.replace(/\+/g, '&amp;');

		var transitTemplate = $("#transit").clone();
		transitTemplate.attr('id', data.id);
		transitTemplate.find('h2').html(data.StopName);
		transitTemplate.removeClass('template');
		
		var output = "";
		for (var i = 0; i < data.Predictions.length; i++) {
			var pred = data.Predictions[i];
			output += "<tr><td>" + pred.RouteID + "</td>";
			output += "<td>" + pred.DirectionText + "</td>";
			output += "<td>" + pred.Minutes + " Min</td></tr>";
		}
		transitTemplate.find('.predictions').html(output);
		$('body').append(transitTemplate);
	};
})();
