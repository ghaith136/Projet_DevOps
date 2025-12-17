pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        // Déclenchement sur push (ou webhook GitHub)
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME = "mon_app"
        DOCKER_IMAGE = "mon_app:${BUILD_NUMBER}"
        CONTAINER_NAME = "mon_app_${BUILD_NUMBER}"
    }

    stages {

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
                echo "🏗️ Build de l’application"
                bat 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                echo "🐳 Construction de l’image Docker"
                bat "docker build -t %DOCKER_IMAGE% ."
            }
        }

        stage('Docker Run') {
            steps {
                echo "🚀 Lancement du container Docker"
                bat """
                docker rm -f %CONTAINER_NAME% 2>nul
                docker run -d -p 3000:3000 --name %CONTAINER_NAME% %DOCKER_IMAGE%
                """
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🧪 Smoke Test – vérification de l’application"

                powershell '''
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
                    Write-Host "Smoke Test OK - Status Code:" $response.StatusCode
                }
                catch {
                    Write-Host "Smoke Test FAILED"
                    exit 1
                }
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo "📦 Archivage des artefacts"
                archiveArtifacts artifacts: '**/build/**, **/logs/**', fingerprint: true
            }
        }

        stage('Cleanup') {
            steps {
                echo "🧹 Nettoyage du container Docker"
                bat """
                docker stop %CONTAINER_NAME% 2>nul
                docker rm %CONTAINER_NAME% 2>nul
                """
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline exécuté avec succès"
        }
        failure {
            echo "❌ Pipeline échoué"
        }
        always {
            echo "📄 Fin du pipeline"
        }
    }
}
