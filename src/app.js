var UI = require('ui');

var base = localStorage.getItem('base');
var username = localStorage.getItem('username');
var i = 0;

if(!base) {  
  baseSelector();
}

if(base && !username) {
  usernameSelector();
}

if(base && username) {
  lightsSelector();
}

var errorCard = new UI.Card({
  title: 'Error',
  body: 'Something went wrong!',
  style: 'small',
  scrollable: true,
  backgroundColor: 'white',
  titleColor: 'black',
  bodyColor: 'black'
});

var retryCard = new UI.Card({
  title: 'Link',
  body: 'Press the link button on your base station! Press SELECT when you are done.',
  style: 'small',
  scrollable: true,
  backgroundColor: 'white',
  titleColor: 'black',
  bodyColor: 'black'
});

function actionSelector(id) {
  actionRequest(id);
}

function actionRequest(id) {
  var lightsDataUrl = 'http://' + base + '/api/' + username + '/lights';
  var request = new XMLHttpRequest();
  
  // Send the request
  request.open('GET', lightsDataUrl);
  request.send();
  request.onload = function() {
    try {
      // Transform in to JSON
      var json = JSON.parse(this.responseText);
      
      if(json[id].state.reachable) {
        lightsRequest(id, !json[id].state.on);
      }
    } catch(err) {
      errorCard.show();
    }
  };
}

function lightsRequest(id, state) {
  var lightsUrl = 'http://' + base + '/api/' + username + '/lights/' + id + '/state';
  var data = '{"on": ' + state + '}';
  // Create the request
  var request2 = new XMLHttpRequest();

  // Send the request
  request2.open('PUT', lightsUrl);
  request2.send(data);
}

function lightsSelector() {
  var lightsUrl = 'http://' + base + '/api/' + username +  '/lights';
  // Create the request
  var request = new XMLHttpRequest();

  // Send the request
  request.open('GET', lightsUrl);
  request.send();
  request.onload = function() {
    try {
      // Transform in to JSON
      var json = JSON.parse(this.responseText);

      // Read data
      var items = [], ids = [];
      items.push({
        title: 'ALL ON',
        id: 'ALLON'
      });
      for (var i in json) {
        if(json[i].state.reachable) {
          items.push({
            title: json[i].name,
            subtitle: json[i].type,
            id: i
          });
          ids.push(i);
        }
      }
      items.push({
        title: 'ALL OFF',
        id: 'ALLOFF'
      });

      // Construct Menu to show to user
      var resultsMenu = new UI.Menu({
        sections: [{
          title: 'Hue Lights',
          items: items
        }]
      });

      // Show the Menu, hide the loader
      resultsMenu.show();
      
      resultsMenu.on('select', function(e) {
        var myId = e.item.id;
        if(myId === 'ALLON') {
          for(i = 0 ; i < ids.length ; i++) {
            lightsRequest(ids[i], true);
          }
        }
        else if(myId === 'ALLOFF') {
          for(i = 0 ; i < ids.length ; i++) {
            lightsRequest(ids[i], false);
          }
        }
        else {
          actionSelector(myId);
        }
      });
    } catch(err) {
      errorCard.show();
    }
  };
}

function usernameSelector() {
  var usernameUrl = 'http://' + base + '/api';
  var data = '{"devicetype": "pebble#hue"}';
  
  // Create the request
  var request = new XMLHttpRequest();

  // Send the request
  request.open('POST', usernameUrl);
  request.send(data);
  request.onload = function() {
    try {
      // Transform in to JSON
      var json = JSON.parse(this.responseText);

      // Read data
      if('success' in json[0]) {
        username = json[0].success.username;
        localStorage.setItem('username', username);
        errorCard.hide();
        retryCard.hide();
        lightsSelector();
      }
      else {
        retryCard.on('click', 'select', function() {
          usernameSelector();
        });
        retryCard.show();
      }
    } catch(err) {
      errorCard.body('Something went wrong!' + err);
      errorCard.show();
    }
  };
}

function baseSelector() {
  var discoveryUrl = 'https://www.meethue.com/api/nupnp';
  
  // Create the request
  var request = new XMLHttpRequest();

  // Send the request
  request.open('GET', discoveryUrl);
  request.send();
  request.onload = function() {
    try {
      // Transform in to JSON
      var json = JSON.parse(this.responseText);

      // Read data
      var items = [];
      for (i = 0 ; i < json.length ; i++) {
        items.push({
          title: json[i].id,
          subtitle: json[i].internalipaddress,
          ip: json[i].internalipaddress 
        });
      }

      // Construct Menu to show to user
      var resultsMenu = new UI.Menu({
        sections: [{
          title: 'Hue Base Stations',
          items: items
        }]
      });

      // Show the Menu, hide the loader
      resultsMenu.show();

      resultsMenu.on('select', function(e) {
        base = e.item.ip;
        localStorage.setItem('base', base);
        usernameSelector();
      });
    } catch(err) {
      errorCard.show();
    }
  };
}