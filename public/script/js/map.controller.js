'use strict';

function Map(){
    this.vLayer =
    this.leafletMap = this.setAttribute();
    this.leafletMap.fitWorld().zoomIn();

    L.svg().addTo(this.leafletMap);

    this.svg = d3.select("#map").select("svg");
    this.mapLayer = this.svg.append("g");
}

Map.prototype.setAttribute = function () {
    let mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';

    let grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr});

    return L.map('map', {
        layers: grayscale
    });
};