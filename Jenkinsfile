pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build || echo "No build script, skipping"'
            }
        }

        stage('Run (Docker)') {
            steps {
                bat 'docker build -t myapp .'
                bat 'docker run -d -p 3000:3000 --name myapp myapp'
                sleep 20  // attente démarrage
            }
        }

        stage('Smoke Test') {
            steps {
                bat 'smoke.bat'   // on va créer ce fichier juste après
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log, smoke-result.txt', allowEmptyArchive: true
            }
        }

        stage('Cleanup') {
            steps {
                bat 'docker stop myapp || exit 0'
                bat 'docker rm myapp || exit 0'
                bat 'docker rmi myapp || exit 0'
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé : ${currentBuild.currentResult}"
        }
    }
}