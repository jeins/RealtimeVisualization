'use strict';

function Main(){
    this.map = new Map();

    this.action = new Action(this.map);

    this.data = new DataProvider(this.action, this.map);
}

/**
 * get data from socket server and update the action
 */
Main.prototype.run = function() {
    this.data.run();
};

// start the show
new Main().run();