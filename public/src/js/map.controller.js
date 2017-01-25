'use strict';

function Map(){
    this.leafletMap = this.setMapWithAttribute();
    this.leafletCluster = new PruneClusterForLeaflet();
    this.setupMarkerCluster();

    this.leafletMap.fitWorld().zoomIn();
    // this.leafletMap.setView([50.763134, 10.4775125], 6);

    L.svg().addTo(this.leafletMap);

    this.svg = d3.select("#map").select("svg");
    this.mapLayer = this.svg.append("g");

    this.leafletMap.addLayer(this.leafletCluster);
}

Map.prototype.setMasterLocation = function(latitude, longitude){
    L.heatLayer([
        [latitude, longitude, 0.5]
    ], {radius: 25}).addTo(this.leafletMap);
};

Map.prototype.setWorkerLocation = function(latitude, longitude, statusPoint){
    var markerColors = this.setMarkerColors();console.log(statusPoint);
    var marker = new PruneCluster.Marker(latitude, longitude, {icon: markerColors[statusPoint]});

    switch (statusPoint){
        case 'win': marker.category = 0; break;
        case 'draw': marker.category = 1; break;
        case 'lost': marker.category = 2; break;
    }

    this.leafletCluster.RegisterMarker(marker);
    this.leafletCluster.ProcessView();
};

Map.prototype.setupMarkerCluster = function(){
    this.leafletCluster.BuildLeafletClusterIcon = function(cluster) {
        var e = new L.Icon.MarkerCluster();

        e.stats = cluster.stats;
        e.population = cluster.population;
        return e;
    };

    L.Icon.MarkerCluster = L.Icon.extend({
        options: {
            iconSize: new L.Point(44, 44),
            className: 'prunecluster leaflet-markercluster-icon'
        },

        createIcon: function () {
            var e = document.createElement('canvas');
            this._setIconStyles(e, 'icon');
            var s = this.options.iconSize;
            e.width = s.x;
            e.height = s.y;
            this.draw(e.getContext('2d'), s.x, s.y);
            return e;
        },

        createShadow: function () {
            return null;
        },

        draw: function(canvas, width, height) {
            var colors = [
                '#23AC20', //win
                '#767676', //draw
                '#CA2038'  //lost
            ];

            var lol = 0;
            var start = 0;

            for (var i = 0, l = colors.length; i < l; ++i) {

                var size = this.stats[i] / this.population;


                if (size > 0) {
                    canvas.beginPath();
                    canvas.moveTo(22, 22);
                    canvas.fillStyle = colors[i];
                    var from = start + 0.14,
                        to = start + size * Math.PI * 2;

                    if (to < from) {
                        from = start;
                    }
                    canvas.arc(22,22,22, from, to);

                    start = start + size * Math.PI * 2;
                    canvas.lineTo(22,22);
                    canvas.fill();
                    canvas.closePath();
                }

            }

            canvas.beginPath();
            canvas.fillStyle = 'white';
            canvas.arc(22, 22, 18, 0, Math.PI*2);
            canvas.fill();
            canvas.closePath();

            canvas.fillStyle = '#555';
            canvas.textAlign = 'center';
            canvas.textBaseline = 'middle';
            canvas.font = 'bold 12px sans-serif';

            canvas.fillText(this.population, 22, 22, 40);
        }
    });
};

Map.prototype.setMarkerColors = function(){
    var greenMarker = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var greyMarker = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var redMarker = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return {win: greenMarker, draw: greyMarker, lost: redMarker};
};

Map.prototype.setMapWithAttribute = function () {
    var me = this;

    return L.map('map', {
        fullscreenControl: {
            pseudoFullscreen: false
        },
        layers: me.setLayer()
    });
};

Map.prototype.setLayer = function () {
    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';

    return L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr});
};