var map = {

    init: function(){

        this.mapContainer = $('.map-container');
        this.infoContainer = $('.info-container');
        this.gMarkers = [];
        this.mapOptions = {
            center: { lat: 51.511748, lng: -0.121218},
            zoom: 3
        };
        this.googleMap = new google.maps.Map(document.getElementById('map'), this.mapOptions);

        google.maps.event.addDomListener(window, 'load', map.init);
        google.maps.event.addDomListener(window, 'resize', map.reSizeMap);

        map.reSizeMap();
        map.loadData();
        map.bindUiEvents();

    },

    bindUiEvents: function(){

        $('#close-info').click(function(){
            map.closeFilters();
        });

        var range = $('#quakeRange');

        range.on('change', function(){

            map.adjustRange(range);

        }).on('keypress', function(){

            map.adjustRange(range);

        });

        $(window).resize(function(){
            map.reSizeMap();
        });

    },

    loadData: function(){

        $.ajax({
            url: 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/week',
            data: {name: 'earthquakes'},
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'eqfeed_callback',
            success: function(data){
                map.markers = data.features;
                map.createMarker();
            }
        });
    },

    createMarker: function(){

        map.bounds = new google.maps.LatLngBounds();

        for ( var i = 0; i < map.markers.length; i++ ) {

            var data = map.markers[i];
            var latLng = new google.maps.LatLng(data.geometry.coordinates[1], data.geometry.coordinates[0]);

            var marker = new google.maps.Marker({
                position: latLng,
                map: map.googleMap,
                title: data.id,
                id: i,
                icon: "../images/layout/generic-skin/pin.png",
                animation: google.maps.Animation.DROP
            });

            /* Add magnitude data property to marker object */
            marker.mag = data.properties.mag;
            map.gMarkers.push(marker);
            map.bounds.extend(marker.position);
            google.maps.event.addListener(marker, 'click', map.buildMarkup);

        }
        var center = map.googleMap.getCenter();
        map.googleMap.setCenter(center);

        var mcOptions = {gridSize: 50, maxZoom: 15};
        map.markerCluster = new MarkerClusterer(map.googleMap, map.gMarkers, mcOptions);

    },

    buildMarkup: function(){

        map.activeMarker = this;
        map.openFilters();
        var data = map.markers[this.id];
        var contentString = '';

        if (data.id) contentString += '<tr><td>Earthquake ID:</td><td>' + data.id + '</td></tr>';
        if (data.properties.mag) contentString += '<tr><td>Earthquake magnitude:</td><td>' + data.properties.mag + '</td></tr>';
        if (data.properties.place) contentString += '<tr><td>Earthquake location:</td><td>' + data.properties.place + '</td></tr>';
        if (data.properties.url) contentString += '<tr><td>More information:</td><td><p><a href="' + data.properties.url + '" target="_blank">Website link</a></p></td></tr>';

        $('.data-table').html(contentString);

    },

    openFilters: function() {

        map.mapContainer.animate({
            marginLeft : $(window).width() / 4
        }, 300).addClass('open');

        map.infoContainer.animate({
            width: $(window).width() / 4,
            height: $(window).height()
        }, 300).find('table, .panel-heading, .panel-body')
            .css('width',$(window).width() / 4 )
                .fadeIn(500)
                    .find('#close-info')
                        .fadeIn();

    },

    closeFilters: function(){

        map.mapContainer.animate({
            marginLeft : '0'
        }, 300).removeClass('open');

        map.infoContainer.animate({
            width: '0',
            height: $(window).height()
        }, 300).find('table')
                .fadeOut(200)
                    .find('#close-info')
                        .fadeOut();;
    },

    reSizeMap: function(){

        $('#map').css("height", $(window).height() - $('.site-header-wrapper').outerHeight());

        var center = map.mapOptions.center;
        map.googleMap.setCenter(center);

    },

    adjustRange: function(range){

        var rangeValue = range.val();

        for ( var i = 0; i < map.gMarkers.length; i++ ) {

            if ( rangeValue >= map.gMarkers[i].mag ) {

                map.gMarkers[i].setVisible(true);

            } else {

                map.gMarkers[i].setVisible(false);

            }
        }

        /* Re calculate the markerClusters on range event */
        map.markerCluster.setIgnoreHidden(true);
        map.markerCluster.repaint();
    }
}