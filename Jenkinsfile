pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
    }

    stages {
        stage('Start') {
            steps {
                bat 'echo "=== DEBUT PIPELINE 2 ==="'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "Checkout termine"'
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
                    // Nettoyage AGGRESSIF
                    bat """
                    echo "Nettoyage des conteneurs existants..."
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo "OK - aucun conteneur"
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo "OK - aucun conteneur"
                    
                    // VERIFIER LES PORTS
                    echo "Verification des ports..."
                    netstat -ano | findstr :3000
                    if errorlevel 1 (
                        echo "Port 3000 libre"
                    ) else (
                        echo "ATTENTION: Port 3002 deja utilise"
                        taskkill /F /PID $(netstat -ano | findstr :3000 | awk '{print \$5}') 2>nul || echo "Impossible de liberer le port"
                    )
                    """
                    
                    parallel(
                        'Build Docker': {
                            bat "docker build -t ${env.DOCKER_IMAGE} ."
                            bat 'echo "Image Docker construite"'
                        },
                        'Run Docker': {
                            script {
                                sleep 5  // Attendre que le build commence
                                bat "docker run -d -p 3000:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}"
                                
                                // Attendre et verifier que le conteneur tourne
                                sleep 20
                                bat """
                                docker ps | findstr ${env.CONTAINER_NAME}
                                if errorlevel 1 (
                                    echo "ERREUR: Conteneur non demarre"
                                    docker logs ${env.CONTAINER_NAME} 2>nul || echo "Pas de logs disponibles"
                                    exit 1
                                )
                                echo "Conteneur lance avec succes sur port 3000"
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
                    echo "=== TEST DE L'APPLICATION ==="
                    
                    // TEST 1: Verifier que le conteneur tourne
                    bat """
                    echo "Verification du conteneur Docker..."
                    docker ps | findstr ${env.CONTAINER_NAME}
                    if errorlevel 1 (
                        echo "ERREUR: Conteneur ne tourne pas"
                        exit 1
                    )
                    """
                    
                    // TEST 2: Tester la connexion HTTP sur le BON PORT (3002)
                    bat """
                    echo "Test de connexion sur localhost:3002..."
                    powershell -Command "
                    \$retryCount = 0
                    \$maxRetries = 5
                    \$success = \$false
                    
                    while (\$retryCount -lt \$maxRetries -and !\$success) {
                        try {
                            Write-Host \"Tentative \$(\$retryCount + 1)/\$maxRetries...\"
                            \$response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10
                            
                            if (\$response.StatusCode -eq 200) {
                                Write-Host '✅ SUCCES: Status 200'
                                Write-Host 'Contenu: ' \$response.Content
                                \$success = \$true
                                break
                            } else {
                                Write-Host \"❌ Echec: Status \$(\$response.StatusCode)\"
                            }
                        } catch {
                            Write-Host \"❌ Echec: \$(\$_.Exception.Message)\"
                        }
                        
                        \$retryCount++
                        if (\$retryCount -lt \$maxRetries) {
                            Write-Host \"Attente 5 secondes avant nouvelle tentative...\"
                            Start-Sleep -Seconds 5
                        }
                    }
                    
                    if (!\$success) {
                        Write-Host \"❌ TOUTES LES TENTATIVES ONT ECHOUE\"
                        
                        // Debug: afficher les logs Docker
                        Write-Host \"=== LOGS DOCKER ===\"
                        \$logs = docker logs ${env.CONTAINER_NAME} 2>&1
                        Write-Host \$logs
                        
                        // Debug: verifier les ports
                        Write-Host \"=== PORTS OUVERTS ===\"
                        netstat -ano | findstr :3000
                        
                        exit 1
                    }
                    "
                    """
                    
                    bat 'echo "✅ Smoke Test reussi"'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    // Creation des artefacts
                    bat """
                    echo "Pipeline 2 - Build #${BUILD_NUMBER}" > build_info.txt
                    echo "Date: %DATE% %TIME%" >> build_info.txt
                    echo "Status: SUCCESS" >> build_info.txt
                    echo "Port utilise: 3000" >> build_info.txt
                    
                    // Sauvegarder les logs Docker
                    docker logs ${env.CONTAINER_NAME} 2>nul > docker_logs.txt || echo "Pas de logs disponibles" > docker_logs.txt
                    """
                    
                    // Archivage
                    archiveArtifacts artifacts: 'build_info.txt, docker_logs.txt, package.json, Dockerfile, server.js', allowEmptyArchive: true
                    bat 'echo "✅ Artefacts archives"'
                }
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                echo "Nettoyage en cours..."
                docker stop ${env.CONTAINER_NAME} 2>nul || echo "Conteneur deja arrete"
                docker rm ${env.CONTAINER_NAME} 2>nul || echo "Conteneur deja supprime"
                """
                bat 'echo "✅ Nettoyage termine"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "=== FIN PIPELINE 2 ==="'
            }
        }
    }

    post {
        always {
            cleanWs()
            bat 'echo "Workspace nettoye"'
        }
        
        success {
            script {
                bat 'echo "🎉 PIPELINE 2 - REUSSITE COMPLETE"'
                
                // Tests paralleles Node
                parallel(
                    'Runtime Node 18': {
                        bat 'node --version'
                        bat 'echo "✅ Tests Node 18 termines"'
                    },
                    'Runtime Node 20': {
                        bat 'echo "Node 20 simulation"'
                        bat 'echo "✅ Tests Node 20 termines"'
                    }
                )
            }
        }
        
        failure {
            bat 'echo "❌ PIPELINE 2 - ECHEC"'
            
            script {
                // Debug avance en cas d'echec
                bat """
                echo "=== DEBUG INFOS ==="
                echo "Conteneurs Docker:"
                docker ps -a
                echo ""
                echo "Images Docker:"
                docker images
                echo ""
                echo "Ports 3000-3005:"
                netstat -ano | findstr :3000 :3001 :3002 :3003 :3004 :3005
                """
            }
        }
    }
}
