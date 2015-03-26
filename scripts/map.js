function Map(config) {

    this.mapContainer = config.mapContainer;
    this.infoContainer = config.infoContainer;
    this.quakeRange = config.quakeRange;
    this.slideOutSpeed = config.slideOutSpeed;
    this.closeInfo = $('#close-info');
    this.markers = [];
    this.gMarkers = [];
    this.baseURL = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/week';
    this.mapOptions = {
        center: { lat: 51.511748, lng: -0.121218},
        zoom: 3
    };
    this.markerCluster = [];
    this.googleMap = new google.maps.Map(document.getElementById('map'), this.mapOptions);
    this.center = this.googleMap.getCenter();
};

Map.prototype = (function(){

    var init = function(){

        var self = this;

        bindUiEvents(self);
        loadData(self);
        resizeMap();

    },

    bindUiEvents = function(self){

        self.closeInfo.click(function(){
            closeFilters(self);
        });

        self.quakeRange.on('change', function(){
            var range = $(this);
            adjustRange(self, range);
        });

    },

    loadData =  function(self){

        $.ajax({
            url: self.baseURL,
            data: {name: 'earthquakes'},
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'eqfeed_callback',
            success: function(data){
                self.markers = data.features;
                createMarker(self);
                console.log(data);
            }
        });

    },

    createMarker =  function(self){

        var bounds = new google.maps.LatLngBounds();

        for ( var i = 0; i < self.markers.length; i++ ) {

            var data = self.markers[i];
            var latLng = new google.maps.LatLng(data.geometry.coordinates[1], data.geometry.coordinates[0]);

            var marker = new google.maps.Marker({
                position: latLng,
                map: self.googleMap,
                title: data.id,
                id: i,
                icon: "../images/layout/generic-skin/pin.png",
                animation: google.maps.Animation.DROP
            });

            /* Add magnitude data property to marker object */
            marker.mag = data.properties.mag;

            self.gMarkers.push(marker);

            bounds.extend(marker.position);

            google.maps.event.addListener(marker, 'click', function(){

                var activeMarker = this;

                var data = self.markers[activeMarker.id];

                var contentString = '';

                contentString += '<tr><td>Earthquake ID:</td><td>' + data.id + '</td></tr>';
                contentString += '<tr><td>Earthquake magnitude:</td><td>' + data.properties.mag + '</td></tr>';
                contentString += '<tr><td>Earthquake location:</td><td>' + data.properties.place + '</td></tr>';
                contentString += '<tr><td>More information:</td><td><p><a href="' + data.properties.url + '" target="_blank">Website link</a></p></td></tr>';

                $('.data-table').html(contentString);
                openFilters(self);

            });

        }

        self.googleMap.setCenter(self.center);

        var mcOptions = {gridSize: 50, maxZoom: 15};
        self.markerCluster = new MarkerClusterer(self.googleMap, self.gMarkers, mcOptions);

    },

    openFilters = function(self){

        self.mapContainer.animate({
            marginLeft : $(window).width() / 4
        }, self.slideOutSpeed).addClass('open');

        self.infoContainer.animate({
            width: $(window).width() / 4,
            height: $(window).height()
        }, self.slideOutSpeed)
            .find('table')
                .fadeIn(self.slideOutSpeed)
                    .css('width', $(window).width() / 4)
                        .find('#close-info').fadeIn();

    },

    closeFilters = function(self){

        self.mapContainer.animate({
            marginLeft : '0'
        }, self.slideOutSpeed).removeClass('open');

        self.infoContainer.animate({
            width: '0',
            height: $(window).height()
        }, self.slideOutSpeed).find('table')
                .fadeOut(self.slideOutSpeed)
                    .find('#close-info').fadeOut();

    },

    resizeMap =  function() {

        $('#map').css("height", $(window).height());
        console.log(self.googleMap);
        //self.googleMap.setCenter(self.center);

    },

    adjustRange = function(self, range){

        var rangeValue = range.val();

        for ( var i = 0; i < self.gMarkers.length; i++ ) {

            if ( rangeValue >= self.gMarkers[i].mag ) {
                self.gMarkers[i].setVisible(true);
            } else {
                self.gMarkers[i].setVisible(false);
            }

        }

        /* Re calculate the markerClusters on range event */
        self.markerCluster.setIgnoreHidden(true);
        self.markerCluster.repaint();

    };

    return {
        init: init
    };

})();

var map1 = new Map({
    mapContainer : $('.map-container'),
    infoContainer : $('.info-container'),
    quakeRange : $('#quakeRange'),
    slideOutSpeed : 400
});

map1.init();

