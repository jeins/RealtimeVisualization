'use strict';

function Action(map) {
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
        win: 'green',
        lose: 'red',
        netral: 'grey'
    }
}

Action.prototype.getDuration = function(length){
    return length / 1200 * this.animationTime;
};

Action.prototype.endAll = function(transition, callback){
    if(transition.size() === 0){
        callback();
    }

    let n = 0;

    transition.each(function() {
        ++n;
    }).each('end', function(){
        if(! --n){
            callback.apply(this, arguments);
        }
    });
};

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

Action.prototype.getMidPoints = function(size, from, to){
    let master = {
        x: this.map.latLngToLayerPoint(to).x,
        y: this.map.latLngToLayerPoint(to).y
    };
    let crawler = {
        x: this.map.latLngToLayerPoint(from).x,
        y: this.map.latLngToLayerPoint(from).y
    };


    let midPoint = [
        (master.x + crawler.x) / 2,
        (master.y + crawler.y) / 2
    ];

    if (size == 1) {
        return [ midPoint ];
    }

    // let isOdd = size % 2;
    // let midPoints = [];
    //
    // if(isOdd){
    //     midPoints.push(midPoint);
    //     size --;
    // }
    //
    // let range = 0.1;
    // if (size > 2) {
    //     if (isOdd) {
    //         range = Math.log(size) / 10;
    //     } else {
    //         range = Math.log(size) / 10 * 0.7;
    //     }
    // }
    //
    // let amplitude;
    // for (let i = 0, j = 1; i < size; i = i + 2, j ++) {
    //     amplitude = range / (size / 2) * j;
    //
    //     midPoints.push([
    //         (master.x + crawler.x) / 2 - amplitude * (master.y - crawler.y),
    //         (master.y + crawler.y) / 2 + amplitude * (master.x - crawler.x)
    //     ]);
    //
    //     midPoints.push([
    //         (master.x + crawler.x) / 2 - (- amplitude) * (master.y - crawler.y),
    //         (master.y + crawler.y) / 2 + (- amplitude) * (master.x - crawler.x)
    //     ]);
    // }
    //
    // return midPoint;
};

Action.prototype.shoot = function(shots){
    let color = "#ff0000";
    let trajectory = d3.svg.line()
        .x(function(d, i) {
            return d.x;
        }).y(function(d, i) {
            return d.y;
        }).interpolate("basis");
    let shotContainer = this.mapLayer.append("g");
    // let master = _(shots).chain()
    //     .groupBy(function(shot) {
    //         return shot.master.latitude + "x" + shot.master.longitude;
    //     }).values().value();
    let workerCoordinates = new L.LatLng(shots.worker.latitude, shots.worker.longitude);//this.projection([shots[0].worker.longitude, shots[0].worker.latitude]);
    let masterCoordinates = new L.LatLng(shots.master.latitude, shots.master.longitude);

    this.blow(this.map.latLngToLayerPoint(workerCoordinates).x, this.map.latLngToLayerPoint(workerCoordinates).y, color);

    // for (let i = 0; i < master.length; i ++) {
    //     let shots = master[i];
        let midPoints = this.getMidPoints(
            1,
            workerCoordinates,
            masterCoordinates
        );
        //
        // for (let j = 0; j < shots.length; j++) {
        //     let shot = shots[j];
            let trajectoryData = [{
                x: this.map.latLngToLayerPoint(workerCoordinates).x,
                y: this.map.latLngToLayerPoint(workerCoordinates).y
            }, {
                x: midPoints[0][0],
                y: midPoints[0][1]
            }, {
                x: this.map.latLngToLayerPoint(masterCoordinates).x,
                y: this.map.latLngToLayerPoint(masterCoordinates).y
            }];

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
        // }

        let path = shotContainer.selectAll(".path-0");

        (function (action, path, masterCoordinates) {
            let totalLength = d3.max(path[0], function (p) {
                return p.getTotalLength();
            });
            let animationTime = action.getDuration(totalLength);

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
                    .call(action.endAll, function (d) {
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
    // }
};

Action.prototype.getFirstStageInterpolater = function(d, totalLength){
    let length, offset;

    switch (d) {
        case 2 : offset = 0; length = 100; break;
        case 3 : offset = 25; length = 75;break;
        case 4 : offset = 50; length = 50;break;
    }

    let interpolateLength = d3.interpolate(0, length);
    let interpolateOffset = d3.interpolate(0, offset);

    return function(t) {
        return "0 " + interpolateOffset(t) + " " + interpolateLength(t) + " " + totalLength;
    };
};

Action.prototype.getSecondStageInterpolater = function(d, totalLength){
    let length, offset;

    switch (d) {
        case 2 : offset = 0; length = 100; break;
        case 3 : offset = 25; length = 75;break;
        case 4 : offset = 50; length = 50;break;
    }

    let interpolate = d3.interpolate(0, totalLength);

    return function(t) {
        return "0 " + (interpolate(t) + offset) + " " + length + " " + (totalLength - interpolate(t));
    };
};