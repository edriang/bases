(function(){
    
    angular.module('bases', ['ui.bootstrap', 'ui.router', 'ngStorage'])
        .config(configureRoutes)
        .factory('JuegoFactory', JuegoFactory)
        .factory('RondaFactory', RondaFactory)
        .factory('ApuestaFactory', ApuestaFactory)
        .factory('JugadorFactory', JugadorFactory)
        .factory('ConfiguracionJuegoFactory', ConfiguracionJuegoFactory)
        .service('ConfigJuegoService', ConfigJuegoService)
        .controller('ConfiguracionController', ConfiguracionController)
        .controller('PartidaController', PartidaController)
        .controller('ConfigPartidaController', ConfigPartidaController)
        .directive('startWithZero', startWithZeroDirective);

    function configureRoutes($stateProvider){
        $stateProvider.state({
            name: 'configuracion',
            url: '/configurar-partida',
            templateUrl: 'views/configuracion.html',
            controller: 'ConfiguracionController'
        });
        
        $stateProvider.state({
            name: 'partida',
            url: '/partida',
            templateUrl: 'views/partida.html',
            controller: 'PartidaController'
        });
    }
    
    function ConfiguracionJuegoFactory($localStorage, JugadorFactory){
        function ConfiguracionJuego(init_config){
            
            //Defaults
            this.numero_rondas = 5;
            this.numero_jugadores = 2;
            this.jugadores = [];
            
            initialize.apply(this);
            
            function initialize(){
                
                if(init_config){
                    this.numero_rondas = init_config.numero_rondas;
                    this.numero_jugadores = init_config.numero_jugadores;
                    
                    for(var i in init_config.jugadores){
                        this.jugadores.push(new JugadorFactory(init_config.jugadores[i]));
                    }
                }
                
                $localStorage.configuracion = this;
            }
        };
        
        ConfiguracionJuego.restore = function(defaults){
            var configuracion = new ConfiguracionJuego($localStorage.configuracion);
            return configuracion;
        };
        
        return ConfiguracionJuego;
    }
    
    function ConfigJuegoService(){
        this.bases_suman_siempre = true;
    }

    function JuegoFactory(JugadorFactory, RondaFactory, $localStorage){
        function Juego(configuracion, init_config){
            
            var iniciado = false;
            var rondas = [];
        
            //Defaults
            this.ronda_actual = 1;
            this.configuracion = configuracion;
            this.rondas = rondas;
            
            this.getRondas = getRondas;
            this.getJugadores = getJugadores;
            this.getIniciado = getIniciado;
            this.obtenerPuntajeJugador = obtenerPuntajeJugador;
            this.actualizarRondas = actualizarRondas;
            
            initialize.apply(this);
            
            function initialize(){
                
                if(init_config){
                    this.ronda_actual = init_config.ronda_actual;
                    
                    for(var i in init_config.rondas){
                        this.rondas.push(new RondaFactory(init_config.rondas[i]));
                    }
                } else {
                    crearRondas(configuracion.numero_rondas);
                }
                $localStorage.juego = this;
            }
            
            function getRondas(){
                return rondas;
            }
            function getJugadores(){
                return configuracion.jugadores;
            }
            function getIniciado(){
                return iniciado;
            }
            
            function crearJugadores(jugadores){
                for(var i in jugadores){
                    this.jugadores.push(new JugadorFactory(i, jugadores[i]));
                }
            }
            
            function crearRondas(numero_rondas){
                var total_cartas;
                var mitad_partida = numero_rondas / 2;
                for(var i = 0; i < numero_rondas; i++){
                    if(!total_cartas){
                        total_cartas = 1;
                    } else {
                        if(i === mitad_partida){
                            
                        } else if(i > mitad_partida){
                            total_cartas -= 2;
                        } else {
                            total_cartas += 2;
                        }
                    }
                    rondas.push(new RondaFactory({numero_cartas: total_cartas, jugadores: getJugadores()}));
                }
            }
            
            function obtenerPuntajeJugador(jugador){
                var puntaje = 0;
                
                angular.forEach(this.rondas, function(ronda){
                    puntaje += parseInt(ronda.apuestas[jugador.id].obtenerPuntaje()) || 0;
                });
                return puntaje;
            }
            
            function actualizarRondas(rondas_actualizadas, rondas_agregadas, rondas_removidas){
                
                for(var i in rondas_actualizadas){
                    for(var j in rondas){
                        if(rondas[j].id === rondas_actualizadas[i].id){
                            rondas[j].numero_cartas = rondas_actualizadas[i].numero_cartas;
                            break;
                        }
                    }
                }
                for(var i in rondas_agregadas){
                    rondas.push(new RondaFactory({numero_cartas: rondas_agregadas[i].numero_cartas, jugadores: configuracion.jugadores}));
                }
                for(var i in rondas_removidas){
                    for(var j in rondas){
                        if(rondas[j].id === rondas_removidas[i].id){
                            rondas.splice(j, 1);
                            break;
                        }
                    }
                }
                configuracion.numero_rondas = rondas.length;
                validarRondas();
            }
        
            function validarRondas(){
                angular.forEach(rondas, function(ronda){
                    ronda.controlarErrorApuestas();
                    ronda.controlarErrorResultados();
                });
            }
        };
        Juego.restore = function(configuracion){
            var juego = new Juego(configuracion, $localStorage.juego);
            return juego;
        };
        
        return Juego;
    }
    
    function RondaFactory(ApuestaFactory){
        var uid = 0;
        
        return function Ronda(init_config){
            
            var apuestas = {};
            
            this.id = ++uid;
            this.numero_cartas = init_config.numero_cartas;
            this.apuestas = apuestas;
            this.error_apuesta = false;
            this.error_resultados = false;
            
            this.controlarErrorApuestas = controlarErrorApuestas;
            this.controlarErrorResultados = controlarErrorResultados;
            
            initialize();
            
            function initialize(){
                if(init_config.apuestas){
                    for(var i in init_config.apuestas){
                        apuestas[init_config.apuestas[i].jugador.id] = new ApuestaFactory(init_config.apuestas[i]);
                    }
                } else {
                    angular.forEach(init_config.jugadores, function(jugador){
                        apuestas[jugador.id] = new ApuestaFactory({jugador: jugador});
                    });
                }
            }
            
            function controlarErrorApuestas(){
                var suma_apuestas = 0;
                
                angular.forEach(apuestas, function(apuesta){
                    suma_apuestas += apuesta.bases_apostadas;
                });
                this.error_apuestas = (suma_apuestas === this.numero_cartas ? true : false)
            };
            
            function controlarErrorResultados(){
                var suma_resultados = 0;
                
                angular.forEach(apuestas, function(apuesta){
                    suma_resultados += apuesta.bases_obtenidas;
                });
                this.error_resultados = (isNaN(suma_resultados) || suma_resultados === this.numero_cartas ? false : true);
            };
        };
    }
    
    function ApuestaFactory(){
        return function Apuesta(init_config){
            
            this.jugador = init_config.jugador;
            this.bases_apostadas = init_config.bases_apostadas;
            this.bases_obtenidas = init_config.bases_obtenidas;
            
            this.obtenerPuntaje = function(){
                var puntaje = '--';
                
                if(this.bases_obtenidas !== undefined){
                    puntaje = this.bases_obtenidas;
                    if(this.bases_apostadas === this.bases_obtenidas){
                        puntaje += 10;
                    } else {
                        puntaje -= 10;
                    }
                }
                return puntaje;
            };
        };
    }
    
    function JugadorFactory(){
        var uid = 0;
        function Jugador(init_config){
            if(init_config){
                this.id = init_config.id;
                this.nombre = init_config.nombre;
            } else {
                this.id = ++uid;
            }
        };
        return Jugador;
    }

    function ConfiguracionController($scope, $state, ConfiguracionJuegoFactory, JuegoFactory, JugadorFactory){
        
        $scope.crearJuego = crearJuego;
        $scope.actualizarNumeroJugadores = actualizarNumeroJugadores;
        
        $scope.configuracion = new ConfiguracionJuegoFactory();
        actualizarNumeroJugadores();
        
        function actualizarNumeroJugadores(){
            $scope.configuracion.jugadores.length = $scope.configuracion.numero_jugadores;
            
            for(var i = 0; i < $scope.configuracion.jugadores.length; i++){
                if(!$scope.configuracion.jugadores[i]){
                    $scope.configuracion.jugadores[i] = new JugadorFactory();
                }
            }
        }
        
        function crearJuego(){
            var juego = new JuegoFactory($scope.configuracion);
            $state.go('partida');
        }
        
    }
    
    function PartidaController($scope, JuegoFactory, $uibModal, ConfiguracionJuegoFactory){
        
        var configuracion = ConfiguracionJuegoFactory.restore();
        $scope.juego = JuegoFactory.restore(configuracion);
        
        $scope.configurarPartida = configurarPartida;
        
        function configurarPartida() {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'views/config_partida.html',
                controller: 'ConfigPartidaController',
                size: 'md',
                resolve: {
                    juego: function () {
                        return $scope.juego;
                    }
                }
            });
            modalInstance.result.then(function(result) {
                $scope.juego.actualizarRondas(result.rondas_actualizadas, result.rondas_agregadas, result.rondas_removidas);
            });
        }
    }
    
    function ConfigPartidaController($scope, $uibModalInstance, juego){
        
        var rondas_removidas = [];
        var rondas_agregadas = [];
        $scope.rondas = angular.copy(juego.getRondas());
        $scope.nueva_ronda = {};
        
        $scope.removerRonda = function(ronda){
            $scope.rondas.splice($scope.rondas.indexOf(ronda), 1);
            rondas_removidas.push(ronda);
        };
        
        $scope.agregarRonda = function(){
            rondas_agregadas.push($scope.nueva_ronda);
            $scope.nueva_ronda = {};
        };
        
        $scope.ok = function () {
            $uibModalInstance.close({
                rondas_actualizadas: $scope.rondas,
                rondas_removidas: rondas_removidas,
                rondas_agregadas: rondas_agregadas
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        $scope.getRondas = function(){
            return $scope.rondas.concat(rondas_agregadas);
        };
    }
        
    function startWithZeroDirective($parse){
        return {
            restrict: 'A',
            require: '?ngModel',
            scope: true,
            link: function($scope, $element, $attrs, ngModelCtrl){
                var old_value;
                
//                ngModelCtrl.$parsers.push(function(value) {
//                    if(old_value === undefined){
//                        value = 0;
//                        old_value = value;
//                        $element.val(value);
//                        $scope.$applyAsync(function(){
//                            ngModelCtrl.$setViewValue(0);
//                        });
//                    }   
//                    return value;
//                });
                
            }
        };
    }
    
})();