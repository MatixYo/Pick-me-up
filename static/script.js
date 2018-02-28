/**
 *
 * 0.00025deg = 2m
 *
 */

require(['esri/map', 'esri/layers/WMTSLayer', 'esri/geometry/Extent', 'esri/layers/MapImageLayer', 'esri/layers/MapImage', 'esri/graphic', 'esri/layers/GraphicsLayer', 'esri/symbols/PictureMarkerSymbol', 'esri/geometry/Point', 'esri/geometry/Polyline', 'esri/symbols/SimpleLineSymbol', 'dojo/domReady!'], (Map, WMTSLayer, Extent, MapImageLayer, MapImage, Graphic, GraphicsLayer, PictureMarkerSymbol, Point, Polyline, SimpleLineSymbol) => {
  esri.config.defaults.io.corsEnabledServers.push('https://api.nasa.gov/mars-wmts');
  map = new Map('map', {
    zoom: 8
  });

  const calculateDistance = (a, b) => Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

  const distanceElement = document.querySelector('#order-distance'),
  priceElement = document.querySelector('#order-price');

  let pickupLocation = null,
  destinationLocation = null,
  destinationMarker,
  drivers = {};

  map.on('click', event => {
    if(!pickupLocation) {
      new Marker('images/pin_blue.png', 32, 114, event.mapPoint.x, event.mapPoint.y);
      pickupLocation = [event.mapPoint.x, event.mapPoint.y];
    } else {
      document.body.classList.add('pickup');
      if(!destinationMarker)
        destinationMarker = new Marker('images/pin_red.png', 32, 114, event.mapPoint.x, event.mapPoint.y);
      else
        destinationMarker.move(event.mapPoint.x, event.mapPoint.y);
      destinationLocation = [event.mapPoint.x, event.mapPoint.y];
      linesLayer.clear();
      linesLayer.add(new Graphic(new Polyline([pickupLocation, destinationLocation]), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, '#fff', 4)));
      let distance = Math.ceil(calculateDistance(pickupLocation, destinationLocation) * 400) / 100,
      price = Math.ceil(distance * 13) / 100;
      distanceElement.textContent = distance;
      priceElement.textContent = price;
    }
  });

  map.addLayer(new WMTSLayer('https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m'));

  const linesLayer = new GraphicsLayer(),
  markersLayer = new GraphicsLayer();
  map.addLayer(linesLayer);
  map.addLayer(markersLayer);

  function Marker(image, width, height, x, y, angle) {
    if(!angle)
      angle = 0; 
    this.symbol = new PictureMarkerSymbol({angle: angle, url: image, width: width, height: height});
    this.graphic = new Graphic(new Point(x, y), this.symbol);
    markersLayer.add(this.graphic);
    this.move = function(x, y) {
      this.graphic.setGeometry(new Point(x, y));
    };
    this.rotate = function(angle) {
      this.symbol.setAngle(angle);
    };
  };

  function Driver(id, name, carName, carIcon, height, x, y, angle) {
    this.id = id;
    this.name = name;
    this.carName = carName;
    this.marker = new Marker(carIcon, 64, height, x, y);
  };

  document.querySelector('#order-button-cancel').addEventListener('click', () => {
    document.body.classList.remove('pickup');
    pickupLocation = null;
    destinationLocation = null;
    destinationMarker = null;
    linesLayer.clear();
    markersLayer.clear();
  });
  document.querySelector('#order-button-confirm').addEventListener('click', () => {
    document.body.classList.remove('pickup');
    document.body.classList.add('order');
    fetch('/get-closest-vehicle?x=' + pickupLocation[0] + '&y=' + pickupLocation[1])
      .then(response => response.json())
      .then(data => {
        linesLayer.add(new Graphic(new Polyline([[data.lng, data.ltd], pickupLocation]), new SimpleLineSymbol(SimpleLineSymbol.STYLE_LONGDASH, '#eee', 4)));
        document.querySelector('#order-information').style.backgroundImage = 'url(' + data.carImage + ')';
        document.querySelector('#order-information-name').textContent = data.name;
        document.querySelector('#order-information-car').textContent = data.car;
        document.querySelector('#order-information-delay').textContent = calculateDistance([data.lng, data.ltd], pickupLocation);
      });
  });

  map.on('load', () => {
    let lastFetch = 0;
    function updatePosition(timestamp) {
      const delta = (timestamp - lastFetch) / 500;
      if(delta > 1) {
        lastFetch = timestamp;
        fetch('/get-visible-vehicles?x_min=' + map.extent.xmin + '&y_min=' + map.extent.ymin + '&x_max=' + map.extent.xmax + '&y_max=' + map.extent.ymax)
          .then(response => response.json())
          .then(data => {
            data.forEach(driver => {
              if(!drivers[driver.id]) {
                drivers[driver.id] = new Driver(driver.id, driver.name, driver.car, driver.carIcon, driver.height, driver.lng,  driver.ltd, driver.angle);
              } else {
                drivers[driver.id].marker.move(driver.lng, driver.ltd);
                drivers[driver.id].marker.rotate(driver.angle);
              }
            });
          });
      }
      requestAnimationFrame(updatePosition);
    }
    requestAnimationFrame(updatePosition);
  })
});
