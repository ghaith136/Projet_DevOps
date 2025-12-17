pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        // Déclenche le pipeline à chaque push sur dev (ou utilise webhook GitHub)
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME = "mon_app"
        DOCKER_IMAGE = "mon_app_%BUILD_NUMBER%"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Clonage du repository Git"
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                echo "Installation des dépendances npm"
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo "Build de l’application"
                bat 'npm run build'
            }
        }

        stage('Docker Build & Run') {
            parallel {
                stage('Build Docker') {
                    steps {
                        echo "Construction de l’image Docker"
                        bat "docker build -t %DOCKER_IMAGE% ."
                    }
                }
                stage('Run Docker') {
                    steps {
                        echo "Démarrage du container Docker"
                        bat "docker run -d --name %APP_NAME%_%BUILD_NUMBER% -p 3000:3000 %DOCKER_IMAGE%"
                    }
                }
            }
        }

        stage('Smoke Test') {
            steps {
                echo "Exécution du Smoke Test"
                bat """
                powershell -Command "
                try {
                    \$status = (Invoke-WebRequest -UseBasicParsing http://localhost:3000).StatusCode
                    if (\$status -ne 200) { exit 1 }
                } catch { exit 1 }"
                """
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo "Archivage des artefacts"
                archiveArtifacts artifacts: 'build/**', fingerprint: true
                archiveArtifacts artifacts: 'logs/**', fingerprint: true
            }
        }

        stage('Cleanup') {
            steps {
                echo "Nettoyage du container Docker"
                bat "docker rm -f %APP_NAME%_%BUILD_NUMBER% || echo 'Container déjà supprimé'"
            }
        }
    }

    post {
        success {
            echo 'Build complet réussi ✅'
        }
        failure {
            echo 'Build complet échoué ❌'
        }
        always {
            cleanWs()
        }
    }
}
