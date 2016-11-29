var socket = io.connect('ws://localhost:8888/');

socket.on('server.data', function (arrData) {
    console.log(arrData);

    $.each(arrData, function(i, val){
        if(val.ip != undefined){
            var d = val.ip + " " + val.namen + " " + val.wert + " " + val.date;
            $('#data').append($('<li></li>').text(d));
        }
    });
});