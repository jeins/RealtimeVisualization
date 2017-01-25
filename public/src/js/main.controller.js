'use strict';

function Main(){
    this.map = new Map();

    this.action = new Action(this.map);

    this.data = new DataProvider(this.action, this.map);
}

Main.prototype.run = function() {
    this.data.run();
};

new Main().run();