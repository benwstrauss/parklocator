'use strict';

angular.module('parkLocator').controller('parkCtrl', [ '$scope', '$state', '$stateParams', 'mapService', 'parkService', 'uiGmapGoogleMapApi', 'amenitiesService',
	function ($scope, $state, $stateParams, mapService, parkService, gMapsAPI, amenitiesService) {

		var parkName = $stateParams.name,
				directionsService,
	  		directionsDisplay,
	  		icons,
	  		map;

	  // Define some async objects from our services
    $scope.parks = parkService.markers;
    $scope.amenities = amenitiesService.list;
    $scope.myLoc = mapService.map.myLocationMarker.coords;
    $scope.map = mapService.map;

	  gMapsAPI.then( function (maps) {
	  	$scope.mapsApi = maps;
      // Directions Service
      initializeDirectionsMap();

	  });

	  $scope.showAmenityInMap = function (activity) {
	  	console.log(activity);
	  	// activity.onMarkerClicked();
    	// $scope.map.location.coords.latitude = activity.latitude;
    	// $scope.map.location.coords.longitude = activity.longitude;
    	$scope.map.zoom = 18;
	  };

	  var initializeDirectionsMap = function () {
	  	if ( !document.getElementById('mini-map') ) { return; }
	  	
	    directionsService = new $scope.mapsApi.DirectionsService();
	    directionsDisplay = new $scope.mapsApi.DirectionsRenderer({ suppressMarkers: true });
	    generateMarkerIcons();
	    var styledMap = new $scope.mapsApi.StyledMapType($scope.map.options.secondaryStyles, {name: 'Light Dream'});
	    var mapOptions = {
		    zoom: 16,
		    scrollwheel: false,
		    center: new $scope.mapsApi.LatLng($scope.myLoc.latitude, $scope.myLoc.longitude),
		    mapTypeControlOptions: {
		      mapTypeIds: [$scope.mapsApi.MapTypeId.ROADMAP, 'light_dream']
		    }
		  };
		  map = new $scope.mapsApi.Map(document.getElementById('mini-map'), mapOptions);
	  	directionsDisplay.setMap( map );
		  map.mapTypes.set('light_dream', styledMap);
		  map.setMapTypeId('light_dream');
      // $scope.mapsApi.event.addListenerOnce(map, 'idle', function() {
      //    $scope.mapsApi.event.trigger(map, 'resize');
      // });
	  };

	  var generateMarkerIcons = function () {
	  	icons = {
			  start: new $scope.mapsApi.MarkerImage('https://s3.amazonaws.com/davidmeza/Park_Locator/user.png',
			    // (width,height)
			    new $scope.mapsApi.Size( 45, 45 ),
			    // The origin point (x,y)
			    new $scope.mapsApi.Point( 0, 0 ),
			    // The anchor point (x,y)
			    new $scope.mapsApi.Point( 24, 39 ) ),
			  end: new $scope.mapsApi.MarkerImage('https://s3.amazonaws.com/davidmeza/Park_Locator/tree-small.png',
			   // (width,height)
			   new $scope.mapsApi.Size( 45, 50 ),
			   // The origin point (x,y)
			   new $scope.mapsApi.Point( 0, 0 ),
			   // The anchor point (x,y)
			   new $scope.mapsApi.Point( 25, 46 ) )
			};
	  };

	  var calcRoute = function (park) {
	  	if ( !verifyPark() ) { return; }

		  var request = {
		      origin: new $scope.mapsApi.LatLng($scope.myLoc.latitude, $scope.myLoc.longitude),
		      destination: new $scope.mapsApi.LatLng(park.latitude, park.longitude),
		      travelMode: $scope.mapsApi.TravelMode.DRIVING,
		  };
		  directionsService.route(request, displayDirections);
		};

		var verifyPark = function () {
			if ($scope.parks[parkName]) {
				$scope.parks.currentPark = $scope.parks[parkName];
				return true;
			} 
			$state.go('home');
		};

		var displayDirections = function (response, status) {
	    if (status === $scope.mapsApi.DirectionsStatus.OK) {
	      directionsDisplay.setDirections(response);
	      placeCustomMarkers(response);
	      extractDirectionsInfo(response);
	    } else {
	    	console.log('Error happened... Maybe over query limit?');
	    }
	  };

	  $scope.$watchGroup(['parks.currentPark', 'myLoc.latitude', 'myLoc.longitude'], function () {
	  	calcRoute($scope.parks.currentPark);
	  });

	  var placeCustomMarkers = function (response) {
	  	var leg = response.routes[0].legs[0];
	  	makeMarker( leg.start_location, icons.start, 'You' );
  		makeMarker( leg.end_location, icons.end, 'Park' );
	  };

	  var startEndMarkers = [];

	  var makeMarker = function ( position, icon, title ) {
	  	if (startEndMarkers[startEndMarkers.length - 2]) { startEndMarkers[startEndMarkers.length - 2].setMap(null); }
	  	var marker = new $scope.mapsApi.Marker({
	  		position: position,
	  		map: map,
	  		icon: icon,
	  		title: title,
	  		animation: $scope.mapsApi.Animation.DROP
	  	});
	  	startEndMarkers.push(marker);
	  };

	  var extractDirectionsInfo = function (response) {
	  	var r = response.routes[0].legs[0];
	  	var dt = r.distance.text;
	  	var dur = r.duration.text;
	  	// Other valuable information may include waypoints, steps, coordinates, etc.
	  	$scope.routeData = {
	  		distance: dt,
	  		duration: dur
	  	};

	  	// Color code the dist / dur text
	  	var a = parseInt(dt);
	  	var b = parseInt(dur);
	  	$scope.distanceColoring = { 'text-green': a <= 2, 'text-warning': a > 2 && a <= 10, 'text-danger': a > 10 };
	  	$scope.durationColoring = { 'text-green': b <= 5, 'text-warning': b > 5 && b <= 20, 'text-danger': b > 20 };

	  };


  }]);
