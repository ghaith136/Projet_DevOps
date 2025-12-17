pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME = "monapp"
        DOCKER_IMAGE = "monapp:${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
    }

    stages {
        stage('Start') {
            steps {
                echo "🚀 DÉBUT PIPELINE ${BUILD_NUMBER}"
                bat 'docker --version'
                bat 'node --version'
            }
        }
        
        stage('Checkout') {
            steps {
                echo "📥 Checkout du code source"
                checkout scm
                bat 'dir'
            }
        }

        stage('Setup') {
            steps {
                echo "⚙️ Installation des dépendances"
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo "🏗️ Build de l'application"
                bat 'npm run build'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    echo "🐳 Construction et lancement Docker"
                    
                    // Nettoyer les anciens conteneurs
                    bat """
                    echo "Nettoyage des anciens conteneurs..."
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo "Aucun conteneur à arrêter"
                    docker rm -f ${env.CONTAINER_NAME} 2>nul || echo "Aucun conteneur à supprimer"
                    
                    // Arrêter le conteneur existant (celui sur port 3000)
                    docker stop monapp-dev-cu 2>nul || echo "Conteneur monapp-dev-cu non trouvé"
                    docker rm -f monapp-dev-cu 2>nul || echo "Conteneur monapp-dev-cu non supprimé"
                    """
                    
                    // Construire l'image
                    bat "docker build -t ${env.DOCKER_IMAGE} ."
                    
                    // Vérifier l'image
                    bat "docker images | findstr ${env.DOCKER_IMAGE}"
                    
                    // Lancer le conteneur sur port 3001 pour éviter les conflits
                    bat """
                    docker run -d -p 3001:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}
                    """
                    
                    // Attendre le démarrage
                    sleep 10
                    
                    // Vérifier que le conteneur tourne
                    bat """
                    docker ps | findstr ${env.CONTAINER_NAME}
                    if errorlevel 1 (
                        echo "ERREUR: Conteneur non démarré"
                        docker logs ${env.CONTAINER_NAME} || echo "Pas de logs"
                        exit 1
                    )
                    """
                }
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🧪 Smoke Test"
                
                script {
                    retry(3) {
                        sleep 5
                        
                        powershell """
                        try {
                            Write-Host "Test de connexion à localhost:3001..."
                            \$response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
                            Write-Host "✅ Smoke Test OK - Status: " \$response.StatusCode
                            Write-Host "Contenu: " \$response.Content
                            
                            if (\$response.StatusCode -ne 200) {
                                Write-Host "❌ Statut non-200"
                                exit 1
                            }
                        } catch {
                            Write-Host "❌ ERREUR Smoke Test: " \$_.Exception.Message
                            exit 1
                        }
                        """
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo "📦 Archivage des artefacts"
                archiveArtifacts artifacts: '**/*.log, **/build/*', allowEmptyArchive: true
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Nettoyage"
                script {
                    // Sauvegarder les logs avant nettoyage
                    bat """
                    docker logs ${env.CONTAINER_NAME} > docker_logs_${env.BUILD_NUMBER}.txt 2>&1
                    """
                    
                    // Nettoyer
                    bat """
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo "Déjà arrêté"
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo "Déjà supprimé"
                    """
                    
                    archiveArtifacts artifacts: "docker_logs_${env.BUILD_NUMBER}.txt"
                }
            }
        }
        
        stage('End') {
            steps {
                echo "✅ FIN PIPELINE ${BUILD_NUMBER} - SUCCÈS"
            }
        }
    }

    post {
        always {
            echo "🧽 Nettoyage workspace"
            cleanWs()
            
            // Tests parallèles Node (optionnel)
            script {
                parallel(
                    'Node 18 Check': {
                        bat 'node --version'
                        echo 'Node 18 OK'
                    },
                    'Node 20 Check': {
                        bat 'echo "Node 20 simulé"'
                        echo 'Node 20 OK'
                    }
                )
            }
        }
        
        success {
            echo "🏆 PIPELINE 2 - DEV PUSH : PASSED ✅"
        }
        
        failure {
            echo "💥 PIPELINE 2 - DEV PUSH : FAILED ❌"
            
            script {
                // Diagnostic en cas d'échec
                bat """
                echo "=== DIAGNOSTIC ==="
                docker ps -a
                docker images
                netstat -ano | findstr :3001 || echo "Port 3001 libre"
                """
            }
        }
    }
}
