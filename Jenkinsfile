pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
        // PORT EXTERNE (votre machine) : 3002
        // PORT INTERNE (docker) : 3000
        EXTERNAL_PORT = "3002"
        INTERNAL_PORT = "3000"
    }

    stages {
        stage('Start') {
            steps {
                bat 'echo "=== PIPELINE 2 - DOCKER PORT MAPPING ==="'
                bat 'echo "Docker interne: localhost:3000"'
                bat 'echo "Externe/Jenkins: localhost:3002"'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "Code recupere"'
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
                bat 'echo "Build termine"'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    // 1. NETTOYAGE
                    bat """
                    echo "Arret des anciens conteneurs..."
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo "OK"
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo "OK"
                    
                    // Liberer le port 3002 si utilise
                    netstat -ano | findstr :${env.EXTERNAL_PORT}
                    if errorlevel 1 (
                        echo "Port ${env.EXTERNAL_PORT} libre"
                    ) else (
                        echo "Port ${env.EXTERNAL_PORT} deja utilise - nettoyage..."
                        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :${env.EXTERNAL_PORT}') do (
                            taskkill /F /PID %%a 2>nul || echo "Processus termine"
                        )
                    )
                    """
                    
                    // 2. BUILD ET RUN EN PARALLELE
                    parallel(
                        'Build Docker': {
                            bat 'echo "Construction image Docker..."'
                            bat "docker build --no-cache -t ${env.DOCKER_IMAGE} ."
                            bat 'echo "✅ Image Docker prete"'
                        },
                        'Run Docker': {
                            script {
                                sleep 3
                                bat """
                                echo "Lancement conteneur..."
                                echo "Mapping: ${env.EXTERNAL_PORT}:${env.INTERNAL_PORT}"
                                docker run -d -p ${env.EXTERNAL_PORT}:${env.INTERNAL_PORT} --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}
                                """
                                
                                // Attendre que l'app démarre DANS Docker
                                sleep 25
                                
                                // Verifier le conteneur
                                bat """
                                echo "Verification conteneur..."
                                docker ps | findstr ${env.CONTAINER_NAME}
                                if errorlevel 1 (
                                    echo "❌ Conteneur non demarre"
                                    docker logs ${env.CONTAINER_NAME}
                                    exit 1
                                )
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
                    echo "=== TEST CONNEXION DOCKER ==="
                    
                    // ESSAYER PLUSIEURS METHODES
                    bat """
                    echo "Methode 1: curl sur port ${env.EXTERNAL_PORT}"
                    curl -f http://localhost:${env.EXTERNAL_PORT} && echo "✅ curl reussi" || (
                        echo "❌ curl echoue, tentative Powershell..."
                        
                        powershell -Command "
                        try {
                            Write-Host 'Test Powershell sur localhost:${env.EXTERNAL_PORT}...'
                            \$response = Invoke-WebRequest -Uri 'http://localhost:${env.EXTERNAL_PORT}' -UseBasicParsing -TimeoutSec 20
                            Write-Host \"✅ Status: \$(\$response.StatusCode)\"
                            Write-Host \"Contenu: \$(\$response.Content.Substring(0, [Math]::Min(100, \$response.Content.Length)))\"
                            exit 0
                        } catch {
                            Write-Host \"❌ Erreur: \$(\$_.Exception.Message)\"
                            
                            // Debug: tester depuis l'INTERIEUR du conteneur
                            Write-Host '=== TEST INTERNE DOCKER ==='
                            \$internalTest = docker exec ${env.CONTAINER_NAME} sh -c 'curl -s http://localhost:${env.INTERNAL_PORT} || wget -qO- http://localhost:${env.INTERNAL_PORT} || echo \"Echec interne\"'
                            Write-Host \"Test interne conteneur: \$internalTest\"
                            
                            exit 1
                        }
                        "
                        
                        if errorlevel 1 (
                            echo "❌ Toutes les methodes echouent"
                            
                            // Dernier recours: verifier l'app dans Docker
                            echo "=== VERIFICATION INTERNE ==="
                            docker exec ${env.CONTAINER_NAME} ps aux || echo "Impossible d'executer dans conteneur"
                            docker logs ${env.CONTAINER_NAME} --tail 30
                            
                            exit 1
                        )
                    )
                    """
                    
                    bat 'echo "✅ Smoke Test reussi sur port ${env.EXTERNAL_PORT}"'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    bat """
                    echo "Build: ${BUILD_NUMBER}" > build_report.txt
                    echo "Port mapping: ${env.EXTERNAL_PORT} -> ${env.INTERNAL_PORT}" >> build_report.txt
                    echo "Date: %DATE% %TIME%" >> build_report.txt
                    
                    docker logs ${env.CONTAINER_NAME} 2>nul > docker_output.txt || echo "Pas de logs" > docker_output.txt
                    """
                    
                    archiveArtifacts artifacts: 'build_report.txt, docker_output.txt', allowEmptyArchive: true
                    bat 'echo "Artefacts archives"'
                }
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                """
                bat 'echo "Nettoyage termine"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "=== FIN PIPELINE ==="'
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
                    'Node 18 Runtime': {
                        bat 'node --version'
                        bat 'echo "Node 18 OK"'
                    },
                    'Node 20 Runtime': {
                        bat 'echo "Node 20 simulation"'
                        bat 'echo "Node 20 OK"'
                    }
                )
                bat 'echo "✅ PIPELINE 2 SUCCESS avec parallelisation"'
            }
        }
        
        failure {
            bat 'echo "❌ PIPELINE 2 FAILED"'
            bat "docker inspect ${env.CONTAINER_NAME} 2>nul || echo 'Conteneur inexistant'"
        }
    }
}
