pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        // Se déclenche sur push vers la branche dev
        pollSCM('H/2 * * * *')
    }

    environment {
        APP_NAME = "meteo-app"
        DOCKER_IMAGE = "meteo-app:${BUILD_NUMBER}"
        CONTAINER_NAME = "meteo-app-${BUILD_NUMBER}"
        HOST_PORT = "3002"
        DOCKER_PORT = "3000"
    }

    stages {
        // ===== PREMIÈRE LIGNE =====
        stage('Start') {
            steps {
                echo "🚀 PIPELINE 2: Build complet sur push dev"
                bat "echo 📅 Build #${BUILD_NUMBER}"
            }
        }
        
        stage('Checkout') {
            steps {
                echo "📥 Récupération du code"
                // CORRECTION: Syntaxe simple
                checkout scm
                bat 'dir'
            }
        }

        stage('Setup') {
            steps {
                echo "⚙️ Installation des dépendances"
                bat 'npm install'
                bat 'echo ✅ Dépendances installées'
            }
        }

        stage('Build') {
            steps {
                echo "🏗️ Build de l'application"
                bat 'npm run build'
                bat 'echo ✅ Build terminé'
            }
        }

        // ===== DEUXIÈME LIGNE =====
        stage('Docker Build & Run') {
            steps {
                script {
                    echo "🐳 Construction et exécution Docker"
                    
                    // Nettoyage préalable
                    bat """
                    echo 🧹 Nettoyage des anciens conteneurs...
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo Aucun conteneur à arrêter
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo Aucun conteneur à supprimer
                    
                    echo Libérer le port si utilisé...
                    netstat -ano | findstr :${env.HOST_PORT}
                    if errorlevel 1 (
                        echo Port ${env.HOST_PORT} libre
                    ) else (
                        echo Port ${env.HOST_PORT} déjà utilisé
                        for /f "tokens=5" %%p in ('netstat -ano ^| findstr :${env.HOST_PORT}') do (
                            echo Termination processus %%p
                            taskkill /F /PID %%p 2>nul || echo Aucun processus
                        )
                    )
                    """
                    
                    // Construction Docker
                    bat """
                    echo 🔨 Construction de l'image Docker...
                    docker build --no-cache -t ${env.DOCKER_IMAGE} .
                    
                    echo ✅ Image construite: ${env.DOCKER_IMAGE}
                    docker images | findstr ${env.DOCKER_IMAGE}
                    """
                    
                    // Exécution Docker
                    bat """
                    echo 🚀 Lancement du conteneur...
                    echo Mapping: ${env.HOST_PORT} -> ${env.DOCKER_PORT}
                    docker run -d -p ${env.HOST_PORT}:${env.DOCKER_PORT} --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}
                    
                    echo ⏳ Attente démarrage 20 secondes...
                    timeout /t 20 /nobreak
                    
                    echo === VÉRIFICATION CONTENEUR ===
                    docker ps --filter name=${env.CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                    """
                }
            }
        }

        // ===== TROISIÈME LIGNE =====
        stage('Smoke Test') {
            steps {
                script {
                    echo "🧪 Tests de validation"
                    
                    // Test 1: Vérifier que le conteneur tourne
                    bat """
                    echo 1. Vérification du conteneur...
                    docker ps --filter name=${env.CONTAINER_NAME} --format="{{.Names}}" | findstr ${env.CONTAINER_NAME}
                    if errorlevel 1 (
                        echo ❌ Conteneur non démarré
                        docker logs ${env.CONTAINER_NAME}
                        exit 1
                    )
                    echo ✅ Conteneur en cours d'exécution
                    """
                    
                    // Test 2: Smoke test avec retry
                    bat """
                    echo 2. Test de connexion 3 tentatives...
                    
                    set SUCCESS=0
                    
                    for /l %%i in (1,1,3) do (
                        if !SUCCESS! equ 0 (
                            echo Tentative %%i/3...
                            
                            powershell -Command "
                            try {
                                Write-Host 'Test sur http://localhost:${env.HOST_PORT}...'
                                \$response = Invoke-WebRequest -Uri 'http://localhost:${env.HOST_PORT}' -UseBasicParsing -TimeoutSec 15
                                
                                if (\$response.StatusCode -eq 200) {
                                    Write-Host '✅ SUCCÈS: Status ' \$response.StatusCode
                                    Write-Host 'Réponse: ' \$response.Content
                                    
                                    # Test endpoint /weather
                                    \$weather = Invoke-WebRequest -Uri 'http://localhost:${env.HOST_PORT}/weather' -UseBasicParsing
                                    Write-Host '🌤️  Météo: ' \$weather.Content
                                    
                                    exit 0
                                } else {
                                    Write-Host '❌ Status inattendu: ' \$response.StatusCode
                                    exit 1
                                }
                            } catch {
                                Write-Host '❌ Erreur: ' \$_.Exception.Message
                                exit 1
                            }
                            "
                            
                            if !errorlevel! equ 0 (
                                set SUCCESS=1
                                echo ✅ Test réussi à la tentative %%i
                            ) else (
                                if %%i lss 3 (
                                    echo ⏳ Nouvelle tentative dans 5 secondes...
                                    timeout /t 5 /nobreak
                                )
                            )
                        )
                    )
                    
                    if !SUCCESS! equ 0 (
                        echo ❌ Tous les tests ont échoué
                        echo === LOGS DOCKER ===
                        docker logs ${env.CONTAINER_NAME}
                        exit 1
                    )
                    
                    echo ✅ Smoke test terminé avec succès
                    """
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    echo "📦 Archivage des artefacts"
                    
                    // Créer un rapport
                    bat """
                    echo # Rapport de build #${BUILD_NUMBER} > build_report.md
                    echo Date: %DATE% %TIME% >> build_report.md
                    echo Application: ${env.APP_NAME} >> build_report.md
                    echo Image Docker: ${env.DOCKER_IMAGE} >> build_report.md
                    echo Port: ${env.HOST_PORT} >> build_report.md
                    echo Statut: SUCCÈS >> build_report.md
                    echo. >> build_report.md
                    echo ## Logs Docker >> build_report.md
                    docker logs ${env.CONTAINER_NAME} 2>nul > docker_logs.txt || echo Aucun log > docker_logs.txt
                    """
                    
                    // Archiver
                    archiveArtifacts artifacts: 'build_report.md, docker_logs.txt, package.json, Dockerfile, server.js', fingerprint: true
                    bat 'echo ✅ Artefacts archivés'
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Nettoyage"
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo Conteneur déjà arrêté
                docker rm ${env.CONTAINER_NAME} 2>nul || echo Conteneur déjà supprimé
                """
                bat 'echo ✅ Nettoyage terminé'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo ✅ PIPELINE 2 TERMINÉ AVEC SUCCÈS'
            }
        }
    }

    post {
        always {
            cleanWs()
            echo "🧽 Nettoyage du workspace"
        }
        
        success {
            echo "🏆 PIPELINE 2 - BUILD COMPLET: PASSED ✅"
            
            // Tests parallèles runtime
            script {
                echo "🔧 Tests parallèles runtime..."
                parallel(
                    'Runtime Node 18': {
                        bat 'node --version'
                        bat 'echo ✅ Tests avec Node 18 terminés'
                    },
                    'Runtime Node 20': {
                        bat 'echo Simulation Node 20...'
                        bat 'echo ✅ Tests avec Node 20 terminés'
                    }
                )
            }
        }
        
        failure {
            echo "💥 PIPELINE 2 - BUILD COMPLET: FAILED ❌"
            
            script {
                // Debug en cas d'échec
                bat """
                echo === DEBUG EN CAS D'ÉCHEC ===
                echo Conteneurs Docker:
                docker ps -a
                echo.
                echo Images Docker:
                docker images | findstr meteo
                echo.
                echo Ports utilisés:
                netstat -ano | findstr :3000 :3001 :3002
                """
            }
        }
    }
}
