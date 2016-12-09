'use strict';

function Main(){
    this.map = new Map();

    this.action = new Action(this.map.getMap());

    this.data = new DataProvider(this.action);
}

Main.prototype.run = function() {
    this.data.run();
};

new Main().run();