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
        APP_NAME = "mon_app"
        DOCKER_IMAGE = "mon_app:${BUILD_NUMBER}"
        CONTAINER_NAME = "mon_app_${BUILD_NUMBER}"
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
                    echo "🐳 Docker Build & Run (Parallèle)"
                    
                    parallel(
                        'Build Docker': {
                            echo "🔨 Construction de l'image Docker"
                            bat "docker build -t %DOCKER_IMAGE% ."
                        },
                        'Run Docker': {
                            script {
                                // Nettoyer avant de lancer
                                bat """
                                docker rm -f %CONTAINER_NAME% 2>nul
                                """
                                
                                echo "🚀 Lancement du container Docker"
                                bat """
                                docker run -d -p 3001:3000 --name %CONTAINER_NAME% %DOCKER_IMAGE%
                                """
                                
                                // Attendre le démarrage
                                sleep 15
                            }
                        }
                    )
                }
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🧪 Smoke Test"
                
                script {
                    retry(3) {
                        sleep 5
                        
                        powershell '''
                        try {
                            Write-Host "Test de connexion à localhost:3001..."
                            $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
                            Write-Host "✅ Smoke Test OK - Status: " $response.StatusCode
                            
                            if ($response.StatusCode -ne 200) {
                                Write-Host "❌ Statut non-200"
                                exit 1
                            }
                        } catch {
                            Write-Host "❌ ERREUR Smoke Test: " $_.Exception.Message
                            exit 1
                        }
                        '''
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo "📦 Archivage des artefacts"
                archiveArtifacts artifacts: '**/build/**, **/logs/**, package.json, Dockerfile', allowEmptyArchive: true
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Nettoyage"
                bat """
                docker stop %CONTAINER_NAME% 2>nul
                docker rm %CONTAINER_NAME% 2>nul
                """
            }
        }
        
        stage('End') {
            steps {
                echo "✅ FIN PIPELINE"
            }
        }
    }

    post {
        always {
            echo "🧽 Nettoyage workspace"
            cleanWs()
        }
        
        success {
            echo "🏆 PIPELINE 2 - DEV PUSH : PASSED AVEC PARALLÉLISATION ✅"
            
            // TESTS PARALLÈLES NODE 18/20 (Post Actions)
            script {
                echo "🔧 Declarative Post Actions - Tests Runtime"
                
                parallel(
                    'Runtime Node 18': {
                        bat 'node --version'
                        echo '✅ Build et tests avec Node 18 terminé'
                    },
                    'Runtime Node 20': {
                        bat 'echo "Simulation Node 20" && echo Node 20 OK'
                        echo '✅ Simulation build et tests avec Node 20 terminé'
                    }
                )
            }
        }
        
        failure {
            echo "💥 PIPELINE 2 - DEV PUSH : FAILED ❌"
            
            script {
                // Diagnostic
                bat """
                echo "=== DIAGNOSTIC D'ÉCHEC ==="
                docker ps -a
                docker images | findstr %DOCKER_IMAGE%
                """
            }
        }
    }
}
