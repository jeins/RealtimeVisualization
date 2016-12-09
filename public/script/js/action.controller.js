'use strict';

function Action(map) {
    this.map = map;
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

Action.prototype.blow = function(x, y, size, color, callback){
    this.mapLayer.append('circle')
        .datum(size)
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
    let midPoint = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2
    ];

    if (size == 1) {
        return [ midPoint ];
    }

    let isOdd = size % 2;
    let midPoints = [];

    if(isOdd){
        midPoints.push(midPoint);
        size --;
    }

    let range = 0.1;
    if (size > 2) {
        if (isOdd) {
            range = Math.log(size) / 10;
        } else {
            range = Math.log(size) / 10 * 0.7;
        }
    }

    let amplitude;
    for (let i = 0, j = 1; i < size; i = i + 2, j ++) {
        amplitude = range / (size / 2) * j;

        midPoints.push([
            (from[0] + to[0]) / 2 - amplitude * (to[1] - from[1]),
            (from[1] + to[1]) / 2 + amplitude * (to[0] - from[0])
        ]);

        midPoints.push([
            (from[0] + to[0]) / 2 - (- amplitude) * (to[1] - from[1]),
            (from[1] + to[1]) / 2 + (- amplitude) * (to[0] - from[0])
        ]);
    }

    return midPoint;
};

Action.prototype.shoot = function(shots){
    let color = "";
    let trajectory = d3.svg.line()
        .x(function(d, i) {
            return d.x;
        }).y(function(d, i) {
            return d.y;
        }).interpolate("basis");
    let shotContainer = this.mapLayer.append("g");
    let master = _(shots).chain()
        .groupBy(function(shot) {
            return shot.master.latitude + "x" + shot.master.longitude;
        }).values().value();
    let workerCoordinates = this.projection([shots[0].worker.longitude, shots[0].worker.latitude]);
    this.blow(workerCoordinates[0], workerCoordinates[1], shots.length, color);

    for (let i = 0; i < master.length; i ++) {
        let shots = master[i];

        let midPoints = this.getMidPoints(
            shots.length,
            this.projection([shots[0].worker.longitude, shots[0].worker.latitude]),
            this.projection([shots[0].master.longitude, shots[0].master.latitude])
        );
        let start;
        let finish;

        for (let j = 0; j < shots.length; j++) {

            let shot = shots[j];

            start = this.projection([shot.worker.longitude, shot.worker.latitude]);
            finish = this.projection([shot.master.longitude, shot.master.latitude]);

            let trajectoryData = [{
                x: start[0],
                y: start[1]
            }, {
                x: midPoints[j][0],
                y: midPoints[j][1]
            }, {
                x: finish[0],
                y: finish[1]
            }];

            shotContainer.selectAll(".path")
                .data([2, 3, 4])
                .enter()
                .append("path")
                .attr("class", "path-" + i)
                .attr("d", trajectory(trajectoryData))
                .attr("stroke", color)
                .attr("visibility", "hidden")
                .attr("fill", "none")
                .attr("stroke-width", function (d) {
                    return d;
                });
        }
        (function (map, path, blowCoordinates, blowSize) {
            let totalLength = d3.max(path[0], function (p) {
                return p.getTotalLength();
            });
            /*
             * Calculate animation time depending on the trajectory length.
             */
            let animationTime = action.getDuration(totalLength);

            path.attr("stroke-dasharray", "0 0 0 " + totalLength)
                .attr("visibility", "visible")
                .transition()
                .duration(animationTime / (totalLength / 100))
                .ease("linear")
                .attrTween("stroke-dasharray", function (d) {
                    return action.getFirstStageInterpolater(d, totalLength);
                }).each("end", function () {
                d3.select(this).transition()
                    .duration(animationTime)
                    .ease("linear")
                    .attrTween("stroke-dasharray", function (d) {
                        return action.getSecondStageInterpolater(d, totalLength);
                    }).call(action.endAll, function (d) {
                    /*
                     * Draw victim hit blow and remove animation container at the end.
                     */
                    action.blow(blowCoordinates[0], blowCoordinates[1], blowSize, color, function () {
                        shotContainer.remove();
                    });
                })
            });
        })(this, path, finish, shots.length);
    }
};

Action.prototype.getFirstStageInterpolater = function(d, totalLength){
    let length, offset;

    switch (d) {
        case 2 : {
            offset = 0, length = 100;
        }; break;
        case 3 : {
            offset = 25, length = 75;
        }; break;
        case 4 : {
            offset = 50, length = 50;
        }; break;
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
        case 2 : {
            offset = 0, length = 100;
        }; break;
        case 3 : {
            offset = 25, length = 75;
        }; break;
        case 4 : {
            offset = 50, length = 50;
        }; break;
    }

    let interpolate = d3.interpolate(0, totalLength);

    return function(t) {
        return "0 " + (interpolate(t) + offset) + " " + length + " " + (totalLength - interpolate(t));
    };
};