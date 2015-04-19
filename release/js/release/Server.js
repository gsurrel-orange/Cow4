(function () { "use strict";
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
var IMap = function() { };
IMap.__name__ = true;
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) return true;
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) return false;
	return f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
var com = {};
com.tamina = {};
com.tamina.cow4 = {};
com.tamina.cow4.Server = function() {
	this._express = nodejs.express.Express.GetApplication();
	this._express.listen(3000);
	this._express["use"](nodejs.express.Express.Static("server/"));
	var mainRoute = new com.tamina.cow4.routes.MainRoute();
	this._express.get("/",mainRoute.succesHandler);
	var testSocketServerRoute = new com.tamina.cow4.routes.TestSocketServerRoute();
	this._express.get("/" + "SOCKET/TEST",testSocketServerRoute.succesHandler);
	var iaListRoute = new com.tamina.cow4.routes.IAListRoute();
	this._express.get("/" + "IAList",iaListRoute.succesHandler);
	var playRoute = new com.tamina.cow4.routes.PlayRoute();
	this._express.get("/" + "Play",playRoute.succesHandler);
	haxe.Log.trace("server listening on " + 3000,{ fileName : "Server.hx", lineNumber : 48, className : "com.tamina.cow4.Server", methodName : "new"});
	this._socketServer = new com.tamina.cow4.socket.SocketServer(8127);
	this._websocketServer = new com.tamina.cow4.socket.WSocketServer();
	this._gameManager = new com.tamina.cow4.core.GameManager();
};
com.tamina.cow4.Server.__name__ = true;
com.tamina.cow4.Server.main = function() {
	haxe.Log.trace = com.tamina.cow4.Server.myTrace;
	com.tamina.cow4.Server._server = new com.tamina.cow4.Server();
};
com.tamina.cow4.Server.myTrace = function(v,inf) {
	console.info(v);
};
com.tamina.cow4.Server.prototype = {
	__class__: com.tamina.cow4.Server
};
com.tamina.cow4.config = {};
com.tamina.cow4.config.Config = function() {
};
com.tamina.cow4.config.Config.__name__ = true;
com.tamina.cow4.config.Config.prototype = {
	__class__: com.tamina.cow4.config.Config
};
com.tamina.cow4.core = {};
com.tamina.cow4.core.Game = function(iaList,gameId,player) {
	this._iaTurnIndex = 0;
	this._timeoutWatcher = new haxe.Timer(com.tamina.cow4.model.GameConstants.TIMEOUT_DURATION);
	this._player = player;
	this._IAList = iaList;
	this._sheep = new com.tamina.cow4.socket.SheepIA();
	this._IAList.push(this._sheep);
	this._data = com.tamina.cow4.data.Mock.get_instance().getDefaultMap();
	this._data.iaList.push(this._IAList[0].toInfo());
	this._data.iaList.push(this._IAList[1].toInfo());
	this._data.iaList.push(this._IAList[2].toInfo());
	this._data.id = gameId;
	this._data.getCellAt(0,0).occupant = this._IAList[0].toInfo();
	this._data.getCellAt(24,24).occupant = this._IAList[1].toInfo();
	this._data.getCellAt(12,12).occupant = this._sheep.toInfo();
};
com.tamina.cow4.core.Game.__name__ = true;
com.tamina.cow4.core.Game.prototype = {
	start: function() {
		this._currentTurn = 0;
		this._isComputing = false;
		this._maxNumTurn = com.tamina.cow4.model.GameConstants.GAME_MAX_NUM_TURN;
		this._startBattleDate = new Date();
		this.initPlayer();
		this.performTurn();
	}
	,initPlayer: function() {
		this._player.render(this._data);
	}
	,performTurn: function() {
		console.info("performTurn");
		this.retrieveIAOrders(this._IAList[this._iaTurnIndex]);
	}
	,updatePlayer: function(turn) {
		this._player.updateRender(turn);
	}
	,timeoutHandler: function() {
		this._timeoutWatcher.stop();
		var currentIA = this._IAList[this._iaTurnIndex];
		currentIA.turnComplete.remove($bind(this,this.turnCompleteHandler));
		console.warn(currentIA.id + " : TIMEOUT : next ia turn");
		this._iaTurnIndex++;
		if(this._iaTurnIndex >= this._IAList.length) {
			this._iaTurnIndex = 0;
			this._currentTurn++;
		}
		this.performTurn();
	}
	,retrieveIAOrders: function(targetIA) {
		console.info(targetIA.id + " : retrieveIAOrders");
		targetIA.turnComplete.addOnce($bind(this,this.turnCompleteHandler));
		this._timeoutWatcher.stop();
		this._timeoutWatcher = new haxe.Timer(com.tamina.cow4.model.GameConstants.TIMEOUT_DURATION);
		this._timeoutWatcher.run = $bind(this,this.timeoutHandler);
		targetIA.getTurnOrder(this._data);
	}
	,parseTurnResult: function(value) {
		var result = new com.tamina.cow4.core.ParseResult();
		var _g1 = 0;
		var _g = value.actions.length;
		try {
			while(_g1 < _g) {
				var i = _g1++;
				var _g2 = value.actions[i].type;
				switch(_g2) {
				case "move":
					result = this.parseMoveOrder(value.actions[i]);
					if(result.type != 0) throw "__break__";
					break;
				case "fail":
					break;
				case "success":
					result.type = 1;
					result.message = "action interdite";
					this.end("fail",result.message);
					throw "__break__";
					break;
				}
			}
		} catch( e ) { if( e != "__break__" ) throw e; }
		return result;
	}
	,parseMoveOrder: function(order) {
		var result = new com.tamina.cow4.core.ParseResult();
		var currentIA = this._IAList[this._iaTurnIndex];
		var currentCell = this._data.getCellByIA(currentIA.id);
		var targetCell = currentCell.getNeighboorById(order.target);
		if(targetCell != null) {
			if(targetCell.occupant != null) {
				if(targetCell.occupant.id == this._sheep.id) {
					result.type = 2;
					result.message = "cible attrapée";
					console.info(result.message);
				} else {
					result.type = 1;
					result.message = "la case ciblée est deja occupée";
					console.info(result.message);
				}
			} else {
				targetCell.occupant = currentCell.occupant;
				currentCell.occupant = null;
				currentIA.pm--;
				if(currentIA.pm < 0) {
					result.type = 1;
					result.message = "pas assez de mouvement";
					console.info(result.message);
				}
			}
		} else {
			result.type = 1;
			result.message = "la case ciblée nest pas voisine de la courant";
			console.info(result.message);
		}
		return result;
	}
	,turnCompleteHandler: function(result) {
		console.info("fin de tour");
		this._timeoutWatcher.stop();
		var parseResult = this.parseTurnResult(result);
		if(parseResult.type == 0) {
			var currentIA = this._IAList[this._iaTurnIndex];
			if(currentIA.pm < com.tamina.cow4.model.GameConstants.MAX_PM) currentIA.pm++;
			if(currentIA.id == this._sheep.id) currentIA.pm = 1;
			result.ia = currentIA.toInfo();
			this._data.getIAById(currentIA.id).pm = currentIA.pm;
			this.updatePlayer(result);
			this._iaTurnIndex++;
			if(this._iaTurnIndex >= this._IAList.length) {
				this._iaTurnIndex = 0;
				this._currentTurn++;
			}
			if(this._currentTurn < this._maxNumTurn) this.performTurn(); else this.end("fail","nombre de tour max");
		} else if(parseResult.type == 2) this.end("success",parseResult.message); else this.end("fail",parseResult.message);
	}
	,end: function(action,message) {
		var result = new com.tamina.cow4.socket.message.TurnResult();
		result.actions.push(new com.tamina.cow4.socket.message.order.EndOrder(action,message));
		result.ia = this._IAList[this._iaTurnIndex].toInfo();
		this._IAList[0].pm = 1;
		this._IAList[1].pm = 1;
		this._IAList[2].pm = 1;
		this.updatePlayer(result);
		console.info(message);
	}
	,__class__: com.tamina.cow4.core.Game
};
com.tamina.cow4.core.GameManager = function() {
	this._games = new Array();
	com.tamina.cow4.events.NotificationBus.get_instance().startBattle.add($bind(this,this.startBattleHandler));
};
com.tamina.cow4.core.GameManager.__name__ = true;
com.tamina.cow4.core.GameManager.prototype = {
	startBattleHandler: function(battle) {
		var list = new Array();
		var _g1 = 0;
		var _g = battle.IAList.length;
		while(_g1 < _g) {
			var i = _g1++;
			list.push(battle.IAList[i]);
		}
		var game = new com.tamina.cow4.core.Game(list,battle.gameId,battle.player);
		this._games.push(game);
		game.start();
	}
	,__class__: com.tamina.cow4.core.GameManager
};
com.tamina.cow4.core.ParseResult = function() {
	this.type = 0;
	this.message = "";
};
com.tamina.cow4.core.ParseResult.__name__ = true;
com.tamina.cow4.core.ParseResult.prototype = {
	__class__: com.tamina.cow4.core.ParseResult
};
com.tamina.cow4.core._ParseResult = {};
com.tamina.cow4.core._ParseResult.ParseResultType_Impl_ = function() { };
com.tamina.cow4.core._ParseResult.ParseResultType_Impl_.__name__ = true;
com.tamina.cow4.core.PathFinder = function() {
	this._inc = 0;
	this._paths = new Array();
};
com.tamina.cow4.core.PathFinder.__name__ = true;
com.tamina.cow4.core.PathFinder.prototype = {
	getPath: function(fromCell,toCell,map) {
		this._map = map;
		this._source = fromCell;
		this._target = toCell;
		var p = new com.tamina.cow4.model.Path();
		p.push(this._source);
		this._paths.push(p);
		var startDate = new Date();
		this.find();
		return this._result;
	}
	,find: function() {
		var result = false;
		this._inc++;
		var paths = this._paths.slice();
		var _g1 = 0;
		var _g = paths.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(this.checkPath(paths[i])) {
				result = true;
				break;
			}
		}
		if(!result && this._inc < 50) this.find();
	}
	,checkPath: function(target) {
		var result = false;
		var currentCell = target.getLastItem();
		var _g1 = 0;
		var _g = currentCell.getNeighboors().length;
		while(_g1 < _g) {
			var i = _g1++;
			var nextCell = currentCell.getNeighboors()[i];
			if(nextCell.id == this._target.id) {
				result = true;
				var p = target.copy();
				p.push(nextCell);
				this._result = p;
				break;
			} else if(!com.tamina.cow4.model.Path.contains(nextCell,this._paths)) {
				var p1 = target.copy();
				p1.push(nextCell);
				this._paths.push(p1);
			}
		}
		HxOverrides.remove(this._paths,target);
		return result;
	}
	,__class__: com.tamina.cow4.core.PathFinder
};
com.tamina.cow4.data = {};
com.tamina.cow4.data.Mock = function() {
};
com.tamina.cow4.data.Mock.__name__ = true;
com.tamina.cow4.data.Mock.get_instance = function() {
	if(com.tamina.cow4.data.Mock._instance == null) com.tamina.cow4.data.Mock._instance = new com.tamina.cow4.data.Mock();
	return com.tamina.cow4.data.Mock._instance;
};
com.tamina.cow4.data.Mock.prototype = {
	getDefaultMap: function() {
		var importedModel = JSON.parse("{\"currentTurn\":0,\"cells\":[[{\"id\":1424090482209,\"bottom\":1424090482258,\"right\":1424090482210},{\"id\":1424090482210,\"left\":1424090482209,\"right\":1424090482211},{\"id\":1424090482211,\"left\":1424090482210,\"right\":1424090482212},{\"id\":1424090482212,\"left\":1424090482211,\"right\":1424090482213},{\"id\":1424090482213,\"left\":1424090482212,\"right\":1424090482214},{\"id\":1424090482214,\"left\":1424090482213,\"right\":1424090482215},{\"id\":1424090482215,\"left\":1424090482214,\"right\":1424090482216},{\"id\":1424090482216,\"bottom\":1424090482251,\"left\":1424090482215,\"right\":1424090482217},{\"id\":1424090482217,\"left\":1424090482216,\"right\":1424090482218},{\"id\":1424090482218,\"left\":1424090482217,\"right\":1424090482219},{\"id\":1424090482219,\"bottom\":1424090482248,\"left\":1424090482218,\"right\":1424090482220},{\"id\":1424090482220,\"left\":1424090482219,\"right\":1424090482221},{\"id\":1424090482221,\"left\":1424090482220,\"right\":1424090482222},{\"id\":1424090482222,\"bottom\":1424090482245,\"left\":1424090482221},{\"id\":1424090482223},{\"id\":1424090482224,\"bottom\":1424090482243,\"right\":1424090482225},{\"id\":1424090482225,\"left\":1424090482224,\"right\":1424090482226},{\"id\":1424090482226,\"left\":1424090482225,\"right\":1424090482227},{\"id\":1424090482227,\"left\":1424090482226,\"right\":1424090482228},{\"id\":1424090482228,\"left\":1424090482227,\"right\":1424090482229},{\"id\":1424090482229,\"left\":1424090482228,\"right\":1424090482230},{\"id\":1424090482230,\"left\":1424090482229,\"right\":1424090482231},{\"id\":1424090482231,\"left\":1424090482230,\"right\":1424090482232},{\"id\":1424090482232,\"left\":1424090482231,\"right\":1424090482233},{\"id\":1424090482233,\"bottom\":1424090482234,\"left\":1424090482232}],[{\"id\":1424090482258,\"top\":1424090482209,\"bottom\":1424090482259},{\"id\":1424090482257,\"bottom\":1424090482260,\"right\":1424090482256},{\"id\":1424090482256,\"left\":1424090482257,\"right\":1424090482255},{\"id\":1424090482255,\"bottom\":1424090482262,\"left\":1424090482256},{\"id\":1424090482254,\"bottom\":1424090482263,\"right\":1424090482253},{\"id\":1424090482253,\"left\":1424090482254,\"right\":1424090482252},{\"id\":1424090482252,\"bottom\":1424090482265,\"left\":1424090482253},{\"id\":1424090482251,\"top\":1424090482216,\"right\":1424090482250},{\"id\":1424090482250,\"left\":1424090482251,\"right\":1424090482249},{\"id\":1424090482249,\"bottom\":1424090482268,\"left\":1424090482250},{\"id\":1424090482248,\"top\":1424090482219,\"right\":1424090482247},{\"id\":1424090482247,\"left\":1424090482248,\"right\":1424090482246},{\"id\":1424090482246,\"bottom\":1424090482271,\"left\":1424090482247},{\"id\":1424090482245,\"top\":1424090482222,\"right\":1424090482244},{\"id\":1424090482244,\"left\":1424090482245,\"right\":1424090482243},{\"id\":1424090482243,\"top\":1424090482224,\"left\":1424090482244},{\"id\":1424090482242,\"bottom\":1424090482275,\"right\":1424090482241},{\"id\":1424090482241,\"left\":1424090482242,\"right\":1424090482240},{\"id\":1424090482240,\"left\":1424090482241,\"right\":1424090482239},{\"id\":1424090482239,\"left\":1424090482240,\"right\":1424090482238},{\"id\":1424090482238,\"left\":1424090482239,\"right\":1424090482237},{\"id\":1424090482237,\"left\":1424090482238,\"right\":1424090482236},{\"id\":1424090482236,\"left\":1424090482237,\"right\":1424090482235},{\"id\":1424090482235,\"left\":1424090482236,\"right\":1424090482234},{\"id\":1424090482234,\"top\":1424090482233,\"left\":1424090482235}],[{\"id\":1424090482259,\"top\":1424090482258,\"right\":1424090482260},{\"id\":1424090482260,\"top\":1424090482257,\"left\":1424090482259},{\"id\":1424090482261,\"right\":1424090482262},{\"id\":1424090482262,\"top\":1424090482255,\"left\":1424090482261,\"right\":1424090482263},{\"id\":1424090482263,\"top\":1424090482254,\"left\":1424090482262},{\"id\":1424090482264,\"bottom\":1424090482303,\"right\":1424090482265},{\"id\":1424090482265,\"top\":1424090482252,\"left\":1424090482264,\"right\":1424090482266},{\"id\":1424090482266,\"left\":1424090482265,\"right\":1424090482267},{\"id\":1424090482267,\"bottom\":1424090482300,\"left\":1424090482266},{\"id\":1424090482268,\"top\":1424090482249,\"right\":1424090482269},{\"id\":1424090482269,\"left\":1424090482268,\"right\":1424090482270},{\"id\":1424090482270,\"bottom\":1424090482297,\"left\":1424090482269},{\"id\":1424090482271,\"top\":1424090482246,\"right\":1424090482272},{\"id\":1424090482272,\"left\":1424090482271,\"right\":1424090482273},{\"id\":1424090482273,\"left\":1424090482272,\"right\":1424090482274},{\"id\":1424090482274,\"left\":1424090482273,\"right\":1424090482275},{\"id\":1424090482275,\"top\":1424090482242,\"bottom\":1424090482292,\"left\":1424090482274},{\"id\":1424090482276,\"bottom\":1424090482291,\"right\":1424090482277},{\"id\":1424090482277,\"left\":1424090482276,\"right\":1424090482278},{\"id\":1424090482278,\"left\":1424090482277,\"right\":1424090482279},{\"id\":1424090482279,\"left\":1424090482278,\"right\":1424090482280},{\"id\":1424090482280,\"left\":1424090482279,\"right\":1424090482281},{\"id\":1424090482281,\"left\":1424090482280,\"right\":1424090482282},{\"id\":1424090482282,\"left\":1424090482281,\"right\":1424090482283},{\"id\":1424090482283,\"bottom\":1424090482284,\"left\":1424090482282}],[{\"id\":1424090482308,\"bottom\":1424090482309,\"right\":1424090482307},{\"id\":1424090482307,\"left\":1424090482308,\"right\":1424090482306},{\"id\":1424090482306,\"left\":1424090482307,\"right\":1424090482305},{\"id\":1424090482305,\"left\":1424090482306,\"right\":1424090482304},{\"id\":1424090482304,\"left\":1424090482305,\"right\":1424090482303},{\"id\":1424090482303,\"top\":1424090482264,\"bottom\":1424090482314,\"left\":1424090482304},{\"id\":1424090482302,\"bottom\":1424090482315,\"right\":1424090482301},{\"id\":1424090482301,\"item\":{\"type\":\"trap\"},\"bottom\":1424090482316,\"left\":1424090482302},{\"id\":1424090482300,\"top\":1424090482267,\"right\":1424090482299},{\"id\":1424090482299,\"left\":1424090482300,\"right\":1424090482298},{\"id\":1424090482298,\"bottom\":1424090482319,\"left\":1424090482299},{\"id\":1424090482297,\"top\":1424090482270,\"right\":1424090482296},{\"id\":1424090482296,\"left\":1424090482297,\"right\":1424090482295},{\"id\":1424090482295,\"left\":1424090482296,\"right\":1424090482294},{\"id\":1424090482294,\"left\":1424090482295,\"right\":1424090482293},{\"id\":1424090482293,\"bottom\":1424090482324,\"left\":1424090482294},{\"id\":1424090482292,\"top\":1424090482275,\"right\":1424090482291},{\"id\":1424090482291,\"top\":1424090482276,\"left\":1424090482292},{\"id\":1424090482290,\"bottom\":1424090482327,\"right\":1424090482289},{\"id\":1424090482289,\"left\":1424090482290,\"right\":1424090482288},{\"id\":1424090482288,\"bottom\":1424090482329,\"left\":1424090482289,\"right\":1424090482287},{\"id\":1424090482287,\"left\":1424090482288,\"right\":1424090482286},{\"id\":1424090482286,\"left\":1424090482287,\"right\":1424090482285},{\"id\":1424090482285,\"left\":1424090482286,\"right\":1424090482284},{\"id\":1424090482284,\"top\":1424090482283,\"left\":1424090482285}],[{\"id\":1424090482309,\"top\":1424090482308,\"bottom\":1424090482358},{\"id\":1424090482310,\"bottom\":1424090482357,\"right\":1424090482311},{\"id\":1424090482311,\"left\":1424090482310,\"right\":1424090482312},{\"id\":1424090482312,\"left\":1424090482311,\"right\":1424090482313},{\"id\":1424090482313,\"left\":1424090482312,\"right\":1424090482314},{\"id\":1424090482314,\"top\":1424090482303,\"left\":1424090482313},{\"id\":1424090482315,\"top\":1424090482302,\"bottom\":1424090482352},{\"id\":1424090482316,\"top\":1424090482301,\"bottom\":1424090482351},{\"id\":1424090482317,\"right\":1424090482318},{\"id\":1424090482318,\"left\":1424090482317,\"right\":1424090482319},{\"id\":1424090482319,\"top\":1424090482298,\"left\":1424090482318,\"right\":1424090482320},{\"id\":1424090482320,\"left\":1424090482319,\"right\":1424090482321},{\"id\":1424090482321,\"left\":1424090482320,\"right\":1424090482322},{\"id\":1424090482322,\"bottom\":1424090482345,\"left\":1424090482321,\"right\":1424090482323},{\"id\":1424090482323,\"left\":1424090482322,\"right\":1424090482324},{\"id\":1424090482324,\"top\":1424090482293,\"left\":1424090482323,\"right\":1424090482325},{\"id\":1424090482325,\"left\":1424090482324,\"right\":1424090482326},{\"id\":1424090482326,\"left\":1424090482325,\"right\":1424090482327},{\"id\":1424090482327,\"top\":1424090482290,\"bottom\":1424090482340,\"left\":1424090482326,\"right\":1424090482328},{\"id\":1424090482328,\"left\":1424090482327,\"right\":1424090482329},{\"id\":1424090482329,\"top\":1424090482288,\"bottom\":1424090482338,\"left\":1424090482328},{\"id\":1424090482330,\"item\":{\"type\":\"potion\"},\"right\":1424090482331},{\"id\":1424090482331,\"left\":1424090482330,\"right\":1424090482332},{\"id\":1424090482332,\"left\":1424090482331,\"right\":1424090482333},{\"id\":1424090482333,\"bottom\":1424090482334,\"left\":1424090482332}],[{\"id\":1424090482358,\"top\":1424090482309,\"bottom\":1424090482359},{\"id\":1424090482357,\"top\":1424090482310,\"bottom\":1424090482360},{\"id\":1424090482356,\"bottom\":1424090482361,\"right\":1424090482355},{\"id\":1424090482355,\"left\":1424090482356,\"right\":1424090482354},{\"id\":1424090482354,\"left\":1424090482355,\"right\":1424090482353},{\"id\":1424090482353,\"left\":1424090482354,\"right\":1424090482352},{\"id\":1424090482352,\"top\":1424090482315,\"left\":1424090482353},{\"id\":1424090482351,\"top\":1424090482316,\"right\":1424090482350},{\"id\":1424090482350,\"left\":1424090482351,\"right\":1424090482349},{\"id\":1424090482349,\"left\":1424090482350,\"right\":1424090482348},{\"id\":1424090482348,\"bottom\":1424090482369,\"left\":1424090482349},{\"id\":1424090482347,\"bottom\":1424090482370,\"right\":1424090482346},{\"id\":1424090482346,\"bottom\":1424090482371,\"left\":1424090482347},{\"id\":1424090482345,\"top\":1424090482322,\"right\":1424090482344},{\"id\":1424090482344,\"left\":1424090482345,\"right\":1424090482343},{\"id\":1424090482343,\"left\":1424090482344,\"right\":1424090482342},{\"id\":1424090482342,\"left\":1424090482343,\"right\":1424090482341},{\"id\":1424090482341,\"left\":1424090482342,\"right\":1424090482340},{\"id\":1424090482340,\"top\":1424090482327,\"bottom\":1424090482377,\"left\":1424090482341,\"right\":1424090482339},{\"id\":1424090482339,\"left\":1424090482340,\"right\":1424090482338},{\"id\":1424090482338,\"top\":1424090482329,\"left\":1424090482339,\"right\":1424090482337},{\"id\":1424090482337,\"left\":1424090482338,\"right\":1424090482336},{\"id\":1424090482336,\"left\":1424090482337,\"right\":1424090482335},{\"id\":1424090482335,\"left\":1424090482336,\"right\":1424090482334},{\"id\":1424090482334,\"top\":1424090482333,\"left\":1424090482335}],[{\"id\":1424090482359,\"top\":1424090482358,\"bottom\":1424090482408},{\"id\":1424090482360,\"top\":1424090482357,\"bottom\":1424090482407},{\"id\":1424090482361,\"top\":1424090482356,\"right\":1424090482362},{\"id\":1424090482362,\"left\":1424090482361,\"right\":1424090482363},{\"id\":1424090482363,\"left\":1424090482362,\"right\":1424090482364},{\"id\":1424090482364,\"bottom\":1424090482403,\"left\":1424090482363},{\"id\":1424090482365,\"bottom\":1424090482402,\"right\":1424090482366},{\"id\":1424090482366,\"left\":1424090482365,\"right\":1424090482367},{\"id\":1424090482367,\"left\":1424090482366,\"right\":1424090482368},{\"id\":1424090482368,\"bottom\":1424090482399,\"left\":1424090482367},{\"id\":1424090482369,\"top\":1424090482348,\"bottom\":1424090482398},{\"id\":1424090482370,\"top\":1424090482347,\"bottom\":1424090482397},{\"id\":1424090482371,\"top\":1424090482346,\"right\":1424090482372},{\"id\":1424090482372,\"left\":1424090482371,\"right\":1424090482373},{\"id\":1424090482373,\"left\":1424090482372,\"right\":1424090482374},{\"id\":1424090482374,\"left\":1424090482373,\"right\":1424090482375},{\"id\":1424090482375,\"left\":1424090482374,\"right\":1424090482376},{\"id\":1424090482376,\"bottom\":1424090482391,\"left\":1424090482375},{\"id\":1424090482377,\"top\":1424090482340,\"right\":1424090482378},{\"id\":1424090482378,\"left\":1424090482377,\"right\":1424090482379},{\"id\":1424090482379,\"left\":1424090482378,\"right\":1424090482380},{\"id\":1424090482380,\"left\":1424090482379,\"right\":1424090482381},{\"id\":1424090482381,\"left\":1424090482380,\"right\":1424090482382},{\"id\":1424090482382,\"left\":1424090482381,\"right\":1424090482383},{\"id\":1424090482383,\"bottom\":1424090482384,\"left\":1424090482382}],[{\"id\":1424090482408,\"top\":1424090482359,\"bottom\":1424090482409},{\"id\":1424090482407,\"top\":1424090482360,\"right\":1424090482406},{\"id\":1424090482406,\"left\":1424090482407,\"right\":1424090482405},{\"id\":1424090482405,\"left\":1424090482406,\"right\":1424090482404},{\"id\":1424090482404,\"left\":1424090482405,\"right\":1424090482403},{\"id\":1424090482403,\"top\":1424090482364,\"left\":1424090482404},{\"id\":1424090482402,\"top\":1424090482365,\"right\":1424090482401},{\"id\":1424090482401,\"left\":1424090482402,\"right\":1424090482400},{\"id\":1424090482400,\"bottom\":1424090482417,\"left\":1424090482401},{\"id\":1424090482399,\"top\":1424090482368,\"right\":1424090482398},{\"id\":1424090482398,\"top\":1424090482369,\"left\":1424090482399},{\"id\":1424090482397,\"top\":1424090482370,\"right\":1424090482396},{\"id\":1424090482396,\"left\":1424090482397,\"right\":1424090482395},{\"id\":1424090482395,\"left\":1424090482396,\"right\":1424090482394},{\"id\":1424090482394,\"left\":1424090482395,\"right\":1424090482393},{\"id\":1424090482393,\"left\":1424090482394,\"right\":1424090482392},{\"id\":1424090482392,\"bottom\":1424090482425,\"left\":1424090482393},{\"id\":1424090482391,\"top\":1424090482376,\"bottom\":1424090482426,\"right\":1424090482390},{\"id\":1424090482390,\"bottom\":1424090482427,\"left\":1424090482391},{\"id\":1424090482389,\"bottom\":1424090482428,\"right\":1424090482388},{\"id\":1424090482388,\"bottom\":1424090482429,\"left\":1424090482389,\"right\":1424090482387},{\"id\":1424090482387,\"left\":1424090482388,\"right\":1424090482386},{\"id\":1424090482386,\"left\":1424090482387,\"right\":1424090482385},{\"id\":1424090482385,\"left\":1424090482386,\"right\":1424090482384},{\"id\":1424090482384,\"top\":1424090482383,\"bottom\":1424090482433,\"left\":1424090482385}],[{\"id\":1424090482409,\"top\":1424090482408,\"right\":1424090482410},{\"id\":1424090482410,\"left\":1424090482409,\"right\":1424090482411},{\"id\":1424090482411,\"left\":1424090482410,\"right\":1424090482412},{\"id\":1424090482412,\"bottom\":1424090482455,\"left\":1424090482411,\"right\":1424090482413},{\"id\":1424090482413,\"left\":1424090482412,\"right\":1424090482414},{\"id\":1424090482414,\"left\":1424090482413,\"right\":1424090482415},{\"id\":1424090482415,\"left\":1424090482414,\"right\":1424090482416},{\"id\":1424090482416,\"left\":1424090482415},{\"id\":1424090482417,\"top\":1424090482400,\"right\":1424090482418},{\"id\":1424090482418,\"left\":1424090482417,\"right\":1424090482419},{\"id\":1424090482419,\"left\":1424090482418,\"right\":1424090482420},{\"id\":1424090482420,\"left\":1424090482419,\"right\":1424090482421},{\"id\":1424090482421,\"bottom\":1424090482446,\"left\":1424090482420,\"right\":1424090482422},{\"id\":1424090482422,\"left\":1424090482421,\"right\":1424090482423},{\"id\":1424090482423,\"left\":1424090482422,\"right\":1424090482424},{\"id\":1424090482424,\"left\":1424090482423,\"right\":1424090482425},{\"id\":1424090482425,\"top\":1424090482392,\"left\":1424090482424},{\"id\":1424090482426,\"top\":1424090482391},{\"id\":1424090482427,\"top\":1424090482390,\"right\":1424090482428},{\"id\":1424090482428,\"top\":1424090482389,\"left\":1424090482427},{\"id\":1424090482429,\"top\":1424090482388,\"bottom\":1424090482438},{\"id\":1424090482430,\"right\":1424090482431},{\"id\":1424090482431,\"left\":1424090482430,\"right\":1424090482432},{\"id\":1424090482432,\"left\":1424090482431,\"right\":1424090482433},{\"id\":1424090482433,\"top\":1424090482384,\"left\":1424090482432}],[{\"id\":1424090482458,\"bottom\":1424090482459,\"right\":1424090482457},{\"id\":1424090482457,\"left\":1424090482458,\"right\":1424090482456},{\"id\":1424090482456,\"left\":1424090482457,\"right\":1424090482455},{\"id\":1424090482455,\"top\":1424090482412,\"left\":1424090482456,\"right\":1424090482454},{\"id\":1424090482454,\"left\":1424090482455,\"right\":1424090482453},{\"id\":1424090482453,\"left\":1424090482454,\"right\":1424090482452},{\"id\":1424090482452,\"left\":1424090482453,\"right\":1424090482451},{\"id\":1424090482451,\"left\":1424090482452},{\"id\":1424090482450,\"bottom\":1424090482467,\"right\":1424090482449},{\"id\":1424090482449,\"left\":1424090482450,\"right\":1424090482448},{\"id\":1424090482448,\"left\":1424090482449,\"right\":1424090482447},{\"id\":1424090482447,\"left\":1424090482448,\"right\":1424090482446},{\"id\":1424090482446,\"top\":1424090482421,\"left\":1424090482447,\"right\":1424090482445},{\"id\":1424090482445,\"left\":1424090482446,\"right\":1424090482444},{\"id\":1424090482444,\"left\":1424090482445,\"right\":1424090482443},{\"id\":1424090482443,\"left\":1424090482444,\"right\":1424090482442},{\"id\":1424090482442,\"left\":1424090482443},{\"id\":1424090482441,\"bottom\":1424090482476,\"right\":1424090482440},{\"id\":1424090482440,\"left\":1424090482441,\"right\":1424090482439},{\"id\":1424090482439,\"left\":1424090482440,\"right\":1424090482438},{\"id\":1424090482438,\"top\":1424090482429,\"left\":1424090482439,\"right\":1424090482437},{\"id\":1424090482437,\"left\":1424090482438,\"right\":1424090482436},{\"id\":1424090482436,\"left\":1424090482437,\"right\":1424090482435},{\"id\":1424090482435,\"left\":1424090482436,\"right\":1424090482434},{\"id\":1424090482434,\"bottom\":1424090482483,\"left\":1424090482435}],[{\"id\":1424090482459,\"top\":1424090482458,\"right\":1424090482460},{\"id\":1424090482460,\"left\":1424090482459,\"right\":1424090482461},{\"id\":1424090482461,\"left\":1424090482460,\"right\":1424090482462},{\"id\":1424090482462,\"left\":1424090482461,\"right\":1424090482463},{\"id\":1424090482463,\"bottom\":1424090482504,\"left\":1424090482462,\"right\":1424090482464},{\"id\":1424090482464,\"bottom\":1424090482503,\"left\":1424090482463,\"right\":1424090482465},{\"id\":1424090482465,\"left\":1424090482464,\"right\":1424090482466},{\"id\":1424090482466,\"item\":{\"type\":\"parfum\"},\"left\":1424090482465},{\"id\":1424090482467,\"top\":1424090482450,\"bottom\":1424090482500,\"right\":1424090482468},{\"id\":1424090482468,\"left\":1424090482467,\"right\":1424090482469},{\"id\":1424090482469,\"left\":1424090482468,\"right\":1424090482470},{\"id\":1424090482470,\"left\":1424090482469,\"right\":1424090482471},{\"id\":1424090482471,\"bottom\":1424090482496,\"left\":1424090482470,\"right\":1424090482472},{\"id\":1424090482472,\"left\":1424090482471,\"right\":1424090482473},{\"id\":1424090482473,\"left\":1424090482472,\"right\":1424090482474},{\"id\":1424090482474,\"left\":1424090482473,\"right\":1424090482475},{\"id\":1424090482475,\"bottom\":1424090482492,\"left\":1424090482474},{\"id\":1424090482476,\"top\":1424090482441,\"right\":1424090482477},{\"id\":1424090482477,\"left\":1424090482476,\"right\":1424090482478},{\"id\":1424090482478,\"left\":1424090482477,\"right\":1424090482479},{\"id\":1424090482479,\"bottom\":1424090482488,\"left\":1424090482478,\"right\":1424090482480},{\"id\":1424090482480,\"bottom\":1424090482487,\"left\":1424090482479,\"right\":1424090482481},{\"id\":1424090482481,\"left\":1424090482480,\"right\":1424090482482},{\"id\":1424090482482,\"left\":1424090482481,\"right\":1424090482483},{\"id\":1424090482483,\"top\":1424090482434,\"left\":1424090482482}],[{\"id\":1424090482508,\"bottom\":1424090482509,\"right\":1424090482507},{\"id\":1424090482507,\"left\":1424090482508,\"right\":1424090482506},{\"id\":1424090482506,\"left\":1424090482507,\"right\":1424090482505},{\"id\":1424090482505,\"left\":1424090482506,\"right\":1424090482504},{\"id\":1424090482504,\"top\":1424090482463,\"left\":1424090482505},{\"id\":1424090482503,\"top\":1424090482464,\"right\":1424090482502},{\"id\":1424090482502,\"left\":1424090482503,\"right\":1424090482501},{\"id\":1424090482501,\"left\":1424090482502,\"right\":1424090482500},{\"id\":1424090482500,\"top\":1424090482467,\"left\":1424090482501,\"right\":1424090482499},{\"id\":1424090482499,\"left\":1424090482500,\"right\":1424090482498},{\"id\":1424090482498,\"left\":1424090482499},{\"id\":1424090482497,\"bottom\":1424090482520,\"right\":1424090482496},{\"id\":1424090482496,\"top\":1424090482471,\"left\":1424090482497,\"right\":1424090482495},{\"id\":1424090482495,\"bottom\":1424090482522,\"left\":1424090482496},{\"id\":1424090482494,\"right\":1424090482493},{\"id\":1424090482493,\"left\":1424090482494,\"right\":1424090482492},{\"id\":1424090482492,\"top\":1424090482475,\"left\":1424090482493,\"right\":1424090482491},{\"id\":1424090482491,\"left\":1424090482492,\"right\":1424090482490},{\"id\":1424090482490,\"left\":1424090482491,\"right\":1424090482489},{\"id\":1424090482489,\"left\":1424090482490,\"right\":1424090482488},{\"id\":1424090482488,\"top\":1424090482479,\"left\":1424090482489},{\"id\":1424090482487,\"top\":1424090482480,\"right\":1424090482486},{\"id\":1424090482486,\"left\":1424090482487,\"right\":1424090482485},{\"id\":1424090482485,\"left\":1424090482486,\"right\":1424090482484},{\"id\":1424090482484,\"bottom\":1424090482533,\"left\":1424090482485}],[{\"id\":1424090482509,\"top\":1424090482508,\"bottom\":1424090482558,\"right\":1424090482510},{\"id\":1424090482510,\"left\":1424090482509,\"right\":1424090482511},{\"id\":1424090482511,\"left\":1424090482510,\"right\":1424090482512},{\"id\":1424090482512,\"left\":1424090482511,\"right\":1424090482513},{\"id\":1424090482513,\"left\":1424090482512,\"right\":1424090482514},{\"id\":1424090482514,\"left\":1424090482513,\"right\":1424090482515},{\"id\":1424090482515,\"left\":1424090482514,\"right\":1424090482516},{\"id\":1424090482516,\"left\":1424090482515,\"right\":1424090482517},{\"id\":1424090482517,\"left\":1424090482516,\"right\":1424090482518},{\"id\":1424090482518,\"left\":1424090482517,\"right\":1424090482519},{\"id\":1424090482519,\"left\":1424090482518,\"right\":1424090482520},{\"id\":1424090482520,\"top\":1424090482497,\"bottom\":1424090482547,\"left\":1424090482519,\"right\":1424090482521},{\"id\":1424090482521,\"left\":1424090482520,\"right\":1424090482522},{\"id\":1424090482522,\"top\":1424090482495,\"bottom\":1424090482545,\"left\":1424090482521,\"right\":1424090482523},{\"id\":1424090482523,\"left\":1424090482522,\"right\":1424090482524},{\"id\":1424090482524,\"left\":1424090482523,\"right\":1424090482525},{\"id\":1424090482525,\"left\":1424090482524,\"right\":1424090482526},{\"id\":1424090482526,\"left\":1424090482525,\"right\":1424090482527},{\"id\":1424090482527,\"left\":1424090482526,\"right\":1424090482528},{\"id\":1424090482528,\"left\":1424090482527,\"right\":1424090482529},{\"id\":1424090482529,\"left\":1424090482528,\"right\":1424090482530},{\"id\":1424090482530,\"left\":1424090482529,\"right\":1424090482531},{\"id\":1424090482531,\"left\":1424090482530,\"right\":1424090482532},{\"id\":1424090482532,\"left\":1424090482531,\"right\":1424090482533},{\"id\":1424090482533,\"top\":1424090482484,\"bottom\":1424090482534,\"left\":1424090482532}],[{\"id\":1424090482558,\"top\":1424090482509,\"right\":1424090482557},{\"id\":1424090482557,\"left\":1424090482558,\"right\":1424090482556},{\"id\":1424090482556,\"left\":1424090482557,\"right\":1424090482555},{\"id\":1424090482555,\"bottom\":1424090482562,\"left\":1424090482556},{\"id\":1424090482554,\"bottom\":1424090482563,\"right\":1424090482553},{\"id\":1424090482553,\"left\":1424090482554,\"right\":1424090482552},{\"id\":1424090482552,\"left\":1424090482553,\"right\":1424090482551},{\"id\":1424090482551,\"left\":1424090482552,\"right\":1424090482550},{\"id\":1424090482550,\"bottom\":1424090482567,\"left\":1424090482551,\"right\":1424090482549},{\"id\":1424090482549,\"left\":1424090482550,\"right\":1424090482548},{\"id\":1424090482548,\"left\":1424090482549},{\"id\":1424090482547,\"top\":1424090482520,\"right\":1424090482546},{\"id\":1424090482546,\"bottom\":1424090482571,\"left\":1424090482547,\"right\":1424090482545},{\"id\":1424090482545,\"top\":1424090482522,\"left\":1424090482546},{\"id\":1424090482544,\"right\":1424090482543},{\"id\":1424090482543,\"left\":1424090482544,\"right\":1424090482542},{\"id\":1424090482542,\"bottom\":1424090482575,\"left\":1424090482543,\"right\":1424090482541},{\"id\":1424090482541,\"left\":1424090482542,\"right\":1424090482540},{\"id\":1424090482540,\"left\":1424090482541,\"right\":1424090482539},{\"id\":1424090482539,\"bottom\":1424090482578,\"left\":1424090482540},{\"id\":1424090482538,\"bottom\":1424090482579,\"right\":1424090482537},{\"id\":1424090482537,\"left\":1424090482538,\"right\":1424090482536},{\"id\":1424090482536,\"left\":1424090482537,\"right\":1424090482535},{\"id\":1424090482535,\"left\":1424090482536,\"right\":1424090482534},{\"id\":1424090482534,\"top\":1424090482533,\"left\":1424090482535}],[{\"id\":1424090482559,\"bottom\":1424090482608,\"right\":1424090482560},{\"id\":1424090482560,\"left\":1424090482559,\"right\":1424090482561},{\"id\":1424090482561,\"left\":1424090482560,\"right\":1424090482562},{\"id\":1424090482562,\"top\":1424090482555,\"left\":1424090482561,\"right\":1424090482563},{\"id\":1424090482563,\"top\":1424090482554,\"left\":1424090482562,\"right\":1424090482564},{\"id\":1424090482564,\"left\":1424090482563,\"right\":1424090482565},{\"id\":1424090482565,\"left\":1424090482564,\"right\":1424090482566},{\"id\":1424090482566,\"bottom\":1424090482601,\"left\":1424090482565},{\"id\":1424090482567,\"top\":1424090482550,\"right\":1424090482568},{\"id\":1424090482568,\"left\":1424090482567,\"right\":1424090482569},{\"id\":1424090482569,\"left\":1424090482568,\"right\":1424090482570},{\"id\":1424090482570,\"left\":1424090482569,\"right\":1424090482571},{\"id\":1424090482571,\"top\":1424090482546,\"left\":1424090482570,\"right\":1424090482572},{\"id\":1424090482572,\"left\":1424090482571,\"right\":1424090482573},{\"id\":1424090482573,\"left\":1424090482572,\"right\":1424090482574},{\"id\":1424090482574,\"left\":1424090482573,\"right\":1424090482575},{\"id\":1424090482575,\"top\":1424090482542,\"bottom\":1424090482592,\"left\":1424090482574},{\"id\":1424090482576,\"item\":{\"type\":\"parfum\"},\"right\":1424090482577},{\"id\":1424090482577,\"left\":1424090482576,\"right\":1424090482578},{\"id\":1424090482578,\"top\":1424090482539,\"left\":1424090482577,\"right\":1424090482579},{\"id\":1424090482579,\"top\":1424090482538,\"left\":1424090482578,\"right\":1424090482580},{\"id\":1424090482580,\"left\":1424090482579,\"right\":1424090482581},{\"id\":1424090482581,\"left\":1424090482580,\"right\":1424090482582},{\"id\":1424090482582,\"left\":1424090482581,\"right\":1424090482583},{\"id\":1424090482583,\"bottom\":1424090482584,\"left\":1424090482582}],[{\"id\":1424090482608,\"top\":1424090482559,\"right\":1424090482607},{\"id\":1424090482607,\"left\":1424090482608,\"right\":1424090482606},{\"id\":1424090482606,\"left\":1424090482607,\"right\":1424090482605},{\"id\":1424090482605,\"left\":1424090482606,\"right\":1424090482604},{\"id\":1424090482604,\"bottom\":1424090482613,\"left\":1424090482605,\"right\":1424090482603},{\"id\":1424090482603,\"left\":1424090482604,\"right\":1424090482602},{\"id\":1424090482602,\"left\":1424090482603,\"right\":1424090482601},{\"id\":1424090482601,\"top\":1424090482566,\"left\":1424090482602},{\"id\":1424090482600,\"right\":1424090482599},{\"id\":1424090482599,\"left\":1424090482600,\"right\":1424090482598},{\"id\":1424090482598,\"left\":1424090482599,\"right\":1424090482597},{\"id\":1424090482597,\"left\":1424090482598,\"right\":1424090482596},{\"id\":1424090482596,\"bottom\":1424090482621,\"left\":1424090482597,\"right\":1424090482595},{\"id\":1424090482595,\"left\":1424090482596,\"right\":1424090482594},{\"id\":1424090482594,\"left\":1424090482595,\"right\":1424090482593},{\"id\":1424090482593,\"left\":1424090482594,\"right\":1424090482592},{\"id\":1424090482592,\"top\":1424090482575,\"left\":1424090482593},{\"id\":1424090482591,\"right\":1424090482590},{\"id\":1424090482590,\"left\":1424090482591,\"right\":1424090482589},{\"id\":1424090482589,\"left\":1424090482590,\"right\":1424090482588},{\"id\":1424090482588,\"left\":1424090482589,\"right\":1424090482587},{\"id\":1424090482587,\"bottom\":1424090482630,\"left\":1424090482588,\"right\":1424090482586},{\"id\":1424090482586,\"left\":1424090482587,\"right\":1424090482585},{\"id\":1424090482585,\"left\":1424090482586,\"right\":1424090482584},{\"id\":1424090482584,\"top\":1424090482583,\"left\":1424090482585}],[{\"id\":1424090482609,\"bottom\":1424090482658,\"right\":1424090482610},{\"id\":1424090482610,\"left\":1424090482609,\"right\":1424090482611},{\"id\":1424090482611,\"left\":1424090482610,\"right\":1424090482612},{\"id\":1424090482612,\"left\":1424090482611},{\"id\":1424090482613,\"top\":1424090482604,\"bottom\":1424090482654},{\"id\":1424090482614,\"bottom\":1424090482653,\"right\":1424090482615},{\"id\":1424090482615,\"bottom\":1424090482652,\"left\":1424090482614},{\"id\":1424090482616,\"bottom\":1424090482651},{\"id\":1424090482617,\"bottom\":1424090482650,\"right\":1424090482618},{\"id\":1424090482618,\"left\":1424090482617,\"right\":1424090482619},{\"id\":1424090482619,\"left\":1424090482618,\"right\":1424090482620},{\"id\":1424090482620,\"left\":1424090482619,\"right\":1424090482621},{\"id\":1424090482621,\"top\":1424090482596,\"left\":1424090482620,\"right\":1424090482622},{\"id\":1424090482622,\"left\":1424090482621,\"right\":1424090482623},{\"id\":1424090482623,\"left\":1424090482622,\"right\":1424090482624},{\"id\":1424090482624,\"left\":1424090482623,\"right\":1424090482625},{\"id\":1424090482625,\"bottom\":1424090482642,\"left\":1424090482624},{\"id\":1424090482626,\"right\":1424090482627},{\"id\":1424090482627,\"left\":1424090482626,\"right\":1424090482628},{\"id\":1424090482628,\"left\":1424090482627,\"right\":1424090482629},{\"id\":1424090482629,\"left\":1424090482628,\"right\":1424090482630},{\"id\":1424090482630,\"top\":1424090482587,\"left\":1424090482629,\"right\":1424090482631},{\"id\":1424090482631,\"left\":1424090482630,\"right\":1424090482632},{\"id\":1424090482632,\"left\":1424090482631,\"right\":1424090482633},{\"id\":1424090482633,\"bottom\":1424090482634,\"left\":1424090482632}],[{\"id\":1424090482658,\"top\":1424090482609,\"bottom\":1424090482659,\"right\":1424090482657},{\"id\":1424090482657,\"left\":1424090482658,\"right\":1424090482656},{\"id\":1424090482656,\"left\":1424090482657,\"right\":1424090482655},{\"id\":1424090482655,\"left\":1424090482656,\"right\":1424090482654},{\"id\":1424090482654,\"top\":1424090482613,\"left\":1424090482655,\"right\":1424090482653},{\"id\":1424090482653,\"top\":1424090482614,\"left\":1424090482654},{\"id\":1424090482652,\"top\":1424090482615,\"right\":1424090482651},{\"id\":1424090482651,\"top\":1424090482616,\"bottom\":1424090482666,\"left\":1424090482652},{\"id\":1424090482650,\"top\":1424090482617,\"right\":1424090482649},{\"id\":1424090482649,\"left\":1424090482650,\"right\":1424090482648},{\"id\":1424090482648,\"left\":1424090482649,\"right\":1424090482647},{\"id\":1424090482647,\"left\":1424090482648,\"right\":1424090482646},{\"id\":1424090482646,\"left\":1424090482647,\"right\":1424090482645},{\"id\":1424090482645,\"bottom\":1424090482672,\"left\":1424090482646},{\"id\":1424090482644,\"bottom\":1424090482673,\"right\":1424090482643},{\"id\":1424090482643,\"bottom\":1424090482674,\"left\":1424090482644},{\"id\":1424090482642,\"top\":1424090482625,\"right\":1424090482641},{\"id\":1424090482641,\"left\":1424090482642,\"right\":1424090482640},{\"id\":1424090482640,\"bottom\":1424090482677,\"left\":1424090482641},{\"id\":1424090482639,\"bottom\":1424090482678,\"right\":1424090482638},{\"id\":1424090482638,\"left\":1424090482639,\"right\":1424090482637},{\"id\":1424090482637,\"left\":1424090482638,\"right\":1424090482636},{\"id\":1424090482636,\"left\":1424090482637,\"right\":1424090482635},{\"id\":1424090482635,\"bottom\":1424090482682,\"left\":1424090482636},{\"id\":1424090482634,\"top\":1424090482633,\"bottom\":1424090482683}],[{\"id\":1424090482659,\"top\":1424090482658,\"right\":1424090482660},{\"id\":1424090482660,\"left\":1424090482659,\"right\":1424090482661},{\"id\":1424090482661,\"left\":1424090482660,\"right\":1424090482662},{\"id\":1424090482662,\"left\":1424090482661,\"right\":1424090482663},{\"id\":1424090482663,\"left\":1424090482662,\"right\":1424090482664},{\"id\":1424090482664,\"left\":1424090482663,\"right\":1424090482665},{\"id\":1424090482665,\"bottom\":1424090482702,\"left\":1424090482664},{\"id\":1424090482666,\"top\":1424090482651,\"right\":1424090482667},{\"id\":1424090482667,\"left\":1424090482666,\"right\":1424090482668},{\"id\":1424090482668,\"left\":1424090482667,\"right\":1424090482669},{\"id\":1424090482669,\"left\":1424090482668,\"right\":1424090482670},{\"id\":1424090482670,\"left\":1424090482669,\"right\":1424090482671},{\"id\":1424090482671,\"bottom\":1424090482696,\"left\":1424090482670},{\"id\":1424090482672,\"top\":1424090482645,\"bottom\":1424090482695},{\"id\":1424090482673,\"top\":1424090482644,\"bottom\":1424090482694},{\"id\":1424090482674,\"top\":1424090482643,\"right\":1424090482675},{\"id\":1424090482675,\"left\":1424090482674,\"right\":1424090482676},{\"id\":1424090482676,\"left\":1424090482675,\"right\":1424090482677},{\"id\":1424090482677,\"top\":1424090482640,\"left\":1424090482676},{\"id\":1424090482678,\"top\":1424090482639,\"right\":1424090482679},{\"id\":1424090482679,\"left\":1424090482678,\"right\":1424090482680},{\"id\":1424090482680,\"left\":1424090482679,\"right\":1424090482681},{\"id\":1424090482681,\"bottom\":1424090482686,\"left\":1424090482680},{\"id\":1424090482682,\"top\":1424090482635,\"bottom\":1424090482685},{\"id\":1424090482683,\"top\":1424090482634,\"bottom\":1424090482684}],[{\"id\":1424090482708,\"bottom\":1424090482709,\"right\":1424090482707},{\"id\":1424090482707,\"left\":1424090482708,\"right\":1424090482706},{\"id\":1424090482706,\"left\":1424090482707,\"right\":1424090482705},{\"id\":1424090482705,\"left\":1424090482706,\"right\":1424090482704},{\"id\":1424090482704,\"bottom\":1424090482713,\"left\":1424090482705,\"right\":1424090482703},{\"id\":1424090482703,\"left\":1424090482704,\"right\":1424090482702},{\"id\":1424090482702,\"top\":1424090482665,\"bottom\":1424090482715,\"left\":1424090482703,\"right\":1424090482701},{\"id\":1424090482701,\"left\":1424090482702,\"right\":1424090482700},{\"id\":1424090482700,\"left\":1424090482701,\"right\":1424090482699},{\"id\":1424090482699,\"left\":1424090482700,\"right\":1424090482698},{\"id\":1424090482698,\"left\":1424090482699,\"right\":1424090482697},{\"id\":1424090482697,\"bottom\":1424090482720,\"left\":1424090482698},{\"id\":1424090482696,\"top\":1424090482671,\"right\":1424090482695},{\"id\":1424090482695,\"top\":1424090482672,\"left\":1424090482696},{\"id\":1424090482694,\"top\":1424090482673,\"right\":1424090482693},{\"id\":1424090482693,\"left\":1424090482694,\"right\":1424090482692},{\"id\":1424090482692,\"left\":1424090482693,\"right\":1424090482691},{\"id\":1424090482691,\"bottom\":1424090482726,\"left\":1424090482692},{\"id\":1424090482690,\"bottom\":1424090482727,\"right\":1424090482689},{\"id\":1424090482689,\"left\":1424090482690,\"right\":1424090482688},{\"id\":1424090482688,\"left\":1424090482689,\"right\":1424090482687},{\"id\":1424090482687,\"left\":1424090482688,\"right\":1424090482686},{\"id\":1424090482686,\"top\":1424090482681,\"left\":1424090482687},{\"id\":1424090482685,\"top\":1424090482682,\"bottom\":1424090482732},{\"id\":1424090482684,\"top\":1424090482683,\"bottom\":1424090482733}],[{\"id\":1424090482709,\"top\":1424090482708,\"right\":1424090482710},{\"id\":1424090482710,\"left\":1424090482709,\"right\":1424090482711},{\"id\":1424090482711,\"left\":1424090482710,\"right\":1424090482712},{\"id\":1424090482712,\"item\":{\"type\":\"potion\"},\"left\":1424090482711},{\"id\":1424090482713,\"top\":1424090482704,\"bottom\":1424090482754,\"right\":1424090482714},{\"id\":1424090482714,\"left\":1424090482713,\"right\":1424090482715},{\"id\":1424090482715,\"top\":1424090482702,\"bottom\":1424090482752,\"left\":1424090482714,\"right\":1424090482716},{\"id\":1424090482716,\"left\":1424090482715,\"right\":1424090482717},{\"id\":1424090482717,\"left\":1424090482716,\"right\":1424090482718},{\"id\":1424090482718,\"bottom\":1424090482749,\"left\":1424090482717,\"right\":1424090482719},{\"id\":1424090482719,\"left\":1424090482718,\"right\":1424090482720},{\"id\":1424090482720,\"top\":1424090482697,\"left\":1424090482719,\"right\":1424090482721},{\"id\":1424090482721,\"left\":1424090482720,\"right\":1424090482722},{\"id\":1424090482722,\"left\":1424090482721,\"right\":1424090482723},{\"id\":1424090482723,\"bottom\":1424090482744,\"left\":1424090482722,\"right\":1424090482724},{\"id\":1424090482724,\"left\":1424090482723,\"right\":1424090482725},{\"id\":1424090482725,\"left\":1424090482724},{\"id\":1424090482726,\"top\":1424090482691,\"bottom\":1424090482741},{\"id\":1424090482727,\"top\":1424090482690,\"bottom\":1424090482740},{\"id\":1424090482728,\"bottom\":1424090482739,\"right\":1424090482729},{\"id\":1424090482729,\"left\":1424090482728,\"right\":1424090482730},{\"id\":1424090482730,\"left\":1424090482729,\"right\":1424090482731},{\"id\":1424090482731,\"left\":1424090482730,\"right\":1424090482732},{\"id\":1424090482732,\"top\":1424090482685,\"left\":1424090482731},{\"id\":1424090482733,\"top\":1424090482684,\"bottom\":1424090482734}],[{\"id\":1424090482758,\"bottom\":1424090482759,\"right\":1424090482757},{\"id\":1424090482757,\"left\":1424090482758,\"right\":1424090482756},{\"id\":1424090482756,\"left\":1424090482757,\"right\":1424090482755},{\"id\":1424090482755,\"left\":1424090482756,\"right\":1424090482754},{\"id\":1424090482754,\"top\":1424090482713,\"left\":1424090482755,\"right\":1424090482753},{\"id\":1424090482753,\"left\":1424090482754,\"right\":1424090482752},{\"id\":1424090482752,\"top\":1424090482715,\"left\":1424090482753},{\"id\":1424090482751,\"bottom\":1424090482766,\"right\":1424090482750},{\"id\":1424090482750,\"bottom\":1424090482767,\"left\":1424090482751},{\"id\":1424090482749,\"top\":1424090482718,\"right\":1424090482748},{\"id\":1424090482748,\"left\":1424090482749,\"right\":1424090482747},{\"id\":1424090482747,\"left\":1424090482748,\"right\":1424090482746},{\"id\":1424090482746,\"left\":1424090482747,\"right\":1424090482745},{\"id\":1424090482745,\"bottom\":1424090482772,\"left\":1424090482746},{\"id\":1424090482744,\"top\":1424090482723,\"right\":1424090482743},{\"id\":1424090482743,\"left\":1424090482744,\"right\":1424090482742},{\"id\":1424090482742,\"bottom\":1424090482775,\"left\":1424090482743},{\"id\":1424090482741,\"item\":{\"type\":\"trap\"},\"top\":1424090482726,\"right\":1424090482740},{\"id\":1424090482740,\"top\":1424090482727,\"left\":1424090482741},{\"id\":1424090482739,\"top\":1424090482728,\"bottom\":1424090482778,\"right\":1424090482738},{\"id\":1424090482738,\"left\":1424090482739,\"right\":1424090482737},{\"id\":1424090482737,\"left\":1424090482738,\"right\":1424090482736},{\"id\":1424090482736,\"left\":1424090482737,\"right\":1424090482735},{\"id\":1424090482735,\"left\":1424090482736,\"right\":1424090482734},{\"id\":1424090482734,\"top\":1424090482733,\"left\":1424090482735}],[{\"id\":1424090482759,\"top\":1424090482758,\"right\":1424090482760},{\"id\":1424090482760,\"left\":1424090482759,\"right\":1424090482761},{\"id\":1424090482761,\"left\":1424090482760,\"right\":1424090482762},{\"id\":1424090482762,\"left\":1424090482761,\"right\":1424090482763},{\"id\":1424090482763,\"left\":1424090482762,\"right\":1424090482764},{\"id\":1424090482764,\"left\":1424090482763,\"right\":1424090482765},{\"id\":1424090482765,\"left\":1424090482764,\"right\":1424090482766},{\"id\":1424090482766,\"top\":1424090482751,\"left\":1424090482765},{\"id\":1424090482767,\"top\":1424090482750,\"bottom\":1424090482800,\"right\":1424090482768},{\"id\":1424090482768,\"left\":1424090482767,\"right\":1424090482769},{\"id\":1424090482769,\"left\":1424090482768,\"right\":1424090482770},{\"id\":1424090482770,\"left\":1424090482769,\"right\":1424090482771},{\"id\":1424090482771,\"bottom\":1424090482796,\"left\":1424090482770},{\"id\":1424090482772,\"top\":1424090482745,\"right\":1424090482773},{\"id\":1424090482773,\"left\":1424090482772,\"right\":1424090482774},{\"id\":1424090482774,\"bottom\":1424090482793,\"left\":1424090482773},{\"id\":1424090482775,\"top\":1424090482742,\"right\":1424090482776},{\"id\":1424090482776,\"left\":1424090482775,\"right\":1424090482777},{\"id\":1424090482777,\"bottom\":1424090482790,\"left\":1424090482776,\"right\":1424090482778},{\"id\":1424090482778,\"top\":1424090482739,\"left\":1424090482777},{\"id\":1424090482779,\"bottom\":1424090482788,\"right\":1424090482780},{\"id\":1424090482780,\"bottom\":1424090482787,\"left\":1424090482779,\"right\":1424090482781},{\"id\":1424090482781,\"left\":1424090482780},{\"id\":1424090482782,\"bottom\":1424090482785,\"right\":1424090482783},{\"id\":1424090482783,\"bottom\":1424090482784,\"left\":1424090482782}],[{\"id\":1424090482808,\"bottom\":1424090482809,\"right\":1424090482807},{\"id\":1424090482807,\"left\":1424090482808,\"right\":1424090482806},{\"id\":1424090482806,\"left\":1424090482807,\"right\":1424090482805},{\"id\":1424090482805,\"left\":1424090482806,\"right\":1424090482804},{\"id\":1424090482804,\"left\":1424090482805,\"right\":1424090482803},{\"id\":1424090482803,\"left\":1424090482804,\"right\":1424090482802},{\"id\":1424090482802,\"left\":1424090482803,\"right\":1424090482801},{\"id\":1424090482801,\"left\":1424090482802,\"right\":1424090482800},{\"id\":1424090482800,\"top\":1424090482767,\"left\":1424090482801},{\"id\":1424090482799,\"bottom\":1424090482818,\"right\":1424090482798},{\"id\":1424090482798,\"left\":1424090482799,\"right\":1424090482797},{\"id\":1424090482797,\"bottom\":1424090482820,\"left\":1424090482798},{\"id\":1424090482796,\"top\":1424090482771,\"right\":1424090482795},{\"id\":1424090482795,\"left\":1424090482796,\"right\":1424090482794},{\"id\":1424090482794,\"bottom\":1424090482823,\"left\":1424090482795},{\"id\":1424090482793,\"top\":1424090482774,\"right\":1424090482792},{\"id\":1424090482792,\"left\":1424090482793,\"right\":1424090482791},{\"id\":1424090482791,\"bottom\":1424090482826,\"left\":1424090482792},{\"id\":1424090482790,\"top\":1424090482777,\"right\":1424090482789},{\"id\":1424090482789,\"left\":1424090482790,\"right\":1424090482788},{\"id\":1424090482788,\"top\":1424090482779,\"left\":1424090482789},{\"id\":1424090482787,\"top\":1424090482780,\"right\":1424090482786},{\"id\":1424090482786,\"left\":1424090482787,\"right\":1424090482785},{\"id\":1424090482785,\"top\":1424090482782,\"left\":1424090482786},{\"id\":1424090482784,\"top\":1424090482783,\"bottom\":1424090482833}],[{\"id\":1424090482809,\"top\":1424090482808,\"right\":1424090482810},{\"id\":1424090482810,\"left\":1424090482809,\"right\":1424090482811},{\"id\":1424090482811,\"left\":1424090482810,\"right\":1424090482812},{\"id\":1424090482812,\"left\":1424090482811,\"right\":1424090482813},{\"id\":1424090482813,\"left\":1424090482812,\"right\":1424090482814},{\"id\":1424090482814,\"left\":1424090482813,\"right\":1424090482815},{\"id\":1424090482815,\"left\":1424090482814,\"right\":1424090482816},{\"id\":1424090482816,\"left\":1424090482815,\"right\":1424090482817},{\"id\":1424090482817,\"left\":1424090482816,\"right\":1424090482818},{\"id\":1424090482818,\"top\":1424090482799,\"left\":1424090482817},{\"id\":1424090482819},{\"id\":1424090482820,\"top\":1424090482797,\"right\":1424090482821},{\"id\":1424090482821,\"left\":1424090482820,\"right\":1424090482822},{\"id\":1424090482822,\"left\":1424090482821,\"right\":1424090482823},{\"id\":1424090482823,\"top\":1424090482794,\"left\":1424090482822,\"right\":1424090482824},{\"id\":1424090482824,\"left\":1424090482823,\"right\":1424090482825},{\"id\":1424090482825,\"left\":1424090482824,\"right\":1424090482826},{\"id\":1424090482826,\"top\":1424090482791,\"left\":1424090482825,\"right\":1424090482827},{\"id\":1424090482827,\"left\":1424090482826,\"right\":1424090482828},{\"id\":1424090482828,\"left\":1424090482827,\"right\":1424090482829},{\"id\":1424090482829,\"left\":1424090482828,\"right\":1424090482830},{\"id\":1424090482830,\"left\":1424090482829,\"right\":1424090482831},{\"id\":1424090482831,\"left\":1424090482830,\"right\":1424090482832},{\"id\":1424090482832,\"left\":1424090482831,\"right\":1424090482833},{\"id\":1424090482833,\"top\":1424090482784,\"left\":1424090482832}]],\"iaList\":[]}");
		return com.tamina.cow4.model.GameMap.fromGameMapVO(importedModel);
	}
	,getTestMap: function(row,col) {
		this._goRight = true;
		this._columnNumber = col;
		this._rowNumber = row;
		var result = new com.tamina.cow4.model.GameMap();
		var previousCell = null;
		var currentCell = null;
		var _g1 = 0;
		var _g = this._rowNumber;
		while(_g1 < _g) {
			var rowIndex = _g1++;
			result.cells.push(new Array());
			if(this._goRight) {
				currentCell = new com.tamina.cow4.model.Cell();
				currentCell.set_top(previousCell);
				if(previousCell != null) previousCell.set_bottom(currentCell);
				result.cells[rowIndex].push(currentCell);
				previousCell = currentCell;
				var _g3 = 1;
				var _g2 = this._columnNumber;
				while(_g3 < _g2) {
					var columnIndex = _g3++;
					currentCell = new com.tamina.cow4.model.Cell();
					currentCell.set_left(previousCell);
					if(previousCell != null) previousCell.set_right(currentCell);
					result.cells[rowIndex].push(currentCell);
					previousCell = currentCell;
				}
				this._goRight = false;
			} else {
				var columnIndex1 = this._columnNumber - 1;
				currentCell = new com.tamina.cow4.model.Cell();
				currentCell.set_top(previousCell);
				if(previousCell != null) previousCell.set_bottom(currentCell);
				result.cells[rowIndex][columnIndex1] = currentCell;
				previousCell = currentCell;
				columnIndex1--;
				while(columnIndex1 >= 0) {
					currentCell = new com.tamina.cow4.model.Cell();
					currentCell.set_right(previousCell);
					if(previousCell != null) previousCell.set_left(currentCell);
					result.cells[rowIndex][columnIndex1] = currentCell;
					previousCell = currentCell;
					columnIndex1--;
				}
				this._goRight = true;
			}
		}
		return result;
	}
	,__class__: com.tamina.cow4.data.Mock
};
com.tamina.cow4.events = {};
com.tamina.cow4.events.NotificationBus = function() {
	this.startUpdateDisplay = new msignal.Signal0();
	this.stopUpdateDisplay = new msignal.Signal0();
	this.startBattle = new msignal.Signal1();
};
com.tamina.cow4.events.NotificationBus.__name__ = true;
com.tamina.cow4.events.NotificationBus.get_instance = function() {
	if(com.tamina.cow4.events.NotificationBus._instance == null) com.tamina.cow4.events.NotificationBus._instance = new com.tamina.cow4.events.NotificationBus();
	return com.tamina.cow4.events.NotificationBus._instance;
};
com.tamina.cow4.events.NotificationBus.prototype = {
	__class__: com.tamina.cow4.events.NotificationBus
};
com.tamina.cow4.events.StartBattleNotification = function(iaList,player) {
	this.IAList = iaList;
	this.player = player;
};
com.tamina.cow4.events.StartBattleNotification.__name__ = true;
com.tamina.cow4.events.StartBattleNotification.prototype = {
	__class__: com.tamina.cow4.events.StartBattleNotification
};
com.tamina.cow4.model = {};
com.tamina.cow4.model._Action = {};
com.tamina.cow4.model._Action.Action_Impl_ = function() { };
com.tamina.cow4.model._Action.Action_Impl_.__name__ = true;
com.tamina.cow4.model.Cell = function() {
	this.id = org.tamina.utils.UID.getUID();
	this.changeSignal = new msignal.Signal0();
};
com.tamina.cow4.model.Cell.__name__ = true;
com.tamina.cow4.model.Cell.fromCellVO = function(value) {
	var result = new com.tamina.cow4.model.Cell();
	result.id = value.id;
	result.occupant = value.occupant;
	result.item = value.item;
	return result;
};
com.tamina.cow4.model.Cell.prototype = {
	toCellVO: function() {
		var result = new com.tamina.cow4.model.vo.CellVO(this.id,this.occupant);
		if(null != result.top) result.top = this.get_top().id;
		if(null != result.bottom) result.bottom = this.get_bottom().id;
		if(null != result.left) result.left = this.get_left().id;
		if(null != result.right) result.right = this.get_right().id;
		result.item = this.item;
		return result;
	}
	,getNeighboors: function() {
		var result = new Array();
		if(this.get_top() != null) result.push(this.get_top());
		if(this.get_bottom() != null) result.push(this.get_bottom());
		if(this.get_left() != null) result.push(this.get_left());
		if(this.get_right() != null) result.push(this.get_right());
		return result;
	}
	,getNeighboorById: function(cellId) {
		var result = null;
		if(this.get_top() != null && this.get_top().id == cellId) result = this.get_top(); else if(this.get_bottom() != null && this.get_bottom().id == cellId) result = this.get_bottom(); else if(this.get_left() != null && this.get_left().id == cellId) result = this.get_left(); else if(this.get_right() != null && this.get_right().id == cellId) result = this.get_right();
		return result;
	}
	,get_top: function() {
		return this._top;
	}
	,set_top: function(value) {
		if(value != this._top) {
			this._top = value;
			this.changeSignal.dispatch();
		}
		return this._top;
	}
	,get_bottom: function() {
		return this._bottom;
	}
	,set_bottom: function(value) {
		if(value != this._bottom) {
			this._bottom = value;
			this.changeSignal.dispatch();
		}
		return this._bottom;
	}
	,get_left: function() {
		return this._left;
	}
	,set_left: function(value) {
		if(value != this._left) {
			this._left = value;
			this.changeSignal.dispatch();
		}
		return this._left;
	}
	,get_right: function() {
		return this._right;
	}
	,set_right: function(value) {
		if(value != this._right) {
			this._right = value;
			this.changeSignal.dispatch();
		}
		return this._right;
	}
	,__class__: com.tamina.cow4.model.Cell
};
com.tamina.cow4.model.GameConstants = function() { };
com.tamina.cow4.model.GameConstants.__name__ = true;
com.tamina.cow4.model.GameMap = function() {
	this.currentTurn = 0;
	this.cells = new Array();
	this.iaList = new Array();
};
com.tamina.cow4.model.GameMap.__name__ = true;
com.tamina.cow4.model.GameMap.fromGameMapVO = function(value) {
	var result = new com.tamina.cow4.model.GameMap();
	result.id = value.id;
	result.iaList = value.iaList;
	result.currentTurn = value.currentTurn;
	var _g1 = 0;
	var _g = value.cells.length;
	while(_g1 < _g) {
		var i = _g1++;
		result.cells.push(new Array());
		var _g3 = 0;
		var _g2 = value.cells[i].length;
		while(_g3 < _g2) {
			var j = _g3++;
			result.cells[i].push(com.tamina.cow4.model.Cell.fromCellVO(value.cells[i][j]));
		}
	}
	var _g11 = 0;
	var _g4 = result.cells.length;
	while(_g11 < _g4) {
		var i1 = _g11++;
		var _g31 = 0;
		var _g21 = result.cells[i1].length;
		while(_g31 < _g21) {
			var j1 = _g31++;
			var cell = result.cells[i1][j1];
			var cellVO = value.cells[i1][j1];
			if(cellVO.top != null) cell.set_top(result.cells[i1 - 1][j1]);
			if(cellVO.bottom != null) cell.set_bottom(result.cells[i1 + 1][j1]);
			if(cellVO.left != null) cell.set_left(result.cells[i1][j1 - 1]);
			if(cellVO.right != null) cell.set_right(result.cells[i1][j1 + 1]);
		}
	}
	return result;
};
com.tamina.cow4.model.GameMap.prototype = {
	getCellPosition: function(cell) {
		var result = null;
		var _g1 = 0;
		var _g = this.cells.length;
		while(_g1 < _g) {
			var i = _g1++;
			var _g3 = 0;
			var _g2 = this.cells[i].length;
			while(_g3 < _g2) {
				var j = _g3++;
				if(this.cells[i][j].id == cell.id) {
					result = new org.tamina.geom.Point(j,i);
					break;
				}
			}
		}
		return result;
	}
	,getCellAt: function(column,row) {
		return this.cells[row][column];
	}
	,getIAById: function(id) {
		var result = null;
		var _g1 = 0;
		var _g = this.iaList.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(this.iaList[i].id == id) {
				result = this.iaList[i];
				break;
			}
		}
		return result;
	}
	,getCellByIA: function(id) {
		var result = null;
		var _g1 = 0;
		var _g = this.cells.length;
		while(_g1 < _g) {
			var i = _g1++;
			var columns = this.cells[i];
			var _g3 = 0;
			var _g2 = columns.length;
			while(_g3 < _g2) {
				var j = _g3++;
				var cell = columns[j];
				if(cell.occupant != null && cell.occupant.id == id) {
					result = cell;
					break;
				}
			}
		}
		return result;
	}
	,toGameMapVO: function() {
		var result = new com.tamina.cow4.model.vo.GameMapVO();
		result.id = this.id;
		result.iaList = this.iaList;
		result.currentTurn = this.currentTurn;
		var _g1 = 0;
		var _g = this.cells.length;
		while(_g1 < _g) {
			var i = _g1++;
			result.cells.push(new Array());
			var _g3 = 0;
			var _g2 = this.cells[i].length;
			while(_g3 < _g2) {
				var j = _g3++;
				result.cells[i].push(this.cells[i][j].toCellVO());
			}
		}
		var _g11 = 0;
		var _g4 = this.cells.length;
		while(_g11 < _g4) {
			var i1 = _g11++;
			var _g31 = 0;
			var _g21 = this.cells[i1].length;
			while(_g31 < _g21) {
				var j1 = _g31++;
				var cell = this.cells[i1][j1];
				var cellVO = result.cells[i1][j1];
				if(cell.get_top() != null) cellVO.top = result.cells[i1 - 1][j1].id;
				if(cell.get_bottom() != null) cellVO.bottom = result.cells[i1 + 1][j1].id;
				if(cell.get_left() != null) cellVO.left = result.cells[i1][j1 - 1].id;
				if(cell.get_right() != null) cellVO.right = result.cells[i1][j1 + 1].id;
			}
		}
		return result;
	}
	,__class__: com.tamina.cow4.model.GameMap
};
com.tamina.cow4.model.IAInfo = function(id,name,avatar,pm) {
	this.pm = 1;
	this.id = id;
	this.name = name;
	this.avatar = avatar;
	this.pm = pm;
	this.items = new Array();
};
com.tamina.cow4.model.IAInfo.__name__ = true;
com.tamina.cow4.model.IAInfo.prototype = {
	__class__: com.tamina.cow4.model.IAInfo
};
com.tamina.cow4.model.Item = function(type) {
	this.type = type;
};
com.tamina.cow4.model.Item.__name__ = true;
com.tamina.cow4.model.Item.prototype = {
	__class__: com.tamina.cow4.model.Item
};
com.tamina.cow4.model._ItemType = {};
com.tamina.cow4.model._ItemType.ItemType_Impl_ = function() { };
com.tamina.cow4.model._ItemType.ItemType_Impl_.__name__ = true;
com.tamina.cow4.model.Path = function(content) {
	if(content == null) this._content = new Array(); else this._content = content;
};
com.tamina.cow4.model.Path.__name__ = true;
com.tamina.cow4.model.Path.contains = function(item,list) {
	var result = false;
	var _g1 = 0;
	var _g = list.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(list[i].hasItem(item)) {
			result = true;
			break;
		}
	}
	return result;
};
com.tamina.cow4.model.Path.prototype = {
	getLastItem: function() {
		return this._content[this._content.length - 1];
	}
	,hasItem: function(item) {
		var result = false;
		var _g1 = 0;
		var _g = this._content.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(item.id == this._content[i].id) {
				result = true;
				break;
			}
		}
		return result;
	}
	,getItemAt: function(index) {
		return this._content[index];
	}
	,push: function(item) {
		this._content.push(item);
	}
	,remove: function(item) {
		return HxOverrides.remove(this._content,item);
	}
	,copy: function() {
		return new com.tamina.cow4.model.Path(this._content.slice());
	}
	,get_length: function() {
		return this._content.length;
	}
	,__class__: com.tamina.cow4.model.Path
};
com.tamina.cow4.model.TurnAction = function(type) {
	this.type = type;
};
com.tamina.cow4.model.TurnAction.__name__ = true;
com.tamina.cow4.model.TurnAction.prototype = {
	__class__: com.tamina.cow4.model.TurnAction
};
com.tamina.cow4.model.vo = {};
com.tamina.cow4.model.vo.CellVO = function(id,occupant) {
	this.id = id;
	this.occupant = occupant;
};
com.tamina.cow4.model.vo.CellVO.__name__ = true;
com.tamina.cow4.model.vo.CellVO.prototype = {
	__class__: com.tamina.cow4.model.vo.CellVO
};
com.tamina.cow4.model.vo.GameMapVO = function() {
	this.currentTurn = 0;
	this.cells = new Array();
	this.iaList = new Array();
};
com.tamina.cow4.model.vo.GameMapVO.__name__ = true;
com.tamina.cow4.model.vo.GameMapVO.prototype = {
	__class__: com.tamina.cow4.model.vo.GameMapVO
};
com.tamina.cow4.net = {};
com.tamina.cow4.net.request = {};
com.tamina.cow4.net.request.PlayRequestParam = function() { };
com.tamina.cow4.net.request.PlayRequestParam.__name__ = true;
com.tamina.cow4.routes = {};
com.tamina.cow4.routes.Route = function(successHandler) {
	this.succesHandler = successHandler;
};
com.tamina.cow4.routes.Route.__name__ = true;
com.tamina.cow4.routes.Route.prototype = {
	__class__: com.tamina.cow4.routes.Route
};
com.tamina.cow4.routes.IAListRoute = function() {
	com.tamina.cow4.routes.Route.call(this,$bind(this,this._sucessHandler));
};
com.tamina.cow4.routes.IAListRoute.__name__ = true;
com.tamina.cow4.routes.IAListRoute.__super__ = com.tamina.cow4.routes.Route;
com.tamina.cow4.routes.IAListRoute.prototype = $extend(com.tamina.cow4.routes.Route.prototype,{
	_sucessHandler: function(request,response) {
		var connecions = com.tamina.cow4.socket.SocketServer.connections;
		var result = new Array();
		var _g1 = 0;
		var _g = connecions.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(connecions[i].isLoggued) result.push(connecions[i].toInfo());
		}
		response.send(JSON.stringify(result));
	}
	,__class__: com.tamina.cow4.routes.IAListRoute
});
com.tamina.cow4.routes.MainRoute = function() {
	com.tamina.cow4.routes.Route.call(this,$bind(this,this._sucessHandler));
};
com.tamina.cow4.routes.MainRoute.__name__ = true;
com.tamina.cow4.routes.MainRoute.__super__ = com.tamina.cow4.routes.Route;
com.tamina.cow4.routes.MainRoute.prototype = $extend(com.tamina.cow4.routes.Route.prototype,{
	_sucessHandler: function(request,response) {
		response.sendfile("server/" + "index.html");
	}
	,__class__: com.tamina.cow4.routes.MainRoute
});
com.tamina.cow4.routes.PlayRoute = function() {
	com.tamina.cow4.routes.Route.call(this,$bind(this,this._sucessHandler));
};
com.tamina.cow4.routes.PlayRoute.__name__ = true;
com.tamina.cow4.routes.PlayRoute.__super__ = com.tamina.cow4.routes.Route;
com.tamina.cow4.routes.PlayRoute.prototype = $extend(com.tamina.cow4.routes.Route.prototype,{
	_sucessHandler: function(request,response) {
		if(request.param("ia1") != null && request.param("ia2") != null && request.param("gameId") != null) response.sendfile("server/" + "play.html"); else console.error("ERROR : url params not found");
	}
	,__class__: com.tamina.cow4.routes.PlayRoute
});
com.tamina.cow4.routes.Routes = function() { };
com.tamina.cow4.routes.Routes.__name__ = true;
com.tamina.cow4.routes.TestSocketServerRoute = function() {
	com.tamina.cow4.routes.Route.call(this,$bind(this,this._sucessHandler));
};
com.tamina.cow4.routes.TestSocketServerRoute.__name__ = true;
com.tamina.cow4.routes.TestSocketServerRoute.__super__ = com.tamina.cow4.routes.Route;
com.tamina.cow4.routes.TestSocketServerRoute.prototype = $extend(com.tamina.cow4.routes.Route.prototype,{
	_sucessHandler: function(request,response) {
		response.send("launch new demoia");
		(require('child_process')).exec("node js/release/IADemoApp.js",$bind(this,this.execHandler));
	}
	,execHandler: function(error,stdout,stderr) {
		console.log(error + stdout + stderr);
	}
	,__class__: com.tamina.cow4.routes.TestSocketServerRoute
});
com.tamina.cow4.socket = {};
com.tamina.cow4.socket.Client = function() {
	this.isLoggued = false;
	this.id = org.tamina.utils.UID.getUID();
	this.exitSignal = new msignal.Signal1();
};
com.tamina.cow4.socket.Client.__name__ = true;
com.tamina.cow4.socket.Client.prototype = {
	exitHandler: function() {
		this.exitSignal.dispatch(this.id);
	}
	,__class__: com.tamina.cow4.socket.Client
};
com.tamina.cow4.socket.Proxy = function(type) {
	this._type = "proxy";
	this._data = "";
	this._type = type;
	this.errorSignal = new msignal.Signal0();
	this.closeSignal = new msignal.Signal0();
	this.messageSignal = new msignal.Signal1();
};
com.tamina.cow4.socket.Proxy.__name__ = true;
com.tamina.cow4.socket.Proxy.prototype = {
	sendError: function(error) {
	}
	,socketServer_openHandler: function(c) {
		haxe.Log.trace("[" + this._type + "] new connection",{ fileName : "Proxy.hx", lineNumber : 27, className : "com.tamina.cow4.socket.Proxy", methodName : "socketServer_openHandler"});
	}
	,socketServer_errorHandler: function(c) {
		haxe.Log.trace("[" + this._type + "] ERROR " + Std.string(c),{ fileName : "Proxy.hx", lineNumber : 31, className : "com.tamina.cow4.socket.Proxy", methodName : "socketServer_errorHandler"});
		this.errorSignal.dispatch();
	}
	,socketServer_closeHandler: function(c) {
		haxe.Log.trace("[" + this._type + "] connection close",{ fileName : "Proxy.hx", lineNumber : 36, className : "com.tamina.cow4.socket.Proxy", methodName : "socketServer_closeHandler"});
		this.closeSignal.dispatch();
	}
	,socketServer_dataHandler: function(data) {
		this._data += data.toString();
		if(this._data.indexOf("#end#") >= 0) {
			this._data = this._data.split("#end#").join("");
			if(this._data.length > 0) this.socketServer_endHandler(); else haxe.Log.trace("message vide: " + data,{ fileName : "Proxy.hx", lineNumber : 48, className : "com.tamina.cow4.socket.Proxy", methodName : "socketServer_dataHandler"});
		}
	}
	,socketServer_endHandler: function() {
		var message = null;
		try {
			message = JSON.parse(this._data);
			this._data = "";
		} catch( e ) {
			if( js.Boot.__instanceof(e,Error) ) {
				haxe.Log.trace("[" + this._type + "] impossible de parser le message json : " + e.message,{ fileName : "Proxy.hx", lineNumber : 62, className : "com.tamina.cow4.socket.Proxy", methodName : "socketServer_endHandler"});
				this.sendError(new com.tamina.cow4.socket.message.Error(2,"message inconnu"));
			} else throw(e);
		}
		if(message != null && message.type != null) this.messageSignal.dispatch(message); else this.sendError(new com.tamina.cow4.socket.message.Error(2,"message inconnu"));
	}
	,__class__: com.tamina.cow4.socket.Proxy
};
com.tamina.cow4.socket.ClientProxy = function(c) {
	com.tamina.cow4.socket.Proxy.call(this,"client proxy");
	this._socket = c;
	this._socket.on(nodejs.net.TCPSocketEventType.Connect,$bind(this,this.socketServer_openHandler));
	this._socket.on(nodejs.net.TCPSocketEventType.Close,$bind(this,this.socketServer_closeHandler));
	this._socket.on(nodejs.net.TCPSocketEventType.Error,$bind(this,this.socketServer_errorHandler));
	this._socket.on(nodejs.net.TCPSocketEventType.Data,$bind(this,this.socketServer_dataHandler));
};
com.tamina.cow4.socket.ClientProxy.__name__ = true;
com.tamina.cow4.socket.ClientProxy.__super__ = com.tamina.cow4.socket.Proxy;
com.tamina.cow4.socket.ClientProxy.prototype = $extend(com.tamina.cow4.socket.Proxy.prototype,{
	sendMessage: function(message) {
		try {
			this._socket.write(message.serialize());
		} catch( e ) {
			if( js.Boot.__instanceof(e,Error) ) {
				haxe.Log.trace("ERROR : " + e.message,{ fileName : "ClientProxy.hx", lineNumber : 24, className : "com.tamina.cow4.socket.ClientProxy", methodName : "sendMessage"});
			} else throw(e);
		}
	}
	,sendError: function(error) {
		try {
			this._socket.write(error.serialize());
		} catch( e ) {
			if( js.Boot.__instanceof(e,Error) ) {
				haxe.Log.trace("ERROR : " + e.message,{ fileName : "ClientProxy.hx", lineNumber : 32, className : "com.tamina.cow4.socket.ClientProxy", methodName : "sendError"});
			} else throw(e);
		}
	}
	,__class__: com.tamina.cow4.socket.ClientProxy
});
com.tamina.cow4.socket.IIA = function() { };
com.tamina.cow4.socket.IIA.__name__ = true;
com.tamina.cow4.socket.IIA.prototype = {
	__class__: com.tamina.cow4.socket.IIA
};
com.tamina.cow4.socket.IA = function(c) {
	this.pm = 1;
	com.tamina.cow4.socket.Client.call(this);
	this._proxy = new com.tamina.cow4.socket.ClientProxy(c);
	this._proxy.messageSignal.add($bind(this,this.clientMessageHandler));
	this._proxy.errorSignal.add($bind(this,this.exitHandler));
	this.turnComplete = new msignal.Signal1();
};
com.tamina.cow4.socket.IA.__name__ = true;
com.tamina.cow4.socket.IA.__interfaces__ = [com.tamina.cow4.socket.IIA];
com.tamina.cow4.socket.IA.__super__ = com.tamina.cow4.socket.Client;
com.tamina.cow4.socket.IA.prototype = $extend(com.tamina.cow4.socket.Client.prototype,{
	toInfo: function() {
		return new com.tamina.cow4.model.IAInfo(this.id,this.name,this.avatar.path,this.pm);
	}
	,getTurnOrder: function(data) {
		this._proxy.sendMessage(new com.tamina.cow4.socket.message.GetTurnOrder(data.toGameMapVO()));
	}
	,clientMessageHandler: function(message) {
		var _g = message.type;
		switch(_g) {
		case "authenticate":
			console.info("demande dauthentifiction");
			var auth = message;
			if(this.isLoggued) this._proxy.sendError(new com.tamina.cow4.socket.message.Error(1,"deja ahtentifié")); else {
				this.isLoggued = true;
				this.name = auth.name;
				this.avatar = new org.tamina.net.URL(auth.avatar);
				this._proxy.sendMessage(new com.tamina.cow4.socket.message.ID(this.id));
			}
			break;
		case "turnResult":
			console.info("resultat du tour");
			var result = message;
			this.turnComplete.dispatch(result);
			break;
		default:
			this._proxy.sendError(new com.tamina.cow4.socket.message.Error(2,"type de message inconnu"));
		}
	}
	,__class__: com.tamina.cow4.socket.IA
});
com.tamina.cow4.socket.Player = function(c) {
	com.tamina.cow4.socket.Client.call(this);
	this._proxy = new com.tamina.cow4.socket.PlayerProxy(c);
	this._proxy.messageSignal.add($bind(this,this.playerMessageHandler));
};
com.tamina.cow4.socket.Player.__name__ = true;
com.tamina.cow4.socket.Player.__super__ = com.tamina.cow4.socket.Client;
com.tamina.cow4.socket.Player.prototype = $extend(com.tamina.cow4.socket.Client.prototype,{
	render: function(data) {
		this._proxy.sendMessage(new com.tamina.cow4.socket.message.Render(data.toGameMapVO()));
	}
	,updateRender: function(turn) {
		var msg = new com.tamina.cow4.socket.message.UpdateRender();
		msg.ia = turn.ia;
		msg.actions = turn.actions;
		this._proxy.sendMessage(msg);
	}
	,playerMessageHandler: function(message) {
		var _g = message.type;
		switch(_g) {
		case "startbattle":
			console.info("StartBattle");
			var startBattle = message;
			var iaList = new Array();
			iaList.push(com.tamina.cow4.socket.SocketServer.getIAById(startBattle.IA1));
			iaList.push(com.tamina.cow4.socket.SocketServer.getIAById(startBattle.IA2));
			var notif = new com.tamina.cow4.events.StartBattleNotification(iaList,this);
			com.tamina.cow4.events.NotificationBus.get_instance().startBattle.dispatch(notif);
			break;
		default:
			this._proxy.sendError(new com.tamina.cow4.socket.message.Error(2,"type de message inconnu"));
		}
	}
	,__class__: com.tamina.cow4.socket.Player
});
com.tamina.cow4.socket.PlayerProxy = function(c) {
	com.tamina.cow4.socket.Proxy.call(this,"player proxy");
	this._socket = c;
	this._socket.on(nodejs.ws.WebSocketEventType.Open,$bind(this,this.socketServer_openHandler));
	this._socket.on(nodejs.ws.WebSocketEventType.Close,$bind(this,this.socketServer_closeHandler));
	this._socket.on(nodejs.ws.WebSocketEventType.Error,$bind(this,this.socketServer_errorHandler));
	this._socket.on(nodejs.ws.WebSocketEventType.Message,$bind(this,this.socketServer_dataHandler));
};
com.tamina.cow4.socket.PlayerProxy.__name__ = true;
com.tamina.cow4.socket.PlayerProxy.__super__ = com.tamina.cow4.socket.Proxy;
com.tamina.cow4.socket.PlayerProxy.prototype = $extend(com.tamina.cow4.socket.Proxy.prototype,{
	sendMessage: function(message) {
		try {
			this._socket.send(message.serialize());
		} catch( e ) {
			if( js.Boot.__instanceof(e,Error) ) {
				haxe.Log.trace("ERROR : " + e.message,{ fileName : "PlayerProxy.hx", lineNumber : 25, className : "com.tamina.cow4.socket.PlayerProxy", methodName : "sendMessage"});
			} else throw(e);
		}
	}
	,sendError: function(error) {
	}
	,__class__: com.tamina.cow4.socket.PlayerProxy
});
com.tamina.cow4.socket.SheepIA = function() {
	this.pm = 1;
	this.name = "SheepIA";
	this.id = org.tamina.utils.UID.getUID();
	this.turnComplete = new msignal.Signal1();
};
com.tamina.cow4.socket.SheepIA.__name__ = true;
com.tamina.cow4.socket.SheepIA.__interfaces__ = [com.tamina.cow4.socket.IIA];
com.tamina.cow4.socket.SheepIA.prototype = {
	toInfo: function() {
		return new com.tamina.cow4.model.IAInfo(this.id,this.name,"",this.pm);
	}
	,getTurnOrder: function(data) {
		var result = new com.tamina.cow4.socket.message.TurnResult();
		try {
			var currentCell = data.getCellByIA(this.id);
			if(this._targetCell == null || this._targetCell.id == currentCell.id) this._targetCell = data.getCellAt(Math.floor(Math.random() * data.cells.length),Math.floor(Math.random() * data.cells.length));
			var path = com.tamina.cow4.utils.GameUtils.getPath(currentCell,this._targetCell,data);
			if(path != null) {
				var order = new com.tamina.cow4.socket.message.order.MoveOrder(path.getItemAt(1));
				result.actions.push(order);
			} else {
				haxe.Log.trace("path null : " + currentCell.id + "//" + this._targetCell.id,{ fileName : "SheepIA.hx", lineNumber : 44, className : "com.tamina.cow4.socket.SheepIA", methodName : "getTurnOrder"});
				this._targetCell = null;
			}
		} catch( e ) {
			if( js.Boot.__instanceof(e,Error) ) {
				haxe.Log.trace("error : " + e.message,{ fileName : "SheepIA.hx", lineNumber : 48, className : "com.tamina.cow4.socket.SheepIA", methodName : "getTurnOrder"});
			} else throw(e);
		}
		this.turnComplete.dispatch(result);
	}
	,__class__: com.tamina.cow4.socket.SheepIA
};
com.tamina.cow4.socket.SocketServer = function(port) {
	com.tamina.cow4.socket.SocketServer.connections = new Array();
	this._server = require('net').createServer($bind(this,this.socketServer_connectionHandler));
	this._server.listen(port,$bind(this,this.socketServer_createHandler));
};
com.tamina.cow4.socket.SocketServer.__name__ = true;
com.tamina.cow4.socket.SocketServer.getIAById = function(id) {
	var result = null;
	haxe.Log.trace("search IA : " + id,{ fileName : "SocketServer.hx", lineNumber : 19, className : "com.tamina.cow4.socket.SocketServer", methodName : "getIAById"});
	var _g1 = 0;
	var _g = com.tamina.cow4.socket.SocketServer.connections.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(com.tamina.cow4.socket.SocketServer.connections[i].id == id) {
			result = com.tamina.cow4.socket.SocketServer.connections[i];
			haxe.Log.trace("IA found",{ fileName : "SocketServer.hx", lineNumber : 23, className : "com.tamina.cow4.socket.SocketServer", methodName : "getIAById"});
			break;
		}
	}
	return result;
};
com.tamina.cow4.socket.SocketServer.prototype = {
	socketServer_connectionHandler: function(c) {
		console.info("[socket server] new connection ");
		var ia = new com.tamina.cow4.socket.IA(c);
		ia.exitSignal.addOnce($bind(this,this.iaCloseHandler));
		com.tamina.cow4.socket.SocketServer.connections.push(ia);
	}
	,iaCloseHandler: function(id) {
		var _g1 = 0;
		var _g = com.tamina.cow4.socket.SocketServer.connections.length;
		while(_g1 < _g) {
			var i = _g1++;
			var c = com.tamina.cow4.socket.SocketServer.connections[i];
			if(c.id == id) {
				HxOverrides.remove(com.tamina.cow4.socket.SocketServer.connections,c);
				break;
			}
		}
	}
	,socketServer_createHandler: function(c) {
		console.info("[socket server] ready");
	}
	,__class__: com.tamina.cow4.socket.SocketServer
};
com.tamina.cow4.socket.WSocketServer = function() {
	com.tamina.cow4.socket.WSocketServer.connections = new Array();
	var opt = { port : 8128};
	this._server = new (require('ws').Server)(opt);
	this._server.on(nodejs.ws.WebSocketServerEventType.Error,$bind(this,this.errorHandler));
	this._server.on(nodejs.ws.WebSocketServerEventType.Connection,$bind(this,this.connectionHandler));
};
com.tamina.cow4.socket.WSocketServer.__name__ = true;
com.tamina.cow4.socket.WSocketServer.getPlayerById = function(id) {
	var result = null;
	haxe.Log.trace("search Player : " + id,{ fileName : "WSocketServer.hx", lineNumber : 23, className : "com.tamina.cow4.socket.WSocketServer", methodName : "getPlayerById"});
	var _g1 = 0;
	var _g = com.tamina.cow4.socket.WSocketServer.connections.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(com.tamina.cow4.socket.WSocketServer.connections[i].id == id) {
			result = com.tamina.cow4.socket.WSocketServer.connections[i];
			haxe.Log.trace("Player found",{ fileName : "WSocketServer.hx", lineNumber : 27, className : "com.tamina.cow4.socket.WSocketServer", methodName : "getPlayerById"});
			break;
		}
	}
	return result;
};
com.tamina.cow4.socket.WSocketServer.prototype = {
	errorHandler: function(evt) {
		haxe.Log.trace("[Socket server] Error",{ fileName : "WSocketServer.hx", lineNumber : 35, className : "com.tamina.cow4.socket.WSocketServer", methodName : "errorHandler"});
	}
	,connectionHandler: function(socket) {
		haxe.Log.trace("[Socket server] : New Connection",{ fileName : "WSocketServer.hx", lineNumber : 39, className : "com.tamina.cow4.socket.WSocketServer", methodName : "connectionHandler"});
		var p = new com.tamina.cow4.socket.Player(socket);
		p.exitSignal.addOnce($bind(this,this.playerCloseHandler));
		com.tamina.cow4.socket.WSocketServer.connections.push(p);
	}
	,playerCloseHandler: function(id) {
		var _g1 = 0;
		var _g = com.tamina.cow4.socket.WSocketServer.connections.length;
		while(_g1 < _g) {
			var i = _g1++;
			var c = com.tamina.cow4.socket.WSocketServer.connections[i];
			if(c.id == id) {
				HxOverrides.remove(com.tamina.cow4.socket.WSocketServer.connections,c);
				break;
			}
		}
	}
	,__class__: com.tamina.cow4.socket.WSocketServer
};
com.tamina.cow4.socket.message = {};
com.tamina.cow4.socket.message.SocketMessage = function(type) {
	this.type = "";
	this.type = type;
};
com.tamina.cow4.socket.message.SocketMessage.__name__ = true;
com.tamina.cow4.socket.message.SocketMessage.prototype = {
	serialize: function() {
		return JSON.stringify(this) + "#end#";
	}
	,__class__: com.tamina.cow4.socket.message.SocketMessage
};
com.tamina.cow4.socket.message.ClientMessage = function(type) {
	com.tamina.cow4.socket.message.SocketMessage.call(this,type);
};
com.tamina.cow4.socket.message.ClientMessage.__name__ = true;
com.tamina.cow4.socket.message.ClientMessage.__super__ = com.tamina.cow4.socket.message.SocketMessage;
com.tamina.cow4.socket.message.ClientMessage.prototype = $extend(com.tamina.cow4.socket.message.SocketMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.ClientMessage
});
com.tamina.cow4.socket.message.Authenticate = function(name,avatar) {
	if(avatar == null) avatar = "";
	com.tamina.cow4.socket.message.ClientMessage.call(this,"authenticate");
	this.name = name;
	this.avatar = avatar;
};
com.tamina.cow4.socket.message.Authenticate.__name__ = true;
com.tamina.cow4.socket.message.Authenticate.__super__ = com.tamina.cow4.socket.message.ClientMessage;
com.tamina.cow4.socket.message.Authenticate.prototype = $extend(com.tamina.cow4.socket.message.ClientMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.Authenticate
});
com.tamina.cow4.socket.message.Error = function(code,message) {
	com.tamina.cow4.socket.message.SocketMessage.call(this,"error");
	this.code = code;
	this.message = message;
};
com.tamina.cow4.socket.message.Error.__name__ = true;
com.tamina.cow4.socket.message.Error.__super__ = com.tamina.cow4.socket.message.SocketMessage;
com.tamina.cow4.socket.message.Error.prototype = $extend(com.tamina.cow4.socket.message.SocketMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.Error
});
com.tamina.cow4.socket.message._ErrorCode = {};
com.tamina.cow4.socket.message._ErrorCode.ErrorCode_Impl_ = function() { };
com.tamina.cow4.socket.message._ErrorCode.ErrorCode_Impl_.__name__ = true;
com.tamina.cow4.socket.message.GameServerMessage = function(type) {
	com.tamina.cow4.socket.message.SocketMessage.call(this,type);
};
com.tamina.cow4.socket.message.GameServerMessage.__name__ = true;
com.tamina.cow4.socket.message.GameServerMessage.__super__ = com.tamina.cow4.socket.message.SocketMessage;
com.tamina.cow4.socket.message.GameServerMessage.prototype = $extend(com.tamina.cow4.socket.message.SocketMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.GameServerMessage
});
com.tamina.cow4.socket.message.GetTurnOrder = function(data) {
	com.tamina.cow4.socket.message.GameServerMessage.call(this,"getTurnOrder");
	this.data = data;
};
com.tamina.cow4.socket.message.GetTurnOrder.__name__ = true;
com.tamina.cow4.socket.message.GetTurnOrder.__super__ = com.tamina.cow4.socket.message.GameServerMessage;
com.tamina.cow4.socket.message.GetTurnOrder.prototype = $extend(com.tamina.cow4.socket.message.GameServerMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.GetTurnOrder
});
com.tamina.cow4.socket.message.ID = function(id) {
	com.tamina.cow4.socket.message.GameServerMessage.call(this,"id");
	this.id = id;
};
com.tamina.cow4.socket.message.ID.__name__ = true;
com.tamina.cow4.socket.message.ID.__super__ = com.tamina.cow4.socket.message.GameServerMessage;
com.tamina.cow4.socket.message.ID.prototype = $extend(com.tamina.cow4.socket.message.GameServerMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.ID
});
com.tamina.cow4.socket.message.PlayerMessage = function(type) {
	com.tamina.cow4.socket.message.SocketMessage.call(this,type);
};
com.tamina.cow4.socket.message.PlayerMessage.__name__ = true;
com.tamina.cow4.socket.message.PlayerMessage.__super__ = com.tamina.cow4.socket.message.SocketMessage;
com.tamina.cow4.socket.message.PlayerMessage.prototype = $extend(com.tamina.cow4.socket.message.SocketMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.PlayerMessage
});
com.tamina.cow4.socket.message.Render = function(map) {
	com.tamina.cow4.socket.message.GameServerMessage.call(this,"render");
	this.map = map;
};
com.tamina.cow4.socket.message.Render.__name__ = true;
com.tamina.cow4.socket.message.Render.__super__ = com.tamina.cow4.socket.message.GameServerMessage;
com.tamina.cow4.socket.message.Render.prototype = $extend(com.tamina.cow4.socket.message.GameServerMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.Render
});
com.tamina.cow4.socket.message.StartBattle = function(gameId,ia1,ia2) {
	com.tamina.cow4.socket.message.PlayerMessage.call(this,"startbattle");
	this.gameId = gameId;
	this.IA1 = ia1;
	this.IA2 = ia2;
};
com.tamina.cow4.socket.message.StartBattle.__name__ = true;
com.tamina.cow4.socket.message.StartBattle.__super__ = com.tamina.cow4.socket.message.PlayerMessage;
com.tamina.cow4.socket.message.StartBattle.prototype = $extend(com.tamina.cow4.socket.message.PlayerMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.StartBattle
});
com.tamina.cow4.socket.message.TurnResult = function() {
	com.tamina.cow4.socket.message.ClientMessage.call(this,"turnResult");
	this.actions = new Array();
};
com.tamina.cow4.socket.message.TurnResult.__name__ = true;
com.tamina.cow4.socket.message.TurnResult.__super__ = com.tamina.cow4.socket.message.ClientMessage;
com.tamina.cow4.socket.message.TurnResult.prototype = $extend(com.tamina.cow4.socket.message.ClientMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.TurnResult
});
com.tamina.cow4.socket.message.UpdateRender = function() {
	com.tamina.cow4.socket.message.GameServerMessage.call(this,"updateRender");
	this.actions = new Array();
};
com.tamina.cow4.socket.message.UpdateRender.__name__ = true;
com.tamina.cow4.socket.message.UpdateRender.__super__ = com.tamina.cow4.socket.message.GameServerMessage;
com.tamina.cow4.socket.message.UpdateRender.prototype = $extend(com.tamina.cow4.socket.message.GameServerMessage.prototype,{
	__class__: com.tamina.cow4.socket.message.UpdateRender
});
com.tamina.cow4.socket.message.order = {};
com.tamina.cow4.socket.message.order.EndOrder = function(action,message) {
	this.message = "";
	com.tamina.cow4.model.TurnAction.call(this,action);
	this.message = message;
};
com.tamina.cow4.socket.message.order.EndOrder.__name__ = true;
com.tamina.cow4.socket.message.order.EndOrder.__super__ = com.tamina.cow4.model.TurnAction;
com.tamina.cow4.socket.message.order.EndOrder.prototype = $extend(com.tamina.cow4.model.TurnAction.prototype,{
	__class__: com.tamina.cow4.socket.message.order.EndOrder
});
com.tamina.cow4.socket.message.order.MoveOrder = function(targetCell) {
	com.tamina.cow4.model.TurnAction.call(this,"move");
	this.target = targetCell.id;
};
com.tamina.cow4.socket.message.order.MoveOrder.__name__ = true;
com.tamina.cow4.socket.message.order.MoveOrder.__super__ = com.tamina.cow4.model.TurnAction;
com.tamina.cow4.socket.message.order.MoveOrder.prototype = $extend(com.tamina.cow4.model.TurnAction.prototype,{
	__class__: com.tamina.cow4.socket.message.order.MoveOrder
});
com.tamina.cow4.utils = {};
com.tamina.cow4.utils.GameUtils = function() {
};
com.tamina.cow4.utils.GameUtils.__name__ = true;
com.tamina.cow4.utils.GameUtils.getPath = function(fromCell,toCell,map) {
	var p = new com.tamina.cow4.core.PathFinder();
	return p.getPath(fromCell,toCell,map);
};
com.tamina.cow4.utils.GameUtils.prototype = {
	__class__: com.tamina.cow4.utils.GameUtils
};
var haxe = {};
haxe.Log = function() { };
haxe.Log.__name__ = true;
haxe.Log.trace = function(v,infos) {
	js.Boot.__trace(v,infos);
};
haxe.Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe.Timer.__name__ = true;
haxe.Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
	,__class__: haxe.Timer
};
haxe.ds = {};
haxe.ds.StringMap = function() {
	this.h = { };
};
haxe.ds.StringMap.__name__ = true;
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,__class__: haxe.ds.StringMap
};
var js = {};
js.Boot = function() { };
js.Boot.__name__ = true;
js.Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};
js.Boot.__trace = function(v,i) {
	var msg;
	if(i != null) msg = i.fileName + ":" + i.lineNumber + ": "; else msg = "";
	msg += js.Boot.__string_rec(v,"");
	if(i != null && i.customParams != null) {
		var _g = 0;
		var _g1 = i.customParams;
		while(_g < _g1.length) {
			var v1 = _g1[_g];
			++_g;
			msg += "," + js.Boot.__string_rec(v1,"");
		}
	}
	var d;
	if(typeof(document) != "undefined" && (d = document.getElementById("haxe:trace")) != null) d.innerHTML += js.Boot.__unhtml(msg) + "<br/>"; else if(typeof console != "undefined" && console.log != null) console.log(msg);
};
js.Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else return o.__class__;
};
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
};
js.Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js.Boot.__interfLoop(js.Boot.getClass(o),cl)) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
var msignal = {};
msignal.Signal = function(valueClasses) {
	if(valueClasses == null) valueClasses = [];
	this.valueClasses = valueClasses;
	this.slots = msignal.SlotList.NIL;
	this.priorityBased = false;
};
msignal.Signal.__name__ = true;
msignal.Signal.prototype = {
	add: function(listener) {
		return this.registerListener(listener);
	}
	,addOnce: function(listener) {
		return this.registerListener(listener,true);
	}
	,addWithPriority: function(listener,priority) {
		if(priority == null) priority = 0;
		return this.registerListener(listener,false,priority);
	}
	,addOnceWithPriority: function(listener,priority) {
		if(priority == null) priority = 0;
		return this.registerListener(listener,true,priority);
	}
	,remove: function(listener) {
		var slot = this.slots.find(listener);
		if(slot == null) return null;
		this.slots = this.slots.filterNot(listener);
		return slot;
	}
	,removeAll: function() {
		this.slots = msignal.SlotList.NIL;
	}
	,registerListener: function(listener,once,priority) {
		if(priority == null) priority = 0;
		if(once == null) once = false;
		if(this.registrationPossible(listener,once)) {
			var newSlot = this.createSlot(listener,once,priority);
			if(!this.priorityBased && priority != 0) this.priorityBased = true;
			if(!this.priorityBased && priority == 0) this.slots = this.slots.prepend(newSlot); else this.slots = this.slots.insertWithPriority(newSlot);
			return newSlot;
		}
		return this.slots.find(listener);
	}
	,registrationPossible: function(listener,once) {
		if(!this.slots.nonEmpty) return true;
		var existingSlot = this.slots.find(listener);
		if(existingSlot == null) return true;
		return false;
	}
	,createSlot: function(listener,once,priority) {
		if(priority == null) priority = 0;
		if(once == null) once = false;
		return null;
	}
	,get_numListeners: function() {
		return this.slots.get_length();
	}
	,__class__: msignal.Signal
};
msignal.Signal0 = function() {
	msignal.Signal.call(this);
};
msignal.Signal0.__name__ = true;
msignal.Signal0.__super__ = msignal.Signal;
msignal.Signal0.prototype = $extend(msignal.Signal.prototype,{
	dispatch: function() {
		var slotsToProcess = this.slots;
		while(slotsToProcess.nonEmpty) {
			slotsToProcess.head.execute();
			slotsToProcess = slotsToProcess.tail;
		}
	}
	,createSlot: function(listener,once,priority) {
		if(priority == null) priority = 0;
		if(once == null) once = false;
		return new msignal.Slot0(this,listener,once,priority);
	}
	,__class__: msignal.Signal0
});
msignal.Signal1 = function(type) {
	msignal.Signal.call(this,[type]);
};
msignal.Signal1.__name__ = true;
msignal.Signal1.__super__ = msignal.Signal;
msignal.Signal1.prototype = $extend(msignal.Signal.prototype,{
	dispatch: function(value) {
		var slotsToProcess = this.slots;
		while(slotsToProcess.nonEmpty) {
			slotsToProcess.head.execute(value);
			slotsToProcess = slotsToProcess.tail;
		}
	}
	,createSlot: function(listener,once,priority) {
		if(priority == null) priority = 0;
		if(once == null) once = false;
		return new msignal.Slot1(this,listener,once,priority);
	}
	,__class__: msignal.Signal1
});
msignal.Signal2 = function(type1,type2) {
	msignal.Signal.call(this,[type1,type2]);
};
msignal.Signal2.__name__ = true;
msignal.Signal2.__super__ = msignal.Signal;
msignal.Signal2.prototype = $extend(msignal.Signal.prototype,{
	dispatch: function(value1,value2) {
		var slotsToProcess = this.slots;
		while(slotsToProcess.nonEmpty) {
			slotsToProcess.head.execute(value1,value2);
			slotsToProcess = slotsToProcess.tail;
		}
	}
	,createSlot: function(listener,once,priority) {
		if(priority == null) priority = 0;
		if(once == null) once = false;
		return new msignal.Slot2(this,listener,once,priority);
	}
	,__class__: msignal.Signal2
});
msignal.Slot = function(signal,listener,once,priority) {
	if(priority == null) priority = 0;
	if(once == null) once = false;
	this.signal = signal;
	this.set_listener(listener);
	this.once = once;
	this.priority = priority;
	this.enabled = true;
};
msignal.Slot.__name__ = true;
msignal.Slot.prototype = {
	remove: function() {
		this.signal.remove(this.listener);
	}
	,set_listener: function(value) {
		return this.listener = value;
	}
	,__class__: msignal.Slot
};
msignal.Slot0 = function(signal,listener,once,priority) {
	if(priority == null) priority = 0;
	if(once == null) once = false;
	msignal.Slot.call(this,signal,listener,once,priority);
};
msignal.Slot0.__name__ = true;
msignal.Slot0.__super__ = msignal.Slot;
msignal.Slot0.prototype = $extend(msignal.Slot.prototype,{
	execute: function() {
		if(!this.enabled) return;
		if(this.once) this.remove();
		this.listener();
	}
	,__class__: msignal.Slot0
});
msignal.Slot1 = function(signal,listener,once,priority) {
	if(priority == null) priority = 0;
	if(once == null) once = false;
	msignal.Slot.call(this,signal,listener,once,priority);
};
msignal.Slot1.__name__ = true;
msignal.Slot1.__super__ = msignal.Slot;
msignal.Slot1.prototype = $extend(msignal.Slot.prototype,{
	execute: function(value1) {
		if(!this.enabled) return;
		if(this.once) this.remove();
		if(this.param != null) value1 = this.param;
		this.listener(value1);
	}
	,__class__: msignal.Slot1
});
msignal.Slot2 = function(signal,listener,once,priority) {
	if(priority == null) priority = 0;
	if(once == null) once = false;
	msignal.Slot.call(this,signal,listener,once,priority);
};
msignal.Slot2.__name__ = true;
msignal.Slot2.__super__ = msignal.Slot;
msignal.Slot2.prototype = $extend(msignal.Slot.prototype,{
	execute: function(value1,value2) {
		if(!this.enabled) return;
		if(this.once) this.remove();
		if(this.param1 != null) value1 = this.param1;
		if(this.param2 != null) value2 = this.param2;
		this.listener(value1,value2);
	}
	,__class__: msignal.Slot2
});
msignal.SlotList = function(head,tail) {
	this.nonEmpty = false;
	if(head == null && tail == null) this.nonEmpty = false; else if(head == null) {
	} else {
		this.head = head;
		if(tail == null) this.tail = msignal.SlotList.NIL; else this.tail = tail;
		this.nonEmpty = true;
	}
};
msignal.SlotList.__name__ = true;
msignal.SlotList.prototype = {
	get_length: function() {
		if(!this.nonEmpty) return 0;
		if(this.tail == msignal.SlotList.NIL) return 1;
		var result = 0;
		var p = this;
		while(p.nonEmpty) {
			++result;
			p = p.tail;
		}
		return result;
	}
	,prepend: function(slot) {
		return new msignal.SlotList(slot,this);
	}
	,append: function(slot) {
		if(slot == null) return this;
		if(!this.nonEmpty) return new msignal.SlotList(slot);
		if(this.tail == msignal.SlotList.NIL) return new msignal.SlotList(slot).prepend(this.head);
		var wholeClone = new msignal.SlotList(this.head);
		var subClone = wholeClone;
		var current = this.tail;
		while(current.nonEmpty) {
			subClone = subClone.tail = new msignal.SlotList(current.head);
			current = current.tail;
		}
		subClone.tail = new msignal.SlotList(slot);
		return wholeClone;
	}
	,insertWithPriority: function(slot) {
		if(!this.nonEmpty) return new msignal.SlotList(slot);
		var priority = slot.priority;
		if(priority >= this.head.priority) return this.prepend(slot);
		var wholeClone = new msignal.SlotList(this.head);
		var subClone = wholeClone;
		var current = this.tail;
		while(current.nonEmpty) {
			if(priority > current.head.priority) {
				subClone.tail = current.prepend(slot);
				return wholeClone;
			}
			subClone = subClone.tail = new msignal.SlotList(current.head);
			current = current.tail;
		}
		subClone.tail = new msignal.SlotList(slot);
		return wholeClone;
	}
	,filterNot: function(listener) {
		if(!this.nonEmpty || listener == null) return this;
		if(Reflect.compareMethods(this.head.listener,listener)) return this.tail;
		var wholeClone = new msignal.SlotList(this.head);
		var subClone = wholeClone;
		var current = this.tail;
		while(current.nonEmpty) {
			if(Reflect.compareMethods(current.head.listener,listener)) {
				subClone.tail = current.tail;
				return wholeClone;
			}
			subClone = subClone.tail = new msignal.SlotList(current.head);
			current = current.tail;
		}
		return this;
	}
	,contains: function(listener) {
		if(!this.nonEmpty) return false;
		var p = this;
		while(p.nonEmpty) {
			if(Reflect.compareMethods(p.head.listener,listener)) return true;
			p = p.tail;
		}
		return false;
	}
	,find: function(listener) {
		if(!this.nonEmpty) return null;
		var p = this;
		while(p.nonEmpty) {
			if(Reflect.compareMethods(p.head.listener,listener)) return p.head;
			p = p.tail;
		}
		return null;
	}
	,__class__: msignal.SlotList
};
var nodejs = {};
nodejs.ChildProcessEventType = function() { };
nodejs.ChildProcessEventType.__name__ = true;
nodejs.NodeJS = function() { };
nodejs.NodeJS.__name__ = true;
nodejs.NodeJS.get_dirname = function() {
	return __dirname;
};
nodejs.NodeJS.get_filename = function() {
	return __filename;
};
nodejs.NodeJS.require = function(p_lib) {
	return require(p_lib);
};
nodejs.NodeJS.get_process = function() {
	return process;
};
nodejs.NodeJS.setTimeout = function(cb,ms) {
	return setTimeout(cb,ms);
};
nodejs.NodeJS.clearTimeout = function(t) {
	return clearTimeout(t);
};
nodejs.NodeJS.setInterval = function(cb,ms) {
	return setInterval(cb,ms);
};
nodejs.NodeJS.clearInterval = function(t) {
	return clearInterval(t);
};
nodejs.NodeJS.assert = function(value,message) {
	require('assert')(value,message);
};
nodejs.NodeJS.get_global = function() {
	return global;
};
nodejs.NodeJS.resolve = function() {
	return require.resolve();
};
nodejs.NodeJS.get_cache = function() {
	return require.cache;
};
nodejs.NodeJS.get_extensions = function() {
	return require.extensions;
};
nodejs.NodeJS.get_module = function() {
	return module;
};
nodejs.NodeJS.get_exports = function() {
	return exports;
};
nodejs.NodeJS.get_domain = function() {
	return domain.create();
};
nodejs.NodeJS.get_repl = function() {
	return require('repl');
};
nodejs.ProcessEventType = function() { };
nodejs.ProcessEventType.__name__ = true;
nodejs.REPLEventType = function() { };
nodejs.REPLEventType.__name__ = true;
nodejs.events = {};
nodejs.events.EventEmitterEventType = function() { };
nodejs.events.EventEmitterEventType.__name__ = true;
nodejs.express = {};
nodejs.express.Express = function() { };
nodejs.express.Express.__name__ = true;
nodejs.express.Express.GetApplication = function() {
	return require('express')();
};
nodejs.express.Express.GetRouter = function(p_case_sensitive,p_strict) {
	if(p_strict == null) p_strict = false;
	if(p_case_sensitive == null) p_case_sensitive = false;
	var opt = { };
	opt.caseSensitive = p_case_sensitive;
	opt.strict = p_strict;
	return require('express').Router(opt);
};
nodejs.express.Express.Static = function(p_value) {
	return (require('express')).static(p_value);
};
nodejs.fs = {};
nodejs.fs.ReadStreamEventType = function() { };
nodejs.fs.ReadStreamEventType.__name__ = true;
nodejs.fs.WriteStreamEventType = function() { };
nodejs.fs.WriteStreamEventType.__name__ = true;
nodejs.http = {};
nodejs.http.HTTPMethod = function() { };
nodejs.http.HTTPMethod.__name__ = true;
nodejs.http.HTTPClientRequestEventType = function() { };
nodejs.http.HTTPClientRequestEventType.__name__ = true;
nodejs.http.HTTPServerEventType = function() { };
nodejs.http.HTTPServerEventType.__name__ = true;
nodejs.stream = {};
nodejs.stream.ReadableEventType = function() { };
nodejs.stream.ReadableEventType.__name__ = true;
nodejs.http.IncomingMessageEventType = function() { };
nodejs.http.IncomingMessageEventType.__name__ = true;
nodejs.http.IncomingMessageEventType.__super__ = nodejs.stream.ReadableEventType;
nodejs.http.IncomingMessageEventType.prototype = $extend(nodejs.stream.ReadableEventType.prototype,{
	__class__: nodejs.http.IncomingMessageEventType
});
nodejs.http.ServerResponseEventType = function() { };
nodejs.http.ServerResponseEventType.__name__ = true;
nodejs.net = {};
nodejs.net.TCPServerEventType = function() { };
nodejs.net.TCPServerEventType.__name__ = true;
nodejs.net.TCPSocketEventType = function() { };
nodejs.net.TCPSocketEventType.__name__ = true;
nodejs.stream.WritableEventType = function() { };
nodejs.stream.WritableEventType.__name__ = true;
nodejs.ws = {};
nodejs.ws.WebSocketEventType = function() { };
nodejs.ws.WebSocketEventType.__name__ = true;
nodejs.ws.WebSocketReadyState = function() { };
nodejs.ws.WebSocketReadyState.__name__ = true;
nodejs.ws.WebSocketServerEventType = function() { };
nodejs.ws.WebSocketServerEventType.__name__ = true;
var org = {};
org.tamina = {};
org.tamina.geom = {};
org.tamina.geom.Point = function(x,y) {
	if(y == null) y = 0;
	if(x == null) x = 0;
	this.x = x;
	this.y = y;
};
org.tamina.geom.Point.__name__ = true;
org.tamina.geom.Point.prototype = {
	__class__: org.tamina.geom.Point
};
org.tamina.net = {};
org.tamina.net.URL = function(path) {
	if(path == null) path = "";
	this.path = path;
	this._parameters = new haxe.ds.StringMap();
	if(path.lastIndexOf("?") > 0) {
		var params = path.substring(path.lastIndexOf("?") + 1);
		var elements = params.split("&");
		var _g1 = 0;
		var _g = elements.length;
		while(_g1 < _g) {
			var i = _g1++;
			var element = elements[i].split("=");
			this._parameters.set(element[0],element[1]);
		}
	}
};
org.tamina.net.URL.__name__ = true;
org.tamina.net.URL.prototype = {
	get_parameters: function() {
		return this._parameters;
	}
	,get_extension: function() {
		var result = "";
		if(this.path.lastIndexOf(".") == this.path.length - 4) result = this.path.substring(this.path.length - 3);
		return result;
	}
	,get_documentName: function() {
		var result = "";
		if(this.path != null) result = this.path.substring(this.path.lastIndexOf("/") + 1);
		return result;
	}
	,toString: function() {
		return this.path;
	}
	,removeParameter: function(key) {
		var rtn = this.path;
		if(this.path.indexOf("?") != -1) {
			rtn = this.path.split("?")[0];
			var param;
			var params_arr = new Array();
			var queryString;
			if(this.path.indexOf("?") != -1) queryString = this.path.split("?")[1]; else queryString = "";
			if(queryString != "") {
				params_arr = queryString.split("&");
				var i = params_arr.length - 1;
				while(i >= 0) {
					param = params_arr[i].split("=")[0];
					if(param == key) params_arr.splice(i,1);
					i -= 1;
				}
				rtn = rtn + "?" + params_arr.join("&");
			}
		}
		this.path = rtn;
	}
	,__class__: org.tamina.net.URL
};
org.tamina.utils = {};
org.tamina.utils.UID = function() { };
org.tamina.utils.UID.__name__ = true;
org.tamina.utils.UID.getUID = function() {
	var result = new Date().getTime();
	if(result <= org.tamina.utils.UID._lastUID) result = org.tamina.utils.UID._lastUID + 1;
	org.tamina.utils.UID._lastUID = result;
	return result;
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
Math.NaN = Number.NaN;
Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Math.isFinite = function(i) {
	return isFinite(i);
};
Math.isNaN = function(i1) {
	return isNaN(i1);
};
String.prototype.__class__ = String;
String.__name__ = true;
Array.__name__ = true;
Date.prototype.__class__ = Date;
Date.__name__ = ["Date"];
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
msignal.SlotList.NIL = new msignal.SlotList(null,null);
com.tamina.cow4.config.Config.ROOT_PATH = "server/";
com.tamina.cow4.config.Config.APP_PORT = 3000;
com.tamina.cow4.config.Config.SOCKET_PORT = 8127;
com.tamina.cow4.config.Config.WEB_SOCKET_PORT = 8128;
com.tamina.cow4.core._ParseResult.ParseResultType_Impl_.SUCCESS = 0;
com.tamina.cow4.core._ParseResult.ParseResultType_Impl_.ERROR = 1;
com.tamina.cow4.core._ParseResult.ParseResultType_Impl_.VICTORY = 2;
com.tamina.cow4.data.Mock.defaultMap = "{\"currentTurn\":0,\"cells\":[[{\"id\":1424090482209,\"bottom\":1424090482258,\"right\":1424090482210},{\"id\":1424090482210,\"left\":1424090482209,\"right\":1424090482211},{\"id\":1424090482211,\"left\":1424090482210,\"right\":1424090482212},{\"id\":1424090482212,\"left\":1424090482211,\"right\":1424090482213},{\"id\":1424090482213,\"left\":1424090482212,\"right\":1424090482214},{\"id\":1424090482214,\"left\":1424090482213,\"right\":1424090482215},{\"id\":1424090482215,\"left\":1424090482214,\"right\":1424090482216},{\"id\":1424090482216,\"bottom\":1424090482251,\"left\":1424090482215,\"right\":1424090482217},{\"id\":1424090482217,\"left\":1424090482216,\"right\":1424090482218},{\"id\":1424090482218,\"left\":1424090482217,\"right\":1424090482219},{\"id\":1424090482219,\"bottom\":1424090482248,\"left\":1424090482218,\"right\":1424090482220},{\"id\":1424090482220,\"left\":1424090482219,\"right\":1424090482221},{\"id\":1424090482221,\"left\":1424090482220,\"right\":1424090482222},{\"id\":1424090482222,\"bottom\":1424090482245,\"left\":1424090482221},{\"id\":1424090482223},{\"id\":1424090482224,\"bottom\":1424090482243,\"right\":1424090482225},{\"id\":1424090482225,\"left\":1424090482224,\"right\":1424090482226},{\"id\":1424090482226,\"left\":1424090482225,\"right\":1424090482227},{\"id\":1424090482227,\"left\":1424090482226,\"right\":1424090482228},{\"id\":1424090482228,\"left\":1424090482227,\"right\":1424090482229},{\"id\":1424090482229,\"left\":1424090482228,\"right\":1424090482230},{\"id\":1424090482230,\"left\":1424090482229,\"right\":1424090482231},{\"id\":1424090482231,\"left\":1424090482230,\"right\":1424090482232},{\"id\":1424090482232,\"left\":1424090482231,\"right\":1424090482233},{\"id\":1424090482233,\"bottom\":1424090482234,\"left\":1424090482232}],[{\"id\":1424090482258,\"top\":1424090482209,\"bottom\":1424090482259},{\"id\":1424090482257,\"bottom\":1424090482260,\"right\":1424090482256},{\"id\":1424090482256,\"left\":1424090482257,\"right\":1424090482255},{\"id\":1424090482255,\"bottom\":1424090482262,\"left\":1424090482256},{\"id\":1424090482254,\"bottom\":1424090482263,\"right\":1424090482253},{\"id\":1424090482253,\"left\":1424090482254,\"right\":1424090482252},{\"id\":1424090482252,\"bottom\":1424090482265,\"left\":1424090482253},{\"id\":1424090482251,\"top\":1424090482216,\"right\":1424090482250},{\"id\":1424090482250,\"left\":1424090482251,\"right\":1424090482249},{\"id\":1424090482249,\"bottom\":1424090482268,\"left\":1424090482250},{\"id\":1424090482248,\"top\":1424090482219,\"right\":1424090482247},{\"id\":1424090482247,\"left\":1424090482248,\"right\":1424090482246},{\"id\":1424090482246,\"bottom\":1424090482271,\"left\":1424090482247},{\"id\":1424090482245,\"top\":1424090482222,\"right\":1424090482244},{\"id\":1424090482244,\"left\":1424090482245,\"right\":1424090482243},{\"id\":1424090482243,\"top\":1424090482224,\"left\":1424090482244},{\"id\":1424090482242,\"bottom\":1424090482275,\"right\":1424090482241},{\"id\":1424090482241,\"left\":1424090482242,\"right\":1424090482240},{\"id\":1424090482240,\"left\":1424090482241,\"right\":1424090482239},{\"id\":1424090482239,\"left\":1424090482240,\"right\":1424090482238},{\"id\":1424090482238,\"left\":1424090482239,\"right\":1424090482237},{\"id\":1424090482237,\"left\":1424090482238,\"right\":1424090482236},{\"id\":1424090482236,\"left\":1424090482237,\"right\":1424090482235},{\"id\":1424090482235,\"left\":1424090482236,\"right\":1424090482234},{\"id\":1424090482234,\"top\":1424090482233,\"left\":1424090482235}],[{\"id\":1424090482259,\"top\":1424090482258,\"right\":1424090482260},{\"id\":1424090482260,\"top\":1424090482257,\"left\":1424090482259},{\"id\":1424090482261,\"right\":1424090482262},{\"id\":1424090482262,\"top\":1424090482255,\"left\":1424090482261,\"right\":1424090482263},{\"id\":1424090482263,\"top\":1424090482254,\"left\":1424090482262},{\"id\":1424090482264,\"bottom\":1424090482303,\"right\":1424090482265},{\"id\":1424090482265,\"top\":1424090482252,\"left\":1424090482264,\"right\":1424090482266},{\"id\":1424090482266,\"left\":1424090482265,\"right\":1424090482267},{\"id\":1424090482267,\"bottom\":1424090482300,\"left\":1424090482266},{\"id\":1424090482268,\"top\":1424090482249,\"right\":1424090482269},{\"id\":1424090482269,\"left\":1424090482268,\"right\":1424090482270},{\"id\":1424090482270,\"bottom\":1424090482297,\"left\":1424090482269},{\"id\":1424090482271,\"top\":1424090482246,\"right\":1424090482272},{\"id\":1424090482272,\"left\":1424090482271,\"right\":1424090482273},{\"id\":1424090482273,\"left\":1424090482272,\"right\":1424090482274},{\"id\":1424090482274,\"left\":1424090482273,\"right\":1424090482275},{\"id\":1424090482275,\"top\":1424090482242,\"bottom\":1424090482292,\"left\":1424090482274},{\"id\":1424090482276,\"bottom\":1424090482291,\"right\":1424090482277},{\"id\":1424090482277,\"left\":1424090482276,\"right\":1424090482278},{\"id\":1424090482278,\"left\":1424090482277,\"right\":1424090482279},{\"id\":1424090482279,\"left\":1424090482278,\"right\":1424090482280},{\"id\":1424090482280,\"left\":1424090482279,\"right\":1424090482281},{\"id\":1424090482281,\"left\":1424090482280,\"right\":1424090482282},{\"id\":1424090482282,\"left\":1424090482281,\"right\":1424090482283},{\"id\":1424090482283,\"bottom\":1424090482284,\"left\":1424090482282}],[{\"id\":1424090482308,\"bottom\":1424090482309,\"right\":1424090482307},{\"id\":1424090482307,\"left\":1424090482308,\"right\":1424090482306},{\"id\":1424090482306,\"left\":1424090482307,\"right\":1424090482305},{\"id\":1424090482305,\"left\":1424090482306,\"right\":1424090482304},{\"id\":1424090482304,\"left\":1424090482305,\"right\":1424090482303},{\"id\":1424090482303,\"top\":1424090482264,\"bottom\":1424090482314,\"left\":1424090482304},{\"id\":1424090482302,\"bottom\":1424090482315,\"right\":1424090482301},{\"id\":1424090482301,\"item\":{\"type\":\"trap\"},\"bottom\":1424090482316,\"left\":1424090482302},{\"id\":1424090482300,\"top\":1424090482267,\"right\":1424090482299},{\"id\":1424090482299,\"left\":1424090482300,\"right\":1424090482298},{\"id\":1424090482298,\"bottom\":1424090482319,\"left\":1424090482299},{\"id\":1424090482297,\"top\":1424090482270,\"right\":1424090482296},{\"id\":1424090482296,\"left\":1424090482297,\"right\":1424090482295},{\"id\":1424090482295,\"left\":1424090482296,\"right\":1424090482294},{\"id\":1424090482294,\"left\":1424090482295,\"right\":1424090482293},{\"id\":1424090482293,\"bottom\":1424090482324,\"left\":1424090482294},{\"id\":1424090482292,\"top\":1424090482275,\"right\":1424090482291},{\"id\":1424090482291,\"top\":1424090482276,\"left\":1424090482292},{\"id\":1424090482290,\"bottom\":1424090482327,\"right\":1424090482289},{\"id\":1424090482289,\"left\":1424090482290,\"right\":1424090482288},{\"id\":1424090482288,\"bottom\":1424090482329,\"left\":1424090482289,\"right\":1424090482287},{\"id\":1424090482287,\"left\":1424090482288,\"right\":1424090482286},{\"id\":1424090482286,\"left\":1424090482287,\"right\":1424090482285},{\"id\":1424090482285,\"left\":1424090482286,\"right\":1424090482284},{\"id\":1424090482284,\"top\":1424090482283,\"left\":1424090482285}],[{\"id\":1424090482309,\"top\":1424090482308,\"bottom\":1424090482358},{\"id\":1424090482310,\"bottom\":1424090482357,\"right\":1424090482311},{\"id\":1424090482311,\"left\":1424090482310,\"right\":1424090482312},{\"id\":1424090482312,\"left\":1424090482311,\"right\":1424090482313},{\"id\":1424090482313,\"left\":1424090482312,\"right\":1424090482314},{\"id\":1424090482314,\"top\":1424090482303,\"left\":1424090482313},{\"id\":1424090482315,\"top\":1424090482302,\"bottom\":1424090482352},{\"id\":1424090482316,\"top\":1424090482301,\"bottom\":1424090482351},{\"id\":1424090482317,\"right\":1424090482318},{\"id\":1424090482318,\"left\":1424090482317,\"right\":1424090482319},{\"id\":1424090482319,\"top\":1424090482298,\"left\":1424090482318,\"right\":1424090482320},{\"id\":1424090482320,\"left\":1424090482319,\"right\":1424090482321},{\"id\":1424090482321,\"left\":1424090482320,\"right\":1424090482322},{\"id\":1424090482322,\"bottom\":1424090482345,\"left\":1424090482321,\"right\":1424090482323},{\"id\":1424090482323,\"left\":1424090482322,\"right\":1424090482324},{\"id\":1424090482324,\"top\":1424090482293,\"left\":1424090482323,\"right\":1424090482325},{\"id\":1424090482325,\"left\":1424090482324,\"right\":1424090482326},{\"id\":1424090482326,\"left\":1424090482325,\"right\":1424090482327},{\"id\":1424090482327,\"top\":1424090482290,\"bottom\":1424090482340,\"left\":1424090482326,\"right\":1424090482328},{\"id\":1424090482328,\"left\":1424090482327,\"right\":1424090482329},{\"id\":1424090482329,\"top\":1424090482288,\"bottom\":1424090482338,\"left\":1424090482328},{\"id\":1424090482330,\"item\":{\"type\":\"potion\"},\"right\":1424090482331},{\"id\":1424090482331,\"left\":1424090482330,\"right\":1424090482332},{\"id\":1424090482332,\"left\":1424090482331,\"right\":1424090482333},{\"id\":1424090482333,\"bottom\":1424090482334,\"left\":1424090482332}],[{\"id\":1424090482358,\"top\":1424090482309,\"bottom\":1424090482359},{\"id\":1424090482357,\"top\":1424090482310,\"bottom\":1424090482360},{\"id\":1424090482356,\"bottom\":1424090482361,\"right\":1424090482355},{\"id\":1424090482355,\"left\":1424090482356,\"right\":1424090482354},{\"id\":1424090482354,\"left\":1424090482355,\"right\":1424090482353},{\"id\":1424090482353,\"left\":1424090482354,\"right\":1424090482352},{\"id\":1424090482352,\"top\":1424090482315,\"left\":1424090482353},{\"id\":1424090482351,\"top\":1424090482316,\"right\":1424090482350},{\"id\":1424090482350,\"left\":1424090482351,\"right\":1424090482349},{\"id\":1424090482349,\"left\":1424090482350,\"right\":1424090482348},{\"id\":1424090482348,\"bottom\":1424090482369,\"left\":1424090482349},{\"id\":1424090482347,\"bottom\":1424090482370,\"right\":1424090482346},{\"id\":1424090482346,\"bottom\":1424090482371,\"left\":1424090482347},{\"id\":1424090482345,\"top\":1424090482322,\"right\":1424090482344},{\"id\":1424090482344,\"left\":1424090482345,\"right\":1424090482343},{\"id\":1424090482343,\"left\":1424090482344,\"right\":1424090482342},{\"id\":1424090482342,\"left\":1424090482343,\"right\":1424090482341},{\"id\":1424090482341,\"left\":1424090482342,\"right\":1424090482340},{\"id\":1424090482340,\"top\":1424090482327,\"bottom\":1424090482377,\"left\":1424090482341,\"right\":1424090482339},{\"id\":1424090482339,\"left\":1424090482340,\"right\":1424090482338},{\"id\":1424090482338,\"top\":1424090482329,\"left\":1424090482339,\"right\":1424090482337},{\"id\":1424090482337,\"left\":1424090482338,\"right\":1424090482336},{\"id\":1424090482336,\"left\":1424090482337,\"right\":1424090482335},{\"id\":1424090482335,\"left\":1424090482336,\"right\":1424090482334},{\"id\":1424090482334,\"top\":1424090482333,\"left\":1424090482335}],[{\"id\":1424090482359,\"top\":1424090482358,\"bottom\":1424090482408},{\"id\":1424090482360,\"top\":1424090482357,\"bottom\":1424090482407},{\"id\":1424090482361,\"top\":1424090482356,\"right\":1424090482362},{\"id\":1424090482362,\"left\":1424090482361,\"right\":1424090482363},{\"id\":1424090482363,\"left\":1424090482362,\"right\":1424090482364},{\"id\":1424090482364,\"bottom\":1424090482403,\"left\":1424090482363},{\"id\":1424090482365,\"bottom\":1424090482402,\"right\":1424090482366},{\"id\":1424090482366,\"left\":1424090482365,\"right\":1424090482367},{\"id\":1424090482367,\"left\":1424090482366,\"right\":1424090482368},{\"id\":1424090482368,\"bottom\":1424090482399,\"left\":1424090482367},{\"id\":1424090482369,\"top\":1424090482348,\"bottom\":1424090482398},{\"id\":1424090482370,\"top\":1424090482347,\"bottom\":1424090482397},{\"id\":1424090482371,\"top\":1424090482346,\"right\":1424090482372},{\"id\":1424090482372,\"left\":1424090482371,\"right\":1424090482373},{\"id\":1424090482373,\"left\":1424090482372,\"right\":1424090482374},{\"id\":1424090482374,\"left\":1424090482373,\"right\":1424090482375},{\"id\":1424090482375,\"left\":1424090482374,\"right\":1424090482376},{\"id\":1424090482376,\"bottom\":1424090482391,\"left\":1424090482375},{\"id\":1424090482377,\"top\":1424090482340,\"right\":1424090482378},{\"id\":1424090482378,\"left\":1424090482377,\"right\":1424090482379},{\"id\":1424090482379,\"left\":1424090482378,\"right\":1424090482380},{\"id\":1424090482380,\"left\":1424090482379,\"right\":1424090482381},{\"id\":1424090482381,\"left\":1424090482380,\"right\":1424090482382},{\"id\":1424090482382,\"left\":1424090482381,\"right\":1424090482383},{\"id\":1424090482383,\"bottom\":1424090482384,\"left\":1424090482382}],[{\"id\":1424090482408,\"top\":1424090482359,\"bottom\":1424090482409},{\"id\":1424090482407,\"top\":1424090482360,\"right\":1424090482406},{\"id\":1424090482406,\"left\":1424090482407,\"right\":1424090482405},{\"id\":1424090482405,\"left\":1424090482406,\"right\":1424090482404},{\"id\":1424090482404,\"left\":1424090482405,\"right\":1424090482403},{\"id\":1424090482403,\"top\":1424090482364,\"left\":1424090482404},{\"id\":1424090482402,\"top\":1424090482365,\"right\":1424090482401},{\"id\":1424090482401,\"left\":1424090482402,\"right\":1424090482400},{\"id\":1424090482400,\"bottom\":1424090482417,\"left\":1424090482401},{\"id\":1424090482399,\"top\":1424090482368,\"right\":1424090482398},{\"id\":1424090482398,\"top\":1424090482369,\"left\":1424090482399},{\"id\":1424090482397,\"top\":1424090482370,\"right\":1424090482396},{\"id\":1424090482396,\"left\":1424090482397,\"right\":1424090482395},{\"id\":1424090482395,\"left\":1424090482396,\"right\":1424090482394},{\"id\":1424090482394,\"left\":1424090482395,\"right\":1424090482393},{\"id\":1424090482393,\"left\":1424090482394,\"right\":1424090482392},{\"id\":1424090482392,\"bottom\":1424090482425,\"left\":1424090482393},{\"id\":1424090482391,\"top\":1424090482376,\"bottom\":1424090482426,\"right\":1424090482390},{\"id\":1424090482390,\"bottom\":1424090482427,\"left\":1424090482391},{\"id\":1424090482389,\"bottom\":1424090482428,\"right\":1424090482388},{\"id\":1424090482388,\"bottom\":1424090482429,\"left\":1424090482389,\"right\":1424090482387},{\"id\":1424090482387,\"left\":1424090482388,\"right\":1424090482386},{\"id\":1424090482386,\"left\":1424090482387,\"right\":1424090482385},{\"id\":1424090482385,\"left\":1424090482386,\"right\":1424090482384},{\"id\":1424090482384,\"top\":1424090482383,\"bottom\":1424090482433,\"left\":1424090482385}],[{\"id\":1424090482409,\"top\":1424090482408,\"right\":1424090482410},{\"id\":1424090482410,\"left\":1424090482409,\"right\":1424090482411},{\"id\":1424090482411,\"left\":1424090482410,\"right\":1424090482412},{\"id\":1424090482412,\"bottom\":1424090482455,\"left\":1424090482411,\"right\":1424090482413},{\"id\":1424090482413,\"left\":1424090482412,\"right\":1424090482414},{\"id\":1424090482414,\"left\":1424090482413,\"right\":1424090482415},{\"id\":1424090482415,\"left\":1424090482414,\"right\":1424090482416},{\"id\":1424090482416,\"left\":1424090482415},{\"id\":1424090482417,\"top\":1424090482400,\"right\":1424090482418},{\"id\":1424090482418,\"left\":1424090482417,\"right\":1424090482419},{\"id\":1424090482419,\"left\":1424090482418,\"right\":1424090482420},{\"id\":1424090482420,\"left\":1424090482419,\"right\":1424090482421},{\"id\":1424090482421,\"bottom\":1424090482446,\"left\":1424090482420,\"right\":1424090482422},{\"id\":1424090482422,\"left\":1424090482421,\"right\":1424090482423},{\"id\":1424090482423,\"left\":1424090482422,\"right\":1424090482424},{\"id\":1424090482424,\"left\":1424090482423,\"right\":1424090482425},{\"id\":1424090482425,\"top\":1424090482392,\"left\":1424090482424},{\"id\":1424090482426,\"top\":1424090482391},{\"id\":1424090482427,\"top\":1424090482390,\"right\":1424090482428},{\"id\":1424090482428,\"top\":1424090482389,\"left\":1424090482427},{\"id\":1424090482429,\"top\":1424090482388,\"bottom\":1424090482438},{\"id\":1424090482430,\"right\":1424090482431},{\"id\":1424090482431,\"left\":1424090482430,\"right\":1424090482432},{\"id\":1424090482432,\"left\":1424090482431,\"right\":1424090482433},{\"id\":1424090482433,\"top\":1424090482384,\"left\":1424090482432}],[{\"id\":1424090482458,\"bottom\":1424090482459,\"right\":1424090482457},{\"id\":1424090482457,\"left\":1424090482458,\"right\":1424090482456},{\"id\":1424090482456,\"left\":1424090482457,\"right\":1424090482455},{\"id\":1424090482455,\"top\":1424090482412,\"left\":1424090482456,\"right\":1424090482454},{\"id\":1424090482454,\"left\":1424090482455,\"right\":1424090482453},{\"id\":1424090482453,\"left\":1424090482454,\"right\":1424090482452},{\"id\":1424090482452,\"left\":1424090482453,\"right\":1424090482451},{\"id\":1424090482451,\"left\":1424090482452},{\"id\":1424090482450,\"bottom\":1424090482467,\"right\":1424090482449},{\"id\":1424090482449,\"left\":1424090482450,\"right\":1424090482448},{\"id\":1424090482448,\"left\":1424090482449,\"right\":1424090482447},{\"id\":1424090482447,\"left\":1424090482448,\"right\":1424090482446},{\"id\":1424090482446,\"top\":1424090482421,\"left\":1424090482447,\"right\":1424090482445},{\"id\":1424090482445,\"left\":1424090482446,\"right\":1424090482444},{\"id\":1424090482444,\"left\":1424090482445,\"right\":1424090482443},{\"id\":1424090482443,\"left\":1424090482444,\"right\":1424090482442},{\"id\":1424090482442,\"left\":1424090482443},{\"id\":1424090482441,\"bottom\":1424090482476,\"right\":1424090482440},{\"id\":1424090482440,\"left\":1424090482441,\"right\":1424090482439},{\"id\":1424090482439,\"left\":1424090482440,\"right\":1424090482438},{\"id\":1424090482438,\"top\":1424090482429,\"left\":1424090482439,\"right\":1424090482437},{\"id\":1424090482437,\"left\":1424090482438,\"right\":1424090482436},{\"id\":1424090482436,\"left\":1424090482437,\"right\":1424090482435},{\"id\":1424090482435,\"left\":1424090482436,\"right\":1424090482434},{\"id\":1424090482434,\"bottom\":1424090482483,\"left\":1424090482435}],[{\"id\":1424090482459,\"top\":1424090482458,\"right\":1424090482460},{\"id\":1424090482460,\"left\":1424090482459,\"right\":1424090482461},{\"id\":1424090482461,\"left\":1424090482460,\"right\":1424090482462},{\"id\":1424090482462,\"left\":1424090482461,\"right\":1424090482463},{\"id\":1424090482463,\"bottom\":1424090482504,\"left\":1424090482462,\"right\":1424090482464},{\"id\":1424090482464,\"bottom\":1424090482503,\"left\":1424090482463,\"right\":1424090482465},{\"id\":1424090482465,\"left\":1424090482464,\"right\":1424090482466},{\"id\":1424090482466,\"item\":{\"type\":\"parfum\"},\"left\":1424090482465},{\"id\":1424090482467,\"top\":1424090482450,\"bottom\":1424090482500,\"right\":1424090482468},{\"id\":1424090482468,\"left\":1424090482467,\"right\":1424090482469},{\"id\":1424090482469,\"left\":1424090482468,\"right\":1424090482470},{\"id\":1424090482470,\"left\":1424090482469,\"right\":1424090482471},{\"id\":1424090482471,\"bottom\":1424090482496,\"left\":1424090482470,\"right\":1424090482472},{\"id\":1424090482472,\"left\":1424090482471,\"right\":1424090482473},{\"id\":1424090482473,\"left\":1424090482472,\"right\":1424090482474},{\"id\":1424090482474,\"left\":1424090482473,\"right\":1424090482475},{\"id\":1424090482475,\"bottom\":1424090482492,\"left\":1424090482474},{\"id\":1424090482476,\"top\":1424090482441,\"right\":1424090482477},{\"id\":1424090482477,\"left\":1424090482476,\"right\":1424090482478},{\"id\":1424090482478,\"left\":1424090482477,\"right\":1424090482479},{\"id\":1424090482479,\"bottom\":1424090482488,\"left\":1424090482478,\"right\":1424090482480},{\"id\":1424090482480,\"bottom\":1424090482487,\"left\":1424090482479,\"right\":1424090482481},{\"id\":1424090482481,\"left\":1424090482480,\"right\":1424090482482},{\"id\":1424090482482,\"left\":1424090482481,\"right\":1424090482483},{\"id\":1424090482483,\"top\":1424090482434,\"left\":1424090482482}],[{\"id\":1424090482508,\"bottom\":1424090482509,\"right\":1424090482507},{\"id\":1424090482507,\"left\":1424090482508,\"right\":1424090482506},{\"id\":1424090482506,\"left\":1424090482507,\"right\":1424090482505},{\"id\":1424090482505,\"left\":1424090482506,\"right\":1424090482504},{\"id\":1424090482504,\"top\":1424090482463,\"left\":1424090482505},{\"id\":1424090482503,\"top\":1424090482464,\"right\":1424090482502},{\"id\":1424090482502,\"left\":1424090482503,\"right\":1424090482501},{\"id\":1424090482501,\"left\":1424090482502,\"right\":1424090482500},{\"id\":1424090482500,\"top\":1424090482467,\"left\":1424090482501,\"right\":1424090482499},{\"id\":1424090482499,\"left\":1424090482500,\"right\":1424090482498},{\"id\":1424090482498,\"left\":1424090482499},{\"id\":1424090482497,\"bottom\":1424090482520,\"right\":1424090482496},{\"id\":1424090482496,\"top\":1424090482471,\"left\":1424090482497,\"right\":1424090482495},{\"id\":1424090482495,\"bottom\":1424090482522,\"left\":1424090482496},{\"id\":1424090482494,\"right\":1424090482493},{\"id\":1424090482493,\"left\":1424090482494,\"right\":1424090482492},{\"id\":1424090482492,\"top\":1424090482475,\"left\":1424090482493,\"right\":1424090482491},{\"id\":1424090482491,\"left\":1424090482492,\"right\":1424090482490},{\"id\":1424090482490,\"left\":1424090482491,\"right\":1424090482489},{\"id\":1424090482489,\"left\":1424090482490,\"right\":1424090482488},{\"id\":1424090482488,\"top\":1424090482479,\"left\":1424090482489},{\"id\":1424090482487,\"top\":1424090482480,\"right\":1424090482486},{\"id\":1424090482486,\"left\":1424090482487,\"right\":1424090482485},{\"id\":1424090482485,\"left\":1424090482486,\"right\":1424090482484},{\"id\":1424090482484,\"bottom\":1424090482533,\"left\":1424090482485}],[{\"id\":1424090482509,\"top\":1424090482508,\"bottom\":1424090482558,\"right\":1424090482510},{\"id\":1424090482510,\"left\":1424090482509,\"right\":1424090482511},{\"id\":1424090482511,\"left\":1424090482510,\"right\":1424090482512},{\"id\":1424090482512,\"left\":1424090482511,\"right\":1424090482513},{\"id\":1424090482513,\"left\":1424090482512,\"right\":1424090482514},{\"id\":1424090482514,\"left\":1424090482513,\"right\":1424090482515},{\"id\":1424090482515,\"left\":1424090482514,\"right\":1424090482516},{\"id\":1424090482516,\"left\":1424090482515,\"right\":1424090482517},{\"id\":1424090482517,\"left\":1424090482516,\"right\":1424090482518},{\"id\":1424090482518,\"left\":1424090482517,\"right\":1424090482519},{\"id\":1424090482519,\"left\":1424090482518,\"right\":1424090482520},{\"id\":1424090482520,\"top\":1424090482497,\"bottom\":1424090482547,\"left\":1424090482519,\"right\":1424090482521},{\"id\":1424090482521,\"left\":1424090482520,\"right\":1424090482522},{\"id\":1424090482522,\"top\":1424090482495,\"bottom\":1424090482545,\"left\":1424090482521,\"right\":1424090482523},{\"id\":1424090482523,\"left\":1424090482522,\"right\":1424090482524},{\"id\":1424090482524,\"left\":1424090482523,\"right\":1424090482525},{\"id\":1424090482525,\"left\":1424090482524,\"right\":1424090482526},{\"id\":1424090482526,\"left\":1424090482525,\"right\":1424090482527},{\"id\":1424090482527,\"left\":1424090482526,\"right\":1424090482528},{\"id\":1424090482528,\"left\":1424090482527,\"right\":1424090482529},{\"id\":1424090482529,\"left\":1424090482528,\"right\":1424090482530},{\"id\":1424090482530,\"left\":1424090482529,\"right\":1424090482531},{\"id\":1424090482531,\"left\":1424090482530,\"right\":1424090482532},{\"id\":1424090482532,\"left\":1424090482531,\"right\":1424090482533},{\"id\":1424090482533,\"top\":1424090482484,\"bottom\":1424090482534,\"left\":1424090482532}],[{\"id\":1424090482558,\"top\":1424090482509,\"right\":1424090482557},{\"id\":1424090482557,\"left\":1424090482558,\"right\":1424090482556},{\"id\":1424090482556,\"left\":1424090482557,\"right\":1424090482555},{\"id\":1424090482555,\"bottom\":1424090482562,\"left\":1424090482556},{\"id\":1424090482554,\"bottom\":1424090482563,\"right\":1424090482553},{\"id\":1424090482553,\"left\":1424090482554,\"right\":1424090482552},{\"id\":1424090482552,\"left\":1424090482553,\"right\":1424090482551},{\"id\":1424090482551,\"left\":1424090482552,\"right\":1424090482550},{\"id\":1424090482550,\"bottom\":1424090482567,\"left\":1424090482551,\"right\":1424090482549},{\"id\":1424090482549,\"left\":1424090482550,\"right\":1424090482548},{\"id\":1424090482548,\"left\":1424090482549},{\"id\":1424090482547,\"top\":1424090482520,\"right\":1424090482546},{\"id\":1424090482546,\"bottom\":1424090482571,\"left\":1424090482547,\"right\":1424090482545},{\"id\":1424090482545,\"top\":1424090482522,\"left\":1424090482546},{\"id\":1424090482544,\"right\":1424090482543},{\"id\":1424090482543,\"left\":1424090482544,\"right\":1424090482542},{\"id\":1424090482542,\"bottom\":1424090482575,\"left\":1424090482543,\"right\":1424090482541},{\"id\":1424090482541,\"left\":1424090482542,\"right\":1424090482540},{\"id\":1424090482540,\"left\":1424090482541,\"right\":1424090482539},{\"id\":1424090482539,\"bottom\":1424090482578,\"left\":1424090482540},{\"id\":1424090482538,\"bottom\":1424090482579,\"right\":1424090482537},{\"id\":1424090482537,\"left\":1424090482538,\"right\":1424090482536},{\"id\":1424090482536,\"left\":1424090482537,\"right\":1424090482535},{\"id\":1424090482535,\"left\":1424090482536,\"right\":1424090482534},{\"id\":1424090482534,\"top\":1424090482533,\"left\":1424090482535}],[{\"id\":1424090482559,\"bottom\":1424090482608,\"right\":1424090482560},{\"id\":1424090482560,\"left\":1424090482559,\"right\":1424090482561},{\"id\":1424090482561,\"left\":1424090482560,\"right\":1424090482562},{\"id\":1424090482562,\"top\":1424090482555,\"left\":1424090482561,\"right\":1424090482563},{\"id\":1424090482563,\"top\":1424090482554,\"left\":1424090482562,\"right\":1424090482564},{\"id\":1424090482564,\"left\":1424090482563,\"right\":1424090482565},{\"id\":1424090482565,\"left\":1424090482564,\"right\":1424090482566},{\"id\":1424090482566,\"bottom\":1424090482601,\"left\":1424090482565},{\"id\":1424090482567,\"top\":1424090482550,\"right\":1424090482568},{\"id\":1424090482568,\"left\":1424090482567,\"right\":1424090482569},{\"id\":1424090482569,\"left\":1424090482568,\"right\":1424090482570},{\"id\":1424090482570,\"left\":1424090482569,\"right\":1424090482571},{\"id\":1424090482571,\"top\":1424090482546,\"left\":1424090482570,\"right\":1424090482572},{\"id\":1424090482572,\"left\":1424090482571,\"right\":1424090482573},{\"id\":1424090482573,\"left\":1424090482572,\"right\":1424090482574},{\"id\":1424090482574,\"left\":1424090482573,\"right\":1424090482575},{\"id\":1424090482575,\"top\":1424090482542,\"bottom\":1424090482592,\"left\":1424090482574},{\"id\":1424090482576,\"item\":{\"type\":\"parfum\"},\"right\":1424090482577},{\"id\":1424090482577,\"left\":1424090482576,\"right\":1424090482578},{\"id\":1424090482578,\"top\":1424090482539,\"left\":1424090482577,\"right\":1424090482579},{\"id\":1424090482579,\"top\":1424090482538,\"left\":1424090482578,\"right\":1424090482580},{\"id\":1424090482580,\"left\":1424090482579,\"right\":1424090482581},{\"id\":1424090482581,\"left\":1424090482580,\"right\":1424090482582},{\"id\":1424090482582,\"left\":1424090482581,\"right\":1424090482583},{\"id\":1424090482583,\"bottom\":1424090482584,\"left\":1424090482582}],[{\"id\":1424090482608,\"top\":1424090482559,\"right\":1424090482607},{\"id\":1424090482607,\"left\":1424090482608,\"right\":1424090482606},{\"id\":1424090482606,\"left\":1424090482607,\"right\":1424090482605},{\"id\":1424090482605,\"left\":1424090482606,\"right\":1424090482604},{\"id\":1424090482604,\"bottom\":1424090482613,\"left\":1424090482605,\"right\":1424090482603},{\"id\":1424090482603,\"left\":1424090482604,\"right\":1424090482602},{\"id\":1424090482602,\"left\":1424090482603,\"right\":1424090482601},{\"id\":1424090482601,\"top\":1424090482566,\"left\":1424090482602},{\"id\":1424090482600,\"right\":1424090482599},{\"id\":1424090482599,\"left\":1424090482600,\"right\":1424090482598},{\"id\":1424090482598,\"left\":1424090482599,\"right\":1424090482597},{\"id\":1424090482597,\"left\":1424090482598,\"right\":1424090482596},{\"id\":1424090482596,\"bottom\":1424090482621,\"left\":1424090482597,\"right\":1424090482595},{\"id\":1424090482595,\"left\":1424090482596,\"right\":1424090482594},{\"id\":1424090482594,\"left\":1424090482595,\"right\":1424090482593},{\"id\":1424090482593,\"left\":1424090482594,\"right\":1424090482592},{\"id\":1424090482592,\"top\":1424090482575,\"left\":1424090482593},{\"id\":1424090482591,\"right\":1424090482590},{\"id\":1424090482590,\"left\":1424090482591,\"right\":1424090482589},{\"id\":1424090482589,\"left\":1424090482590,\"right\":1424090482588},{\"id\":1424090482588,\"left\":1424090482589,\"right\":1424090482587},{\"id\":1424090482587,\"bottom\":1424090482630,\"left\":1424090482588,\"right\":1424090482586},{\"id\":1424090482586,\"left\":1424090482587,\"right\":1424090482585},{\"id\":1424090482585,\"left\":1424090482586,\"right\":1424090482584},{\"id\":1424090482584,\"top\":1424090482583,\"left\":1424090482585}],[{\"id\":1424090482609,\"bottom\":1424090482658,\"right\":1424090482610},{\"id\":1424090482610,\"left\":1424090482609,\"right\":1424090482611},{\"id\":1424090482611,\"left\":1424090482610,\"right\":1424090482612},{\"id\":1424090482612,\"left\":1424090482611},{\"id\":1424090482613,\"top\":1424090482604,\"bottom\":1424090482654},{\"id\":1424090482614,\"bottom\":1424090482653,\"right\":1424090482615},{\"id\":1424090482615,\"bottom\":1424090482652,\"left\":1424090482614},{\"id\":1424090482616,\"bottom\":1424090482651},{\"id\":1424090482617,\"bottom\":1424090482650,\"right\":1424090482618},{\"id\":1424090482618,\"left\":1424090482617,\"right\":1424090482619},{\"id\":1424090482619,\"left\":1424090482618,\"right\":1424090482620},{\"id\":1424090482620,\"left\":1424090482619,\"right\":1424090482621},{\"id\":1424090482621,\"top\":1424090482596,\"left\":1424090482620,\"right\":1424090482622},{\"id\":1424090482622,\"left\":1424090482621,\"right\":1424090482623},{\"id\":1424090482623,\"left\":1424090482622,\"right\":1424090482624},{\"id\":1424090482624,\"left\":1424090482623,\"right\":1424090482625},{\"id\":1424090482625,\"bottom\":1424090482642,\"left\":1424090482624},{\"id\":1424090482626,\"right\":1424090482627},{\"id\":1424090482627,\"left\":1424090482626,\"right\":1424090482628},{\"id\":1424090482628,\"left\":1424090482627,\"right\":1424090482629},{\"id\":1424090482629,\"left\":1424090482628,\"right\":1424090482630},{\"id\":1424090482630,\"top\":1424090482587,\"left\":1424090482629,\"right\":1424090482631},{\"id\":1424090482631,\"left\":1424090482630,\"right\":1424090482632},{\"id\":1424090482632,\"left\":1424090482631,\"right\":1424090482633},{\"id\":1424090482633,\"bottom\":1424090482634,\"left\":1424090482632}],[{\"id\":1424090482658,\"top\":1424090482609,\"bottom\":1424090482659,\"right\":1424090482657},{\"id\":1424090482657,\"left\":1424090482658,\"right\":1424090482656},{\"id\":1424090482656,\"left\":1424090482657,\"right\":1424090482655},{\"id\":1424090482655,\"left\":1424090482656,\"right\":1424090482654},{\"id\":1424090482654,\"top\":1424090482613,\"left\":1424090482655,\"right\":1424090482653},{\"id\":1424090482653,\"top\":1424090482614,\"left\":1424090482654},{\"id\":1424090482652,\"top\":1424090482615,\"right\":1424090482651},{\"id\":1424090482651,\"top\":1424090482616,\"bottom\":1424090482666,\"left\":1424090482652},{\"id\":1424090482650,\"top\":1424090482617,\"right\":1424090482649},{\"id\":1424090482649,\"left\":1424090482650,\"right\":1424090482648},{\"id\":1424090482648,\"left\":1424090482649,\"right\":1424090482647},{\"id\":1424090482647,\"left\":1424090482648,\"right\":1424090482646},{\"id\":1424090482646,\"left\":1424090482647,\"right\":1424090482645},{\"id\":1424090482645,\"bottom\":1424090482672,\"left\":1424090482646},{\"id\":1424090482644,\"bottom\":1424090482673,\"right\":1424090482643},{\"id\":1424090482643,\"bottom\":1424090482674,\"left\":1424090482644},{\"id\":1424090482642,\"top\":1424090482625,\"right\":1424090482641},{\"id\":1424090482641,\"left\":1424090482642,\"right\":1424090482640},{\"id\":1424090482640,\"bottom\":1424090482677,\"left\":1424090482641},{\"id\":1424090482639,\"bottom\":1424090482678,\"right\":1424090482638},{\"id\":1424090482638,\"left\":1424090482639,\"right\":1424090482637},{\"id\":1424090482637,\"left\":1424090482638,\"right\":1424090482636},{\"id\":1424090482636,\"left\":1424090482637,\"right\":1424090482635},{\"id\":1424090482635,\"bottom\":1424090482682,\"left\":1424090482636},{\"id\":1424090482634,\"top\":1424090482633,\"bottom\":1424090482683}],[{\"id\":1424090482659,\"top\":1424090482658,\"right\":1424090482660},{\"id\":1424090482660,\"left\":1424090482659,\"right\":1424090482661},{\"id\":1424090482661,\"left\":1424090482660,\"right\":1424090482662},{\"id\":1424090482662,\"left\":1424090482661,\"right\":1424090482663},{\"id\":1424090482663,\"left\":1424090482662,\"right\":1424090482664},{\"id\":1424090482664,\"left\":1424090482663,\"right\":1424090482665},{\"id\":1424090482665,\"bottom\":1424090482702,\"left\":1424090482664},{\"id\":1424090482666,\"top\":1424090482651,\"right\":1424090482667},{\"id\":1424090482667,\"left\":1424090482666,\"right\":1424090482668},{\"id\":1424090482668,\"left\":1424090482667,\"right\":1424090482669},{\"id\":1424090482669,\"left\":1424090482668,\"right\":1424090482670},{\"id\":1424090482670,\"left\":1424090482669,\"right\":1424090482671},{\"id\":1424090482671,\"bottom\":1424090482696,\"left\":1424090482670},{\"id\":1424090482672,\"top\":1424090482645,\"bottom\":1424090482695},{\"id\":1424090482673,\"top\":1424090482644,\"bottom\":1424090482694},{\"id\":1424090482674,\"top\":1424090482643,\"right\":1424090482675},{\"id\":1424090482675,\"left\":1424090482674,\"right\":1424090482676},{\"id\":1424090482676,\"left\":1424090482675,\"right\":1424090482677},{\"id\":1424090482677,\"top\":1424090482640,\"left\":1424090482676},{\"id\":1424090482678,\"top\":1424090482639,\"right\":1424090482679},{\"id\":1424090482679,\"left\":1424090482678,\"right\":1424090482680},{\"id\":1424090482680,\"left\":1424090482679,\"right\":1424090482681},{\"id\":1424090482681,\"bottom\":1424090482686,\"left\":1424090482680},{\"id\":1424090482682,\"top\":1424090482635,\"bottom\":1424090482685},{\"id\":1424090482683,\"top\":1424090482634,\"bottom\":1424090482684}],[{\"id\":1424090482708,\"bottom\":1424090482709,\"right\":1424090482707},{\"id\":1424090482707,\"left\":1424090482708,\"right\":1424090482706},{\"id\":1424090482706,\"left\":1424090482707,\"right\":1424090482705},{\"id\":1424090482705,\"left\":1424090482706,\"right\":1424090482704},{\"id\":1424090482704,\"bottom\":1424090482713,\"left\":1424090482705,\"right\":1424090482703},{\"id\":1424090482703,\"left\":1424090482704,\"right\":1424090482702},{\"id\":1424090482702,\"top\":1424090482665,\"bottom\":1424090482715,\"left\":1424090482703,\"right\":1424090482701},{\"id\":1424090482701,\"left\":1424090482702,\"right\":1424090482700},{\"id\":1424090482700,\"left\":1424090482701,\"right\":1424090482699},{\"id\":1424090482699,\"left\":1424090482700,\"right\":1424090482698},{\"id\":1424090482698,\"left\":1424090482699,\"right\":1424090482697},{\"id\":1424090482697,\"bottom\":1424090482720,\"left\":1424090482698},{\"id\":1424090482696,\"top\":1424090482671,\"right\":1424090482695},{\"id\":1424090482695,\"top\":1424090482672,\"left\":1424090482696},{\"id\":1424090482694,\"top\":1424090482673,\"right\":1424090482693},{\"id\":1424090482693,\"left\":1424090482694,\"right\":1424090482692},{\"id\":1424090482692,\"left\":1424090482693,\"right\":1424090482691},{\"id\":1424090482691,\"bottom\":1424090482726,\"left\":1424090482692},{\"id\":1424090482690,\"bottom\":1424090482727,\"right\":1424090482689},{\"id\":1424090482689,\"left\":1424090482690,\"right\":1424090482688},{\"id\":1424090482688,\"left\":1424090482689,\"right\":1424090482687},{\"id\":1424090482687,\"left\":1424090482688,\"right\":1424090482686},{\"id\":1424090482686,\"top\":1424090482681,\"left\":1424090482687},{\"id\":1424090482685,\"top\":1424090482682,\"bottom\":1424090482732},{\"id\":1424090482684,\"top\":1424090482683,\"bottom\":1424090482733}],[{\"id\":1424090482709,\"top\":1424090482708,\"right\":1424090482710},{\"id\":1424090482710,\"left\":1424090482709,\"right\":1424090482711},{\"id\":1424090482711,\"left\":1424090482710,\"right\":1424090482712},{\"id\":1424090482712,\"item\":{\"type\":\"potion\"},\"left\":1424090482711},{\"id\":1424090482713,\"top\":1424090482704,\"bottom\":1424090482754,\"right\":1424090482714},{\"id\":1424090482714,\"left\":1424090482713,\"right\":1424090482715},{\"id\":1424090482715,\"top\":1424090482702,\"bottom\":1424090482752,\"left\":1424090482714,\"right\":1424090482716},{\"id\":1424090482716,\"left\":1424090482715,\"right\":1424090482717},{\"id\":1424090482717,\"left\":1424090482716,\"right\":1424090482718},{\"id\":1424090482718,\"bottom\":1424090482749,\"left\":1424090482717,\"right\":1424090482719},{\"id\":1424090482719,\"left\":1424090482718,\"right\":1424090482720},{\"id\":1424090482720,\"top\":1424090482697,\"left\":1424090482719,\"right\":1424090482721},{\"id\":1424090482721,\"left\":1424090482720,\"right\":1424090482722},{\"id\":1424090482722,\"left\":1424090482721,\"right\":1424090482723},{\"id\":1424090482723,\"bottom\":1424090482744,\"left\":1424090482722,\"right\":1424090482724},{\"id\":1424090482724,\"left\":1424090482723,\"right\":1424090482725},{\"id\":1424090482725,\"left\":1424090482724},{\"id\":1424090482726,\"top\":1424090482691,\"bottom\":1424090482741},{\"id\":1424090482727,\"top\":1424090482690,\"bottom\":1424090482740},{\"id\":1424090482728,\"bottom\":1424090482739,\"right\":1424090482729},{\"id\":1424090482729,\"left\":1424090482728,\"right\":1424090482730},{\"id\":1424090482730,\"left\":1424090482729,\"right\":1424090482731},{\"id\":1424090482731,\"left\":1424090482730,\"right\":1424090482732},{\"id\":1424090482732,\"top\":1424090482685,\"left\":1424090482731},{\"id\":1424090482733,\"top\":1424090482684,\"bottom\":1424090482734}],[{\"id\":1424090482758,\"bottom\":1424090482759,\"right\":1424090482757},{\"id\":1424090482757,\"left\":1424090482758,\"right\":1424090482756},{\"id\":1424090482756,\"left\":1424090482757,\"right\":1424090482755},{\"id\":1424090482755,\"left\":1424090482756,\"right\":1424090482754},{\"id\":1424090482754,\"top\":1424090482713,\"left\":1424090482755,\"right\":1424090482753},{\"id\":1424090482753,\"left\":1424090482754,\"right\":1424090482752},{\"id\":1424090482752,\"top\":1424090482715,\"left\":1424090482753},{\"id\":1424090482751,\"bottom\":1424090482766,\"right\":1424090482750},{\"id\":1424090482750,\"bottom\":1424090482767,\"left\":1424090482751},{\"id\":1424090482749,\"top\":1424090482718,\"right\":1424090482748},{\"id\":1424090482748,\"left\":1424090482749,\"right\":1424090482747},{\"id\":1424090482747,\"left\":1424090482748,\"right\":1424090482746},{\"id\":1424090482746,\"left\":1424090482747,\"right\":1424090482745},{\"id\":1424090482745,\"bottom\":1424090482772,\"left\":1424090482746},{\"id\":1424090482744,\"top\":1424090482723,\"right\":1424090482743},{\"id\":1424090482743,\"left\":1424090482744,\"right\":1424090482742},{\"id\":1424090482742,\"bottom\":1424090482775,\"left\":1424090482743},{\"id\":1424090482741,\"item\":{\"type\":\"trap\"},\"top\":1424090482726,\"right\":1424090482740},{\"id\":1424090482740,\"top\":1424090482727,\"left\":1424090482741},{\"id\":1424090482739,\"top\":1424090482728,\"bottom\":1424090482778,\"right\":1424090482738},{\"id\":1424090482738,\"left\":1424090482739,\"right\":1424090482737},{\"id\":1424090482737,\"left\":1424090482738,\"right\":1424090482736},{\"id\":1424090482736,\"left\":1424090482737,\"right\":1424090482735},{\"id\":1424090482735,\"left\":1424090482736,\"right\":1424090482734},{\"id\":1424090482734,\"top\":1424090482733,\"left\":1424090482735}],[{\"id\":1424090482759,\"top\":1424090482758,\"right\":1424090482760},{\"id\":1424090482760,\"left\":1424090482759,\"right\":1424090482761},{\"id\":1424090482761,\"left\":1424090482760,\"right\":1424090482762},{\"id\":1424090482762,\"left\":1424090482761,\"right\":1424090482763},{\"id\":1424090482763,\"left\":1424090482762,\"right\":1424090482764},{\"id\":1424090482764,\"left\":1424090482763,\"right\":1424090482765},{\"id\":1424090482765,\"left\":1424090482764,\"right\":1424090482766},{\"id\":1424090482766,\"top\":1424090482751,\"left\":1424090482765},{\"id\":1424090482767,\"top\":1424090482750,\"bottom\":1424090482800,\"right\":1424090482768},{\"id\":1424090482768,\"left\":1424090482767,\"right\":1424090482769},{\"id\":1424090482769,\"left\":1424090482768,\"right\":1424090482770},{\"id\":1424090482770,\"left\":1424090482769,\"right\":1424090482771},{\"id\":1424090482771,\"bottom\":1424090482796,\"left\":1424090482770},{\"id\":1424090482772,\"top\":1424090482745,\"right\":1424090482773},{\"id\":1424090482773,\"left\":1424090482772,\"right\":1424090482774},{\"id\":1424090482774,\"bottom\":1424090482793,\"left\":1424090482773},{\"id\":1424090482775,\"top\":1424090482742,\"right\":1424090482776},{\"id\":1424090482776,\"left\":1424090482775,\"right\":1424090482777},{\"id\":1424090482777,\"bottom\":1424090482790,\"left\":1424090482776,\"right\":1424090482778},{\"id\":1424090482778,\"top\":1424090482739,\"left\":1424090482777},{\"id\":1424090482779,\"bottom\":1424090482788,\"right\":1424090482780},{\"id\":1424090482780,\"bottom\":1424090482787,\"left\":1424090482779,\"right\":1424090482781},{\"id\":1424090482781,\"left\":1424090482780},{\"id\":1424090482782,\"bottom\":1424090482785,\"right\":1424090482783},{\"id\":1424090482783,\"bottom\":1424090482784,\"left\":1424090482782}],[{\"id\":1424090482808,\"bottom\":1424090482809,\"right\":1424090482807},{\"id\":1424090482807,\"left\":1424090482808,\"right\":1424090482806},{\"id\":1424090482806,\"left\":1424090482807,\"right\":1424090482805},{\"id\":1424090482805,\"left\":1424090482806,\"right\":1424090482804},{\"id\":1424090482804,\"left\":1424090482805,\"right\":1424090482803},{\"id\":1424090482803,\"left\":1424090482804,\"right\":1424090482802},{\"id\":1424090482802,\"left\":1424090482803,\"right\":1424090482801},{\"id\":1424090482801,\"left\":1424090482802,\"right\":1424090482800},{\"id\":1424090482800,\"top\":1424090482767,\"left\":1424090482801},{\"id\":1424090482799,\"bottom\":1424090482818,\"right\":1424090482798},{\"id\":1424090482798,\"left\":1424090482799,\"right\":1424090482797},{\"id\":1424090482797,\"bottom\":1424090482820,\"left\":1424090482798},{\"id\":1424090482796,\"top\":1424090482771,\"right\":1424090482795},{\"id\":1424090482795,\"left\":1424090482796,\"right\":1424090482794},{\"id\":1424090482794,\"bottom\":1424090482823,\"left\":1424090482795},{\"id\":1424090482793,\"top\":1424090482774,\"right\":1424090482792},{\"id\":1424090482792,\"left\":1424090482793,\"right\":1424090482791},{\"id\":1424090482791,\"bottom\":1424090482826,\"left\":1424090482792},{\"id\":1424090482790,\"top\":1424090482777,\"right\":1424090482789},{\"id\":1424090482789,\"left\":1424090482790,\"right\":1424090482788},{\"id\":1424090482788,\"top\":1424090482779,\"left\":1424090482789},{\"id\":1424090482787,\"top\":1424090482780,\"right\":1424090482786},{\"id\":1424090482786,\"left\":1424090482787,\"right\":1424090482785},{\"id\":1424090482785,\"top\":1424090482782,\"left\":1424090482786},{\"id\":1424090482784,\"top\":1424090482783,\"bottom\":1424090482833}],[{\"id\":1424090482809,\"top\":1424090482808,\"right\":1424090482810},{\"id\":1424090482810,\"left\":1424090482809,\"right\":1424090482811},{\"id\":1424090482811,\"left\":1424090482810,\"right\":1424090482812},{\"id\":1424090482812,\"left\":1424090482811,\"right\":1424090482813},{\"id\":1424090482813,\"left\":1424090482812,\"right\":1424090482814},{\"id\":1424090482814,\"left\":1424090482813,\"right\":1424090482815},{\"id\":1424090482815,\"left\":1424090482814,\"right\":1424090482816},{\"id\":1424090482816,\"left\":1424090482815,\"right\":1424090482817},{\"id\":1424090482817,\"left\":1424090482816,\"right\":1424090482818},{\"id\":1424090482818,\"top\":1424090482799,\"left\":1424090482817},{\"id\":1424090482819},{\"id\":1424090482820,\"top\":1424090482797,\"right\":1424090482821},{\"id\":1424090482821,\"left\":1424090482820,\"right\":1424090482822},{\"id\":1424090482822,\"left\":1424090482821,\"right\":1424090482823},{\"id\":1424090482823,\"top\":1424090482794,\"left\":1424090482822,\"right\":1424090482824},{\"id\":1424090482824,\"left\":1424090482823,\"right\":1424090482825},{\"id\":1424090482825,\"left\":1424090482824,\"right\":1424090482826},{\"id\":1424090482826,\"top\":1424090482791,\"left\":1424090482825,\"right\":1424090482827},{\"id\":1424090482827,\"left\":1424090482826,\"right\":1424090482828},{\"id\":1424090482828,\"left\":1424090482827,\"right\":1424090482829},{\"id\":1424090482829,\"left\":1424090482828,\"right\":1424090482830},{\"id\":1424090482830,\"left\":1424090482829,\"right\":1424090482831},{\"id\":1424090482831,\"left\":1424090482830,\"right\":1424090482832},{\"id\":1424090482832,\"left\":1424090482831,\"right\":1424090482833},{\"id\":1424090482833,\"top\":1424090482784,\"left\":1424090482832}]],\"iaList\":[]}";
com.tamina.cow4.model._Action.Action_Impl_.MOVE = "move";
com.tamina.cow4.model._Action.Action_Impl_.FAIL = "fail";
com.tamina.cow4.model._Action.Action_Impl_.SUCCESS = "success";
com.tamina.cow4.model.GameConstants.GAME_MAX_NUM_TURN = 100;
com.tamina.cow4.model.GameConstants.TIMEOUT_DURATION = 2000;
com.tamina.cow4.model.GameConstants.MAX_PM = 5;
com.tamina.cow4.model._ItemType.ItemType_Impl_.POTION = "potion";
com.tamina.cow4.model._ItemType.ItemType_Impl_.PARFUM = "parfum";
com.tamina.cow4.model._ItemType.ItemType_Impl_.TRAP = "trap";
com.tamina.cow4.net.request.PlayRequestParam.IA1 = "ia1";
com.tamina.cow4.net.request.PlayRequestParam.IA2 = "ia2";
com.tamina.cow4.net.request.PlayRequestParam.GAME_ID = "gameId";
com.tamina.cow4.routes.Routes.IAList = "IAList";
com.tamina.cow4.routes.Routes.Play = "Play";
com.tamina.cow4.routes.Routes.SOCKET_TEST = "SOCKET/TEST";
com.tamina.cow4.socket.SheepIA.IA_NAME = "SheepIA";
com.tamina.cow4.socket.message.SocketMessage.END_CHAR = "#end#";
com.tamina.cow4.socket.message.Authenticate.MESSAGE_TYPE = "authenticate";
com.tamina.cow4.socket.message.Error.MESSAGE_TYPE = "error";
com.tamina.cow4.socket.message._ErrorCode.ErrorCode_Impl_.ALREADY_AUTH = 1;
com.tamina.cow4.socket.message._ErrorCode.ErrorCode_Impl_.UNKNOWN_MESSAGE = 2;
com.tamina.cow4.socket.message.GetTurnOrder.MESSAGE_TYPE = "getTurnOrder";
com.tamina.cow4.socket.message.ID.MESSAGE_TYPE = "id";
com.tamina.cow4.socket.message.Render.MESSAGE_TYPE = "render";
com.tamina.cow4.socket.message.StartBattle.MESSAGE_TYPE = "startbattle";
com.tamina.cow4.socket.message.TurnResult.MESSAGE_TYPE = "turnResult";
com.tamina.cow4.socket.message.UpdateRender.MESSAGE_TYPE = "updateRender";
nodejs.ChildProcessEventType.Disconnect = "disconnect";
nodejs.ChildProcessEventType.Error = "error";
nodejs.ChildProcessEventType.Close = "close";
nodejs.ChildProcessEventType.Message = "message";
nodejs.ChildProcessEventType.Exit = "exit";
nodejs.ProcessEventType.Exit = "exit";
nodejs.ProcessEventType.Exception = "uncaughtException";
nodejs.REPLEventType.Exit = "exit";
nodejs.events.EventEmitterEventType.NewListener = "newListener";
nodejs.events.EventEmitterEventType.RemoveListener = "removeListener";
nodejs.fs.ReadStreamEventType.Open = "open";
nodejs.fs.WriteStreamEventType.Open = "open";
nodejs.http.HTTPMethod.Get = "GET";
nodejs.http.HTTPMethod.Post = "POST";
nodejs.http.HTTPMethod.Options = "OPTIONS";
nodejs.http.HTTPMethod.Head = "HEAD";
nodejs.http.HTTPMethod.Put = "PUT";
nodejs.http.HTTPMethod.Delete = "DELETE";
nodejs.http.HTTPMethod.Trace = "TRACE";
nodejs.http.HTTPMethod.Connect = "CONNECT";
nodejs.http.HTTPClientRequestEventType.Response = "response";
nodejs.http.HTTPClientRequestEventType.Socket = "socket";
nodejs.http.HTTPClientRequestEventType.Connect = "connect";
nodejs.http.HTTPClientRequestEventType.Upgrade = "upgrade";
nodejs.http.HTTPClientRequestEventType.Continue = "continue";
nodejs.http.HTTPServerEventType.Listening = "listening";
nodejs.http.HTTPServerEventType.Connection = "connection";
nodejs.http.HTTPServerEventType.Close = "close";
nodejs.http.HTTPServerEventType.Error = "error";
nodejs.http.HTTPServerEventType.Request = "request";
nodejs.http.HTTPServerEventType.CheckContinue = "checkContinue";
nodejs.http.HTTPServerEventType.Connect = "connect";
nodejs.http.HTTPServerEventType.Upgrade = "upgrade";
nodejs.http.HTTPServerEventType.ClientError = "clientError";
nodejs.stream.ReadableEventType.Readable = "readable";
nodejs.stream.ReadableEventType.Data = "data";
nodejs.stream.ReadableEventType.End = "end";
nodejs.stream.ReadableEventType.Close = "close";
nodejs.stream.ReadableEventType.Error = "error";
nodejs.http.IncomingMessageEventType.Data = "data";
nodejs.http.IncomingMessageEventType.Close = "close";
nodejs.http.IncomingMessageEventType.End = "end";
nodejs.http.ServerResponseEventType.Close = "close";
nodejs.http.ServerResponseEventType.Finish = "finish";
nodejs.net.TCPServerEventType.Listening = "listening";
nodejs.net.TCPServerEventType.Connection = "connection";
nodejs.net.TCPServerEventType.Close = "close";
nodejs.net.TCPServerEventType.Error = "error";
nodejs.net.TCPSocketEventType.Connect = "connect";
nodejs.net.TCPSocketEventType.Data = "data";
nodejs.net.TCPSocketEventType.End = "end";
nodejs.net.TCPSocketEventType.TimeOut = "timeout";
nodejs.net.TCPSocketEventType.Drain = "drain";
nodejs.net.TCPSocketEventType.Error = "error";
nodejs.net.TCPSocketEventType.Close = "close";
nodejs.stream.WritableEventType.Drain = "drain";
nodejs.stream.WritableEventType.Finish = "finish";
nodejs.stream.WritableEventType.Pipe = "pipe";
nodejs.stream.WritableEventType.Unpipe = "unpipe";
nodejs.stream.WritableEventType.Error = "error";
nodejs.ws.WebSocketEventType.Error = "error";
nodejs.ws.WebSocketEventType.Close = "close";
nodejs.ws.WebSocketEventType.Open = "open";
nodejs.ws.WebSocketEventType.Message = "message";
nodejs.ws.WebSocketEventType.Ping = "ping";
nodejs.ws.WebSocketEventType.Pong = "pong";
nodejs.ws.WebSocketReadyState.Connecting = "CONNECTING";
nodejs.ws.WebSocketReadyState.Open = "OPEN";
nodejs.ws.WebSocketReadyState.Closing = "CLOSING";
nodejs.ws.WebSocketReadyState.Closed = "CLOSED";
nodejs.ws.WebSocketServerEventType.Error = "error";
nodejs.ws.WebSocketServerEventType.Headers = "headers";
nodejs.ws.WebSocketServerEventType.Connection = "connection";
org.tamina.utils.UID._lastUID = 0;
com.tamina.cow4.Server.main();
})();
