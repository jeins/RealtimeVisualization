'use strict';

/**
 * animation over the map (shoot line & blow circle)
 * @param map
 * @constructor
 */
function Action(map) {
    this.m = map;
    this.map = map.leafletMap;
    this.mapLayer = map.mapLayer;
    this.animationTime = 2500;
    this.blowRadiusScale = d3.scale.linear()
        .domain([1, 2])
        .range([50, 60]);
    this.blowStrokeScale = d3.scale.linear()
        .domain([1, 2])
        .range([7, 10]);
    this.colorSet = {
        win: '#23AC20',
        lost: '#CA2038',
        draw: '#767676'
    };
    this.lineCollection = {};
}

/**
 * get animate duration
 * @param length
 * @returns {number}
 */
Action.prototype.getDuration = function(length){
    return length / 1200 * this.animationTime;
};

/**
 * action end all animation (blow and shoot line)
 * @param transition
 * @param callback
 */
Action.prototype.endAll = function(transition, callback){
    if(transition.size() === 0){
        callback();
    }

    var n = 0;

    transition.each(function() {
        ++n;
    }).each('end', function(){
        if(! --n){
            callback.apply(this, arguments);
        }
    });
};

/**
 * animate blow circle if the shoot line receive the target / master
 * @param x
 * @param y
 * @param color
 * @param callback
 */
Action.prototype.blow = function(x, y, color, callback){
    this.mapLayer.append('circle')
        .datum(1)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', 'transparent')
        .attr('stroke', color)
        .attr('stroke-width', this.blowStrokeScale)
        .attr('stroke-opacity', 1)
        .transition()
        .duration(this.animationTime / 2)
        .attr('r', this.blowRadiusScale)
        .attr('stroke-opacity', 0)
        .each('end', function(){
            d3.select(this).remove();

            callback ? callback() : null;
        });
};

/**
 * get the middle point between two worker and master coordinate
 * @param worker
 * @param master
 * @returns {{x: number, y: number}}
 */
Action.prototype.getMidPoints = function(worker, master){
    return {
        x: (this.map.latLngToLayerPoint(master).x + this.map.latLngToLayerPoint(worker).x) / 2,
        y: (this.map.latLngToLayerPoint(master).y + this.map.latLngToLayerPoint(worker).y) / 2
    };
};

/**
 * displaying a shoot line from worker to master
 * and if the shoot line receive the master,
 * calling method to animate blow circle, then stop all animation
 * @param shots
 */
Action.prototype.shoot = function(shots){
    var color = this.colorSet[shots.worker.statusPoint];
    var trajectory = d3.svg.line()
        .x(function(d) {
            return d.x;
        }).y(function(d) {
            return d.y;
        }).interpolate("basis");
    var shotContainer = this.mapLayer.append("g");
    var workerCoordinates = new L.LatLng(shots.worker.latitude, shots.worker.longitude);
    var masterCoordinates = new L.LatLng(shots.master.latitude, shots.master.longitude);

    this.blow(this.map.latLngToLayerPoint(workerCoordinates).x, this.map.latLngToLayerPoint(workerCoordinates).y, color);

    var midPoints = this.getMidPoints(workerCoordinates,masterCoordinates);
    var trajectoryData = [{
        x: this.map.latLngToLayerPoint(workerCoordinates).x,
        y: this.map.latLngToLayerPoint(workerCoordinates).y
    }, {
        x: midPoints.x,
        y: midPoints.y
    }, {
        x: this.map.latLngToLayerPoint(masterCoordinates).x,
        y: this.map.latLngToLayerPoint(masterCoordinates).y
    }];

    this.drawLine(shots);

    shotContainer.selectAll(".path")
        .data([2, 3, 4])
        .enter()
        .append("path")
        .attr("class", "path-0")
        .attr("d", trajectory(trajectoryData))
        .attr("stroke", color)
        .attr("visibility", "hidden")
        .attr("fill", "none")
        .attr("stroke-width", function (d) {
            return d;
        });

    var path = shotContainer.selectAll(".path-0");

    (function (action, path, masterCoordinates) {
        var totalLength = d3.max(path[0], function (p) {
            return p.getTotalLength();
        });
        var animationTime = action.getDuration(totalLength);

        path.attr("stroke-dasharray", "0 0 0 " + totalLength)
            .attr("visibility", "visible")
            .transition()
            .duration(animationTime / (totalLength / 100))
            .ease("linear")
            .attrTween("stroke-dasharray", function (d) {
                return action.getFirstStageInterpolater(d, totalLength);
            }).each("end", function () {
            d3.select(this)
                .transition()
                .duration(animationTime)
                .ease("linear")
                .attrTween("stroke-dasharray", function (d) {
                    return action.getSecondStageInterpolater(d, totalLength);
                })
                .call(action.endAll, function () {
                    action.blow(
                        action.map.latLngToLayerPoint(masterCoordinates).x,
                        action.map.latLngToLayerPoint(masterCoordinates).y,
                        color,
                        function () {
                            shotContainer.remove();
                        });
                })
        });
    })(this, path, masterCoordinates);
};

/**
 * calculate the interpolate of the fist line
 * @param d
 * @param totalLength
 * @returns {Function}
 */
Action.prototype.getFirstStageInterpolater = function(d, totalLength){
    var length, offset;

    switch (d) {
        case 2 : offset = 0; length = 100; break;
        case 3 : offset = 25; length = 75;break;
        case 4 : offset = 50; length = 50;break;
    }

    var interpolateLength = d3.interpolate(0, length);
    var interpolateOffset = d3.interpolate(0, offset);

    return function(t) {
        return "0 " + interpolateOffset(t) + " " + interpolateLength(t) + " " + totalLength;
    };
};

/**
 * calculate the interpolate of the next line
 * @param d
 * @param totalLength
 * @returns {Function}
 */
Action.prototype.getSecondStageInterpolater = function(d, totalLength){
    var length, offset;

    switch (d) {
        case 2 : offset = 0; length = 100; break;
        case 3 : offset = 25; length = 75;break;
        case 4 : offset = 50; length = 50;break;
    }

    var interpolate = d3.interpolate(0, totalLength);

    return function(t) {
        return "0 " + (interpolate(t) + offset) + " " + length + " " + (totalLength - interpolate(t));
    };
};

/**
 * draw line between marker, if often data send
 * @param data
 */
Action.prototype.drawLine = function(data){
    var lineColor = [
        '#FFCCCC',
        '#FF9999',
        '#FF6666'
    ];
    var latLong = [
        [data.worker.latitude, data.worker.longitude],
        [data.master.latitude, data.master.longitude]
    ];

    var key = md5(latLong);
    var color = null;
    var redraw = false;
    var d = new Date();
    var currTime = d.getHours() + '.' + d.getMinutes() + '.' + d.getSeconds();

    var d = this.m.isClusterDisplayed();
    if(d.markers){
        var isClusterExist = false;
        for(var i=0; i<d.markers.length; i++){
            if(data.worker.latitude === d.markers[i].position.lat && data.worker.longitude === d.markers[i].position.lng){
                latLong[0] = [d.clusterPos.lat, d.clusterPos.lng];
                isClusterExist = true;
            }

            if(isClusterExist){
                var tmpLatLong = latLong;
                tmpLatLong[0] = [d.markers[i].position.lat, d.markers[i].position.lng];
                this.map.removeLayer(L.polyline(latLong));
            }
        }
    }

    if(!this.lineCollection.hasOwnProperty(key)) {
        this.lineCollection[key] = {count: 1, lastUpdate: currTime};
    }
    else {
        this.lineCollection[key].count += 1;
        this.lineCollection[key].lastUpdate = currTime;
    }
    this.lineCollection[key].pos = latLong;

    switch (this.lineCollection[key].count){
        case 3: color = lineColor[0]; redraw = true; break;
        case 5: color = lineColor[1]; redraw = true; break;
        case 8: color = lineColor[2]; redraw = true; break;
    }
    this.lineCollection[key].color = color;

    console.log(this.lineCollection);

    var line = L.polyline(this.lineCollection[key].pos, {color: this.lineCollection[key].color});

    if(redraw) {
        this.map.removeLayer(line);
        this.map.addLayer(line);
    }

    this.checkUpLine();
};

/**
 * check up the line if no more data send remove the line
 */
Action.prototype.checkUpLine = function(){
    var d = new Date();
    for(var key in this.lineCollection){
        if(!this.lineCollection.hasOwnProperty(key)) continue;

        var pl = L.polyline(this.lineCollection[key].pos, {color: this.lineCollection[key].color});
        var splitTime = this.lineCollection[key].lastUpdate.split('.');
        var diffTime = d.getSeconds() - splitTime[2];

        if(diffTime < 5 && this.lineCollection[key].count > 8){
            this.map.removeLayer(pl);
            this.lineCollection[key].count = 0;
            // delete this.lineCollection[key];
            console.log("rest line with key: " + key);
        }
    }
};