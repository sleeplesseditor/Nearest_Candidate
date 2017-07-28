var geocoder = null;
var map = null;
var customerMarker = null;
var gmarkers = [];
var closest = [];

//Draws Map in relevant div in index file//
function initialize() {
  // alert("init");
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    //Coordinates changed to centre map on Birmingham/Midlands region//
    center: new google.maps.LatLng(52.486243, -1.890401),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  var infowindow = new google.maps.InfoWindow();
  var marker, i;
  var bounds = new google.maps.LatLngBounds();

//Establishes parameters of map//
//Section was originally experimented with when testing marker placement, but restored to default after testing//
  for (i = 0; i < locations.length; i++) {
    var coordStr = locations[i][4];
    var coords = coordStr.split(",");
    var pt = new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
    bounds.extend(pt);
    marker = new google.maps.Marker({
      position: pt,
      map: map,
      icon: locations[i][5],
      address: locations[i][2],
      title: locations[i][0],
      html: locations[i][0] + "<br>" + locations[i][2]
    });
    gmarkers.push(marker);
    google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
          infowindow.setContent(marker.html);
          infowindow.open(map, marker);
        }
      })
      (marker, i));
  }
  map.fitBounds(bounds);
}

//Part of search function using Geocoder and displays results of search
function codeAddress() {
  var numberOfResults = 25;
    //Currently set to default of 'driving'//
    //Controls number of results displayed after search//
  var numberOfDrivingResults = 6;
  var address = document.getElementById('address').value;
  geocoder.geocode({
    'address': address
  }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      if (customerMarker) customerMarker.setMap(null);
      customerMarker = new google.maps.Marker({
        map: map,
        position: results[0].geometry.location
      });
      closest = findClosestN(results[0].geometry.location, numberOfResults);
      closest = closest.splice(0, numberOfResults);
      calculateDistances(results[0].geometry.location, closest, numberOfDrivingResults);
    } else {
      alert('Geocoder failed for the following reason: ' + status);
    }
  });
}

//Removed extraneous 'processing' and 'found' text in original code//

//Arranges results based on proximity to client postcode//
function findClosestN(pt, numberOfResults) {
  var closest = [];
  for (var i = 0; i < gmarkers.length; i++) {
    gmarkers[i].distance = google.maps.geometry.spherical.computeDistanceBetween(pt, gmarkers[i].getPosition());
    document.getElementById('info').innerHTML += "process " + i + ":" + gmarkers[i].getPosition().toUrlValue(6) + ":" + gmarkers[i].distance.toFixed(2) + "<br>";
    gmarkers[i].setMap(null);
    closest.push(gmarkers[i]);
  }
  closest.sort(sortByDist);
  return closest;
}

function sortByDist(a, b) {
  return (a.distance - b.distance)
}

//Uses Distance Matrix to calculate approx distance for results//
function calculateDistances(pt, closest, numberOfResults) {
  var service = new google.maps.DistanceMatrixService();
  var request = {
    origins: [pt],
    destinations: [],
    travelMode: google.maps.TravelMode.DRIVING,
    //Potential for additional travel modes to be entered here//
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false
  };
  for (var i = 0; i < closest.length; i++) {
    request.destinations.push(closest[i].getPosition());
  }
  service.getDistanceMatrix(request, function(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
      alert('Error was: ' + status);
    } else {
      var origins = response.originAddresses;
      var destinations = response.destinationAddresses;
      var outputDiv = document.getElementById('side_bar');
      outputDiv.innerHTML = '';

      var results = response.rows[0].elements;
      for (var i = 0; i < closest.length; i++) {
        results[i].title = closest[i].title;
        results[i].address = closest[i].address;
        results[i].idx_closestMark = i;
      }
      results.sort(sortByDistDM);
      for (var i = 0;
        ((i < numberOfResults) && (i < closest.length)); i++) {
        closest[i].setMap(map);
        outputDiv.innerHTML += "<a href='javascript:google.maps.event.trigger(closest[" + results[i].idx_closestMark + "],\"click\");'>" + results[i].title + '</a><br>' + results[i].address + "<br>" + results[i].distance.text + ' appoximately ' + results[i].duration.text + '<br><hr>';
      }
    }
  });
}

//Sorts candidates by proximity to searched client postcode//
function sortByDistDM(a, b) {
  return (a.distance.value - b.distance.value)
}

//Data for search results – converted from candidates.json file
google.maps.event.addDomListener(window, 'load', initialize);
//Postcodes in candidates.json were converted to coordinates for pins. Further development would simplify this section to only require LatLng of postcode, rather than polygon system//
var locations = [
  ["Agnezka Seize-Soinxante-Quatre", "no", "B42 1QZ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.121277,37.386799,0 -122.158012,37.4168,0 -122.158012,37.448151,0 -122.142906,37.456055,0 -122.118874,37.45224,0 -122.107544,37.437793,0 -122.102737,37.422526,0 -122.113037,37.414618,0 -122.121277,37.386799,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.52918889999999, -1.9166281000000254", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Pavel Smirnoff", "yes", "B69 1EQ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.200928,37.438611,0 -122.158012,37.4168,0 -122.158012,37.448151,0 -122.142906,37.456055,0 -122.144623,37.475948,0 -122.164192,37.481125,0 -122.189255,37.478673,0 -122.208481,37.468319,0 -122.201271,37.438338,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4924802, -2.0345528999999942", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Gunther Paulaner", "no", "B30 1DH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.415516,-1.9403809000000365</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.415516,-1.9403809000000365", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["John Stella", "yes", "B11 3RZ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.304268,37.516534,0 -122.300835,37.505096,0 -122.262383,37.481669,0 -122.242813,37.502917,0 -122.244186,37.534232,0 -122.269249,37.550021,0 -122.291222,37.545122,0 -122.302895,37.537499,0 -122.304268,37.516534,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4514451,-1.8531339999999545", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Pierre Guinness", "yes", "B10 9NN", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.304268,37.516534,0 -122.348557,37.538044,0 -122.359886,37.56363,0 -122.364006,37.582405,0 -122.33654,37.589207,0 -122.281609,37.570433,0 -122.291222,37.545122,0 -122.302895,37.537499,0 -122.304268,37.516534,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4678001,-1.8477362999999514", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Vincent Pride", "yes", "B17 8NL", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.374306,37.548933,0 -122.348557,37.538044,0 -122.359886,37.56363,0 -122.364006,37.582405,0 -122.33654,37.589207,0 -122.359543,37.59764,0 -122.372246,37.604712,0 -122.417564,37.594648,0 -122.374306,37.548933,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4736881,-1.9557165999999597", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Nathan Pilsner", "yes", "B20 3PU", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.462883,37.628916,0 -122.445374,37.639247,0 -122.426147,37.648762,0 -122.405205,37.642238,0 -122.400055,37.628644,0 -122.392159,37.610696,0 -122.372246,37.604712,0 -122.417564,37.594648,0 -122.462196,37.628644,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5107637,-1.9098997999999483", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Pavel Heineken", "yes", "B19 1HP", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.43576,37.790795,0 -122.449493,37.801646,0 -122.425461,37.809784,0 -122.402115,37.811411,0 -122.390442,37.794593,0 -122.408295,37.79188,0 -122.434387,37.789167,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5050268,-1.9082467000000634", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Juan Artois", "yes", "B23 5LD", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.463398,37.760266,0 -122.477349,37.774785,0 -122.427349,37.774785,0 -122.429237,37.763658,0 -122.46357,37.760808,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5425269,-1.8496752999999444", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Jacques Desperados", "yes", "B9 5AA", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.418766,37.747779,0 -122.425289,37.768951,0 -122.406063,37.769901,0 -122.406063,37.749679,0 -122.418251,37.747508,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4750739,-1.8556466", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Juan Stella", "no", "B18 4DL", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.121277,37.386799,0 -122.108917,37.362244,0 -122.077675,37.3385,0 -122.064285,37.378615,0 -122.069778,37.3898,0 -122.076645,37.402619,0 -122.078705,37.411619,0 -122.113037,37.414618,0 -122.121277,37.386799,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4882463,-1.9428454999999758", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Agnezka San Miguel", "no", "B63 4JU", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.047119,37.33113,0 -122.065315,37.332495,0 -122.077675,37.3385,0 -122.064285,37.378615,0 -122.036819,37.385162,0 -122.006607,37.382162,0 -122.00386,37.342048,0 -122.047119,37.331403,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.44306599999999,-2.0674094999999397", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Pierre Stella", "yes", "B13 1LE", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-121.935196,37.345051,0 -121.931076,37.294267,0 -121.871338,37.293721,0 -121.806793,37.293174,0 -121.798553,37.361426,0 -121.879578,37.36088,0 -121.934509,37.345597,0 -121.935196,37.345051,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4371068,-1.8713384000000133", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Vincent San Miguel", "yes", "B29 7JL", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-121.935883,37.253287,0 -121.931076,37.294267,0 -121.871338,37.293721,0 -121.806793,37.293174,0 -121.790657,37.234702,0 -121.852455,37.223221,0 -121.935539,37.253014,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4438839,-1.9175537999999506", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Juan Smirnoff", "yes", "B18 4EJ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-121.947556,37.435612,0 -121.934509,37.476493,0 -121.893311,37.469409,0 -121.852798,37.429615,0 -121.843872,37.400165,0 -121.887817,37.3898,0 -121.959915,37.420345,0 -121.959915,37.427979,0 -121.948929,37.435612,0 -121.947556,37.435612,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4865637,-1.9397257000000536", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Nathan Guinness", "no", "B18 5DX", "<Polygon><outerBoundaryIs><LinearRing><coordinates>-122.02343,37.52198,0 -122.023773,37.558731,0 -121.989784,37.573426,0 -121.959572,37.566351,0 -121.944466,37.544305,0 -121.967125,37.520891,0 -122.023087,37.522525,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4951721,-1.93240830000002", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Katarzina Pride", "no", "B9 5NT", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.47881,-1.84519,37.558731,0 52.47808,-1.84382,0 52.47954,-1.84184,0 52.4815,-1.84279,0 52.48145,-1.8427,0 -52.47881,-1.84519</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4796527,-1.8437493999999788", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Michal Pride", "no", "B29 6ST", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.44377,-1.94844,0 52.44304,-1.94707,0 52.4445,-1.9451,0 52.44647,-1.94604,0 52.44641,-1.94596,0 52.44636,-1.94699,0 52.44377,-1.94844,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4446913,-1.945888200000013", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Pierre Artois", "no", "B79 7ES", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.63568,-1.70333,0 52.63495,-1.70196,0 52.63641,-1.69999,0 52.63837,-1.70093,0 52.63831,-1.70084,0 52.63826,-1.70187,0 52.63568,-1.70333,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.63686209999999,-1.700669199999993", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Michal Stella", "no", "B36 8BG", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.5009,-1.80021,0 52.50017,-1.79884,0 52.50164,-1.79687,0 52.50359,-1.79781,0 52.50354,-1.79773,0 52.50349,-1.79876,0 52.5009,-1.80021,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5012041,-1.7978590999999824", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Nathan Paulaner", "no", "B19 1HN", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.50542,-1.90982,0 52.50469,-1.90845,0 52.50615,-1.90647,0 52.50811,-1.90742,0 52.50806,-1.90733,0 52.50801,-1.90836,0 52.50542,-1.90982,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5060065,-1.9079206000000113", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Nathan Artois", "no", "B36 8JE", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.49827,-1.8185,0 52.49753,-1.81712,0 52.499,-1.81515,0 52.50096,-1.81609,0 52.5009,-1.81601,0 52.50085,-1.81704,0 52.49827,-1.8185,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.49948149999999,-1.8165748999999778", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Pavel Stella", "no", "B70 7SB", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51347,-2.00282,0 52.51274,-2.00144,0 52.5142,-1.99947,0 52.51616,-2.00041,0 52.51611,-2.00033,0 52.51605,-2.00136,0 52.51347,-2.00282,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5145825,-2.0002953000000616", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["John San Miguel", "no", "B12 0YH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.46484,-1.88763,0 52.46411,-1.88626,0 52.46557,-1.88429,0 52.46753,-1.88523,0 52.46748,-1.88514,0 52.46743,-1.88617,0 52.46484,-1.88763,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.46553369999999,-1.8870887000000494", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Katarzina Desperados", "no", "B8 3AP", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.4858,-1.84635,0 52.48507,-1.84498,0 52.48653,-1.843,0 52.48849,-1.84395,0 52.48844,-1.84386,0 52.48839,-1.84489,0 52.4858,-1.84635,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4866932,-1.8447701000000052", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Jean-Michel Stella", "no", "B20 3ED", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51041,-1.8951,0 52.50968,-1.89373,0 52.51114,-1.89175,0 52.5131,-1.8927,0 52.51305,-1.89261,0 52.513,-1.89364,0 52.51041,-1.8951,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.511298,-1.8929834000000483", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Paul Kronembourg", "no", "B9 5EP", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.47561,-1.85733,0 52.47488,-1.85596,0 52.47634,-1.85399,0 52.4783,-1.85493,0 52.47825,-1.85485,0 52.4782,-1.85588,0 52.47561,-1.85733,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4769152,-1.8543302000000494", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Paul Doombar", "no", "B16 9SQ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.47488,-1.94214,0 52.47414,-1.94076,0 52.47561,-1.93879,0 52.47757,-1.93973,0 52.47752,-1.93965,0 52.47746,-1.94068,0 52.47488,-1.94214,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4752091,-1.939225800000031", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Jacques Bombarider", "no", "B8 2XQ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.49474,-1.84395,0 52.49401,-1.84257,0 52.49547,-1.8406,0 52.49743,-1.84154,0 52.49738,-1.84146,0 52.49732,-1.84249,0 52.49474,-1.84395,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.49516029999999,-1.8437092000000348", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Gunther Bombarider", "no", "BL1 2SR", "<Polygon><outerBoundaryIs><LinearRing><coordinates>53.58597,-2.42474,0 53.58415,-2.42736,0 53.58329,-2.42139,0 53.58523,-2.42,0 53.58597,-2.42474,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "53.58480789999999,-2.4241342999999915", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Michal Pilsner", "no", "B9 5EH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.47763,-1.856,0 52.47577,-1.85862,0 52.47488,-1.85266,0 52.47688,-1.85126,0 52.47763,-1.856,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4759446,-1.8545248000000356", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Vitor Kronembourg", "no", "B33 8DR", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.48357,-1.80388,0 52.4817,-1.8065,0 52.48081,-1.80054,0 52.48281,-1.79914,0 52.48357,-1.80388,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.482018,-1.8022465999999895", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Jacques Doombar", "no", "B29 5DS", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.43297,-1.97426,0 52.4311,-1.97688,0 52.43021,-1.97091,0 52.43221,-1.96952,0 52.43297,-1.97426,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4316561,-1.9732903999999962", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Agnezka Kronembourg", "no", "B20 2AH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51756,-1.91739,0 52.51569,-1.92001,0 52.5148,-1.91405,0 52.5168,-1.91265,0 52.51756,-1.91739,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.51595589999999,-1.9168151999999736", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Jean-Michel Desperados", "no", "B33 0XL", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.47711,-1.78195,0 52.47524,-1.78457,0 52.47435,-1.77861,0 52.47635,-1.77721,0 52.47711,-1.78195,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4758316,-1.7810881999999992", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Pavel San Miguel", "no", "B19 1LL", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.50964,-1.90443,0 52.50777,-1.90705,0 52.50689,-1.90109,0 52.50888,-1.89969,0 52.50964,-1.90443,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5074856,-1.9025987999999643", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Michal Artois", "no", "B42 2SY", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51954,-1.89727,0 52.51767,-1.89989,0 52.51679,-1.89392,0 52.51878,-1.89253,0 52.51954,-1.89727,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5178629,-1.8955170000000408", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Vitor Pilsner", "no", "BD3 0AD", "<Polygon><outerBoundaryIs><LinearRing><coordinates>53.80064,-1.7336,0 53.79883,-1.73622,0 53.79797,-1.73025,0 -53.79991,-1.72886,0 53.80064,-1.7336,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "53.7992875,-1.7323604000000614", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Nathan Bombardier", "no", "BL3 5NU", "<Polygon><outerBoundaryIs><LinearRing><coordinates>53.57509,-2.45316,0 53.57327,-2.45578,0 53.57241,-2.44981,0 53.57436,-2.44842,0 53.57509,-2.45316,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "53.57374960000001,-2.451840500000003", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Katarzina Paulaner", "no", "B24 9SJ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51673,-1.83039,0 52.51487,-1.83301,0 52.51398,-1.82705,0 52.51598,-1.82565,0 52.51673,-1.83039,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5158172,-1.8292830999999978", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Jean-Michel Guinness", "no", "B44 8NB", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.53843,-1.8991,0 52.53656,-1.90172,0 52.53568,-1.89576,0 52.53767,-1.89436,0 52.53843,-1.8991,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.53680670000001,-1.8979636999999911", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Vincent Bombarider", "no", "B17 8JH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.48267,-1.9603,0 52.4808,-1.96292,0 52.47991,-1.95695,0 52.48191,-1.95556,0 52.48267,-1.9603,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4813668,-1.959183899999971", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Vitor Paulaner", "no", "B6 6LT", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.50945,-1.89464,0 52.50758,-1.89726,0 52.50669,-1.89129,0 52.50869,-1.8899,0 52.50945,-1.89464,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5080257,-1.892991400000028", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Nathan Kronembourg", "no", "B21 8EF", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.51488,-1.94348,0 52.51301,-1.94609,0 52.51212,-1.94013,0 52.51412,-1.93873,0 52.51488,-1.94348,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5136611,-1.9433284000000413", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Pavel Paulaner", "no", "B8 1NS", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.49294,-1.8543,0 52.49107,-1.85692,0 52.49018,-1.85095,0 52.49218,-1.84956,0 52.49294,-1.8543,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.49148659999999,-1.853192300000046", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Vitor Heineken", "no", "B4 6HJ", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.48703,-1.9006,0 52.48516,-1.90322,0 52.48427,-1.89726,0 52.48627,-1.89586,0 52.48703,-1.9006,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4858084,-1.899657100000013", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Vincent Smirnoff", "no", "B23 7SF", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.5221,-1.87531,0 52.52023,-1.87792,0 52.51934,-1.87196,0 52.52134,-1.87056,0 52.5221,-1.87531,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5204497,-1.8746128999999883", "http://maps.google.com/mapfiles/ms/icons/green.png"],
  ["Vitor San Miguel", "no", "B18 5RD", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.49554,-1.92792,0 52.49367,-1.93054,0 52.49278,-1.92457,0 52.49478,-1.92318,0 52.49554,-1.92792,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4941166,-1.9262827000000016", "http://maps.google.com/mapfiles/ms/icons/yellow.png"],
  ["Pavel Seize-Soinxante-Quatre", "no", "B11 3LH", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.45078,-1.86243,0 52.44891,-1.86505,0 52.44802,-1.85908,0 52.45002,-1.85769,0 52.45078,-1.86243,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.4493234,-1.8605126999999584", "http://maps.google.com/mapfiles/ms/icons/blue.png"],
  ["Pierre Paulaner", "no", "B6 7PT", "<Polygon><outerBoundaryIs><LinearRing><coordinates>52.50615,-1.87232,0 52.50429,-1.87494,0 52.5034,-1.86898,0 52.5054,-1.86758,0 52.50615,-1.87232,0</coordinates></LinearRing></outerBoundaryIs></Polygon>", "52.5049475,-1.8712242999999944", "http://maps.google.com/mapfiles/ms/icons/green.png"],
];