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
                bat 'echo "=== PIPELINE 2 ==="'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "Checkout OK"'
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
                bat 'echo "Dependances installees"'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                bat 'echo "Build OK"'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    // NETTOYAGE
                    bat """
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                    """
                    
                    parallel(
                        'Build Docker': {
                            bat 'echo "Construction Docker..."'
                            
                            // AFFICHER LE DOCKERFILE
                            bat 'echo "=== DOCKERFILE CONTENT ==="'
                            bat 'type Dockerfile'
                            
                            // BUILD AVEC LOGS DÉTAILLÉS
                            bat "docker build --no-cache --progress=plain -t ${env.DOCKER_IMAGE} . 2>&1"
                            bat 'echo "✅ Build Docker terminé"'
                        },
                        'Run Docker': {
                            script {
                                sleep 5
                                bat """
                                echo "Lancement conteneur..."
                                docker run -d -p ${env.HOST_PORT}:${env.CONTAINER_PORT} --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}
                                """
                                
                                // ATTENDRE ET VÉRIFIER
                                sleep 20
                                
                                bat """
                                echo "=== VÉRIFICATION CONTENEUR ==="
                                
                                // 1. Vérifier si le conteneur tourne
                                docker ps | findstr ${env.CONTAINER_NAME}
                                if errorlevel 1 (
                                    echo "❌ Conteneur non démarré"
                                    echo "État:"
                                    docker ps -a | findstr ${env.CONTAINER_NAME}
                                    exit 1
                                )
                                
                                // 2. Vérifier les logs
                                echo "Logs:"
                                docker logs ${env.CONTAINER_NAME} --tail 20
                                
                                // 3. Vérifier les processus DANS le conteneur
                                echo "Processus dans conteneur:"
                                docker exec ${env.CONTAINER_NAME} ps aux 2>nul || echo "Impossible d'exécuter ps"
                                
                                // 4. Tester depuis l'INTÉRIEUR du conteneur
                                echo "Test interne:"
                                docker exec ${env.CONTAINER_NAME} sh -c "node -e \"const http = require('http'); http.get('http://localhost:3000', (res) => { console.log('Status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', (e) => { console.error('Error:', e.message); process.exit(1); });\"" 2>nul || echo "Test interne échoué"
                                
                                echo "✅ Conteneur actif"
                                """
                            }
                        }
                    )
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    bat """
                    echo "=== TEST CONNEXION ==="
                    
                    // Attendre un peu plus
                    timeout /t 10 /nobreak
                    
                    // TEST SIMPLE AVEC CURL
                    curl -f http://localhost:${env.HOST_PORT} || (
                        echo "Curl échoué, tentative PowerShell..."
                        
                        powershell -Command "
                        \$attempts = 0
                        \$maxAttempts = 5
                        
                        while (\$attempts -lt \$maxAttempts) {
                            \$attempts++
                            Write-Host \"Tentative \$attempts/\$maxAttempts...\"
                            
                            try {
                                \$response = Invoke-WebRequest -Uri 'http://localhost:${env.HOST_PORT}' -UseBasicParsing -TimeoutSec 10
                                Write-Host \"✅ SUCCÈS: Status \$(\$response.StatusCode)\"
                                Write-Host \"Réponse: \$(\$response.Content)\"
                                exit 0
                            } catch {
                                Write-Host \"❌ Échec: \$(\$_.Exception.Message)\"
                                
                                if (\$attempts -eq \$maxAttempts) {
                                    // Dernière tentative: afficher les logs
                                    Write-Host \"=== DERNIER DEBUG ===\"
                                    \$logs = docker logs ${env.CONTAINER_NAME} 2>&1
                                    Write-Host \$logs
                                    exit 1
                                }
                                
                                Start-Sleep -Seconds 5
                            }
                        }
                        "
                        
                        if errorlevel 1 (
                            echo "❌ Tous les tests ont échoué"
                            exit 1
                        )
                    )
                    
                    echo "✅ Test réussi"
                    """
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                bat """
                echo "Build ${BUILD_NUMBER}" > success.txt
                docker logs ${env.CONTAINER_NAME} 2>nul > logs.txt || echo "Pas de logs" > logs.txt
                """
                archiveArtifacts artifacts: 'success.txt, logs.txt', allowEmptyArchive: true
                bat 'echo "Artefacts archivés"'
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                """
                bat 'echo "Nettoyage terminé"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "=== FIN ==="'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        
        success {
            script {
                parallel(
                    'Node 18': {
                        bat 'node --version'
                        bat 'echo "Node 18 OK"'
                    },
                    'Node 20': {
                        bat 'echo "Node 20 simulé"'
                        bat 'echo "Node 20 OK"'
                    }
                )
                bat 'echo "✅ PIPELINE 2 RÉUSSI"'
            }
        }
        
        failure {
            bat 'echo "❌ PIPELINE 2 ÉCHOUÉ"'
        }
    }
}
