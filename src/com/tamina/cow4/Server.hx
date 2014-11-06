package com.tamina.cow4;
import com.tamina.cow4.routes.TestSocketServerRoute;
import com.tamina.cow4.socket.SocketServer;
import nodejs.net.TCPServer;
import nodejs.net.Net;
import com.tamina.cow4.config.Config;
import com.tamina.cow4.routes.MainRoute;
import nodejs.express.Application;
import nodejs.express.Express;
class Server {

    private static var _server:Server;

    private var _express:Application;
    private var _socketServer:SocketServer;

    public function new( ) {

        _express = Express.GetApplication();
        _express.listen( Config.APP_PORT );
        _express.use( Express.Static(Config.ROOT_PATH));

        var mainRoute = new MainRoute();
        _express.get('/', mainRoute.succesHandler);

        var testSocketServerRoute = new TestSocketServerRoute();
        _express.get('/SOCKET/TEST',testSocketServerRoute.succesHandler);

        trace('server listening on ' + Config.APP_PORT);

        _socketServer = new SocketServer(Config.SOCKET_PORT);
    }

    static function main() {
        _server = new Server();
    }

}