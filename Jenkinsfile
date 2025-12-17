pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Setup') {
            steps { sh 'npm install' }
        }

        stage('Build') {
            steps { sh 'npm run build || echo "No build script, skip"' }
        }

        stage('Run Docker') {
            steps {
                sh 'docker build -t myapp .'
                sh 'docker run -d -p 3000:3000 --name myapp myapp'
            }
        }

        stage('Smoke Test') {
            steps {
                sh './smoke.sh'
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: '**/logs/**', fingerprint: true
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker rm -f $(docker ps -aq || true)'
                sh 'docker rmi myapp || true'
            }
        }
    }
}
