var express = require('express')
	, app = express(app)
	, server = require('http').createServer(app);
	

app.use(express.static(__dirname));

var clients = {};

var EurecaServer = require('eureca.io').EurecaServer;

var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState']});

eurecaServer.attach(server);


eurecaServer.onConnect(function (conn) {
	console.log('A client id=%d ', conn.id, conn.remoteAddress);
	var remote = eurecaServer.getClient(conn.id);
	clients[conn.id] = {id:conn.id, remote:remote}
	remote.setId(conn.id);
});

eurecaServer.onDisconnect(function (conn) {
	console.log('Client Disconnected ', conn.id);
	var removeId = clients[conn.id].id;
	
	delete clients[conn.id];
	for (var c in clients)
	{
		var remote = clients[c].remote;
		remote.kill(conn.id);
	}
	});

eurecaServer.exports.handshake = function()
{
	for (var c in clients)
	{
		var remote = clients[c].remote;
		for (var cc in clients)
		{		
			//send latest known position
			var x = clients[cc].laststate ? clients[cc].laststate.x:  0;
			var y = clients[cc].laststate ? clients[cc].laststate.y:  0;

			remote.spawnEnemy(clients[cc].id, x, y);		
		}
	}
}

//be exposed to client side
eurecaServer.exports.handleKeys = function (keys) {
	var conn = this.connection;
	var updatedClient = clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		remote.updateState(updatedClient.id, keys);
		
		//keep last known state so we can send it to new connected clients
		clients[c].laststate = keys;
	}
}
server.listen(8000);