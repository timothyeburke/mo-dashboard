var clock = (function() {
    var clockDiv = document.getElementById("clock");
    var updateClock = function() {
        var currentTime = new Date();
        var currentHours = currentTime.getHours();
        var currentMinutes = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();
        currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
        currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;
        var timeOfDay = ( currentHours < 12 ) ? "AM" : "PM";
        currentHours = ( currentHours > 12 ) ? currentHours - 12 : currentHours;
        currentHours = ( currentHours == 0 ) ? 12 : currentHours;
        var currentTimeString = currentHours + ":" + currentMinutes + " " + timeOfDay;
        clockDiv.innerHTML = currentTimeString;
    }
    updateClock();
    setInterval(updateClock, 1000);
})();