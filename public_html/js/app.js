(function(){
    
    angular.module('bases', ["ui.bootstrap"])
        .factory('JuegoFactory', JuegoFactory)
        .factory('RondaFactory', RondaFactory)
        .factory('ApuestaFactory', ApuestaFactory)
        .factory('JugadorFactory', JugadorFactory)
        .service('ConfigJuegoService', ConfigJuegoService)
        .controller('JuegoController', JuegoController)
        .controller('ConfigPartidaController', ConfigPartidaController)
        .directive('startWithZero', startWithZeroDirective);

    function ConfigJuegoService(){
        this.bases_suman_siempre = true;
    }

    function JuegoFactory(JugadorFactory, RondaFactory){
        return function Juego(){
            
            var iniciado = false,
                rondas = [], 
                jugadores = [];
            
            this.getRondas = getRondas;
            this.getJugadores = getJugadores;
            this.getIniciado = getIniciado;
            this.obtenerPuntajeJugador = obtenerPuntajeJugador;
            this.iniciar = iniciar;
            this.actualizarRondas = actualizarRondas;
            
            this.rondas = rondas;
            this.numero_rondas;
            this.numero_jugadores;
            
            function getRondas(){
                return this.rondas;
            }
            function getJugadores(){
                return jugadores;
            }
            function getIniciado(){
                return iniciado;
            }
            
            function iniciar(jugadores){
                
                crearJugadores(jugadores);
                crearRondas(this.numero_rondas);
                
                iniciado = true;
            }
            
            function crearJugadores(_jugadores){
                angular.forEach(_jugadores, function(nombre, id){
                    jugadores.push(new JugadorFactory(id, nombre));
                });
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
                    rondas.push(new RondaFactory(total_cartas, jugadores));
                }
            }
            
            function obtenerPuntajeJugador(jugador){
                var puntaje = 0;
                
                angular.forEach(rondas, function(ronda){
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
                    rondas.push(new RondaFactory(rondas_agregadas[i].numero_cartas, jugadores));
                }
                for(var i in rondas_removidas){
                    for(var j in rondas){
                        if(rondas[j].id === rondas_removidas[i].id){
                            rondas.splice(j, 1);
                            break;
                        }
                    }
                }
                this.numero_rondas = rondas.length;
                validarRondas();
            }
        
            function validarRondas(){
                angular.forEach(rondas, function(ronda){
                    ronda.controlarErrorApuestas();
                    ronda.controlarErrorResultados();
                });
            }
        };
    }
    
    function RondaFactory(ApuestaFactory){
        var uid = 0;
        
        return function Ronda(numero_cartas, jugadores){
            
            var apuestas = {};
            
            this.id = ++uid;
            this.numero_cartas = numero_cartas;
            this.apuestas = apuestas;
            this.error_apuesta = false;
            this.error_resultados = false;
            
            this.controlarErrorApuestas = controlarErrorApuestas;
            this.controlarErrorResultados = controlarErrorResultados;
            
            initialize();
            
            function initialize(){
                angular.forEach(jugadores, function(jugador){
                    apuestas[jugador.id] = new ApuestaFactory();
                });
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
                this.error_resultados = (isNaN(suma_resultados) || suma_resultados === this.numero_cartas ? false : true)
            };
        };
    }
    
    function ApuestaFactory(){
        return function Apuesta(){
            
            this.bases_apostadas;
            this.bases_obtenidas;
            
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
        return function Jugador(id, nombre){
            this.id = id;
            this.nombre = nombre;
            
        };
    }

    function JuegoController($scope, JuegoFactory, $uibModal){
        
        $scope.crearJuego = crearJuego;
        $scope.actualizarNumeroJugadores = actualizarNumeroJugadores;
        $scope.configurarPartida = configurarPartida;
        
        $scope.juego = new JuegoFactory();
        $scope.juego.numero_rondas = 5;
        $scope.juego.numero_jugadores = 2;
        $scope.jugadores = new Array($scope.juego.numero_jugadores);
        
        
        function actualizarNumeroJugadores(){
            $scope.jugadores.length = $scope.juego.numero_jugadores;
        }
        
        function crearJuego(){
            $scope.juego.iniciar($scope.jugadores);
        }
        
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
        }
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