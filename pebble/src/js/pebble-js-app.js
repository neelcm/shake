function getContact(latitude, longitude) {
  var response;
  var req = new XMLHttpRequest();
  console.log("GETTING");
  req.open('GET', "http://192.168.1.3:3000/neel?", true);
  req.onload = function(e) {
    
    console.log(req.responseText);
        response = JSON.parse(req.responseText);
        var name, phone;
        if (response && response.list && response.list.length > 0) {
          name = response.list[0].name;
          phone = response.list[0].phone;

          console.log("RETURNING");
          console.log(name);
          console.log(phone);
          Pebble.sendAppMessage({
            "id":1,
            "name":name,
            "phone":phone});
        }


    if (req.readyState == 4) {
      if(req.status == 200) {
        

      } else {
        console.log("Error");
      }
    }
  }
  
  req.send(null);
}

function locationSuccess(pos) {
  var coordinates = pos.coords;
  getContact(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
  console.warn('location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "city":"Loc Unavailable",
    "temperature":"N/A"
  });
}

var locationOptions = { "timeout": 15000, "maximumAge": 60000 }; 


Pebble.addEventListener("ready",
                        function(e) {
                          //console.log("connect!" + e.ready);
                          //locationWatcher = window.navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
                          console.log(e.type);
                        });

Pebble.addEventListener("appmessage",
                        function(e) {
                          window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
                          console.log(e.type);
                          console.log("message!");
                        });

Pebble.addEventListener("webviewclosed",
                                     function(e) {
                                     console.log("webview closed");
                                     console.log(e.type);
                                     console.log(e.response);
                                     });


