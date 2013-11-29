var module = (function () {
	$(document).ready(function () {
		fetch();
		setInterval(fetch, 5000);
	});

	var fetch = function () {
		$.getJSON('/stop.json', function (data) {
			var north = data.north;
			var south = data.south;

			displayTransit(south);
			displayTransit(north);
		});
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
			output += "<td>" + pred.Minutes + " Minutes</td></tr>";
		}
		transitTemplate.find('.predictions').html(output);
		$('body').append(transitTemplate);
	};
})();
