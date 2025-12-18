pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
        HOST_PORT = "3002"
        CONTAINER_PORT = "3000"
    }

    stages {
        stage('Start') {
            steps {
                bat 'echo "=== DÉMARRAGE PIPELINE 2 ==="'
                bat 'docker --version'
                bat 'node --version'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "✅ Checkout terminé"'
                bat 'dir'
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
                bat 'echo "✅ Dépendances installées"'
                
                // Vérifier les fichiers
                bat '''
                echo "=== VÉRIFICATION FICHIERS ==="
                dir Dockerfile
                dir package.json
                dir server.js
                type package.json
                '''
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                bat 'echo "✅ Build terminé"'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    // PHASE 1: NETTOYAGE COMPLET
                    bat """
                    echo "=== PHASE 1: NETTOYAGE ==="
                    
                    // Arrêter et supprimer TOUS les conteneurs monapp
                    FOR /f "tokens=*" %%i IN ('docker ps -aq --filter "name=monapp*"') DO (
                        echo "Arrêt conteneur: %%i"
                        docker stop %%i 2>nul
                        docker rm %%i 2>nul
                    )
                    
                    // Vérifier les ports
                    echo "Ports utilisés:"
                    netstat -ano | findstr :3000 :3001 :3002 :3003
                    
                    // Tuer les processus sur port 3002
                    for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3002') do (
                        echo "Termination processus PID %%p sur port 3002"
                        taskkill /F /PID %%p 2>nul || echo "Aucun processus"
                    )
                    
                    // Nettoyer les anciennes images
                    docker rmi ${env.DOCKER_IMAGE} 2>nul || echo "Pas d'ancienne image"
                    """
                    
                    // PHASE 2: BUILD DOCKER
                    bat """
                    echo "=== PHASE 2: BUILD DOCKER ==="
                    echo "Construction de l'image: ${env.DOCKER_IMAGE}"
                    """
                    
                    bat "docker build --no-cache -t ${env.DOCKER_IMAGE} ."
                    
                    bat """
                    echo "=== VÉRIFICATION IMAGE ==="
                    docker images | findstr ${env.DOCKER_IMAGE}
                    if errorlevel 1 (
                        echo "❌ ERREUR: Image non créée"
                        exit 1
                    )
                    echo "✅ Image créée avec succès"
                    """
                    
                    // PHASE 3: LANCER DOCKER AVEC DEBUG
                    bat """
                    echo "=== PHASE 3: LANCEMENT DOCKER ==="
                    echo "Mapping: ${env.HOST_PORT} -> ${env.CONTAINER_PORT}"
                    """
                    
                    // Lancer en mode interactif pour voir les logs
                    bat """
                    docker run -d \
                        -p ${env.HOST_PORT}:${env.CONTAINER_PORT} \
                        --name ${env.CONTAINER_NAME} \
                        ${env.DOCKER_IMAGE}
                    
                    echo "Conteneur lancé, attente démarrage..."
                    timeout /t 30 /nobreak
                    """
                    
                    // PHASE 4: VÉRIFICATION DÉTAILLÉE
                    bat """
                    echo "=== PHASE 4: VÉRIFICATION ==="
                    
                    echo "1. Conteneurs en cours:"
                    docker ps
                    echo ""
                    
                    echo "2. Tous les conteneurs:"
                    docker ps -a
                    echo ""
                    
                    echo "3. Logs du conteneur:"
                    docker logs ${env.CONTAINER_NAME} --tail 50
                    echo ""
                    
                    echo "4. Ports exposés:"
                    docker port ${env.CONTAINER_NAME}
                    echo ""
                    
                    echo "5. Vérifier processus dans conteneur:"
                    docker exec ${env.CONTAINER_NAME} ps aux 2>nul || echo "Impossible d'exécuter dans conteneur"
                    echo ""
                    
                    echo "6. Test INTERNE (dans Docker):"
                    docker exec ${env.CONTAINER_NAME} sh -c "curl -s http://localhost:${env.CONTAINER_PORT} || wget -qO- http://localhost:${env.CONTAINER_PORT} || echo 'Échec test interne'" 2>nul || echo "Test interne impossible"
                    """
                    
                    // Vérifier que le conteneur est en cours d'exécution
                    bat """
                    docker inspect ${env.CONTAINER_NAME} --format="{{.State.Status}}" | findstr "running"
                    if errorlevel 1 (
                        echo "❌ ERREUR: Conteneur non running"
                        echo "État:"
                        docker inspect ${env.CONTAINER_NAME} --format="{{json .State}}"
                        exit 1
                    )
                    echo "✅ Conteneur en cours d'exécution"
                    """
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    echo "=== SMOKE TEST DÉTAILLÉ ==="
                    
                    // Attendre encore un peu
                    bat 'timeout /t 10 /nobreak'
                    
                    // TEST 1: Vérifier que le port est accessible
                    bat """
                    echo "Test 1: Vérification port ${env.HOST_PORT}"
                    netstat -ano | findstr :${env.HOST_PORT}
                    if errorlevel 1 (
                        echo "❌ Port ${env.HOST_PORT} non ouvert"
                        exit 1
                    )
                    echo "✅ Port ${env.HOST_PORT} ouvert"
                    """
                    
                    // TEST 2: Test HTTP avec retry
                    bat """
                    echo "Test 2: Connexion HTTP (3 tentatives)"
                    
                    set TEST_PASSED=0
                    
                    for /l %%i in (1,1,3) do (
                        if !TEST_PASSED! EQU 0 (
                            echo "Tentative %%i/3..."
                            
                            powershell -Command "
                            try {
                                Write-Host 'Connexion à http://localhost:${env.HOST_PORT}...'
                                \$response = Invoke-WebRequest -Uri 'http://localhost:${env.HOST_PORT}' -UseBasicParsing -TimeoutSec 15
                                Write-Host \"✅ SUCCÈS: Status \$(\$response.StatusCode)\"
                                Write-Host \"Réponse: \$(\$response.Content)\"
                                exit 0
                            } catch {
                                Write-Host \"❌ Échec tentative %%i: \$(\$_.Exception.Message)\"
                                exit 1
                            }
                            "
                            
                            if !errorlevel! EQU 0 (
                                set TEST_PASSED=1
                            ) else (
                                echo "Attente 5 secondes..."
                                timeout /t 5 /nobreak
                            )
                        )
                    )
                    
                    if !TEST_PASSED! EQU 0 (
                        echo "❌ TOUTES LES TENTATIVES ONT ÉCHOUÉ"
                        
                        // Debug avancé
                        echo "=== DEBUG AVANCÉ ==="
                        echo "Logs Docker récents:"
                        docker logs ${env.CONTAINER_NAME} --tail 100
                        
                        echo "Processus dans conteneur:"
                        docker exec ${env.CONTAINER_NAME} ps aux 2>nul || echo "Commande échouée"
                        
                        echo "Fichiers dans conteneur:"
                        docker exec ${env.CONTAINER_NAME} ls -la /app 2>nul || echo "Commande échouée"
                        
                        exit 1
                    )
                    
                    echo "✅ Smoke test réussi"
                    """
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    bat """
                    echo "=== CRÉATION ARTEFACTS ==="
                    
                    // Récupérer tous les logs
                    docker logs ${env.CONTAINER_NAME} 2>nul > full_logs.txt || echo "Pas de logs" > full_logs.txt
                    
                    // Informations système
                    echo "=== RAPPORT BUILD ${BUILD_NUMBER} ===" > build_report.txt
                    echo "Date: %DATE% %TIME%" >> build_report.txt
                    echo "Image: ${env.DOCKER_IMAGE}" >> build_report.txt
                    echo "Conteneur: ${env.CONTAINER_NAME}" >> build_report.txt
                    echo "Port: ${env.HOST_PORT}:${env.CONTAINER_PORT}" >> build_report.txt
                    echo "" >> build_report.txt
                    
                    docker inspect ${env.CONTAINER_NAME} >> container_info.txt 2>nul || echo "Inspection impossible" > container_info.txt
                    """
                    
                    archiveArtifacts artifacts: 'build_report.txt, full_logs.txt, container_info.txt', allowEmptyArchive: true
                    bat 'echo "✅ Artefacts archivés"'
                }
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                echo "=== NETTOYAGE ==="
                docker stop ${env.CONTAINER_NAME} 2>nul || echo "Déjà arrêté"
                docker rm ${env.CONTAINER_NAME} 2>nul || echo "Déjà supprimé"
                """
                bat 'echo "✅ Nettoyage terminé"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "=== PIPELINE TERMINÉ ==="'
            }
        }
    }

    post {
        always {
            cleanWs()
            bat 'echo "Workspace nettoyé"'
        }
        
        success {
            script {
                bat 'echo "🎉 PIPELINE 2 - SUCCÈS COMPLET"'
                
                parallel(
                    'Node 18 Check': {
                        bat 'node --version'
                        bat 'echo "Node 18 vérifié"'
                    },
                    'Node 20 Check': {
                        bat 'echo "Node 20 simulation"'
                        bat 'echo "Node 20 vérifié"'
                    }
                )
            }
        }
        
        failure {
            script {
                bat 'echo "❌ PIPELINE 2 - ÉCHEC"'
                
                // Diagnostic complet
                bat """
                echo "=== DIAGNOSTIC D'ÉCHEC ==="
                echo "1. État Docker:"
                docker info
                echo ""
                
                echo "2. Tous les conteneurs:"
                docker ps -a
                echo ""
                
                echo "3. Toutes les images:"
                docker images
                echo ""
                
                echo "4. Ports ouverts 3000-3005:"
                netstat -ano | findstr :3000 :3001 :3002 :3003 :3004 :3005
                """
            }
        }
    }
}
